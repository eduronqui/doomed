import Phaser from 'phaser';
import { MARINE } from '../characters';
import type { CharacterKind } from '../characters/art';
import { LEVELS, TRAINING_INDEX, levelInfo } from '../levels';
import { DEATH_MUSIC } from '../levels/death.music';
import { isTrainingDone, markTrainingDone } from '../ui/progress';
import { DEFAULT_DIFFICULTY, DIFFICULTIES, type DecoKind, type Difficulty } from '../sim/defs';
import { FOOT_OFFSET, type Door } from '../sim/grid';
import { looksLikeWall, type Tile } from '../sim/level';
import { dist } from '../sim/types';
import type { ProjectileLook } from '../weapons';
import { IDLE_INPUT, World, keyColorOf, type Carry, type EffectKind, type GameEvent, type Input, type Monster } from '../sim/world';
import type { Hud } from '../ui/hud';
import type { Screens } from '../ui/screens';
import type { Sfx } from './sfx';
import type { Music } from './music';
import { TILE, WALL_HEIGHT } from './art/tiles';
import { Lighting, type Light } from './lighting';
import { parseDevParams } from './devParams';
import type { TouchControls } from '../ui/touch';
import { RAISE, drawLowShadows, drawRaisedRow, rowHasHeight } from './heights';
import { ATLAS, FLOOR_VARIANTS, WALL_VARIANTS, key } from './atlas';

export const VIEW_W = 1024;
export const VIEW_H = 704;
export const ZOOM = 2;
const OVERVIEW_MARGIN = 1;

const FLOOR_DEPTH = -100000;
const DECAL_DEPTH = -90000;
const CORPSE_DEPTH = -80000;
const OVERLAY_DEPTH = 1_000_000;
const NAME_DEPTH = 2_000_000;
const ACTOR_FOOT = FOOT_OFFSET;
const GUN_HEIGHT_PX = 10;
const STEALTH_EXPOSE_RANGE = 3;
const DEATHS_BEFORE_DIFFICULTY_PICK = 3;

export interface GameDeps {
  sfx: Sfx;
  music: Music;
  hud: Hud;
  screens: Screens;
  touch: TouchControls;
}

interface Fx {
  sprite: Phaser.GameObjects.Image;
  name: EffectKind;
  frames: number;
  age: number;
  frameTime: number;
}

interface Floater {
  text: Phaser.GameObjects.Text;
  age: number;
}

interface Tracer {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  age: number;
  hostile: boolean;
  beam: boolean;
}

interface ActorView {
  sprite: Phaser.GameObjects.Image;
  name: Phaser.GameObjects.Text;
  dead: boolean;
  exposedUntil: number;
}

function hash(x: number, y: number): number {
  let h = Math.imul(x * 374761393 + y * 668265263, 1274126177);
  h ^= h >>> 13;
  return (h >>> 0) % 1000;
}

function floorVariant(t: Tile, x: number, y: number): number {
  if (t.floor === 'slime' || t.floor === 'lava') return 0;
  return hash(x, y) < 700 ? 0 : hash(x, y) % FLOOR_VARIANTS;
}

const KEY_RGB: Record<'red' | 'blue' | 'yellow', [number, number, number]> = { red: [255, 40, 40], blue: [60, 130, 255], yellow: [255, 220, 60] };

const FX_FRAMES: Record<EffectKind, number> = { puff: 3, blood: 3, explosion: 4, burst: 4, flame: 3, riftblast: 4 };
const FX_TIME: Record<EffectKind, number> = { puff: 0.06, blood: 0.07, explosion: 0.09, burst: 0.06, flame: 0.07, riftblast: 0.11 };
const ADDITIVE_FX: ReadonlySet<EffectKind> = new Set<EffectKind>(['explosion', 'burst', 'flame', 'riftblast']);
const TRACER_LIFE = 0.06;
const BEAM_LIFE = 0.12;
const PROJECTILE_LIGHT: Record<ProjectileLook, Light | null> = {
  fireball: { x: 0, y: 0, r: 2.6, a: 0.9, color: [255, 130, 30], glow: 0.45 },
  orb: { x: 0, y: 0, r: 4, a: 1, color: [190, 90, 255], glow: 0.55 },
  grenade: null,
  wisp: { x: 0, y: 0, r: 2.2, a: 0.85, color: [150, 230, 255], glow: 0.4 },
  bolt: { x: 0, y: 0, r: 2.4, a: 0.9, color: [230, 60, 200], glow: 0.45 },
};
const FLOAT_PX = 7;
const LABEL_HEIGHT: Partial<Record<string, number>> = { brute: 28, warden: 28, shade: 28, gatekeeper: 62 };

export class GameScene extends Phaser.Scene {
  private deps!: GameDeps;
  private world!: World;
  private levelIndex = 0;
  private startCarry: Carry | undefined;
  private static devLevelApplied = false;
  private playerView!: ActorView;
  private monsterViews = new Map<number, ActorView>();
  private itemViews = new Map<number, Phaser.GameObjects.Image>();
  private barrelViews = new Map<number, Phaser.GameObjects.Image>();
  private projectileViews = new Map<number, Phaser.GameObjects.Image>();
  private doorViews: { img: Phaser.GameObjects.Image; lead: Door; top: number; height: number; width: number }[] = [];
  private liquids: { img: Phaser.GameObjects.Image; kind: 'slime' | 'lava' }[] = [];
  private braziers: Phaser.GameObjects.Image[] = [];
  private exitView: Phaser.GameObjects.Image | null = null;
  private overview = false;
  private switchViews: { img: Phaser.GameObjects.Image; id: number; wall: 'tech' | 'stone'; x: number; y: number }[] = [];
  private exitWall: 'tech' | 'stone' = 'tech';
  private exitRooms: number[] = [];
  private fx: Fx[] = [];
  private floaters: Floater[] = [];
  private tracers: Tracer[] = [];
  private gfx!: Phaser.GameObjects.Graphics;
  private sightGfx!: Phaser.GameObjects.Graphics;
  private showSight = false;
  private muzzle!: Phaser.GameObjects.Image;
  private lighting!: Lighting;
  private staticLights: Light[] = [];
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private wheel = 0;
  private useQueued = false;
  private slotQueued: number | null = null;
  private animClock = 0;
  private paused = false;
  private ended = false;
  private endTimer = 0;
  private deathLevel = -1;
  private deathCount = 0;
  private started = false;
  private difficulty: Difficulty = DEFAULT_DIFFICULTY;
  private firing = false;
  private aimByKeys = false;
  private keyAim = 0;
  private lastPointer = { x: -1, y: -1 };
  private lastMove = { x: 0, y: 0 };
  private revealCount = -1;
  private walls: { img: Phaser.GameObjects.Image; rooms: number[] }[] = [];
  private closetCovers: Phaser.GameObjects.Image[] = [];
  private decoViews: { img: Phaser.GameObjects.Image; x: number; y: number }[] = [];

  constructor() {
    super('game');
  }

  init(data: { deps: GameDeps; started?: boolean; difficulty?: Difficulty; levelIndex?: number; carry?: Carry }): void {
    this.deps = data.deps;
    this.started = data.started ?? false;
    this.difficulty = data.difficulty ?? this.difficulty;
    this.levelIndex = data.levelIndex ?? (isTrainingDone() ? 0 : TRAINING_INDEX);
    this.startCarry = data.carry;
  }

  create(): void {
    if (import.meta.env.DEV && !GameScene.devLevelApplied) {
      GameScene.devLevelApplied = true;
      const { level } = parseDevParams(window.location.search, LEVELS.length);
      if (level !== null) this.levelIndex = level === 0 ? TRAINING_INDEX : level - 1;
    }
    const info = levelInfo(this.levelIndex);
    this.world = new World(info.load(), (Date.now() & 0xffff) + 1, this.difficulty, this.startCarry ?? info.startCarry, {
      alertOnEntry: info.alertOnEntry,
      ambush: info.ambush,
      watchDoors: info.watchDoors,
    });
    this.monsterViews.clear();
    this.itemViews.clear();
    this.barrelViews.clear();
    this.projectileViews.clear();
    this.doorViews = [];
    this.switchViews = [];
    this.walls = [];
    this.closetCovers = [];
    this.decoViews = [];
    this.revealCount = -1;
    this.firing = false;
    this.liquids = [];
    this.braziers = [];
    this.fx = [];
    this.floaters = [];
    this.tracers = [];
    this.staticLights = [];
    this.paused = false;
    this.ended = false;
    this.aimByKeys = false;
    this.endTimer = 0;

    this.buildMap();
    this.buildEntities();
    this.gfx = this.add.graphics().setDepth(OVERLAY_DEPTH - 10);
    this.sightGfx = this.add.graphics().setDepth(OVERLAY_DEPTH + 5);
    this.muzzle = this.add.image(0, 0, ATLAS, key.fx('muzzle', 0)).setVisible(false).setBlendMode(Phaser.BlendModes.ADD);
    this.lighting = new Lighting(this, VIEW_W / ZOOM, VIEW_H / ZOOM, info.darkness, OVERLAY_DEPTH);

    const cam = this.cameras.main;
    cam.setZoom(ZOOM);
    cam.setBackgroundColor('#000000');
    cam.setBounds(-TILE * 2, -TILE * 2, this.world.grid.width * TILE + TILE * 4, this.world.grid.height * TILE + TILE * 4);
    cam.startFollow(this.playerView.sprite, true, 0.18, 0.18, 0, 14);
    cam.roundPixels = true;

    this.setupInput();
    this.deps.hud.reset(this.world, `${info.title} (${this.difficulty.name})`);
    if (import.meta.env.DEV) {
      const dev = parseDevParams(window.location.search, LEVELS.length);
      if (dev.autostart) {
        this.started = true;
        this.unlockAudioOnFirstInput();
      }
      if (dev.pos) {
        this.world.player.x = dev.pos.x + 0.5;
        this.world.player.y = dev.pos.y + 0.5;
        this.cameras.main.centerOn(this.world.player.x * TILE, this.world.player.y * TILE);
      }
      if (dev.god) this.world.god = true;
      if (dev.arsenal) this.world.giveArsenal();
      if (dev.sight) this.showSight = true;
      if (dev.overview) this.showOverview();
      if (dev.noMonster) {
        for (const v of this.monsterViews.values()) {
          v.sprite.destroy();
          v.name.destroy();
        }
        this.monsterViews.clear();
        this.world.monsters.length = 0;
      }
      (window as unknown as { __doomed: { world: World; scene: Phaser.Scene } }).__doomed = { world: this.world, scene: this };
    }
    if (this.started) this.beginPlay();
    else {
      this.paused = true;
      this.deps.screens.title(info.title, info.briefing, DIFFICULTIES, this.difficulty.id, (d) => {
        this.deps.sfx.unlock();
        this.restart(d);
      });
    }
  }

  private unlockAudioOnFirstInput(): void {
    const unlock = (): void => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      this.deps.sfx.unlock();
      if (!this.paused) this.deps.music.resume();
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
  }

  private beginPlay(): void {
    this.paused = false;
    this.started = true;
    this.deps.music.play(levelInfo(this.levelIndex).music);
    const info = levelInfo(this.levelIndex);
    this.deps.hud.message(info.startMessage ? `Welcome to ${info.title}. ${info.startMessage}` : `Welcome to ${info.title}.`, 'info', 0);
  }

  // ---------- construction ----------

  private buildMap(): void {
    const g = this.world.grid;
    const W = g.width;
    const H = g.height;
    if (this.textures.exists('floor_static')) this.textures.remove('floor_static');
    const tex = this.textures.createCanvas('floor_static', W * TILE, H * TILE)!;
    const ctx = tex.context;
    ctx.imageSmoothingEnabled = false;
    const isWallLike = (x: number, y: number): boolean => {
      const t = g.tile(x, y);
      return !t || t.type === 'wall' || t.type === 'exit' || t.type === 'void' || (t.type === 'door' && looksLikeWall(t.door));
    };

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const t = g.tiles[g.index(x, y)];
        if (t.type === 'floor' || t.type === 'door') {
          const fr = this.textures.getFrame(ATLAS, key.floor(t.floor, floorVariant(t, x, y)));
          ctx.drawImage(fr.source.image as CanvasImageSource, fr.cutX, fr.cutY, TILE, TILE, x * TILE, y * TILE, TILE, TILE);
          if (t.floor === 'slime' || t.floor === 'lava') {
            const img = this.add.image(x * TILE, y * TILE, ATLAS, key.floor(t.floor, 0)).setOrigin(0).setDepth(FLOOR_DEPTH + 1);
            this.liquids.push({ img, kind: t.floor });
            this.staticLights.push(
              t.floor === 'lava'
                ? { x: x + 0.5, y: y + 0.5, r: 1.7, a: 0.55, color: [255, 90, 20], glow: 0.2 }
                : { x: x + 0.5, y: y + 0.5, r: 1.3, a: 0.3, color: [80, 255, 60], glow: 0.08 },
            );
          }
          if (t.type === 'floor') {
            ctx.fillStyle = 'rgba(0,0,0,0.38)';
            if (isWallLike(x, y - 1)) ctx.fillRect(x * TILE, y * TILE, TILE, 7);
            if (isWallLike(x - 1, y)) ctx.fillRect(x * TILE, y * TILE + (isWallLike(x, y - 1) ? 7 : 0), 5, TILE - (isWallLike(x, y - 1) ? 7 : 0));
            ctx.fillStyle = 'rgba(0,0,0,0.18)';
            if (isWallLike(x - 1, y - 1) && !isWallLike(x, y - 1) && !isWallLike(x - 1, y)) ctx.fillRect(x * TILE, y * TILE, 5, 7);
          }
        }
      }
    }
    drawLowShadows(ctx, g);
    tex.refresh();
    this.add.image(0, 0, 'floor_static').setOrigin(0).setDepth(FLOOR_DEPTH);
    this.buildRaisedRows();
    this.buildDoorPieces();
    const closet = this.world.hiddenCloset();
    for (const i of closet?.embedded ? closet.cells : []) {
      const x = i % W;
      const y = Math.floor(i / W);
      this.closetCovers.push(this.add.image(x * TILE, y * TILE - WALL_HEIGHT, ATLAS, key.wall(closet!.wall, 0)).setOrigin(0).setDepth((y + 1) * TILE));
    }

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = g.index(x, y);
        const t = g.tiles[i];
        if (t.type === 'void' || t.type === 'floor') continue;
        const px = x * TILE;
        const py = y * TILE - WALL_HEIGHT;
        const depth = (y + 1) * TILE;
        if (t.type === 'wall') {
          if (!this.touchesOpen(x, y)) continue;
          if (t.switchId >= 0) {
            const img = this.add.image(px, py, ATLAS, key.switch(t.wall, false)).setOrigin(0).setDepth(depth);
            this.walls.push({ img, rooms: this.roomsAround(x, y) });
            this.switchViews.push({ img, id: t.switchId, wall: t.wall, x: x + 0.5, y: y + 1.1 });
            continue;
          }
          const variant = this.wallVariant(t, x, y);
          this.walls.push({ img: this.add.image(px, py, ATLAS, key.wall(t.wall, variant)).setOrigin(0).setDepth(depth), rooms: this.roomsAround(x, y) });
          if (t.wall === 'tech' && variant === 1 && !isWallLike(x, y + 1)) this.staticLights.push({ x: x + 0.5, y: y + 1.1, r: 2.2, a: 0.45, color: [120, 230, 255], glow: 0.12 });
          if (t.wall === 'tech' && variant === 2 && !isWallLike(x, y + 1)) this.staticLights.push({ x: x + 0.5, y: y + 1.1, r: 1.8, a: 0.35, color: [80, 255, 120], glow: 0.1 });
          if (t.wall === 'stone' && variant === 2 && !isWallLike(x, y + 1)) this.staticLights.push({ x: x + 0.5, y: y + 1.1, r: 1.6, a: 0.35, color: [255, 100, 30], glow: 0.15 });
        } else if (t.type === 'exit') {
          this.exitWall = t.wall;
          this.exitRooms = this.roomsAround(x, y);
          this.exitView = this.add.image(px, py, ATLAS, key.exit(t.wall, false)).setOrigin(0).setDepth(depth);
        }
      }
    }
  }

  private buildRaisedRows(): void {
    const g = this.world.grid;
    for (let y = 0; y < g.height; y++) {
      const name = `raised_${y}`;
      if (this.textures.exists(name)) this.textures.remove(name);
      if (!rowHasHeight(g, y)) continue;
      const tex = this.textures.createCanvas(name, g.width * TILE, TILE + RAISE)!;
      const ctx = tex.context;
      ctx.imageSmoothingEnabled = false;
      drawRaisedRow(
        g,
        y,
        (cx, cy) => floorVariant(g.tiles[g.index(cx, cy)], cx, cy),
        (frameKey, dx, dy) => {
          const fr = this.textures.getFrame(ATLAS, frameKey);
          ctx.drawImage(fr.source.image as CanvasImageSource, fr.cutX, fr.cutY, fr.cutWidth, fr.cutHeight, dx, dy, fr.cutWidth, fr.cutHeight);
        },
      );
      tex.refresh();
      this.add.image(0, y * TILE - RAISE, name).setOrigin(0).setDepth((y + 1) * TILE);
    }
  }

  private lift(x: number, y: number): number {
    return this.world.grid.elevation(x, y) * RAISE;
  }

  private raisedDepth(x: number, y: number, depth: number): number {
    return this.world.grid.elevation(x, y) > 0 ? Math.max(depth + TILE, (Math.floor(y) + 1) * TILE + 0.5) : depth;
  }

  private showOverview(): void {
    const g = this.world.grid;
    this.overview = true;
    for (const r of g.rooms) if (r >= 0) this.world.revealedRooms.add(r);
    this.lighting.setVisible(false);
    const cam = this.cameras.main;
    const w = (g.width + OVERVIEW_MARGIN * 2) * TILE;
    const h = (g.height + OVERVIEW_MARGIN * 2) * TILE;
    cam.stopFollow();
    cam.removeBounds();
    cam.setZoom(Math.min(cam.width / w, cam.height / h));
    cam.centerOn((g.width * TILE) / 2, (g.height * TILE) / 2 - WALL_HEIGHT / 2);
  }

  private buildDoorPieces(): void {
    for (const group of this.world.grid.doorGroups) {
      const lead = group[0];
      const kind = lead.kind;
      const x0 = Math.min(...group.map((d) => d.x));
      const y0 = Math.min(...group.map((d) => d.y));
      const cw = Math.max(...group.map((d) => d.x)) - x0 + 1;
      const ch = Math.max(...group.map((d) => d.y)) - y0 + 1;
      const wallKind = this.world.grid.tiles[lead.index].wall;
      const k = key.doorPiece(kind, wallKind, cw, ch);
      const top = y0 * TILE - WALL_HEIGHT;
      const img = this.add.image(x0 * TILE, top, ATLAS, k).setOrigin(0).setDepth((y0 + ch) * TILE);
      this.doorViews.push({ img, lead, top, height: ch * TILE + WALL_HEIGHT, width: cw * TILE });
      const color = keyColorOf(kind);
      if (color) this.staticLights.push({ x: x0 + cw / 2, y: y0 + ch - 0.4, r: 2, a: 0.45, color: KEY_RGB[color], glow: 0.25 });
      if (kind === 'seal') this.staticLights.push({ x: x0 + cw / 2, y: y0 + ch - 0.4, r: 2.4, a: 0.5, color: [190, 90, 255], glow: 0.3 });
      if (kind === 'gate') this.staticLights.push({ x: x0 + cw / 2, y: y0 + ch - 0.4, r: 2, a: 0.4, color: [90, 230, 255], glow: 0.2 });
    }
  }

  private roomsAround(x: number, y: number): number[] {
    const g = this.world.grid;
    const out = new Set<number>();
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!g.inBounds(x + dx, y + dy)) continue;
        const r = g.rooms[g.index(x + dx, y + dy)];
        if (r >= 0) out.add(r);
      }
    }
    return [...out];
  }

  private touchesOpen(x: number, y: number): boolean {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const t = this.world.grid.tile(x + dx, y + dy);
        if (t && t.type !== 'wall' && t.type !== 'void') return true;
      }
    }
    return false;
  }

  private wallVariant(t: Tile, x: number, y: number): number {
    const h = hash(x, y);
    const below = this.world.grid.tile(x, y + 1);
    if (!below || below.type === 'wall' || below.type === 'exit' || below.type === 'void') return 0;
    const n = WALL_VARIANTS[t.wall];
    if (t.wall === 'tech') return h < 620 ? 0 : 1 + (h % (n - 1));
    return h < 600 ? 0 : 1 + (h % (n - 1));
  }

  private buildEntities(): void {
    const w = this.world;
    for (const d of w.decos) this.addDeco(d.kind, d.x, d.y);
    for (const b of w.barrels) {
      const lift = this.lift(b.x, b.y);
      this.barrelViews.set(b.id, this.add.image(b.x * TILE, (b.y + 0.32) * TILE - lift, ATLAS, key.barrel(0)).setOrigin(0.5, 1).setDepth(this.raisedDepth(b.x, b.y, (b.y + 0.32) * TILE)));
    }
    for (const it of w.items) this.addItem(it.id, it.kind, it.x, it.y);
    for (const m of w.monsters) this.monsterViews.set(m.id, this.makeActor(m.kind, m.def.name, m.x, m.y));
    this.playerView = this.makeActor('marine', MARINE.name, w.player.x, w.player.y);
  }

  private addDeco(kind: DecoKind, x: number, y: number): void {
    const cx = x * TILE;
    const lift = this.lift(x, y);
    const bottom = Math.floor(y) * TILE + TILE - lift;
    switch (kind) {
      case 'lamp':
        this.decoViews.push({ img: this.add.image(cx, bottom - 2, ATLAS, key.deco('lamp', 0)).setOrigin(0.5, 1).setDepth(this.raisedDepth(x, y, (y + ACTOR_FOOT) * TILE)), x, y });
        this.staticLights.push({ x, y: y - 0.3, r: 4.6, a: 0.92, color: [170, 225, 255], glow: 0.1 });
        break;
      case 'crate':
        this.decoViews.push({ img: this.add.image(cx, bottom, ATLAS, key.deco('crate', 0)).setOrigin(0.5, 1).setDepth(this.raisedDepth(x, y, bottom + lift)), x, y });
        break;
      case 'brazier': {
        const img = this.add.image(cx, bottom - 1, ATLAS, key.deco('brazier', 0)).setOrigin(0.5, 1).setDepth(this.raisedDepth(x, y, bottom + lift));
        this.braziers.push(img);
        this.decoViews.push({ img, x, y });
        this.staticLights.push({ x, y: y - 0.3, r: 4.4, a: 0.9, color: [255, 120, 30], glow: 0.3, flicker: true });
        break;
      }
      case 'gore':
      case 'body':
        this.decoViews.push({ img: this.add.image(cx, y * TILE - lift, ATLAS, key.deco(kind, 0)).setDepth(this.raisedDepth(x, y, DECAL_DEPTH)), x, y });
        break;
    }
  }

  private addItem(id: number, kind: string, x: number, y: number): void {
    const img = this.add.image(x * TILE, y * TILE - 4 - this.lift(x, y), ATLAS, `item_${kind}`).setDepth(this.raisedDepth(x, y, y * TILE));
    if (kind === 'sphere' || kind === 'redkey') {
      this.tweens.add({ targets: img, y: img.y - 3, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    this.itemViews.set(id, img);
  }

  private monsterView(m: Monster): ActorView {
    let v = this.monsterViews.get(m.id);
    if (!v) {
      v = this.makeActor(m.kind, m.def.name, m.x, m.y);
      this.monsterViews.set(m.id, v);
    }
    return v;
  }

  private makeActor(kind: CharacterKind, name: string, x: number, y: number): ActorView {
    const texture = kind === 'marine' ? key.marine('pistol', 's', 0) : key.actor(kind, 's', 0);
    const sprite = this.add.image(x * TILE, (y + ACTOR_FOOT) * TILE, ATLAS, texture).setOrigin(0.5, 30 / 32);
    const label = this.add
      .text(0, 0, name, {
        fontFamily: 'Verdana, Tahoma, sans-serif',
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#30d030',
        stroke: '#000000',
        strokeThickness: 2,
        resolution: 2,
      })
      .setOrigin(0.5, 1)
      .setDepth(NAME_DEPTH);
    return { sprite, name: label, dead: false, exposedUntil: 0 };
  }

  // ---------- input ----------

  private setupInput(): void {
    this.deps.hud.onWeaponTap = (slot) => (this.slotQueued = slot);
    const pauseWhenHidden = (): void => {
      if (document.hidden && this.deps.touch.isEnabled && !this.paused) this.togglePause();
    };
    document.addEventListener('visibilitychange', pauseWhenHidden);
    this.events.once('shutdown', () => document.removeEventListener('visibilitychange', pauseWhenHidden));
    const kb = this.input.keyboard!;
    this.keys = kb.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE,ONE,TWO,THREE,FOUR,FIVE,SIX,SEVEN,EIGHT,M,N,ESC,P,R,Q') as Record<string, Phaser.Input.Keyboard.Key>;
    kb.addCapture('SPACE,UP,DOWN,LEFT,RIGHT');
    this.input.mouse?.disableContextMenu();
    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (ptr.leftButtonDown()) this.firing = true;
    });
    this.input.on('pointerup', () => (this.firing = false));
    this.input.on('pointerupoutside', () => (this.firing = false));
    this.input.on('gameout', () => (this.firing = false));
    const stopFiring = (): void => {
      this.firing = false;
    };
    this.game.events.on('blur', stopFiring);
    this.events.once('shutdown', () => this.game.events.off('blur', stopFiring));
    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => {
      this.wheel += Math.sign(dy);
    });
    const onDown = (k: string, fn: () => void): void => {
      this.keys[k].on('down', fn);
    };
    onDown('E', () => (this.useQueued = true));
    onDown('SPACE', () => (this.useQueued = true));
    onDown('ONE', () => (this.slotQueued = 1));
    onDown('TWO', () => (this.slotQueued = 2));
    onDown('THREE', () => (this.slotQueued = 3));
    onDown('FOUR', () => (this.slotQueued = 4));
    onDown('FIVE', () => (this.slotQueued = 5));
    onDown('SIX', () => (this.slotQueued = 6));
    onDown('SEVEN', () => (this.slotQueued = 7));
    onDown('EIGHT', () => (this.slotQueued = 8));
    onDown('Q', () => (this.wheel += 1));
    onDown('M', () => {
      const muted = this.deps.sfx.toggleMute();
      this.deps.hud.message(muted ? 'Sound muted.' : 'Sound on.', 'info', this.world.time);
    });
    onDown('N', () => {
      const on = this.deps.music.toggle();
      this.deps.hud.message(on ? 'Music on.' : 'Music off.', 'info', this.world.time);
    });
    const pause = (): void => this.togglePause();
    onDown('ESC', pause);
    onDown('P', pause);
    onDown('R', () => {
      if (!this.ended) return;
      const next = LEVELS[this.levelIndex + 1];
      if (this.world.status === 'won' && this.levelIndex === TRAINING_INDEX) this.finishTraining();
      else if (this.world.status === 'won') {
        if (next) this.restart(this.difficulty, this.levelIndex + 1, this.world.carry());
        else this.restart(this.difficulty, 0, undefined);
      } else this.restart();
    });
  }

  private finishTraining(): void {
    markTrainingDone();
    this.restart(this.difficulty, 0, undefined);
  }

  private updateTip(): void {
    const info = levelInfo(this.levelIndex);
    if (!info.tips || this.world.status !== 'playing') {
      this.deps.hud.setTip(null, null);
      return;
    }
    const w = this.world;
    const px = Math.floor(w.player.x);
    const py = Math.floor(w.player.y);
    const tip = info.tips.find(({ area: [x0, y0, x1, y1] }) => px >= x0 && px <= x1 && py >= y0 && py <= y1);
    if (!tip) return;
    const [x0, y0, x1, y1] = tip.area;
    const clear = !w.monsters.some((m) => m.state !== 'dead' && m.x >= x0 && m.x < x1 + 1 && m.y >= y0 && m.y < y1 + 1);
    const isTouch = this.deps.touch.isEnabled;
    const text = clear && tip.clearText ? ((isTouch && tip.touchClearText) || tip.clearText) : (isTouch && tip.touchText) || tip.text;
    this.deps.hud.setTip(text, () => this.finishTraining());
  }

  private togglePause(): void {
    if (!this.started || this.ended) return;
    if (this.paused) {
      this.deps.screens.hide();
      this.paused = false;
      this.deps.music.resume();
    } else {
      this.paused = true;
      this.deps.music.pause();
      this.deps.screens.paused(() => {
        this.paused = false;
        this.deps.music.resume();
      });
    }
  }

  private restart(difficulty: Difficulty = this.difficulty, levelIndex = this.levelIndex, carry: Carry | undefined = this.startCarry): void {
    this.deps.screens.hide();
    this.scene.restart({ deps: this.deps, started: true, difficulty, levelIndex, carry });
  }

  private aimRow(px: number, py: number): number {
    const y = (py + GUN_HEIGHT_PX) / TILE;
    const raisedY = y + RAISE / TILE;
    return this.world.grid.elevation(px / TILE, raisedY) > 0 ? raisedY : y;
  }

  private readInput(): Input {
    const k = this.keys;
    const cam = this.cameras.main;
    const ptr = this.input.activePointer;
    const wp = cam.getWorldPoint(ptr.x, ptr.y);
    const touch = this.deps.touch.read();
    const keyX = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
    const keyY = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
    const moveX = keyX || touch.moveX;
    const moveY = keyY || touch.moveY;
    const mouseFire = this.firing && ptr.leftButtonDown();
    const pointerMoved = ptr.x !== this.lastPointer.x || ptr.y !== this.lastPointer.y;
    this.lastPointer = { x: ptr.x, y: ptr.y };
    const moveChanged = (moveX !== 0 || moveY !== 0) && (moveX !== this.lastMove.x || moveY !== this.lastMove.y);
    this.lastMove = { x: moveX, y: moveY };
    if (mouseFire || pointerMoved) this.aimByKeys = false;
    else if (moveChanged) this.aimByKeys = true;
    if (touch.isAiming) {
      this.aimByKeys = true;
      this.keyAim = touch.aimAngle;
    } else if (this.aimByKeys && (moveX !== 0 || moveY !== 0)) this.keyAim = Math.atan2(moveY, moveX);
    const p = this.world.player;
    const input: Input = {
      ...IDLE_INPUT,
      moveX,
      moveY,
      aimX: this.aimByKeys ? p.x + Math.cos(this.keyAim) : wp.x / TILE,
      aimY: this.aimByKeys ? p.y + Math.sin(this.keyAim) : this.aimRow(wp.x, wp.y),
      fire: mouseFire || k.SPACE.isDown || touch.isFiring,
      use: this.useQueued || touch.isUsing,
      weaponSlot: this.slotQueued,
      cycleWeapon: this.wheel,
    };
    this.useQueued = false;
    this.slotQueued = null;
    this.wheel = 0;
    return input;
  }

  // ---------- frame ----------

  update(_time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs / 1000, 0.1);
    const w = this.world;
    if (this.deps.touch.takePause()) this.togglePause();
    this.deps.touch.showPaused(this.paused && this.started);
    if (this.deps.touch.isEnabled) this.deps.touch.showUse(w.status === 'playing' && !this.paused ? w.usableAction() : null);
    if (!this.paused && !this.deps.screens.visible && !this.deps.touch.isBlocked) {
      w.update(dt, this.readInput());
    } else {
      this.deps.touch.read();
      this.useQueued = false;
      this.slotQueued = null;
      this.wheel = 0;
    }
    for (const e of w.drainEvents()) this.handleEvent(e);

    this.animClock += dt;
    this.syncWorld();
    this.updateFx(dt);
    this.drawOverlay();
    this.deps.hud.update(w, dt);
    this.updateTip();

    if (w.status !== 'playing' && !this.ended) {
      this.endTimer += dt;
      if (this.endTimer > (w.status === 'won' ? 0.6 : 1.4)) {
        this.ended = true;
        this.deps.music.stop();
        const info = levelInfo(this.levelIndex);
        const nextInfo = LEVELS[this.levelIndex + 1];
        if (w.status === 'won') {
          this.deathLevel = -1;
          this.deathCount = 0;
          if (info.training) markTrainingDone();
          const next = info.training
            ? { title: nextInfo.title, onContinue: () => this.finishTraining(), blurb: 'The deployment starts with a fresh loadout.' }
            : nextInfo
              ? { title: nextInfo.title, onContinue: () => this.restart(this.difficulty, this.levelIndex + 1, this.world.carry()) }
              : null;
          this.deps.screens.won(info.title, w.stats, w.time, info.par, DIFFICULTIES, this.difficulty.id, (d) => this.restart(d, 0, undefined), next);
        } else {
          if (this.deathLevel !== this.levelIndex) {
            this.deathLevel = this.levelIndex;
            this.deathCount = 0;
          }
          this.deathCount++;
          const canPick = this.deathCount >= DEATHS_BEFORE_DIFFICULTY_PICK;
          this.deps.screens.dead(DIFFICULTIES, this.difficulty.id, (d) => this.restart(d), canPick);
          this.deps.music.play(DEATH_MUSIC);
        }
      }
    }
  }

  private handleEvent(e: GameEvent): void {
    const p = this.world.player;
    switch (e.type) {
      case 'sound': {
        const d = dist(p.x, p.y, e.x, e.y);
        this.deps.sfx.play(e.sound, Math.max(0, 1 - d / 20), (e.x - p.x) / 12);
        break;
      }
      case 'message':
        this.deps.hud.message(e.text, e.tone, this.world.time);
        break;
      case 'damage':
        if (!this.world.isRevealedAt(e.x, e.y)) break;
        this.spawnFloater(e.x, e.y, String(e.amount), e.toPlayer ? '#ff3a2a' : '#ff6a3a');
        break;
      case 'heal':
        if (!this.world.isRevealedAt(e.x, e.y)) break;
        this.spawnFloater(e.x, e.y, `+${e.amount}`, '#40e040');
        break;
      case 'tracer':
        if (!this.world.isRevealedAt(e.x1, e.y1) && !this.world.isRevealedAt(e.x2, e.y2)) break;
        this.tracers.push({ x1: e.x1, y1: e.y1, x2: e.x2, y2: e.y2, age: 0, hostile: e.hostile, beam: false });
        break;
      case 'beam':
        this.tracers.push({ x1: e.x1, y1: e.y1, x2: e.x2, y2: e.y2, age: 0, hostile: false, beam: true });
        break;
      case 'effect':
        if (!this.world.isRevealedAt(e.x, e.y)) break;
        this.spawnFx(e.effect, e.x, e.y);
        break;
    }
  }

  private spawnFloater(x: number, y: number, label: string, color: string): void {
    const text = this.add
      .text(x * TILE + (Math.random() * 8 - 4), (y - 0.7) * TILE, label, {
        fontFamily: 'Verdana, Tahoma, sans-serif',
        fontSize: '9px',
        fontStyle: 'bold',
        color,
        stroke: '#000000',
        strokeThickness: 2,
        resolution: 2,
      })
      .setOrigin(0.5)
      .setDepth(NAME_DEPTH + 1);
    this.floaters.push({ text, age: 0 });
  }

  private spawnFx(name: EffectKind, x: number, y: number): void {
    const lift = this.lift(x, y);
    const sprite = this.add.image(x * TILE, y * TILE - (name === 'blood' ? 10 : 6) - lift, ATLAS, key.fx(name, 0)).setDepth(this.raisedDepth(x, y, y * TILE + 20));
    if (ADDITIVE_FX.has(name)) sprite.setBlendMode(Phaser.BlendModes.ADD);
    this.fx.push({ sprite, name, frames: FX_FRAMES[name], age: 0, frameTime: FX_TIME[name] });
    if (name === 'explosion' || name === 'riftblast') {
      this.add.image(x * TILE, y * TILE - lift, ATLAS, key.fx('scorch', 0)).setDepth(this.raisedDepth(x, y, DECAL_DEPTH + 1));
      const d = dist(x, y, this.world.player.x, this.world.player.y);
      if (d < 9) this.cameras.main.shake(220, 0.012 * (1 - d / 9));
    }
  }

  private actorFrame(moving: boolean, walkTime: number, attacking: boolean): number {
    if (attacking) return 3;
    if (!moving) return 0;
    return Math.floor(walkTime / 0.16) % 2 === 0 ? 1 : 2;
  }

  private syncWorld(): void {
    const w = this.world;
    const p = w.player;
    const pv = this.playerView;
    const pf = this.actorFrame(p.moving, p.walkTime, p.attackTime > 0);
    const pLift = this.lift(p.x, p.y + ACTOR_FOOT);
    const pDepth = this.raisedDepth(p.x, p.y + ACTOR_FOOT, (p.y + ACTOR_FOOT) * TILE);
    pv.sprite.setPosition(p.x * TILE, (p.y + ACTOR_FOOT) * TILE - pLift).setDepth(pDepth);
    if (w.status === 'dead') {
      if (!pv.dead) {
        pv.dead = true;
        pv.sprite.setFrame(key.corpse('marine')).setOrigin(0.5, 0.7).setDepth(this.raisedDepth(p.x, p.y + ACTOR_FOOT, CORPSE_DEPTH + p.y));
        pv.name.setVisible(false);
      }
    } else {
      pv.sprite.setFrame(key.marine(p.weapon, p.dir, pf));
      pv.sprite.setTint(p.hurtTime > 0.2 ? 0xff9090 : 0xffffff);
      pv.name.setPosition(p.x * TILE, (p.y + ACTOR_FOOT) * TILE - 31 - pLift);
    }

    if (p.flash > 0 && w.status === 'playing') {
      this.muzzle
        .setVisible(true)
        .setPosition((p.x + Math.cos(p.angle) * 0.62) * TILE, (p.y + Math.sin(p.angle) * 0.62) * TILE - GUN_HEIGHT_PX - pLift)
        .setDepth(pDepth + (p.dir === 'n' ? -1 : 1));
    } else this.muzzle.setVisible(false);

    this.syncReveal();

    for (const m of w.monsters) {
      const v = this.monsterView(m);
      v.sprite.setVisible(w.isRevealedAt(m.x, m.y));
      if (m.state === 'dead') {
        if (!v.dead) {
          v.dead = true;
          v.sprite.setFrame(key.corpse(m.kind)).setOrigin(0.5, 0.7).clearTint().setAlpha(m.def.stealth ? 0.45 : 1).setDepth(this.raisedDepth(m.x, m.y + ACTOR_FOOT, CORPSE_DEPTH + m.y));
          v.sprite.setPosition(m.x * TILE, (m.y + ACTOR_FOOT) * TILE - this.lift(m.x, m.y + ACTOR_FOOT));
          v.name.setVisible(false);
        }
        continue;
      }
      const f = this.actorFrame(m.moving, m.walkTime, m.state === 'windup' && m.stateTime < 0.25);
      const mLift = m.def.floats ? FLOAT_PX + Math.sin(this.animClock * 3 + m.id) * 2 : this.lift(m.x, m.y + ACTOR_FOOT);
      v.sprite
        .setFrame(key.actor(m.kind, m.dir, m.state === 'pain' ? 0 : f))
        .setPosition(m.x * TILE, (m.y + ACTOR_FOOT) * TILE - mLift)
        .setDepth(this.raisedDepth(m.x, m.y + ACTOR_FOOT, (m.y + ACTOR_FOOT) * TILE));
      v.sprite.setTint(m.hurtTime > 0 || m.state === 'pain' ? 0xff7070 : m.burn > 0 ? 0xffb070 : 0xffffff);
      if (m.def.stealth) {
        if (m.hurtTime > 0) v.exposedUntil = this.animClock + 1.5;
        v.sprite.setAlpha(m.hurtTime > 0 ? 0.7 : 0.37 + 0.12 * Math.sin(this.animClock * 7 + m.id));
      }
      const ratio = m.hp / m.def.hp;
      v.name.setPosition(m.x * TILE, (m.y + ACTOR_FOOT) * TILE - (LABEL_HEIGHT[m.kind] ?? 31) - mLift);
      v.name.setColor(ratio > 0.6 ? '#30d030' : ratio > 0.3 ? '#e0d030' : '#e03020');
    }

    for (const it of w.items) {
      let img = this.itemViews.get(it.id);
      if (!img && !it.taken) {
        this.addItem(it.id, it.kind, it.x, it.y);
        img = this.itemViews.get(it.id);
      }
      if (img && it.taken) {
        this.tweens.killTweensOf(img);
        img.destroy();
        this.itemViews.delete(it.id);
      } else if (img) img.setVisible(w.isRevealedAt(it.x, it.y));
    }

    const frame3 = Math.floor(this.animClock / 0.3) % 3;
    for (const b of w.barrels) {
      const img = this.barrelViews.get(b.id);
      if (!img) continue;
      if (b.exploded) {
        img.destroy();
        this.barrelViews.delete(b.id);
      } else img.setFrame(key.barrel(frame3)).setVisible(w.isRevealedAt(b.x, b.y));
    }

    const live = new Set<number>();
    for (const pr of w.projectiles) {
      live.add(pr.id);
      let img = this.projectileViews.get(pr.id);
      if (!img) {
        img = this.add.image(0, 0, ATLAS, key.fx(pr.look, 0));
        if (pr.look !== 'grenade') img.setBlendMode(Phaser.BlendModes.ADD);
        this.projectileViews.set(pr.id, img);
      }
      img
        .setFrame(key.fx(pr.look, Math.floor(this.animClock / 0.08) % 2))
        .setPosition(pr.x * TILE, pr.y * TILE - 12 - this.lift(pr.x, pr.y))
        .setDepth(this.raisedDepth(pr.x, pr.y, pr.y * TILE + 12))
        .setVisible(w.isRevealedAt(pr.x, pr.y));
    }
    for (const [id, img] of this.projectileViews) {
      if (!live.has(id)) {
        img.destroy();
        this.projectileViews.delete(id);
      }
    }

    for (const v of this.doorViews) {
      if (looksLikeWall(v.lead.kind) && !w.isRevealedAt(v.lead.x + 0.5, v.lead.y + 0.5)) {
        v.img.setVisible(false);
        continue;
      }
      const visible = Math.max(0, Math.round(v.height * (1 - v.lead.openness)));
      v.img.setVisible(visible > 0);
      v.img.setCrop(0, 0, v.width, visible);
      v.img.y = v.top + (v.height - visible);
    }

    if (this.exitView && w.exitActivated) this.exitView.setFrame(key.exit(this.exitWall, true));
    for (const v of this.switchViews) if (w.switchesOn.has(v.id)) v.img.setFrame(key.switch(v.wall, true));

    for (const l of this.liquids) l.img.setFrame(key.floor(l.kind, frame3));
    const bf = Math.floor(this.animClock / 0.12) % 3;
    for (const b of this.braziers) b.setFrame(key.deco('brazier', bf));
  }

  private updateFx(dt: number): void {
    for (const f of this.fx) {
      f.age += dt;
      const frame = Math.floor(f.age / f.frameTime);
      if (frame >= f.frames) f.sprite.destroy();
      else f.sprite.setFrame(key.fx(f.name, frame));
    }
    this.fx = this.fx.filter((f) => f.sprite.active);

    for (const fl of this.floaters) {
      fl.age += dt;
      fl.text.y -= dt * 22;
      fl.text.setAlpha(Math.max(0, 1 - Math.max(0, fl.age - 0.5) / 0.5));
      if (fl.age > 1) fl.text.destroy();
    }
    this.floaters = this.floaters.filter((f) => f.text.active);
    for (const t of this.tracers) t.age += dt;
    this.tracers = this.tracers.filter((t) => t.age < (t.beam ? BEAM_LIFE : TRACER_LIFE));
  }

  private drawSight(view: Phaser.Geom.Rectangle): void {
    const g = this.sightGfx;
    g.clear();
    if (!this.showSight) return;
    const grid = this.world.grid;
    const margin = 14 * TILE;
    for (const m of this.world.monsters) {
      if (m.state === 'dead' || !this.world.isRevealedAt(m.x, m.y) || !this.isExposed(m)) continue;
      const mx = m.x * TILE;
      const my = m.y * TILE;
      if (mx < view.x - margin || mx > view.right + margin || my < view.y - margin || my > view.bottom + margin) continue;
      const alert = m.state === 'chase' || m.state === 'windup' || m.state === 'pain';
      const color = alert ? 0xff3020 : m.state === 'hold' ? 0xff9a20 : 0xffe060;
      const { fov } = m.def;
      const range = this.world.sightRange(m, alert);
      const rays = Math.max(8, Math.ceil(fov / 0.07));
      const points: { x: number; y: number }[] = [{ x: mx, y: my }];
      for (let i = 0; i <= rays; i++) {
        const a = m.angle - fov / 2 + (fov * i) / rays;
        const dx = Math.cos(a);
        const dy = Math.sin(a);
        const hit = grid.raycast(m.x, m.y, dx, dy, range, (cx, cy) => (m.def.coverBlocksSight ? grid.isShotBlocker(cx, cy) : grid.isOpaque(cx, cy)));
        points.push({ x: (m.x + dx * hit.dist) * TILE, y: (m.y + dy * hit.dist) * TILE });
      }
      const trace = (): void => {
        g.beginPath();
        g.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) g.lineTo(points[i].x, points[i].y);
        g.closePath();
      };
      g.fillStyle(color, alert ? 0.16 : 0.11);
      trace();
      g.fillPath();
      g.lineStyle(1, color, alert ? 0.55 : 0.35);
      trace();
      g.strokePath();
    }
  }

  private isExposed(m: Monster): boolean {
    if (!m.def.stealth) return true;
    const p = this.world.player;
    return Math.hypot(m.x - p.x, m.y - p.y) < STEALTH_EXPOSE_RANGE || this.monsterView(m).exposedUntil > this.animClock;
  }

  private hiddenCells(view: Phaser.Geom.Rectangle): [number, number, number][] {
    const out: [number, number, number][] = [];
    for (let y = Math.floor(view.y / TILE) - 1; y <= Math.ceil(view.bottom / TILE) + 1; y++) {
      for (let x = Math.floor(view.x / TILE) - 1; x <= Math.ceil(view.right / TILE) + 1; x++) {
        if (!this.isCellHidden(x, y)) continue;
        const below = this.world.grid.tile(x, y + 1);
        const capBelow = below && below.type !== 'void' && below.type !== 'floor' && !this.isCellHidden(x, y + 1);
        out.push([x, y, capBelow ? TILE - WALL_HEIGHT : TILE]);
      }
    }
    return out;
  }

  private isCellHidden(x: number, y: number): boolean {
    const g = this.world.grid;
    const t = g.tile(x, y);
    if (!t || t.type === 'void') return true;
    const closet = this.world.hiddenCloset();
    if (closet?.cells.has(g.index(x, y))) return !closet.embedded || !closet.outerRooms.some((r) => this.world.revealedRooms.has(r));
    if (t.type === 'floor' || t.type === 'door') return !this.world.isRevealedAt(x + 0.5, y + 0.5);
    return !this.roomsAround(x, y).some((r) => this.world.revealedRooms.has(r));
  }

  private syncReveal(): void {
    const w = this.world;
    if (this.closetCovers.length > 0) {
      const closet = w.hiddenCloset();
      if (!closet) {
        for (const img of this.closetCovers) img.destroy();
        this.closetCovers = [];
      } else {
        const shown = closet.outerRooms.some((r) => w.revealedRooms.has(r));
        for (const img of this.closetCovers) img.setVisible(shown);
      }
    }
    if (w.revealedRooms.size === this.revealCount) return;
    this.revealCount = w.revealedRooms.size;
    for (const v of this.walls) v.img.setVisible(v.rooms.length === 0 || v.rooms.some((r) => w.revealedRooms.has(r)));
    this.exitView?.setVisible(this.exitRooms.some((r) => w.revealedRooms.has(r)));
    for (const v of this.decoViews) v.img.setVisible(w.isRevealedAt(v.x, v.y));
  }

  private drawOverlay(): void {
    const g = this.gfx;
    const w = this.world;
    g.clear();
    const line = Math.max(1, (1.5 * this.scale.displayScale.x) / ZOOM);
    for (const t of this.tracers) {
      const x1 = t.x1 * TILE;
      const y1 = t.y1 * TILE - GUN_HEIGHT_PX - this.lift(t.x1, t.y1 + ACTOR_FOOT);
      const x2 = t.x2 * TILE;
      const y2 = t.y2 * TILE - GUN_HEIGHT_PX - this.lift(t.x2, t.y2);
      if (t.beam) {
        const fade = 1 - t.age / BEAM_LIFE;
        g.lineStyle(3 * line, 0x4ad0ff, 0.7 * fade).lineBetween(x1, y1, x2, y2);
        g.lineStyle(line, 0xffffff, fade).lineBetween(x1, y1, x2, y2);
        continue;
      }
      g.lineStyle(line, t.hostile ? 0xff9a40 : 0xfff0a0, 0.8 - t.age * 10);
      g.lineBetween(x1, y1, x2, y2);
    }

    const view = this.cameras.main.worldView;
    const bar = (x: number, y: number, ratio: number): void => {
      const bw = 26;
      g.fillStyle(0x000000, 1).fillRect(x - bw / 2 - 1, y - 1, bw + 2, 5);
      const color = ratio > 0.6 ? 0x20c020 : ratio > 0.3 ? 0xd0c020 : 0xd02010;
      g.fillStyle(color, 1).fillRect(x - bw / 2, y, Math.max(1, Math.round(bw * ratio)), 3);
    };
    for (const m of w.monsters) {
      if (m.state === 'dead') continue;
      const v = this.monsterView(m);
      const onScreen = view.contains(m.x * TILE, m.y * TILE) && w.isRevealedAt(m.x, m.y) && this.isExposed(m);
      v.name.setVisible(onScreen);
      if (onScreen) bar(m.x * TILE, v.name.y + 1, m.hp / m.def.hp);
    }
    if (w.status === 'playing') bar(w.player.x * TILE, this.playerView.name.y + 1, Math.min(1, w.player.health / 100));

    this.drawSight(view);

    const lights: Light[] = [];
    const p = w.player;
    lights.push({ x: p.x, y: p.y, r: p.flash > 0 ? 7.5 : 5.2, a: 0.95, color: [255, 220, 160], glow: p.flash > 0 ? 0.25 : 0 });
    for (const l of this.staticLights) lights.push(l);
    for (const pr of w.projectiles) {
      const light = PROJECTILE_LIGHT[pr.look];
      if (light) lights.push({ ...light, x: pr.x, y: pr.y - 0.3 });
    }
    for (const t of this.tracers) if (t.beam) lights.push({ x: t.x2, y: t.y2, r: 2.4, a: 0.8, color: [80, 200, 255], glow: 0.35 });
    for (const f of this.fx) {
      if (f.name === 'explosion') lights.push({ x: f.sprite.x / TILE, y: f.sprite.y / TILE, r: 6, a: 1, color: [255, 150, 50], glow: 0.6 * (1 - f.age / 0.36) });
      if (f.name === 'burst') lights.push({ x: f.sprite.x / TILE, y: f.sprite.y / TILE, r: 3, a: 0.9, color: [255, 120, 40], glow: 0.4 });
      if (f.name === 'flame') lights.push({ x: f.sprite.x / TILE, y: f.sprite.y / TILE, r: 2.4, a: 0.85, color: [255, 140, 40], glow: 0.3 });
      if (f.name === 'riftblast') lights.push({ x: f.sprite.x / TILE, y: f.sprite.y / TILE, r: 9, a: 1, color: [190, 90, 255], glow: 0.7 * (1 - f.age / 0.44) });
    }
    for (const it of w.items) {
      if (it.taken) continue;
      const keyColor = it.kind === 'redkey' ? 'red' : it.kind === 'bluekey' ? 'blue' : it.kind === 'yellowkey' ? 'yellow' : null;
      if (keyColor) lights.push({ x: it.x, y: it.y, r: 1.6, a: 0.5, color: KEY_RGB[keyColor], glow: 0.35 });
      if (it.kind === 'sphere') lights.push({ x: it.x, y: it.y, r: 2.2, a: 0.6, color: [60, 140, 255], glow: 0.35 });
    }
    for (const m of w.monsters) {
      if (m.kind === 'fiend' && m.state === 'windup' && m.attack === 'ranged') lights.push({ x: m.x, y: m.y - 0.4, r: 2, a: 0.7, color: [255, 140, 40], glow: 0.4 });
    }
    for (const v of this.switchViews) {
      if (v.img.visible) lights.push({ x: v.x, y: v.y, r: 1.6, a: w.switchesOn.has(v.id) ? 0.5 : 0.3, color: [90, 230, 255], glow: 0.15 });
    }
    if (this.exitView) {
      const ex = this.exitView.x / TILE + 0.5;
      const ey = (this.exitView.y + WALL_HEIGHT) / TILE + 1;
      lights.push({ x: ex, y: ey, r: 2.2, a: 0.6, color: w.exitActivated ? [60, 255, 80] : [255, 50, 40], glow: 0.25 });
    }
    const visibleLights = lights.filter((l, i) => i === 0 || w.isRevealedAt(l.x, l.y));
    if (!this.overview) this.lighting.render(view, visibleLights, this.animClock, this.hiddenCells(view));
  }
}
