import Phaser from 'phaser';
import { ARENA } from '../levels/arena';
import { ArenaWorld, type ArenaEvent, type ArenaPlayer, type Slot } from '../sim/arena';
import { IDLE_INPUT, type Input } from '../sim/world';
import { dist } from '../sim/types';
import { encode, parseClientMessage, parseHostMessage } from '../net/protocol';
import type { Link } from '../net/peer';
import type { HudView } from '../ui/hud';
import { ACTOR_FOOT, CORPSE_DEPTH, FLOOR_DEPTH, GUN_HEIGHT_PX, NAME_DEPTH, OVERLAY_DEPTH, VIEW_H, VIEW_W, ZOOM, hash, type GameDeps } from './GameScene';
import { TILE, WALL_HEIGHT } from './art/tiles';
import { ATLAS, FLOOR_VARIANTS, WALL_VARIANTS, key } from './atlas';
import { Lighting, type Light } from './lighting';

export type Role = 'host' | 'guest';

export interface ArenaInit {
  deps: GameDeps;
  link: Link;
  role: Role;
  names: [string, string];
}

const SNAPSHOT_EVERY = 0.05;
const INPUT_EVERY = 1 / 30;
const MAX_PENDING_EVENTS = 200;
const RATE_WINDOW = 1;
const RATE_SOFT = 120;
const RATE_HARD = 600;
const TEAM_COLOR = ['#30d030', '#4a9aff'] as const;
const FX_FRAMES = 3;
const FX_TIME = 0.065;

interface MarineView {
  sprite: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
  muzzle: Phaser.GameObjects.Image;
}

export class ArenaScene extends Phaser.Scene {
  private deps!: GameDeps;
  private link!: Link;
  private role: Role = 'host';
  private names: [string, string] = ['Marine', 'Marine'];
  private world!: ArenaWorld;
  private local: Slot = 0;
  private views: MarineView[] = [];
  private itemViews: Phaser.GameObjects.Image[] = [];
  private fx: { sprite: Phaser.GameObjects.Image; name: 'blood' | 'puff'; age: number }[] = [];
  private tracers: { x1: number; y1: number; x2: number; y2: number; age: number; slot: Slot }[] = [];
  private staticLights: Light[] = [];
  private gfx!: Phaser.GameObjects.Graphics;
  private lighting!: Lighting;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private firing = false;
  private wheel = 0;
  private slotQueued: number | null = null;
  private remoteInput: Input = IDLE_INPUT;
  private pending: ArenaEvent[] = [];
  private sendTimer = 0;
  private rate = { window: 0, count: 0 };
  private ended = false;
  private menuOpen = false;

  constructor() {
    super('arena');
  }

  init(data: ArenaInit): void {
    this.deps = data.deps;
    this.link = data.link;
    this.role = data.role;
    this.names = data.names;
    this.local = data.role === 'host' ? 0 : 1;
  }

  create(): void {
    this.world = new ArenaWorld(ARENA.load(), this.names, (Date.now() & 0xffff) + 1);
    this.views = [];
    this.itemViews = [];
    this.fx = [];
    this.tracers = [];
    this.staticLights = [];
    this.pending = [];
    this.ended = false;
    this.menuOpen = false;
    this.remoteInput = IDLE_INPUT;

    this.buildMap();
    for (const p of this.world.players) this.views.push(this.makeMarine(p));
    for (const it of this.world.items) this.itemViews.push(this.add.image(it.x * TILE, it.y * TILE - 4, ATLAS, key.item(it.kind)).setDepth(it.y * TILE));
    this.gfx = this.add.graphics().setDepth(OVERLAY_DEPTH - 10);
    this.lighting = new Lighting(this, VIEW_W / ZOOM, VIEW_H / ZOOM, ARENA.darkness, OVERLAY_DEPTH);

    const cam = this.cameras.main;
    cam.setZoom(ZOOM);
    cam.setBackgroundColor('#000000');
    cam.setBounds(-TILE * 2, -TILE * 2, this.world.grid.width * TILE + TILE * 4, this.world.grid.height * TILE + TILE * 4);
    cam.startFollow(this.views[this.local].sprite, true, 0.18, 0.18, 0, 14);
    cam.roundPixels = true;

    this.setupInput();
    this.deps.hud.reset(this.world, ARENA.title);
    this.deps.hud.setTip(null, null);
    this.updateScore();
    this.deps.music.play(ARENA.music);
    this.deps.hud.message(`${this.names[0]} (green) vs ${this.names[1]} (blue). First to 10 frags wins.`, 'info', 0);

    if (import.meta.env.DEV) (window as unknown as { __arena: unknown }).__arena = { world: this.world, scene: this };
    this.link.onMessage = (raw) => (this.role === 'host' ? this.onClientMessage(raw) : this.onHostMessage(raw));
    this.link.onClose = () => this.connectionLost();
    this.events.once('shutdown', () => {
      this.link.onMessage = () => undefined;
      this.link.onClose = () => undefined;
    });
  }

  // ---------- map ----------

  private buildMap(): void {
    const g = this.world.grid;
    if (this.textures.exists('arena_floor')) this.textures.remove('arena_floor');
    const tex = this.textures.createCanvas('arena_floor', g.width * TILE, g.height * TILE)!;
    const ctx = tex.context;
    ctx.imageSmoothingEnabled = false;
    const isWall = (x: number, y: number): boolean => {
      const t = g.tile(x, y);
      return !t || t.type !== 'floor';
    };
    for (let y = 0; y < g.height; y++) {
      for (let x = 0; x < g.width; x++) {
        const t = g.tiles[g.index(x, y)];
        if (t.type === 'floor') {
          const variant = hash(x, y) < 700 ? 0 : hash(x, y) % FLOOR_VARIANTS;
          const fr = this.textures.getFrame(ATLAS, key.floor(t.floor, variant));
          ctx.drawImage(fr.source.image as CanvasImageSource, fr.cutX, fr.cutY, TILE, TILE, x * TILE, y * TILE, TILE, TILE);
          ctx.fillStyle = 'rgba(0,0,0,0.28)';
          if (isWall(x, y - 1)) ctx.fillRect(x * TILE, y * TILE, TILE, 7);
          if (isWall(x - 1, y)) ctx.fillRect(x * TILE, y * TILE, 5, TILE);
        } else if (t.type === 'wall') {
          const open = [-1, 0, 1].some((dy) => [-1, 0, 1].some((dx) => g.tile(x + dx, y + dy)?.type === 'floor'));
          if (!open) continue;
          const below = g.tile(x, y + 1);
          const variant = !below || below.type !== 'floor' || hash(x, y) < 600 ? 0 : 1 + (hash(x, y) % (WALL_VARIANTS[t.wall] - 1));
          this.add.image(x * TILE, y * TILE - WALL_HEIGHT, ATLAS, key.wall(t.wall, variant)).setOrigin(0).setDepth((y + 1) * TILE);
        }
      }
    }
    tex.refresh();
    this.add.image(0, 0, 'arena_floor').setOrigin(0).setDepth(FLOOR_DEPTH);
    for (const d of this.world.decos) {
      const cx = d.x * TILE;
      const bottom = Math.floor(d.y) * TILE + TILE;
      if (d.kind === 'lamp') {
        this.add.image(cx, bottom - 2, ATLAS, key.deco('lamp', 0)).setOrigin(0.5, 1).setDepth((d.y + ACTOR_FOOT) * TILE);
        this.staticLights.push({ x: d.x, y: d.y - 0.3, r: 4.6, a: 0.92, color: [170, 225, 255], glow: 0.1 });
      } else if (d.kind === 'crate') this.add.image(cx, bottom, ATLAS, key.deco('crate', 0)).setOrigin(0.5, 1).setDepth(bottom);
    }
  }

  private makeMarine(p: ArenaPlayer): MarineView {
    const sprite = this.add.image(p.x * TILE, (p.y + ACTOR_FOOT) * TILE, ATLAS, key.marine('pistol', 's', 0, p.team)).setOrigin(0.5, 30 / 32);
    const label = this.add
      .text(0, 0, p.name, {
        fontFamily: 'Verdana, Tahoma, sans-serif',
        fontSize: '9px',
        fontStyle: 'bold',
        color: TEAM_COLOR[p.slot],
        stroke: '#000000',
        strokeThickness: 2,
        resolution: 2,
      })
      .setOrigin(0.5, 1)
      .setDepth(NAME_DEPTH);
    const muzzle = this.add.image(0, 0, ATLAS, key.fx('muzzle', 0)).setVisible(false).setBlendMode(Phaser.BlendModes.ADD);
    return { sprite, label, muzzle };
  }

  // ---------- input ----------

  private setupInput(): void {
    const kb = this.input.keyboard!;
    kb.enabled = true;
    this.keys = kb.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,ONE,TWO,THREE,FOUR,Q,M,N,ESC') as Record<string, Phaser.Input.Keyboard.Key>;
    kb.addCapture('SPACE,UP,DOWN,LEFT,RIGHT');
    this.input.mouse?.disableContextMenu();
    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (ptr.leftButtonDown()) this.firing = true;
    });
    this.input.on('pointerup', () => (this.firing = false));
    this.input.on('gameout', () => (this.firing = false));
    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => (this.wheel += Math.sign(dy)));
    this.keys.ONE.on('down', () => (this.slotQueued = 1));
    this.keys.TWO.on('down', () => (this.slotQueued = 2));
    this.keys.THREE.on('down', () => (this.slotQueued = 3));
    this.keys.FOUR.on('down', () => (this.slotQueued = 4));
    this.keys.Q.on('down', () => (this.wheel += 1));
    this.keys.M.on('down', () => this.deps.sfx.toggleMute());
    this.keys.N.on('down', () => this.deps.music.toggle());
    this.keys.ESC.on('down', () => this.openMenu());
  }

  private readInput(): Input {
    const k = this.keys;
    const ptr = this.input.activePointer;
    const wp = this.cameras.main.getWorldPoint(ptr.x, ptr.y);
    const blocked = this.menuOpen || this.ended;
    const input: Input = {
      ...IDLE_INPUT,
      moveX: blocked ? 0 : (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0),
      moveY: blocked ? 0 : (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0),
      aimX: wp.x / TILE,
      aimY: (wp.y + GUN_HEIGHT_PX) / TILE,
      fire: !blocked && ((this.firing && ptr.leftButtonDown()) || k.SPACE.isDown),
      weaponSlot: this.slotQueued,
      cycleWeapon: Math.sign(this.wheel),
    };
    this.slotQueued = null;
    this.wheel = 0;
    return input;
  }

  // ---------- network ----------

  private onClientMessage(raw: string): void {
    const now = this.time.now / 1000;
    if (now - this.rate.window > RATE_WINDOW) this.rate = { window: now, count: 0 };
    this.rate.count++;
    if (this.rate.count > RATE_HARD) {
      this.link.close();
      return;
    }
    if (this.rate.count > RATE_SOFT) return;
    const guest = this.world.players[1];
    const msg = parseClientMessage(raw, guest);
    if (msg?.t !== 'input') return;
    const prev = this.remoteInput;
    this.remoteInput = {
      ...msg.input,
      weaponSlot: msg.input.weaponSlot ?? prev.weaponSlot,
      cycleWeapon: msg.input.cycleWeapon || prev.cycleWeapon,
    };
  }

  private onHostMessage(raw: string): void {
    const msg = parseHostMessage(raw, this.world.items.length);
    if (msg?.t !== 'snap') return;
    this.world.applySnapshot(msg.snap);
    for (const e of msg.snap.events) this.handleEvent(e);
  }

  private connectionLost(): void {
    if (this.ended) return;
    this.ended = true;
    this.deps.music.stop();
    this.deps.screens.notice('CONNECTION LOST', 'The other player left or the link dropped.', 'Back to title', () => window.location.reload());
  }

  private openMenu(): void {
    if (this.ended || this.menuOpen) return;
    this.menuOpen = true;
    this.deps.screens.menu('MATCH', 'The match keeps running while this menu is open.', [
      { name: 'Keep playing', blurb: 'Back to the fight.', action: () => (this.menuOpen = false) },
      {
        name: 'Leave the match',
        blurb: 'Closes the connection for both players.',
        action: () => {
          this.ended = true;
          this.link.close();
          window.location.reload();
        },
      },
    ]);
  }

  // ---------- frame ----------

  update(_time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs / 1000, 0.1);
    const own = this.readInput();
    this.sendTimer += dt;
    if (this.role === 'host') {
      this.world.update(dt, [own, this.remoteInput]);
      this.remoteInput = { ...this.remoteInput, weaponSlot: null, cycleWeapon: 0 };
      const events = this.world.drainEvents();
      for (const e of events) this.handleEvent(e);
      this.pending.push(...events);
      if (this.sendTimer >= SNAPSHOT_EVERY) {
        this.sendTimer = 0;
        const batch = this.pending.slice(-MAX_PENDING_EVENTS);
        this.pending = [];
        this.link.send(encode({ t: 'snap', snap: this.world.snapshot(batch) }));
      }
    } else {
      this.remoteInput = {
        ...own,
        weaponSlot: own.weaponSlot ?? this.remoteInput.weaponSlot,
        cycleWeapon: own.cycleWeapon || this.remoteInput.cycleWeapon,
      };
      if (this.sendTimer >= INPUT_EVERY) {
        this.sendTimer = 0;
        this.link.send(encode({ t: 'input', input: this.remoteInput }));
        this.remoteInput = IDLE_INPUT;
      }
    }

    this.syncViews();
    this.updateFx(dt);
    this.drawOverlay();
    this.deps.hud.update(this.hudView(), dt);
    this.updateScore();
    if (this.world.status === 'over' && !this.ended) this.showResult();
  }

  private hudView(): HudView {
    const w = this.world;
    const p = w.players[this.local];
    return {
      player: p,
      status: p.alive ? 'playing' : 'dead',
      time: w.time,
      grid: w.grid,
      revealedRooms: w.revealedRooms,
      isRevealedAt: () => true,
      hiddenCloset: () => null,
    };
  }

  private updateScore(): void {
    const [a, b] = this.world.players;
    this.deps.hud.setTitle(`${a.name} ${a.frags} : ${b.frags} ${b.name}`);
  }

  private showResult(): void {
    this.ended = true;
    this.deps.music.stop();
    const winner = this.world.winner === null ? null : this.world.players[this.world.winner];
    const [a, b] = this.world.players;
    const title = winner ? `${winner.name.toUpperCase()} WINS` : 'MATCH OVER';
    this.deps.screens.notice(title, `${a.name} ${a.frags} : ${b.frags} ${b.name}`, 'Back to title', () => {
      this.link.close();
      window.location.reload();
    });
  }

  private handleEvent(e: ArenaEvent): void {
    const me = this.world.players[this.local];
    switch (e.type) {
      case 'sound': {
        const d = dist(me.x, me.y, e.x, e.y);
        this.deps.sfx.play(e.sound, Math.max(0, 1 - d / 20), (e.x - me.x) / 12);
        break;
      }
      case 'tracer':
        this.tracers.push({ x1: e.x1, y1: e.y1, x2: e.x2, y2: e.y2, age: 0, slot: e.slot });
        break;
      case 'effect': {
        const sprite = this.add.image(e.x * TILE, e.y * TILE - (e.effect === 'blood' ? 10 : 6), ATLAS, key.fx(e.effect, 0)).setDepth(e.y * TILE + 20);
        this.fx.push({ sprite, name: e.effect, age: 0 });
        break;
      }
      case 'message':
        if (e.slot === null || e.slot === this.local) this.deps.hud.message(e.text, e.slot === null ? 'info' : 'pickup', this.world.time);
        break;
      case 'damage':
        break;
    }
  }

  private syncViews(): void {
    const w = this.world;
    w.players.forEach((p, i) => {
      const v = this.views[i];
      if (!p.alive) {
        v.sprite.setFrame(key.marineCorpse(p.team)).setOrigin(0.5, 0.7).setDepth(CORPSE_DEPTH + p.y);
        v.label.setVisible(false);
        v.muzzle.setVisible(false);
        return;
      }
      const frame = p.attackTime > 0 ? 3 : !p.moving ? 0 : Math.floor(p.walkTime / 0.16) % 2 === 0 ? 1 : 2;
      v.sprite
        .setFrame(key.marine(p.weapon, p.dir, frame, p.team))
        .setOrigin(0.5, 30 / 32)
        .setPosition(p.x * TILE, (p.y + ACTOR_FOOT) * TILE)
        .setDepth((p.y + ACTOR_FOOT) * TILE)
        .setTint(p.hurtTime > 0.2 ? 0xff9090 : 0xffffff);
      v.label.setVisible(true).setPosition(p.x * TILE, (p.y + ACTOR_FOOT) * TILE - 31);
      if (p.flash > 0) {
        v.muzzle
          .setVisible(true)
          .setPosition((p.x + Math.cos(p.angle) * 0.62) * TILE, (p.y + Math.sin(p.angle) * 0.62) * TILE - GUN_HEIGHT_PX)
          .setDepth((p.y + ACTOR_FOOT) * TILE + (p.dir === 'n' ? -1 : 1));
      } else v.muzzle.setVisible(false);
    });
    w.items.forEach((it, i) => this.itemViews[i].setVisible(it.respawn === 0));
  }

  private updateFx(dt: number): void {
    for (const f of this.fx) {
      f.age += dt;
      const frame = Math.floor(f.age / FX_TIME);
      if (frame >= FX_FRAMES) f.sprite.destroy();
      else f.sprite.setFrame(key.fx(f.name, frame));
    }
    this.fx = this.fx.filter((f) => f.sprite.active);
    for (const t of this.tracers) t.age += dt;
    this.tracers = this.tracers.filter((t) => t.age < 0.06);
  }

  private drawOverlay(): void {
    const g = this.gfx;
    g.clear();
    for (const t of this.tracers) {
      g.lineStyle(1, t.slot === this.local ? 0xfff0a0 : 0xff9a40, 0.8 - t.age * 10);
      g.lineBetween(t.x1 * TILE, t.y1 * TILE - GUN_HEIGHT_PX, t.x2 * TILE, t.y2 * TILE - GUN_HEIGHT_PX);
    }
    const me = this.world.players[this.local];
    const other = this.world.players[this.local === 0 ? 1 : 0];
    const lights: Light[] = [{ x: me.x, y: me.y, r: me.flash > 0 ? 7.5 : 5.2, a: 0.95, color: [255, 220, 160], glow: me.flash > 0 ? 0.25 : 0 }];
    if (other.alive) lights.push({ x: other.x, y: other.y, r: other.flash > 0 ? 6 : 3, a: 0.8, color: [255, 220, 160], glow: other.flash > 0 ? 0.25 : 0 });
    lights.push(...this.staticLights);
    this.lighting.render(this.cameras.main.worldView, lights, this.world.time);
  }
}
