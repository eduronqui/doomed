import { DECO_POSTS, ITEM_NAMES, SOLID_DECOS, type Ambush, DEFAULT_DIFFICULTY, type DecoKind, type Difficulty, type KeyColor, type ItemKind, type SoundId } from './defs';
import { MARINE, MONSTERS, type MonsterDef, type MonsterKind } from '../characters';
import { FALLBACK_ORDER, MAX_AMMO, WEAPONS, WEAPON_ORDER, type AmmoType, type WeaponId } from '../weapons';
import { Grid, type Door } from './grid';
import { FLOOR_HAZARD, monsterOfChar, type DoorKind, type FloorKind, type LevelData, type WallKind } from './level';
import { findPath } from './pathfind';
import { Rng } from './rng';
import { clamp, dirFromAngle, dist, type Dir, type Vec } from './types';

export interface Input {
  moveX: number;
  moveY: number;
  aimX: number;
  aimY: number;
  fire: boolean;
  use: boolean;
  weaponSlot: number | null;
  cycleWeapon: number;
}

export const IDLE_INPUT: Input = {
  moveX: 0,
  moveY: 0,
  aimX: 0,
  aimY: 0,
  fire: false,
  use: false,
  weaponSlot: null,
  cycleWeapon: 0,
};

export interface HiddenCloset {
  cells: ReadonlySet<number>;
  outerRooms: readonly number[];
  wall: WallKind;
}

export interface WorldOptions {
  alertOnEntry?: MonsterKind[];
  ambush?: Ambush;
}

export interface Carry {
  health: number;
  armor: number;
  ammo: Record<AmmoType, number>;
  weapons: WeaponId[];
  weapon: WeaponId;
}

const KEY_COLOR_OF_ITEM: Record<'redkey' | 'bluekey' | 'yellowkey', KeyColor> = { redkey: 'red', bluekey: 'blue', yellowkey: 'yellow' };

export function keyColorOf(kind: DoorKind): KeyColor | null {
  return kind === 'red' || kind === 'blue' || kind === 'yellow' ? kind : null;
}

export interface Player {
  x: number;
  y: number;
  r: number;
  angle: number;
  dir: Dir;
  health: number;
  armor: number;
  ammo: Record<AmmoType, number>;
  weapons: Set<WeaponId>;
  weapon: WeaponId;
  keys: Set<KeyColor>;
  cooldown: number;
  flash: number;
  attackTime: number;
  hurtTime: number;
  hazardTimer: number;
  moving: boolean;
  walkTime: number;
  restTimer: number;
  stillTime: number;
  resting: boolean;
}

export type MonsterState = 'idle' | 'chase' | 'hold' | 'wander' | 'return' | 'windup' | 'pain' | 'dead';
type NavResult = 'moving' | 'arrived' | 'blocked';
type AttackKind = 'ranged' | 'melee';

export interface Monster {
  id: number;
  kind: MonsterKind;
  def: MonsterDef;
  x: number;
  y: number;
  r: number;
  hp: number;
  angle: number;
  dir: Dir;
  state: MonsterState;
  stateTime: number;
  cooldown: number;
  attack: AttackKind;
  path: Vec[];
  pathTimer: number;
  lookTimer: number;
  seesPlayer: boolean;
  cried: boolean;
  moving: boolean;
  walkTime: number;
  deathTime: number;
  hurtTime: number;
  home: Vec;
  lastKnown: Vec;
  lostTime: number;
  goal: Vec | null;
  goalCell: number;
  pauseTime: number;
  lookAround: number;
  turnTo: number;
}

export interface Item {
  id: number;
  kind: ItemKind;
  x: number;
  y: number;
  taken: boolean;
  dropped: boolean;
}

export interface Deco {
  id: number;
  kind: DecoKind;
  x: number;
  y: number;
}

export interface Barrel {
  id: number;
  x: number;
  y: number;
  r: number;
  hp: number;
  fuse: number;
  exploded: boolean;
}

export interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: [number, number];
  ownerId: number;
  alive: boolean;
}

export type MessageTone = 'info' | 'pickup' | 'warn' | 'secret';
export type EffectKind = 'puff' | 'blood' | 'explosion' | 'burst';

export type GameEvent =
  | { type: 'sound'; sound: SoundId; x: number; y: number }
  | { type: 'message'; text: string; tone: MessageTone }
  | { type: 'damage'; x: number; y: number; amount: number; toPlayer: boolean }
  | { type: 'heal'; x: number; y: number; amount: number }
  | { type: 'tracer'; x1: number; y1: number; x2: number; y2: number; hostile: boolean }
  | { type: 'effect'; effect: EffectKind; x: number; y: number };

export type GameStatus = 'playing' | 'dead' | 'won';

export interface Stats {
  kills: number;
  totalKills: number;
  items: number;
  totalItems: number;
  secrets: number;
  totalSecrets: number;
}

interface HitResult {
  dist: number;
  target: Monster | Barrel | Player | null;
  wall: boolean;
}

const PICKUP_RADIUS = 0.6;
const NOISE_RANGE = 13;
const SHOUT_RANGE = 10;
const CRY_GAP = 0.5;
const FOOTSTEP_RANGE = 4;
const STEP_INTERVAL = 0.35;
const LOUD_FLOORS: ReadonlySet<FloorKind> = new Set<FloorKind>(['metal', 'grate']);
const EXPLOSION_RADIUS = 2.6;
const EXPLOSION_DAMAGE = 110;
const FIREBALL_SPEED = 7.5;
const MAX_STEP = 1 / 30;
export const REST_DELAY = 10;
const CLOSE_SENSE = 1.5;
const BACK_ARC = (120 * Math.PI) / 180;
const ENEMY_AIM_ERROR = 0.14;
const DROPPED_AMMO = 5;
export const ALERT_SIGHT = 1.5;

function angleDiff(a: number, b: number): number {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}

function rayCircle(ox: number, oy: number, dx: number, dy: number, cx: number, cy: number, r: number): number {
  const fx = ox - cx;
  const fy = oy - cy;
  const b = fx * dx + fy * dy;
  const c = fx * fx + fy * fy - r * r;
  if (c <= 0) return 0;
  const disc = b * b - c;
  if (disc < 0 || b > 0) return -1;
  return -b - Math.sqrt(disc);
}

function isCalm(m: Monster): boolean {
  return m.state === 'idle' || m.state === 'wander' || m.state === 'return' || m.state === 'hold';
}

function isMonster(t: HitResult['target']): t is Monster {
  return t !== null && 'kind' in t && 'def' in t;
}

function isBarrel(t: HitResult['target']): t is Barrel {
  return t !== null && 'fuse' in t;
}

export class World {
  readonly level: LevelData;
  readonly grid: Grid;
  readonly rng: Rng;
  readonly difficulty: Difficulty;
  readonly revealedRooms = new Set<number>();
  private readonly enteredRooms = new Set<number>();
  private readonly alertOnEntry: ReadonlySet<MonsterKind>;
  private doorRooms: { group: Door[]; rooms: number[] }[] = [];
  private stepTimer = 0;
  private ambush: { key: KeyColor; door: Door; monsters: Monster[]; sprung: boolean; closet: HiddenCloset } | null = null;
  readonly player: Player;
  readonly monsters: Monster[] = [];
  readonly items: Item[] = [];
  readonly decos: Deco[] = [];
  private posts: { x: number; y: number; r: number }[] = [];
  private postCells = new Set<number>();
  readonly barrels: Barrel[] = [];
  readonly projectiles: Projectile[] = [];
  readonly stats: Stats;
  status: GameStatus = 'playing';
  time = 0;
  exitActivated = false;
  private events: GameEvent[] = [];
  private nextId = 1;
  private foundSecrets = new Set<number>();
  private throttle = new Map<string, number>();

  constructor(level: LevelData, seed = 1, difficulty: Difficulty = DEFAULT_DIFFICULTY, carry?: Carry, options: WorldOptions = {}) {
    this.alertOnEntry = new Set(options.alertOnEntry ?? []);
    this.difficulty = difficulty;
    this.level = level;
    this.grid = new Grid(level);
    this.rng = new Rng(seed);
    const start = level.spawns.find((s) => s.kind === 'player');
    if (!start) throw new Error(`Level ${level.name} has no player start`);
    this.player = {
      x: start.x,
      y: start.y,
      r: MARINE.radius,
      angle: 0,
      dir: 's',
      health: (carry ?? MARINE.start).health,
      armor: (carry ?? MARINE.start).armor,
      ammo: carry ? { ...carry.ammo } : { ...MARINE.start.ammo, bullets: difficulty.startBullets },
      weapons: new Set<WeaponId>((carry ?? MARINE.start).weapons),
      weapon: (carry ?? MARINE.start).weapon,
      keys: new Set(),
      cooldown: 0,
      flash: 0,
      attackTime: 0,
      hurtTime: 0,
      hazardTimer: 0,
      moving: false,
      walkTime: 0,
      restTimer: 0,
      stillTime: 0,
      resting: false,
    };

    for (const s of level.spawns) {
      if (s.kind === 'player') continue;
      if (s.kind in MONSTERS) this.spawnMonster(s.kind as MonsterKind, s.x, s.y);
      else if (s.kind === 'barrel') this.barrels.push({ id: this.nextId++, x: s.x, y: s.y, r: 0.32, hp: 20, fuse: -1, exploded: false });
      else if (s.kind in ITEM_NAMES) this.items.push({ id: this.nextId++, kind: s.kind as ItemKind, x: s.x, y: s.y, taken: false, dropped: false });
      else {
        const kind = s.kind as DecoKind;
        this.decos.push({ id: this.nextId++, kind, x: s.x, y: s.y });
        const cell = this.grid.index(Math.floor(s.x), Math.floor(s.y));
        if (SOLID_DECOS.has(kind)) this.grid.blockers.add(cell);
        const postRadius = DECO_POSTS.get(kind);
        if (postRadius !== undefined) {
          this.posts.push({ x: s.x, y: s.y, r: postRadius });
          this.postCells.add(cell);
        }
        if (kind === 'crate') this.grid.shotBlockers.add(cell);
      }
    }

    this.doorRooms = this.grid.doorGroups.map((group) => ({
      group,
      rooms: [...new Set(group.flatMap((d) => this.grid.roomsAt(d.x, d.y)))],
    }));
    this.updateReveal();
    if (options.ambush) this.setUpAmbush(options.ambush);

    this.stats = {
      kills: 0,
      totalKills: this.monsters.length,
      items: 0,
      totalItems: this.items.length,
      secrets: 0,
      totalSecrets: level.secretCount,
    };
  }

  carry(): Carry {
    const p = this.player;
    return { health: p.health, armor: p.armor, ammo: { ...p.ammo }, weapons: [...p.weapons], weapon: p.weapon };
  }

  drainEvents(): GameEvent[] {
    const out = this.events;
    this.events = [];
    return out;
  }

  update(dt: number, input: Input): void {
    let remaining = Math.min(dt, 0.25);
    let first = true;
    while (remaining > 1e-6) {
      const step = Math.min(remaining, MAX_STEP);
      this.step(step, first ? input : { ...input, use: false, weaponSlot: null, cycleWeapon: 0 });
      remaining -= step;
      first = false;
    }
  }

  private step(dt: number, input: Input): void {
    if (this.status !== 'playing') return;
    this.time += dt;
    this.updatePlayer(dt, input);
    this.updateReveal();
    for (const m of this.monsters) this.updateMonster(m, dt);
    this.updateProjectiles(dt);
    this.updateBarrels(dt);
    const closing = this.grid.updateDoors(dt, (x, y) => this.cellOccupied(x, y));
    for (const d of closing) this.sound('door', d.x + 0.5, d.y + 0.5);
  }

  // ---------- player ----------

  private updatePlayer(dt: number, input: Input): void {
    const p = this.player;
    p.cooldown -= dt;
    p.flash = Math.max(0, p.flash - dt);
    p.attackTime = Math.max(0, p.attackTime - dt);
    p.hurtTime = Math.max(0, p.hurtTime - dt);
    p.hazardTimer -= dt;

    p.angle = Math.atan2(input.aimY - p.y, input.aimX - p.x);
    p.dir = dirFromAngle(p.angle);

    if (input.weaponSlot !== null) {
      const w = WEAPON_ORDER.find((id) => WEAPONS[id].slot === input.weaponSlot);
      if (w && p.weapons.has(w)) this.selectWeapon(w);
    }
    if (input.cycleWeapon !== 0) this.cycleWeapon(input.cycleWeapon);

    const len = Math.hypot(input.moveX, input.moveY);
    p.moving = len > 0.01;
    if (p.moving) {
      const mx = (input.moveX / Math.max(1, len)) * MARINE.speed * dt;
      const my = (input.moveY / Math.max(1, len)) * MARINE.speed * dt;
      const res = this.grid.move(p.x, p.y, p.r, mx, my);
      p.x = res.x;
      p.y = res.y;
      p.walkTime += dt;
      this.stepTimer += dt;
      if (this.stepTimer >= STEP_INTERVAL) {
        this.stepTimer -= STEP_INTERVAL;
        this.footstep();
      }
      for (const idx of res.bumped) {
        const door = this.grid.doors.get(idx);
        if (door) this.tryDoor(door, true, false);
      }
      this.pushOutOfObstacles(p, null);
    }

    if (input.use) this.playerUse();
    if (input.fire && p.cooldown <= 0) this.playerFire();

    for (const item of this.items) {
      if (!item.taken && dist(p.x, p.y, item.x, item.y) < PICKUP_RADIUS) this.tryPickup(item);
    }

    const cx = Math.floor(p.x);
    const cy = Math.floor(p.y);
    const tile = this.grid.tile(cx, cy);
    if (tile && tile.secretId >= 0 && !this.foundSecrets.has(tile.secretId)) {
      this.foundSecrets.add(tile.secretId);
      this.stats.secrets++;
      this.message('You found a secret area!', 'secret');
      this.sound('secret', p.x, p.y);
    }

    const calm = !p.moving && p.attackTime <= 0 && p.hurtTime <= 0 && p.health < this.difficulty.restCap && !this.enemyNearby();
    p.stillTime = calm ? p.stillTime + dt : 0;
    p.resting = p.stillTime >= REST_DELAY;
    if (p.resting) {
      p.restTimer += dt;
      if (p.restTimer >= this.difficulty.restInterval) {
        p.restTimer -= this.difficulty.restInterval;
        p.health += 1;
        this.events.push({ type: 'heal', x: p.x, y: p.y, amount: 1 });
      }
    } else p.restTimer = 0;

    const hazard = this.grid.hazardAt(p.x, p.y);
    if (hazard > 0 && p.hazardTimer <= 0) {
      p.hazardTimer = 1;
      this.damagePlayer(hazard, true);
    }
  }

  private enemyNearby(): boolean {
    const rooms = this.grid.roomsAt(this.player.x, this.player.y);
    if (rooms.length === 0) return true;
    return this.monsters.some((m) => m.state !== 'dead' && this.grid.roomsAt(m.x, m.y).some((r) => rooms.includes(r)));
  }

  selectWeapon(w: WeaponId): void {
    const p = this.player;
    if (p.weapon === w || !p.weapons.has(w)) return;
    p.weapon = w;
    p.cooldown = Math.max(p.cooldown, 0.2);
  }

  private cycleWeapon(delta: number): void {
    const p = this.player;
    const owned = WEAPON_ORDER.filter((w) => p.weapons.has(w));
    const i = owned.indexOf(p.weapon);
    this.selectWeapon(owned[(i + (delta > 0 ? 1 : owned.length - 1)) % owned.length]);
  }

  private hasAmmoFor(w: WeaponId): boolean {
    const ammo = WEAPONS[w].ammo;
    return ammo === null || this.player.ammo[ammo] > 0;
  }

  private bestWeapon(): WeaponId {
    return FALLBACK_ORDER.find((w) => this.player.weapons.has(w) && this.hasAmmoFor(w)) ?? 'knife';
  }

  private playerFire(): void {
    const p = this.player;
    const w = WEAPONS[p.weapon];
    if (!this.hasAmmoFor(p.weapon)) {
      if (this.throttled('noammo', 1)) {
        this.message('Out of ammo.', 'warn');
        this.sound('empty', p.x, p.y);
      }
      this.selectWeapon(this.bestWeapon());
      return;
    }
    if (w.ammo) p.ammo[w.ammo]--;
    p.cooldown = w.cooldown;
    p.attackTime = 0.15;
    this.sound(w.sound, p.x, p.y);

    if (w.id === 'knife') {
      this.playerMelee();
      return;
    }
    p.flash = 0.07;
    if (w.noise) this.alertNearby(p.x, p.y, NOISE_RANGE);

    const totals = new Map<Monster | Barrel, number>();
    const mx = p.x + Math.cos(p.angle) * 0.45;
    const my = p.y + Math.sin(p.angle) * 0.45;
    for (let i = 0; i < w.pellets; i++) {
      const a = p.angle + this.rng.range(-w.spread, w.spread);
      const hit = this.hitscan(p.x, p.y, a, w.range, null);
      const ex = p.x + Math.cos(a) * hit.dist;
      const ey = p.y + Math.sin(a) * hit.dist;
      this.events.push({ type: 'tracer', x1: mx, y1: my, x2: ex, y2: ey, hostile: false });
      if (isMonster(hit.target) || isBarrel(hit.target)) {
        const dmg = this.rng.int(w.damage[0], w.damage[1]);
        totals.set(hit.target, (totals.get(hit.target) ?? 0) + dmg);
        this.effect(isMonster(hit.target) ? 'blood' : 'puff', ex, ey);
      } else if (hit.wall) {
        this.effect('puff', ex - Math.cos(a) * 0.05, ey - Math.sin(a) * 0.05);
      }
    }
    for (const [target, dmg] of totals) {
      if (isMonster(target)) this.damageMonster(target, dmg, true);
      else this.damageBarrel(target, dmg);
    }
  }

  private playerMelee(): void {
    const p = this.player;
    const w = WEAPONS.knife;
    let best: Monster | Barrel | null = null;
    let bestD = Infinity;
    const candidates: (Monster | Barrel)[] = [...this.monsters.filter((m) => m.state !== 'dead'), ...this.barrels.filter((b) => !b.exploded)];
    for (const t of candidates) {
      const d = dist(p.x, p.y, t.x, t.y) - t.r;
      if (d > w.range - p.r + 0.3 || d >= bestD) continue;
      const diff = Math.atan2(Math.sin(Math.atan2(t.y - p.y, t.x - p.x) - p.angle), Math.cos(Math.atan2(t.y - p.y, t.x - p.x) - p.angle));
      if (Math.abs(diff) > 0.9) continue;
      best = t;
      bestD = d;
    }
    if (!best) return;
    if (!('def' in best)) {
      this.damageBarrel(best, this.rng.int(w.damage[0], w.damage[1]));
      return;
    }
    this.effect('blood', best.x, best.y);
    if (this.canBackstab(best)) {
      this.backstab(best);
      return;
    }
    this.damageMonster(best, this.rng.int(w.damage[0], w.damage[1]), true);
    if (best.state === 'dead') this.alertNearby(best.x, best.y, NOISE_RANGE);
  }

  private canBackstab(m: Monster): boolean {
    return isCalm(m) && !m.seesPlayer && this.isBehind(m);
  }

  private backstab(m: Monster): void {
    this.events.push({ type: 'damage', x: m.x, y: m.y, amount: m.hp, toPlayer: false });
    this.killMonster(m, true);
    this.message('Silent kill.', 'info');
  }

  private isBehind(m: Monster): boolean {
    const toPlayer = Math.atan2(this.player.y - m.y, this.player.x - m.x);
    return Math.abs(angleDiff(toPlayer, m.angle)) > Math.PI - BACK_ARC / 2;
  }

  private playerUse(): void {
    const p = this.player;
    const cos = Math.cos(p.angle);
    const sin = Math.sin(p.angle);
    let best: { x: number; y: number } | null = null;
    let bestScore = Infinity;
    for (let cy = Math.floor(p.y) - 1; cy <= Math.floor(p.y) + 1; cy++) {
      for (let cx = Math.floor(p.x) - 1; cx <= Math.floor(p.x) + 1; cx++) {
        const t = this.grid.tile(cx, cy);
        if (!t || (t.type !== 'door' && t.type !== 'exit')) continue;
        const d = dist(p.x, p.y, cx + 0.5, cy + 0.5);
        if (d > 1.5) continue;
        const dot = ((cx + 0.5 - p.x) * cos + (cy + 0.5 - p.y) * sin) / d;
        if (dot < -0.2 && d > 0.9) continue;
        const score = d - dot * 0.6;
        if (score < bestScore) {
          bestScore = score;
          best = { x: cx, y: cy };
        }
      }
    }
    if (!best) return;
    const t = this.grid.tile(best.x, best.y)!;
    if (t.type === 'exit') this.activateExit();
    else this.tryDoor(this.grid.doorAt(best.x, best.y)!, true, true);
  }

  private activateExit(): void {
    if (this.exitActivated) return;
    this.exitActivated = true;
    this.sound('switch', this.player.x, this.player.y);
    this.message('Exit switch activated.', 'info');
    this.status = 'won';
  }

  private setUpAmbush(ambush: Ambush): void {
    const traps = this.grid.doorGroups.filter((g) => g[0].kind === 'trap');
    if (traps.length !== 1) throw new Error(`Level ${this.level.name} needs exactly one trap door for its ambush, found ${traps.length}`);
    const trap = traps[0];
    const trapRooms = this.doorRooms.find((d) => d.group === trap)!.rooms;
    const occupied = new Set(this.level.spawns.map((s) => this.grid.rooms[this.grid.index(Math.floor(s.x), Math.floor(s.y))]));
    const closets = trapRooms.filter((r) => !occupied.has(r));
    if (closets.length !== 1) throw new Error(`Trap door in ${this.level.name} must lead to exactly one empty closet`);
    const closet: number[] = [];
    this.grid.rooms.forEach((r, i) => {
      if (r === closets[0]) closet.push(i);
    });
    if (!this.doorSpansCloset(trap, closet)) throw new Error(`Trap door in ${this.level.name} must be as wide as its closet`);
    const door = trap[Math.floor(trap.length / 2)];
    const cells: { x: number; y: number }[] = [];
    this.grid.rooms.forEach((r, i) => {
      if (r === closets[0] && !this.grid.blockers.has(i)) cells.push({ x: (i % this.grid.width) + 0.5, y: Math.floor(i / this.grid.width) + 0.5 });
    });
    cells.sort((a, b) => dist(a.x, a.y, door.x + 0.5, door.y + 0.5) - dist(b.x, b.y, door.x + 0.5, door.y + 0.5));
    const kinds = [...ambush.groups[this.difficulty.id]].map((c) => {
      const kind = monsterOfChar(c);
      if (!kind) throw new Error(`Unknown ambush monster '${c}' in ${this.level.name}`);
      return kind;
    });
    if (kinds.length > cells.length) throw new Error(`Ambush closet in ${this.level.name} has ${cells.length} cells for ${kinds.length} monsters`);
    const monsters = kinds.map((kind, i) => {
      const m = this.spawnMonster(kind, cells[i].x, cells[i].y);
      this.face(m, Math.atan2(door.y + 0.5 - m.y, door.x + 0.5 - m.x));
      return m;
    });
    const closetRoom = closets[0];
    this.ambush = {
      key: ambush.key,
      door,
      monsters,
      sprung: false,
      closet: { cells: new Set(closet), outerRooms: trapRooms.filter((r) => r !== closetRoom), wall: this.grid.tiles[door.index].wall },
    };
  }

  private doorSpansCloset(door: Door[], closet: number[]): boolean {
    const xs = closet.map((i) => i % this.grid.width);
    const ys = closet.map((i) => Math.floor(i / this.grid.width));
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const dxs = door.map((d) => d.x);
    const dys = door.map((d) => d.y);
    const horizontal = new Set(dys).size === 1 && (dys[0] === y0 - 1 || dys[0] === y1 + 1);
    const vertical = new Set(dxs).size === 1 && (dxs[0] === x0 - 1 || dxs[0] === x1 + 1);
    if (horizontal) return Math.min(...dxs) === x0 && Math.max(...dxs) === x1 && door.length === x1 - x0 + 1;
    if (vertical) return Math.min(...dys) === y0 && Math.max(...dys) === y1 && door.length === y1 - y0 + 1;
    return false;
  }

  hiddenCloset(): HiddenCloset | null {
    const a = this.ambush;
    return a && a.door.openness === 0 ? a.closet : null;
  }

  private springAmbush(color: KeyColor): void {
    const a = this.ambush;
    if (!a || a.sprung || a.key !== color) return;
    a.sprung = true;
    if (this.grid.openDoor(a.door)) this.sound('door', a.door.x + 0.5, a.door.y + 0.5);
    for (const m of a.monsters) this.wake(m);
  }

  private tryDoor(door: Door, byPlayer: boolean, explicit: boolean): void {
    if (door.kind === 'trap') return;
    if (door.kind === 'secret' && !(byPlayer && explicit)) return;
    const color = keyColorOf(door.kind);
    if (color) {
      if (!byPlayer) return;
      if (!this.player.keys.has(color)) {
        if (this.throttled(`${color}key`, 1.5)) {
          this.message(`You need a ${color} keycard to open this door.`, 'warn');
          this.sound('noway', door.x + 0.5, door.y + 0.5);
        }
        return;
      }
    }
    if (this.grid.openDoor(door)) this.sound('door', door.x + 0.5, door.y + 0.5);
  }

  private tryPickup(item: Item): void {
    const p = this.player;
    let sound: SoundId = 'pickup';
    switch (item.kind) {
      case 'stimpack':
      case 'medkit':
        if (p.health >= 100) return;
        p.health = Math.min(100, p.health + (item.kind === 'stimpack' ? 10 : 25));
        break;
      case 'sphere':
        p.health = Math.min(200, p.health + 100);
        sound = 'powerup';
        break;
      case 'armor':
        if (p.armor >= 100) return;
        p.armor = 100;
        break;
      case 'clip':
        if (!this.giveAmmo('bullets', this.scaledAmmo(item.dropped ? DROPPED_AMMO : 10))) return;
        break;
      case 'shells':
        if (!this.giveAmmo('shells', this.scaledAmmo(item.dropped ? DROPPED_AMMO : 8))) return;
        break;
      case 'shotgun':
      case 'rotary': {
        const isNew = !p.weapons.has(item.kind);
        const gave = this.giveAmmo(item.kind === 'shotgun' ? 'shells' : 'bullets', this.scaledAmmo(item.kind === 'shotgun' ? 8 : 20));
        if (!isNew && !gave) return;
        p.weapons.add(item.kind);
        if (isNew) this.selectWeapon(item.kind);
        sound = 'weapon';
        break;
      }
      case 'redkey':
      case 'bluekey':
      case 'yellowkey':
        p.keys.add(KEY_COLOR_OF_ITEM[item.kind]);
        this.springAmbush(KEY_COLOR_OF_ITEM[item.kind]);
        sound = 'powerup';
        break;
    }
    item.taken = true;
    if (!item.dropped) this.stats.items++;
    this.message(`You picked up ${ITEM_NAMES[item.kind]}.`, 'pickup');
    this.sound(sound, item.x, item.y);
  }

  private scaledAmmo(amount: number): number {
    return Math.round(amount * this.difficulty.ammo);
  }

  private hurtPlayerByEnemy(amount: number): void {
    this.damagePlayer(Math.max(1, Math.round(amount * this.difficulty.enemyDamage)));
  }

  private giveAmmo(type: AmmoType, amount: number): boolean {
    const p = this.player;
    if (p.ammo[type] >= MAX_AMMO[type]) return false;
    const hadNone = p.ammo[type] === 0;
    p.ammo[type] = Math.min(MAX_AMMO[type], p.ammo[type] + amount);
    if (hadNone && p.weapon === 'knife') this.selectWeapon(this.bestWeapon());
    return true;
  }

  damagePlayer(amount: number, ignoreArmor = false): void {
    if (this.status !== 'playing') return;
    const p = this.player;
    let taken = amount;
    if (!ignoreArmor && p.armor > 0) {
      const saved = Math.min(p.armor, Math.floor(amount / 3));
      p.armor -= saved;
      taken -= saved;
    }
    p.health -= taken;
    p.hurtTime = 0.35;
    this.events.push({ type: 'damage', x: p.x, y: p.y, amount: taken, toPlayer: true });
    if (p.health <= 0) {
      p.health = 0;
      this.status = 'dead';
      this.sound('playerDeath', p.x, p.y);
      this.message('You are dead.', 'warn');
    } else if (this.throttled('playerPain', 0.3)) this.sound('playerPain', p.x, p.y);
  }

  // ---------- monsters ----------

  spawnMonster(kind: MonsterKind, x: number, y: number): Monster {
    const def = MONSTERS[kind];
    const m: Monster = {
      id: this.nextId++,
      kind,
      def,
      x,
      y,
      r: def.radius,
      hp: def.hp,
      angle: Math.PI / 2,
      dir: 's',
      state: 'idle',
      stateTime: 0,
      cooldown: 0.5,
      attack: 'ranged',
      path: [],
      pathTimer: 0,
      lookTimer: this.rng.range(0, 0.3),
      seesPlayer: false,
      cried: false,
      moving: false,
      walkTime: 0,
      deathTime: 0,
      hurtTime: 0,
      home: { x, y },
      lastKnown: { x, y },
      lostTime: 0,
      goal: null,
      goalCell: -1,
      pauseTime: 0,
      lookAround: this.rng.range(0, MONSTERS[kind].lookEvery[1]),
      turnTo: Math.PI / 2,
    };
    this.monsters.push(m);
    return m;
  }

  private wake(m: Monster, x = this.player.x, y = this.player.y): void {
    if (m.state === 'dead') return;
    m.lastKnown = { x, y };
    if (m.state === 'chase' || m.state === 'windup' || m.state === 'pain') return;
    if (m.state === 'idle') m.cooldown = this.rng.range(0.4, 1.2);
    m.state = 'chase';
    m.lostTime = 0;
    m.goal = null;
    m.pathTimer = 0;
    if (m.cried) return;
    m.cried = true;
    if (this.throttled('alert-cry', CRY_GAP)) this.sound(m.def.alertSound, m.x, m.y);
  }

  private footstep(): void {
    const p = this.player;
    const tile = this.grid.tile(Math.floor(p.x), Math.floor(p.y));
    if (!tile || !LOUD_FLOORS.has(tile.floor)) return;
    this.sound('footstep', p.x, p.y);
    const range = FOOTSTEP_RANGE * this.difficulty.enemySight;
    for (const m of this.monsters) {
      if (!isCalm(m) || dist(m.x, m.y, p.x, p.y) > range || !this.grid.lineOfSight(m.x, m.y, p.x, p.y)) continue;
      this.spot(m);
    }
  }

  private spot(m: Monster): void {
    this.wake(m);
    this.alertNearby(m.x, m.y, SHOUT_RANGE);
  }

  private alertNearby(x: number, y: number, radius: number): void {
    for (const m of this.monsters) {
      if (m.state !== 'dead' && m.state !== 'chase' && dist(x, y, m.x, m.y) <= radius) this.wake(m, x, y);
    }
  }

  private updateMonster(m: Monster, dt: number): void {
    if (m.state === 'dead') return;
    const p = this.player;
    m.stateTime -= dt;
    m.cooldown -= dt;
    m.hurtTime = Math.max(0, m.hurtTime - dt);
    m.moving = false;
    const d = dist(m.x, m.y, p.x, p.y);

    m.lookTimer -= dt;
    if (m.lookTimer <= 0) {
      m.lookTimer = 0.2;
      m.seesPlayer = this.canSee(m, d);
    }
    if (m.seesPlayer) m.lastKnown = { x: p.x, y: p.y };

    switch (m.state) {
      case 'idle':
        if (m.seesPlayer) this.spot(m);
        else this.lookAround(m, dt);
        return;
      case 'hold':
        if (m.seesPlayer) this.spot(m);
        return;
      case 'wander':
        if (m.seesPlayer) this.spot(m);
        else this.wander(m, dt);
        return;
      case 'return':
        if (m.seesPlayer) this.spot(m);
        else if (this.navigate(m, m.home.x, m.home.y, dt, 0.7) !== 'moving') {
          m.state = 'idle';
          m.turnTo = m.angle + Math.PI;
        }
        return;
      case 'pain':
        if (m.stateTime <= 0) m.state = 'chase';
        return;
      case 'windup':
        this.face(m, Math.atan2(p.y - m.y, p.x - m.x));
        if (m.stateTime <= 0) {
          this.performAttack(m);
          m.state = 'chase';
          m.cooldown = m.def.cooldown * this.difficulty.enemyCooldown * this.rng.range(0.7, 1.3);
        }
        return;
      case 'chase':
        break;
    }

    if (!m.seesPlayer) {
      m.lostTime += dt;
      this.chaseUnseen(m, dt);
      return;
    }
    m.lostTime = 0;

    const gap = d - m.r - p.r;
    if (m.def.meleeDamage && gap < 0.4 && m.cooldown <= 0) {
      this.startAttack(m, 'melee');
      return;
    }
    if (m.def.ranged && m.def.ranged !== 'melee' && d < m.def.rangedRange && m.cooldown <= 0 && (gap > 0.4 || !m.def.meleeDamage) && this.grid.lineOfFire(m.x, m.y, p.x, p.y)) {
      if (this.rng.chance(m.def.rangedChance)) {
        this.startAttack(m, 'ranged');
        return;
      }
      m.cooldown = 0.4;
    }
    if (gap < 0.05 || this.navigate(m, p.x, p.y, dt, 1) !== 'moving') this.face(m, Math.atan2(p.y - m.y, p.x - m.x));
  }

  sightRange(m: Monster, alert: boolean): number {
    return m.def.sightRange * this.difficulty.enemySight * (alert ? ALERT_SIGHT : 1);
  }

  isRevealedAt(x: number, y: number): boolean {
    const rooms = this.grid.roomsAt(x, y);
    return rooms.length === 0 || rooms.some((r) => this.revealedRooms.has(r));
  }

  private alertRoom(room: number): void {
    if (this.alertOnEntry.size === 0) return;
    for (const m of this.monsters) {
      if (m.state !== 'dead' && this.alertOnEntry.has(m.kind) && this.grid.roomsAt(m.x, m.y).includes(room)) this.wake(m);
    }
  }

  private updateReveal(): void {
    const here = this.grid.roomsAt(this.player.x, this.player.y);
    for (const r of here) {
      this.revealedRooms.add(r);
      if (!this.enteredRooms.has(r)) {
        this.enteredRooms.add(r);
        this.alertRoom(r);
      }
    }
    for (const { group, rooms } of this.doorRooms) {
      if (group[0].openness > 0.3 && rooms.some((r) => here.includes(r))) for (const r of rooms) this.revealedRooms.add(r);
    }
  }

  private canSee(m: Monster, d: number): boolean {
    const p = this.player;
    const alert = m.state === 'chase' || m.state === 'windup' || m.state === 'pain';
    if (d >= this.sightRange(m, alert)) return false;
    if (!alert && (d > CLOSE_SENSE || this.isBehind(m))) {
      const toPlayer = Math.atan2(p.y - m.y, p.x - m.x);
      if (Math.abs(angleDiff(toPlayer, m.angle)) > m.def.fov / 2) return false;
    }
    return m.def.coverBlocksSight ? this.grid.lineOfFire(m.x, m.y, p.x, p.y) : this.grid.lineOfSight(m.x, m.y, p.x, p.y);
  }

  private lookAround(m: Monster, dt: number): void {
    m.lookAround -= dt;
    if (m.lookAround <= 0) {
      m.lookAround = this.rng.range(m.def.lookEvery[0], m.def.lookEvery[1]);
      m.turnTo = m.angle + this.rng.range(-m.def.lookSwing, m.def.lookSwing);
    }
    const diff = angleDiff(m.turnTo, m.angle);
    if (Math.abs(diff) > 0.01) this.face(m, m.angle + Math.sign(diff) * Math.min(Math.abs(diff), m.def.turnSpeed * dt));
  }

  private chaseUnseen(m: Monster, dt: number): void {
    switch (m.def.lost) {
      case 'hold':
        m.state = 'hold';
        m.path = [];
        this.face(m, Math.atan2(m.lastKnown.y - m.y, m.lastKnown.x - m.x));
        return;
      case 'wander':
        if (m.lostTime > m.def.trackTime || this.navigate(m, m.lastKnown.x, m.lastKnown.y, dt, 1) !== 'moving') this.startWander(m);
        return;
      case 'track':
        if (m.lostTime > m.def.trackTime) {
          m.state = 'return';
          m.goalCell = -1;
          return;
        }
        this.navigate(m, this.player.x, this.player.y, dt, 1);
        return;
    }
  }

  private startWander(m: Monster): void {
    m.state = 'wander';
    m.goal = null;
    m.path = [];
    m.pauseTime = this.rng.range(0.3, 1);
  }

  private wander(m: Monster, dt: number): void {
    if (m.pauseTime > 0) {
      m.pauseTime -= dt;
      return;
    }
    if (!m.goal) {
      for (let i = 0; i < 10 && !m.goal; i++) {
        const gx = Math.floor(m.x) + this.rng.int(-5, 5);
        const gy = Math.floor(m.y) + this.rng.int(-5, 5);
        const t = this.grid.tile(gx, gy);
        if (t && t.type === 'floor' && this.monsterPassable(gx, gy)) m.goal = { x: gx + 0.5, y: gy + 0.5 };
      }
      if (!m.goal) {
        m.pauseTime = 1;
        return;
      }
    }
    if (this.navigate(m, m.goal.x, m.goal.y, dt, 0.5) !== 'moving') {
      m.goal = null;
      m.pauseTime = this.rng.range(0.8, 2.5);
    }
  }

  private navigate(m: Monster, gx: number, gy: number, dt: number, speedMul: number): NavResult {
    const d = dist(m.x, m.y, gx, gy);
    if (d < 0.2) return 'arrived';
    let tx = gx;
    let ty = gy;
    const goalCell = this.grid.index(Math.floor(gx), Math.floor(gy));
    const ownCell = this.grid.index(Math.floor(m.x), Math.floor(m.y));
    if (ownCell !== goalCell && !(d < 7 && this.clearWalk(m.x, m.y, gx, gy, m.r))) {
      m.pathTimer -= dt;
      if (m.pathTimer <= 0 || m.path.length === 0 || m.goalCell !== goalCell) {
        m.pathTimer = this.rng.range(0.5, 0.9);
        m.goalCell = goalCell;
        const path = findPath(
          this.grid.width,
          this.grid.height,
          (cx, cy) => this.monsterPassable(cx, cy),
          Math.floor(m.x),
          Math.floor(m.y),
          Math.floor(gx),
          Math.floor(gy),
        );
        m.path = path ?? [];
        if (!path) return 'blocked';
      }
      while (m.path.length > 0 && dist(m.x, m.y, m.path[0].x, m.path[0].y) < 0.2) m.path.shift();
      if (m.path.length === 0 || this.grid.hazardAt(m.path[0].x, m.path[0].y) > 0) return 'blocked';
      tx = m.path[0].x;
      ty = m.path[0].y;
    }

    const a = Math.atan2(ty - m.y, tx - m.x);
    this.face(m, a);
    const step = Math.min(m.def.speed * this.difficulty.enemySpeed * speedMul * dt, dist(m.x, m.y, tx, ty));
    const res = this.grid.move(m.x, m.y, m.r, Math.cos(a) * step, Math.sin(a) * step, this.monsterSolid);
    const moved = Math.hypot(res.x - m.x, res.y - m.y);
    m.x = res.x;
    m.y = res.y;
    this.pushOutOfObstacles(m, m, this.monsterSolid);
    if (moved < step * 0.1 && res.bumped.length > 0) return 'blocked';
    m.moving = true;
    m.walkTime += dt;
    return 'moving';
  }

  private monsterPassable(cx: number, cy: number): boolean {
    const t = this.grid.tile(cx, cy);
    if (!t) return false;
    if (t.type === 'floor') {
      const cell = this.grid.index(cx, cy);
      return !this.grid.blockers.has(cell) && !this.postCells.has(cell) && FLOOR_HAZARD[t.floor] === 0;
    }
    if (t.type === 'door') return !this.grid.isSolid(cx, cy);
    return false;
  }

  private readonly monsterSolid = (cx: number, cy: number): boolean => this.grid.isSolid(cx, cy) || this.grid.hazardAt(cx + 0.5, cy + 0.5) > 0;

  private clearWalk(ax: number, ay: number, bx: number, by: number, r: number): boolean {
    const d = Math.hypot(bx - ax, by - ay);
    if (d < 1e-6) return true;
    const nx = -(by - ay) / d;
    const ny = (bx - ax) / d;
    for (let t = 0; t <= d; t += 0.25) {
      const x = ax + ((bx - ax) * t) / d;
      const y = ay + ((by - ay) * t) / d;
      for (const o of [-r, 0, r]) {
        if (!this.monsterPassable(Math.floor(x + nx * o), Math.floor(y + ny * o))) return false;
      }
    }
    return true;
  }

  private face(m: Monster, angle: number): void {
    m.angle = angle;
    m.dir = dirFromAngle(angle);
  }

  private startAttack(m: Monster, kind: AttackKind): void {
    m.state = 'windup';
    m.attack = kind;
    m.stateTime = kind === 'melee' ? Math.min(m.def.windup, 0.35) : m.def.windup;
  }

  private performAttack(m: Monster): void {
    const p = this.player;
    const a = Math.atan2(p.y - m.y, p.x - m.x);
    if (m.attack === 'melee') {
      if (dist(m.x, m.y, p.x, p.y) - m.r - p.r < 0.65 && m.def.meleeDamage) {
        this.sound('claw', m.x, m.y);
        this.hurtPlayerByEnemy(this.rng.int(m.def.meleeDamage[0], m.def.meleeDamage[1]));
      }
      return;
    }
    if (m.def.ranged === 'hitscan') {
      this.enemyGunfire(m, a);
    } else if (m.def.ranged === 'fireball') {
      this.sound('fireball', m.x, m.y);
      this.projectiles.push({
        id: this.nextId++,
        x: m.x + Math.cos(a) * (m.r + 0.1),
        y: m.y + Math.sin(a) * (m.r + 0.1),
        vx: Math.cos(a) * FIREBALL_SPEED * this.difficulty.projectileSpeed,
        vy: Math.sin(a) * FIREBALL_SPEED * this.difficulty.projectileSpeed,
        damage: m.def.rangedDamage,
        ownerId: m.id,
        alive: true,
      });
    }
  }

  private enemyGunfire(m: Monster, aim: number): void {
    const w = WEAPONS[m.def.weapon ?? 'pistol'];
    const shot = aim + this.rng.range(-ENEMY_AIM_ERROR, ENEMY_AIM_ERROR);
    this.sound(w.sound, m.x, m.y);
    const totals = new Map<Player | Monster | Barrel, number>();
    for (let i = 0; i < w.pellets; i++) {
      const a = shot + this.rng.range(-w.spread, w.spread);
      const hit = this.hitscan(m.x, m.y, a, w.range, m);
      const ex = m.x + Math.cos(a) * hit.dist;
      const ey = m.y + Math.sin(a) * hit.dist;
      this.events.push({ type: 'tracer', x1: m.x + Math.cos(a) * 0.4, y1: m.y + Math.sin(a) * 0.4, x2: ex, y2: ey, hostile: true });
      if (hit.target) totals.set(hit.target, (totals.get(hit.target) ?? 0) + this.rng.int(m.def.rangedDamage[0], m.def.rangedDamage[1]));
      else if (hit.wall) this.effect('puff', ex, ey);
    }
    for (const [target, dmg] of totals) {
      if (target === this.player) this.hurtPlayerByEnemy(dmg);
      else if (isMonster(target)) this.damageMonster(target, dmg);
      else if (isBarrel(target)) this.damageBarrel(target, dmg);
    }
  }

  damageMonster(m: Monster, amount: number, byPlayer = false): void {
    if (m.state === 'dead') return;
    m.hp -= amount;
    m.hurtTime = 0.15;
    this.events.push({ type: 'damage', x: m.x, y: m.y, amount, toPlayer: false });
    if (m.hp <= 0) {
      this.killMonster(m);
      return;
    }
    if (isCalm(m)) {
      if (byPlayer) this.spot(m);
      else this.wake(m);
    }
    if (m.state !== 'windup' && this.rng.chance(m.def.painChance)) {
      m.state = 'pain';
      m.stateTime = m.def.painTime;
      if (this.throttled(`pain-${m.id}`, 0.4)) this.sound('monsterPain', m.x, m.y);
    }
  }

  private killMonster(m: Monster, silent = false): void {
    m.state = 'dead';
    m.hp = 0;
    m.deathTime = this.time;
    m.path = [];
    this.stats.kills++;
    this.sound(silent ? 'backstab' : 'monsterDeath', m.x, m.y);
    if (m.def.drop) this.items.push({ id: this.nextId++, kind: m.def.drop, x: m.x, y: m.y, taken: false, dropped: true });
  }

  // ---------- combat helpers ----------

  private hitscan(ox: number, oy: number, angle: number, range: number, shooter: Monster | null): HitResult {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const wall = this.grid.raycast(ox, oy, dx, dy, range);
    let best = wall.dist;
    let target: HitResult['target'] = null;
    for (const m of this.monsters) {
      if (m === shooter || m.state === 'dead') continue;
      const t = rayCircle(ox, oy, dx, dy, m.x, m.y, m.r);
      if (t >= 0 && t < best) {
        best = t;
        target = m;
      }
    }
    for (const b of this.barrels) {
      if (b.exploded) continue;
      const t = rayCircle(ox, oy, dx, dy, b.x, b.y, b.r);
      if (t >= 0 && t < best) {
        best = t;
        target = b;
      }
    }
    if (shooter) {
      const p = this.player;
      const t = rayCircle(ox, oy, dx, dy, p.x, p.y, p.r);
      if (t >= 0 && t < best) {
        best = t;
        target = p;
      }
    }
    return { dist: best, target, wall: target === null && wall.hit };
  }

  private updateProjectiles(dt: number): void {
    const p = this.player;
    for (const pr of this.projectiles) {
      if (!pr.alive) continue;
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      const burst = (): void => {
        pr.alive = false;
        this.effect('burst', pr.x, pr.y);
        this.sound('explode', pr.x, pr.y);
      };
      if (this.grid.isShotBlocker(Math.floor(pr.x), Math.floor(pr.y))) {
        pr.x -= pr.vx * dt * 0.5;
        pr.y -= pr.vy * dt * 0.5;
        burst();
        continue;
      }
      const dmg = this.rng.int(pr.damage[0], pr.damage[1]);
      if (dist(pr.x, pr.y, p.x, p.y) < p.r + 0.15) {
        burst();
        this.hurtPlayerByEnemy(dmg);
        continue;
      }
      const m = this.monsters.find((o) => o.id !== pr.ownerId && o.state !== 'dead' && dist(pr.x, pr.y, o.x, o.y) < o.r + 0.15);
      if (m) {
        burst();
        this.damageMonster(m, dmg);
        continue;
      }
      const b = this.barrels.find((o) => !o.exploded && dist(pr.x, pr.y, o.x, o.y) < o.r + 0.15);
      if (b) {
        burst();
        this.damageBarrel(b, dmg);
      }
    }
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      if (!this.projectiles[i].alive) this.projectiles.splice(i, 1);
    }
  }

  damageBarrel(b: Barrel, amount: number): void {
    if (b.exploded || b.fuse >= 0) return;
    b.hp -= amount;
    if (b.hp <= 0) b.fuse = this.rng.range(0.08, 0.2);
  }

  private updateBarrels(dt: number): void {
    for (const b of this.barrels) {
      if (b.exploded || b.fuse < 0) continue;
      b.fuse -= dt;
      if (b.fuse <= 0) this.explode(b);
    }
  }

  private explode(b: Barrel): void {
    b.exploded = true;
    this.effect('explosion', b.x, b.y);
    this.sound('explode', b.x, b.y);
    this.alertNearby(b.x, b.y, NOISE_RANGE);
    const hurt = (x: number, y: number): number => {
      const d = dist(b.x, b.y, x, y);
      if (d >= EXPLOSION_RADIUS || !this.grid.lineOfFire(b.x, b.y, x, y)) return 0;
      return Math.round(EXPLOSION_DAMAGE * (1 - d / EXPLOSION_RADIUS));
    };
    for (const m of this.monsters) {
      if (m.state === 'dead') continue;
      const dmg = hurt(m.x, m.y);
      if (dmg > 0) this.damageMonster(m, dmg);
    }
    for (const o of this.barrels) {
      if (o === b) continue;
      const dmg = hurt(o.x, o.y);
      if (dmg > 0) this.damageBarrel(o, dmg);
    }
    const pd = hurt(this.player.x, this.player.y);
    if (pd > 0) this.damagePlayer(pd);
  }

  // ---------- physics helpers ----------

  private pushOutOfObstacles(e: { x: number; y: number; r: number }, self: Monster | null, solid?: (cx: number, cy: number) => boolean): void {
    const solids: { x: number; y: number; r: number }[] = [];
    for (const m of this.monsters) if (m !== self && m.state !== 'dead') solids.push(m);
    for (const b of this.barrels) if (!b.exploded) solids.push(b);
    solids.push(...this.posts);
    if (self) solids.push(this.player);
    for (const o of solids) {
      const dx = e.x - o.x;
      const dy = e.y - o.y;
      const d = Math.hypot(dx, dy);
      const min = e.r + o.r;
      if (d >= min) continue;
      const nx = d > 1e-6 ? dx / d : 1;
      const ny = d > 1e-6 ? dy / d : 0;
      const push = clamp(min - d, 0, 0.3);
      const res = this.grid.move(e.x, e.y, e.r, nx * push, ny * push, solid);
      e.x = res.x;
      e.y = res.y;
    }
  }

  private cellOccupied(cx: number, cy: number): boolean {
    const overlaps = (x: number, y: number, r: number): boolean => x + r > cx && x - r < cx + 1 && y + r > cy && y - r < cy + 1;
    const p = this.player;
    if (overlaps(p.x, p.y, p.r)) return true;
    return this.monsters.some((m) => m.state !== 'dead' && overlaps(m.x, m.y, m.r));
  }

  // ---------- events ----------

  private throttled(key: string, interval: number): boolean {
    const last = this.throttle.get(key) ?? -Infinity;
    if (this.time - last < interval) return false;
    this.throttle.set(key, this.time);
    return true;
  }

  private sound(sound: SoundId, x: number, y: number): void {
    this.events.push({ type: 'sound', sound, x, y });
  }

  private message(text: string, tone: MessageTone): void {
    this.events.push({ type: 'message', text, tone });
  }

  private effect(effect: EffectKind, x: number, y: number): void {
    this.events.push({ type: 'effect', effect, x, y });
  }
}
