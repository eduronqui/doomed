import { DECO_POSTS, ITEM_NAMES, SOLID_DECOS, type Ambush, DEFAULT_DIFFICULTY, type DecoKind, type Difficulty, type KeyColor, type ItemKind, type SoundId } from './defs';
import { MARINE, MONSTERS, type MonsterDef, type MonsterKind, type ShotSpec } from '../characters';
import { FALLBACK_ORDER, MAX_AMMO, WEAPONS, WEAPON_ORDER, type AmmoType, type Blast, type ProjectileLook, type WeaponDef, type WeaponId } from '../weapons';
import { FOOT_OFFSET, Grid, reachUp, type Door } from './grid';
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

export type UseAction = 'exit' | 'switch';

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
  embedded: boolean;
}

export interface WorldOptions {
  alertOnEntry?: MonsterKind[];
  ambush?: Ambush;
  watchDoors?: boolean;
  playerHitScale?: number;
  pickupScale?: number;
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
  restAngle: number | null;
  turnTo: number;
  burn: number;
  burnDamage: number;
  burnFx: number;
  burstLeft: number;
  burstTimer: number;
  leapTime: number;
  leapAngle: number;
  flankSide: number;
  flankTimer: number;
  shieldAngle: number;
  summonTimer: number;
  slamTimer: number;
  summoned: boolean;
  teleportTimer: number;
  hurtSinceTeleport: number;
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
  look: ProjectileLook;
  fromPlayer: boolean;
  overCover: boolean;
  blast: Blast | null;
  travel: number;
  range: number;
  homing: number;
}

export type MessageTone = 'info' | 'pickup' | 'warn' | 'secret';
export type EffectKind = 'puff' | 'blood' | 'explosion' | 'burst' | 'flame' | 'riftblast';

export type GameEvent =
  | { type: 'sound'; sound: SoundId; x: number; y: number }
  | { type: 'message'; text: string; tone: MessageTone }
  | { type: 'damage'; x: number; y: number; amount: number; toPlayer: boolean }
  | { type: 'heal'; x: number; y: number; amount: number }
  | { type: 'tracer'; x1: number; y1: number; x2: number; y2: number; hostile: boolean }
  | { type: 'beam'; x1: number; y1: number; x2: number; y2: number }
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
const SHOVE_REACH = 0.05;
const GAP_PROBE = 0.05;
const GAP_REACH = 0.85;
const GATE_HINT_NEAR = 6;
const SHOVE_SPEED = 0.8;
const LOUD_FLOORS: ReadonlySet<FloorKind> = new Set<FloorKind>(['metal', 'grate']);
const EXPLOSION_RADIUS = 2.6;
const EXPLOSION_DAMAGE = 110;
const FIREBALL_SPEED = 7.5;
const FIREBALL_RANGE = 40;
const FIREBALL_SHOT: ShotSpec = { look: 'fireball', speed: FIREBALL_SPEED, count: 1, spread: 0, homing: 0, range: FIREBALL_RANGE };
const FRONT_ARC = Math.PI / 3;
const FLANK_DISTANCE = 2.5;
const FLANK_SWITCH: [number, number] = [1.2, 2.4];
const LEAP_COOLDOWN = 1.6;
const BOSS_SUMMON_EVERY = 12;
const BOSS_SLAM_EVERY = 7;
const BOSS_MAX_ADDS = 4;
const BOSS_RING = 12;
const BOSS_RING_SHOT: ShotSpec = { look: 'bolt', speed: 6, count: 1, spread: 0, homing: 0, range: 26 };
const BOSS_TELEPORT_EVERY = [8, 6, 4];
const BOSS_TELEPORT_HURT = 300;
const BOSS_TELEPORT_RANGE: [number, number] = [5, 10];
const BOSS_TELEPORT_TRIES = 40;
const BURN_TIME = 3;
const BURN_DPS = 8;
const BURN_TICK = 4;
const BURN_FX_EVERY = 0.3;
const FLAME_FX_PER_SHOT = 2;
const PICKUP_AMMO: Partial<Record<ItemKind, [AmmoType, number]>> = {
  clip: ['bullets', 10],
  shells: ['shells', 8],
  grenades: ['grenades', 4],
  fuel: ['fuel', 50],
  cells: ['cells', 40],
};
const WEAPON_PICKUP_AMMO: Record<WeaponId, number> = { knife: 0, pistol: 10, shotgun: 8, rotary: 20, launcher: 6, flamer: 60, arc: 40, rift: 160 };
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

const GOD_SKIPS = new Set<ItemKind>(['stimpack', 'medkit', 'sphere', 'armor']);

export class World {
  readonly level: LevelData;
  readonly grid: Grid;
  readonly rng: Rng;
  readonly difficulty: Difficulty;
  readonly revealedRooms = new Set<number>();
  private readonly enteredRooms = new Set<number>();
  private readonly alertOnEntry: ReadonlySet<MonsterKind>;
  private readonly playerHitScale: number;
  private readonly pickupScale: number;
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
  god = false;
  infiniteAmmo = false;
  time = 0;
  exitActivated = false;
  readonly switchesOn = new Set<number>();
  private events: GameEvent[] = [];
  private nextId = 1;
  private foundSecrets = new Set<number>();
  private throttle = new Map<string, number>();

  constructor(level: LevelData, seed = 1, difficulty: Difficulty = DEFAULT_DIFFICULTY, carry?: Carry, options: WorldOptions = {}) {
    this.alertOnEntry = new Set(options.alertOnEntry ?? []);
    this.playerHitScale = options.playerHitScale ?? 1;
    this.pickupScale = options.pickupScale ?? 1;
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
    this.checkGates();
    if (options.watchDoors) this.watchDoors();

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
      const stuck = Math.hypot(res.x - p.x, res.y - p.y) < Math.hypot(mx, my) * 0.5;
      p.x = res.x;
      p.y = res.y;
      if (stuck) this.slideIntoGap(mx, my);
      this.shoveAside(mx, my, dt);
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
      if (!item.taken && this.isInPickupReach(item)) this.tryPickup(item);
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

  giveArsenal(): void {
    const p = this.player;
    for (const w of WEAPON_ORDER) p.weapons.add(w);
    for (const type of Object.keys(MAX_AMMO) as AmmoType[]) p.ammo[type] = MAX_AMMO[type];
    this.infiniteAmmo = true;
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
    const { ammo, ammoPerShot } = WEAPONS[w];
    return ammo === null || this.player.ammo[ammo] >= ammoPerShot;
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
    if (w.ammo && !this.infiniteAmmo) p.ammo[w.ammo] -= w.ammoPerShot;
    p.cooldown = w.cooldown;
    p.attackTime = 0.15;
    this.sound(w.sound, p.x, p.y);

    if (w.kind === 'melee') {
      this.playerMelee();
      return;
    }
    p.flash = w.kind === 'flame' ? 0.03 : 0.07;
    if (w.noise) this.alertNearby(p.x, p.y, NOISE_RANGE);
    if (w.kind === 'hitscan') this.playerHitscan(w);
    else if (w.kind === 'projectile') this.playerProjectile(w);
    else if (w.kind === 'flame') this.playerFlame(w);
    else this.playerBeam(w);
  }

  private muzzle(): Vec {
    const p = this.player;
    return { x: p.x + Math.cos(p.angle) * 0.45, y: p.y + Math.sin(p.angle) * 0.45 };
  }

  private playerHitscan(w: WeaponDef): void {
    const p = this.player;
    const totals = new Map<Monster | Barrel, number>();
    const { x: mx, y: my } = this.muzzle();
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
      if (isMonster(target)) this.damageMonster(target, dmg, true, p);
      else this.damageBarrel(target, dmg);
    }
  }

  private playerProjectile(w: WeaponDef): void {
    const p = this.player;
    const spec = w.projectile!;
    const a = p.angle + this.rng.range(-w.spread, w.spread);
    const { x, y } = this.muzzle();
    this.projectiles.push({
      id: this.nextId++,
      x,
      y,
      vx: Math.cos(a) * spec.speed,
      vy: Math.sin(a) * spec.speed,
      damage: w.damage,
      ownerId: -1,
      alive: true,
      look: spec.look,
      fromPlayer: true,
      overCover: spec.overCover,
      blast: spec.blast,
      travel: 0,
      range: w.range,
      homing: 0,
    });
  }

  private playerFlame(w: WeaponDef): void {
    const p = this.player;
    const reach = this.grid.raycast(p.x, p.y, Math.cos(p.angle), Math.sin(p.angle), w.range).dist;
    const inCone = (x: number, y: number, r: number): boolean => {
      const d = dist(p.x, p.y, x, y) - r;
      return d <= reach && Math.abs(angleDiff(Math.atan2(y - p.y, x - p.x), p.angle)) <= w.spread && this.grid.lineOfFire(p.x, p.y, x, y);
    };
    for (const m of this.monsters) {
      if (m.state === 'dead' || !inCone(m.x, m.y, m.r)) continue;
      m.burn = BURN_TIME;
      this.damageMonster(m, this.rng.int(w.damage[0], w.damage[1]), true, p);
    }
    for (const b of this.barrels) if (!b.exploded && inCone(b.x, b.y, b.r)) this.damageBarrel(b, this.rng.int(w.damage[0], w.damage[1]));
    for (let i = 0; i < FLAME_FX_PER_SHOT; i++) {
      const a = p.angle + this.rng.range(-w.spread, w.spread) * 0.6;
      const d = this.rng.range(0.6, Math.max(0.7, reach - 0.2));
      this.effect('flame', p.x + Math.cos(a) * d, p.y + Math.sin(a) * d);
    }
  }

  private playerBeam(w: WeaponDef): void {
    const p = this.player;
    const a = p.angle + this.rng.range(-w.spread, w.spread);
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    const end = this.grid.raycast(p.x, p.y, dx, dy, w.range).dist;
    for (const m of this.monsters) {
      if (m.state === 'dead') continue;
      const t = rayCircle(p.x, p.y, dx, dy, m.x, m.y, m.r * this.playerHitScale);
      if (t < 0 || t > end) continue;
      this.effect('blood', m.x, m.y);
      this.damageMonster(m, this.rng.int(w.damage[0], w.damage[1]), true, p);
    }
    for (const b of this.barrels) {
      if (b.exploded) continue;
      const t = rayCircle(p.x, p.y, dx, dy, b.x, b.y, b.r);
      if (t >= 0 && t <= end) this.damageBarrel(b, this.rng.int(w.damage[0], w.damage[1]));
    }
    const { x, y } = this.muzzle();
    this.events.push({ type: 'beam', x1: x, y1: y, x2: p.x + dx * end, y2: p.y + dy * end });
  }

  private playerMelee(): void {
    const p = this.player;
    const w = WEAPONS.knife;
    let best: Monster | Barrel | null = null;
    let bestD = Infinity;
    const candidates: (Monster | Barrel)[] = [...this.monsters.filter((m) => m.state !== 'dead'), ...this.barrels.filter((b) => !b.exploded)];
    for (const t of candidates) {
      const d = dist(p.x, p.y, t.x, t.y) - t.r;
      if (d > w.range - p.r + 0.3 || d >= bestD || !this.grid.canStep(p.x, p.y, t.x, t.y)) continue;
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
    return !m.def.boss && isCalm(m) && !m.seesPlayer && this.isBehind(m);
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

  usableAction(): UseAction | null {
    const target = this.findUseTarget();
    if (!target) return null;
    const t = this.grid.tile(target.x, target.y)!;
    if (t.type === 'exit') return this.exitActivated ? null : 'exit';
    if (t.switchId >= 0) return this.switchesOn.has(t.switchId) ? null : 'switch';
    return null;
  }

  private findUseTarget(): { x: number; y: number } | null {
    const p = this.player;
    const cos = Math.cos(p.angle);
    const sin = Math.sin(p.angle);
    let best: { x: number; y: number } | null = null;
    let bestScore = Infinity;
    for (let cy = Math.floor(p.y) - 1; cy <= Math.floor(p.y) + 1; cy++) {
      for (let cx = Math.floor(p.x) - 1; cx <= Math.floor(p.x) + 1; cx++) {
        const t = this.grid.tile(cx, cy);
        if (!t || (t.type !== 'door' && t.type !== 'exit' && t.switchId < 0)) continue;
        if (t.switchId >= 0 && cy >= Math.floor(p.y)) continue;
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
    return best;
  }

  private playerUse(): void {
    const best = this.findUseTarget();
    if (!best) return;
    const t = this.grid.tile(best.x, best.y)!;
    if (t.type === 'exit') this.activateExit();
    else if (t.switchId >= 0) this.activateSwitch(t.switchId, best.x, best.y);
    else this.tryDoor(this.grid.doorAt(best.x, best.y)!, true, true);
  }

  private activateExit(): void {
    if (this.exitActivated) return;
    this.exitActivated = true;
    this.sound('switch', this.player.x, this.player.y);
    this.message('Exit switch activated.', 'info');
    this.status = 'won';
  }

  private gateHint(door: Door): string {
    const link = this.level.switches.find((s) => s.gates.some(([x, y]) => this.grid.doorAt(x, y)?.group === door.group));
    if (!link) return 'This gate opens with a lever.';
    const dx = link.at[0] + 0.5 - (door.x + 0.5);
    const dy = link.at[1] + 1 - (door.y + 0.5);
    if (Math.hypot(dx, dy) < GATE_HINT_NEAR) return 'This gate opens with a lever close by.';
    const ns = dy < -Math.abs(dx) / 2 ? 'north' : dy > Math.abs(dx) / 2 ? 'south' : '';
    const ew = dx < -Math.abs(dy) / 2 ? 'west' : dx > Math.abs(dy) / 2 ? 'east' : '';
    return `This gate opens with a lever to the ${ns && ew ? `${ns}-${ew}` : ns || ew}.`;
  }

  private activateSwitch(id: number, x: number, y: number): void {
    if (this.switchesOn.has(id)) return;
    this.switchesOn.add(id);
    this.sound('switch', x + 0.5, y + 1);
    for (const [gx, gy] of this.level.switches[id].gates) {
      const gate = this.grid.doorAt(gx, gy)!;
      if (this.grid.openDoor(gate)) this.sound('door', gx + 0.5, gy + 0.5);
    }
    this.message('The lever opens a gate.', 'info');
  }

  private checkGates(): void {
    const linked = new Set(this.level.switches.flatMap((s) => s.gates.map(([x, y]) => this.grid.doorAt(x, y)!.group)));
    for (const group of this.grid.doorGroups) {
      if (group[0].kind === 'gate' && !linked.has(group)) throw new Error(`Gate at ${group[0].x},${group[0].y} in ${this.level.name} has no switch`);
      if (group[0].kind === 'seal' && !this.monsters.some((m) => m.def.boss)) throw new Error(`Seal at ${group[0].x},${group[0].y} in ${this.level.name} has no boss to break it`);
    }
  }

  private watchDoors(): void {
    for (const m of this.monsters) {
      const room = this.grid.rooms[this.grid.index(Math.floor(m.x), Math.floor(m.y))];
      let best: { x: number; y: number } | null = null;
      for (const { group, rooms } of this.doorRooms) {
        if (!rooms.includes(room) || group[0].kind === 'secret' || group[0].kind === 'trap') continue;
        const mid = group[Math.floor(group.length / 2)];
        const door = { x: mid.x + 0.5, y: mid.y + 0.5 };
        if (!best || dist(m.x, m.y, door.x, door.y) < dist(m.x, m.y, best.x, best.y)) best = door;
      }
      if (!best) continue;
      const angle = Math.atan2(best.y - m.y, best.x - m.x);
      m.restAngle = angle;
      m.turnTo = angle;
      this.face(m, angle);
    }
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
    this.placeClosetMedkits(trap, cells);
    const closetRoom = closets[0];
    this.ambush = {
      key: ambush.key,
      door,
      monsters,
      sprung: false,
      closet: {
        cells: new Set(closet),
        outerRooms: trapRooms.filter((r) => r !== closetRoom),
        wall: this.grid.tiles[door.index].wall,
        embedded: this.isEmbedded(closet, closetRoom),
      },
    };
  }

  private placeClosetMedkits(trap: Door[], cells: { x: number; y: number }[]): void {
    const horizontal = new Set(trap.map((d) => d.y)).size === 1;
    const depth = (c: { x: number; y: number }): number => (horizontal ? Math.abs(c.y - 0.5 - trap[0].y) : Math.abs(c.x - 0.5 - trap[0].x));
    const deepest = Math.max(...cells.map(depth));
    const back = cells.filter((c) => depth(c) === deepest).sort((a, b) => (horizontal ? a.x - b.x : a.y - b.y));
    if (back.length < 2) throw new Error(`Ambush closet in ${this.level.name} needs two free cells on its back row for the medkits`);
    const mid = (back.length - 1) / 2;
    const picks = back.length % 2 === 0 ? [mid - 0.5, mid + 0.5] : [mid - 1, mid + 1];
    for (const i of picks) this.items.push({ id: this.nextId++, kind: 'medkit', x: back[i].x, y: back[i].y, taken: false, dropped: false });
  }

  private isEmbedded(closet: number[], closetRoom: number): boolean {
    const g = this.grid;
    const near = (i: number): number[] => {
      const x = i % g.width;
      const y = Math.floor(i / g.width);
      const out: number[] = [];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (g.inBounds(x + dx, y + dy)) out.push(g.index(x + dx, y + dy));
      return out;
    };
    const shell = new Set(closet.flatMap(near).filter((i) => g.rooms[i] < 0));
    return [...shell].every((i) => near(i).some((n) => g.rooms[n] >= 0 && g.rooms[n] !== closetRoom));
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
    if (door.kind === 'seal') {
      if (byPlayer && this.throttled('seal', 1.5)) {
        this.message('A rift seal holds this door. It breaks when its keeper dies.', 'warn');
        this.sound('noway', door.x + 0.5, door.y + 0.5);
      }
      return;
    }
    if (door.kind === 'gate') {
      if (byPlayer && this.throttled('gate', 1.5)) {
        this.message(this.gateHint(door), 'warn');
        this.sound('noway', door.x + 0.5, door.y + 0.5);
      }
      return;
    }
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

  private isInPickupReach(item: Item): boolean {
    const p = this.player;
    const d = dist(p.x, p.y, item.x, item.y);
    if (d < PICKUP_RADIUS) return true;
    return d < PICKUP_RADIUS * this.pickupScale && this.grid.canStep(p.x, p.y, item.x, item.y) && this.grid.lineOfFire(p.x, p.y, item.x, item.y);
  }

  private tryPickup(item: Item): void {
    const p = this.player;
    let sound: SoundId = 'pickup';
    if (this.god && GOD_SKIPS.has(item.kind)) return;
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
      case 'shells':
      case 'grenades':
      case 'fuel':
      case 'cells': {
        const [type, amount] = PICKUP_AMMO[item.kind]!;
        const dropped = item.dropped && (type === 'bullets' || type === 'shells');
        if (!this.giveAmmo(type, this.scaledAmmo(dropped ? DROPPED_AMMO : amount))) return;
        break;
      }
      case 'shotgun':
      case 'rotary':
      case 'launcher':
      case 'flamer':
      case 'arc':
      case 'rift': {
        const isNew = !p.weapons.has(item.kind);
        const ammo = WEAPONS[item.kind].ammo!;
        const gave = this.giveAmmo(ammo, this.scaledAmmo(WEAPON_PICKUP_AMMO[item.kind]));
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
    if (this.god) {
      p.hurtTime = 0.35;
      return;
    }
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
      restAngle: null,
      burn: 0,
      burnDamage: 0,
      burnFx: 0,
      burstLeft: 0,
      burstTimer: 0,
      leapTime: 0,
      leapAngle: 0,
      flankSide: this.rng.chance(0.5) ? 1 : -1,
      flankTimer: 0,
      shieldAngle: Math.PI / 2,
      summonTimer: BOSS_SUMMON_EVERY,
      slamTimer: BOSS_SLAM_EVERY,
      summoned: false,
      teleportTimer: BOSS_TELEPORT_EVERY[0],
      hurtSinceTeleport: 0,
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

  private updateBurning(m: Monster, dt: number): boolean {
    if (m.burn <= 0) return false;
    m.burn -= dt;
    m.burnDamage += BURN_DPS * dt;
    m.burnFx -= dt;
    if (m.burnFx <= 0) {
      m.burnFx = BURN_FX_EVERY;
      this.effect('flame', m.x + this.rng.range(-0.2, 0.2), m.y + this.rng.range(-0.2, 0.2));
    }
    if (m.burnDamage >= BURN_TICK) {
      m.burnDamage -= BURN_TICK;
      this.damageMonster(m, BURN_TICK, true);
    }
    return m.state === 'dead';
  }

  private updateMonster(m: Monster, dt: number): void {
    if (m.state === 'dead') return;
    if (this.updateBurning(m, dt)) return;
    this.turnShield(m, dt);
    this.updateBoss(m, dt);
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
    if (this.updateLeap(m, dt) || this.updateBurst(m, dt)) return;

    switch (m.state) {
      case 'idle':
        if (m.seesPlayer) this.spot(m);
        else this.lookAround(m, dt);
        return;
      case 'hold':
        if (m.seesPlayer) this.spot(m);
        else this.lookAround(m, dt);
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
    const canReach = this.grid.canStep(m.x, m.y, p.x, p.y);
    if (m.def.meleeDamage && gap < 0.4 && m.cooldown <= 0 && canReach) {
      this.startAttack(m, 'melee');
      return;
    }
    if (m.def.ranged && m.def.ranged !== 'melee' && d < m.def.rangedRange && m.cooldown <= 0 && (gap > 0.4 || !m.def.meleeDamage || !canReach) && this.grid.lineOfFire(m.x, m.y, p.x, p.y)) {
      if (this.rng.chance(m.def.rangedChance)) {
        this.startAttack(m, 'ranged');
        return;
      }
      m.cooldown = 0.4;
    }
    const leap = m.def.leap;
    if (leap && m.cooldown <= 0 && d < leap.range && gap > 0.4 && canReach && this.grid.lineOfFire(m.x, m.y, p.x, p.y)) {
      m.leapTime = leap.time;
      m.leapAngle = Math.atan2(p.y - m.y, p.x - m.x);
      m.cooldown = LEAP_COOLDOWN;
      this.face(m, m.leapAngle);
      return;
    }
    const [tx, ty] = this.chaseTarget(m, dt);
    if (gap < 0.05 || this.navigate(m, tx, ty, dt, 1) !== 'moving') this.face(m, Math.atan2(p.y - m.y, p.x - m.x));
  }

  private chaseTarget(m: Monster, dt: number): [number, number] {
    const p = this.player;
    const d = dist(m.x, m.y, p.x, p.y);
    if (!m.def.flank || d < (m.def.leap?.range ?? 0) * 0.8 || d > 9) return [p.x, p.y];
    m.flankTimer -= dt;
    if (m.flankTimer <= 0) {
      m.flankTimer = this.rng.range(FLANK_SWITCH[0], FLANK_SWITCH[1]);
      m.flankSide = -m.flankSide;
    }
    const a = Math.atan2(m.y - p.y, m.x - p.x) + m.flankSide * 0.9;
    const tx = p.x + Math.cos(a) * FLANK_DISTANCE;
    const ty = p.y + Math.sin(a) * FLANK_DISTANCE;
    return this.monsterPassable(Math.floor(tx), Math.floor(ty)) ? [tx, ty] : [p.x, p.y];
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
      m.turnTo = (m.restAngle ?? m.angle) + this.rng.range(-m.def.lookSwing, m.def.lookSwing);
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
    const goalCell = this.grid.index(Math.floor(gx), Math.floor(gy + FOOT_OFFSET));
    const ownCell = this.grid.index(Math.floor(m.x), Math.floor(m.y + FOOT_OFFSET));
    const floats = m.def.floats === true;
    if (ownCell !== goalCell && !(d < 7 && this.clearWalk(m.x, m.y, gx, gy, m.r, floats))) {
      m.pathTimer -= dt;
      if (m.pathTimer <= 0 || m.path.length === 0 || m.goalCell !== goalCell) {
        m.pathTimer = this.rng.range(0.5, 0.9);
        m.goalCell = goalCell;
        const path = findPath(
          this.grid.width,
          this.grid.height,
          (cx, cy) => this.monsterPassable(cx, cy, floats),
          Math.floor(m.x),
          Math.floor(m.y + FOOT_OFFSET),
          Math.floor(gx),
          Math.floor(gy + FOOT_OFFSET),
          undefined,
          (ax, ay, bx, by) => floats || this.grid.canStep(ax, ay, bx, by),
        );
        m.path = path ?? [];
        if (!path) return 'blocked';
      }
      while (m.path.length > 0 && dist(m.x, m.y, m.path[0].x, m.path[0].y) < 0.2) m.path.shift();
      if (m.path.length === 0 || (!floats && this.grid.hazardAt(m.path[0].x, m.path[0].y) > 0)) return 'blocked';
      tx = m.path[0].x;
      ty = m.path[0].y;
    }

    const a = Math.atan2(ty - m.y, tx - m.x);
    this.face(m, a);
    const step = Math.min(m.def.speed * this.difficulty.enemySpeed * speedMul * dt, dist(m.x, m.y, tx, ty));
    const solid = floats ? this.floatSolid : this.monsterSolid;
    const res = this.grid.move(m.x, m.y, m.r, Math.cos(a) * step, Math.sin(a) * step, solid, floats);
    const moved = Math.hypot(res.x - m.x, res.y - m.y);
    m.x = res.x;
    m.y = res.y;
    this.pushOutOfObstacles(m, m, solid, floats);
    if (moved < step * 0.1 && res.bumped.length > 0) return 'blocked';
    m.moving = true;
    m.walkTime += dt;
    return 'moving';
  }

  private monsterPassable(cx: number, cy: number, floats = false): boolean {
    const t = this.grid.tile(cx, cy);
    if (!t) return false;
    if (t.type === 'floor') {
      const cell = this.grid.index(cx, cy);
      return !this.grid.blockers.has(cell) && !this.postCells.has(cell) && (floats || FLOOR_HAZARD[t.floor] === 0);
    }
    if (t.type === 'door') return !this.grid.isSolid(cx, cy);
    return false;
  }

  private readonly monsterSolid = (cx: number, cy: number): boolean => this.grid.isSolid(cx, cy) || this.grid.hazardAt(cx + 0.5, cy + 0.5) > 0;
  private readonly floatSolid = (cx: number, cy: number): boolean => this.grid.isSolid(cx, cy);

  private clearWalk(ax: number, ay: number, bx: number, by: number, r: number, floats = false): boolean {
    const d = Math.hypot(bx - ax, by - ay);
    if (d < 1e-6) return true;
    const nx = -(by - ay) / d;
    const ny = (bx - ax) / d;
    let px = ax;
    let py = ay;
    for (let t = 0; t <= d; t += 0.25) {
      const x = ax + ((bx - ax) * t) / d;
      const y = ay + ((by - ay) * t) / d;
      if (!floats && !this.grid.canStep(px, py, x, y)) return false;
      px = x;
      py = y;
      for (const o of [-r, 0, r]) {
        const ox = x + nx * o;
        const oy = y + ny * o;
        if (!this.monsterPassable(Math.floor(ox), Math.floor(oy), floats) || (!floats && !this.grid.canStep(x, y, ox, oy))) return false;
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
      if (dist(m.x, m.y, p.x, p.y) - m.r - p.r < 0.65 && m.def.meleeDamage && this.grid.canStep(m.x, m.y, p.x, p.y)) {
        this.sound('claw', m.x, m.y);
        this.hurtPlayerByEnemy(this.rng.int(m.def.meleeDamage[0], m.def.meleeDamage[1]));
      }
      return;
    }
    if (m.def.ranged === 'hitscan') {
      this.enemyGunfire(m, a);
      m.burstLeft = (m.def.burst ?? 1) - 1;
      m.burstTimer = m.def.burstGap ?? 0;
    } else if (m.def.ranged === 'fireball') {
      const shot = m.def.shot ?? FIREBALL_SHOT;
      const count = shot.count + (m.def.boss ? this.bossPhase(m) * 2 : 0);
      this.sound('fireball', m.x, m.y);
      for (let i = 0; i < count; i++) this.enemyShot(m, a + (i - (count - 1) / 2) * shot.spread, shot);
    }
  }

  private enemyShot(m: Monster, a: number, shot: ShotSpec): void {
    const speed = shot.speed * this.difficulty.projectileSpeed;
    this.projectiles.push({
      id: this.nextId++,
      x: m.x + Math.cos(a) * (m.r + 0.1),
      y: m.y + Math.sin(a) * (m.r + 0.1),
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      damage: m.def.rangedDamage,
      ownerId: m.id,
      alive: true,
      look: shot.look,
      fromPlayer: false,
      overCover: false,
      blast: null,
      travel: 0,
      range: shot.range,
      homing: shot.homing,
    });
  }

  private bossPhase(m: Monster): number {
    const ratio = m.hp / m.def.hp;
    return ratio > 2 / 3 ? 0 : ratio > 1 / 3 ? 1 : 2;
  }

  private updateBoss(m: Monster, dt: number): void {
    if (!m.def.boss || isCalm(m)) return;
    const phase = this.bossPhase(m);
    if (phase >= 1) {
      m.summonTimer -= dt;
      const adds = this.monsters.filter((o) => o.summoned && o.state !== 'dead').length;
      if (m.summonTimer <= 0 && adds < BOSS_MAX_ADDS) {
        m.summonTimer = BOSS_SUMMON_EVERY;
        for (const side of [-1, 1]) {
          const a = m.angle + side * Math.PI / 2;
          const x = m.x + Math.cos(a) * 1.6;
          const y = m.y + Math.sin(a) * 1.6;
          if (!this.monsterPassable(Math.floor(x), Math.floor(y))) continue;
          const add = this.spawnMonster(phase === 1 ? 'fiend' : 'stalker', x, y);
          add.summoned = true;
          this.wake(add);
          this.effect('riftblast', x, y);
        }
      }
    }
    if (phase >= 2) {
      m.slamTimer -= dt;
      if (m.slamTimer <= 0) {
        m.slamTimer = BOSS_SLAM_EVERY;
        this.sound('rift', m.x, m.y);
        for (let i = 0; i < BOSS_RING; i++) this.enemyShot(m, (i / BOSS_RING) * Math.PI * 2, BOSS_RING_SHOT);
      }
    }
    m.teleportTimer -= dt;
    if (m.teleportTimer <= 0 || m.hurtSinceTeleport >= BOSS_TELEPORT_HURT) this.teleport(m, BOSS_TELEPORT_EVERY[phase]);
  }

  private teleport(m: Monster, next: number): void {
    const p = this.player;
    const rooms = this.grid.roomsAt(m.x, m.y);
    for (let i = 0; i < BOSS_TELEPORT_TRIES; i++) {
      const x = Math.floor(m.x + this.rng.range(-BOSS_TELEPORT_RANGE[1], BOSS_TELEPORT_RANGE[1])) + 0.5;
      const y = Math.floor(m.y + this.rng.range(-BOSS_TELEPORT_RANGE[1], BOSS_TELEPORT_RANGE[1])) + 0.5;
      const d = dist(x, y, p.x, p.y);
      if (d < BOSS_TELEPORT_RANGE[0] || d > BOSS_TELEPORT_RANGE[1] || !this.monsterPassable(Math.floor(x), Math.floor(y), true)) continue;
      if (!this.grid.roomsAt(x, y).some((r) => rooms.includes(r))) continue;
      this.effect('riftblast', m.x, m.y);
      m.x = x;
      m.y = y;
      m.path = [];
      this.effect('riftblast', x, y);
      this.sound('rift', x, y);
      break;
    }
    m.teleportTimer = next;
    m.hurtSinceTeleport = 0;
  }

  private updateBurst(m: Monster, dt: number): boolean {
    if (m.burstLeft <= 0) return false;
    const p = this.player;
    if (!m.seesPlayer || !this.grid.lineOfFire(m.x, m.y, p.x, p.y)) {
      m.burstLeft = 0;
      return false;
    }
    this.face(m, Math.atan2(p.y - m.y, p.x - m.x));
    m.burstTimer -= dt;
    if (m.burstTimer <= 0) {
      m.burstTimer = m.def.burstGap ?? 0;
      m.burstLeft--;
      this.enemyGunfire(m, m.angle);
    }
    return true;
  }

  private updateLeap(m: Monster, dt: number): boolean {
    if (m.leapTime <= 0 || !m.def.leap) return false;
    m.leapTime -= dt;
    const step = m.def.leap.speed * dt;
    const res = this.grid.move(m.x, m.y, m.r, Math.cos(m.leapAngle) * step, Math.sin(m.leapAngle) * step, this.monsterSolid);
    m.x = res.x;
    m.y = res.y;
    m.moving = true;
    m.walkTime += dt;
    if (res.bumped.length > 0) m.leapTime = 0;
    return true;
  }

  private turnShield(m: Monster, dt: number): void {
    if (!m.def.frontArmor) return;
    const diff = angleDiff(m.angle, m.shieldAngle);
    m.shieldAngle += Math.sign(diff) * Math.min(Math.abs(diff), m.def.turnSpeed * dt);
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

  damageMonster(m: Monster, amount: number, byPlayer = false, from: Vec | null = null): void {
    if (m.state === 'dead') return;
    if (m.def.frontArmor && from && Math.abs(angleDiff(Math.atan2(from.y - m.y, from.x - m.x), m.shieldAngle)) < FRONT_ARC) {
      amount = Math.max(1, Math.round(amount * (1 - m.def.frontArmor)));
      this.effect('puff', m.x + Math.cos(m.shieldAngle) * m.r, m.y + Math.sin(m.shieldAngle) * m.r);
    }
    m.hp -= amount;
    m.hurtTime = 0.15;
    if (m.def.boss) m.hurtSinceTeleport += amount;
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
    if (!m.summoned) this.stats.kills++;
    this.sound(silent ? 'backstab' : 'monsterDeath', m.x, m.y);
    if (m.def.drop) this.items.push({ id: this.nextId++, kind: m.def.drop, x: m.x, y: m.y, taken: false, dropped: true });
    if (m.def.boss && !this.monsters.some((o) => o.def.boss && o.state !== 'dead')) this.breakSeals();
  }

  private breakSeals(): void {
    const seals = this.grid.doorGroups.filter((g) => g[0].kind === 'seal');
    for (const group of seals) {
      const mid = group[Math.floor(group.length / 2)];
      if (this.grid.openDoor(mid)) this.sound('door', mid.x + 0.5, mid.y + 0.5);
    }
    if (seals.length > 0) this.message('The rift seal breaks.', 'info');
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
      const t = rayCircle(ox, oy, dx, dy, m.x, m.y, m.r * (shooter ? 1 : this.playerHitScale));
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
    for (const pr of this.projectiles) {
      if (!pr.alive) continue;
      if (pr.homing > 0) this.steer(pr, dt);
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      pr.travel += Math.hypot(pr.vx, pr.vy) * dt;
      const cx = Math.floor(pr.x);
      const cy = Math.floor(pr.y);
      if (pr.overCover ? this.grid.isOpaque(cx, cy) : this.grid.isShotBlocker(cx, cy)) {
        pr.x -= pr.vx * dt * 0.5;
        pr.y -= pr.vy * dt * 0.5;
        this.detonate(pr, null);
        continue;
      }
      const target = this.projectileTarget(pr);
      if (target) this.detonate(pr, target);
      else if (pr.travel >= pr.range) this.detonate(pr, null);
    }
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      if (!this.projectiles[i].alive) this.projectiles.splice(i, 1);
    }
  }

  private steer(pr: Projectile, dt: number): void {
    const p = this.player;
    const speed = Math.hypot(pr.vx, pr.vy);
    const current = Math.atan2(pr.vy, pr.vx);
    const diff = angleDiff(Math.atan2(p.y - pr.y, p.x - pr.x), current);
    const a = current + Math.sign(diff) * Math.min(Math.abs(diff), pr.homing * dt);
    pr.vx = Math.cos(a) * speed;
    pr.vy = Math.sin(a) * speed;
  }

  private projectileTarget(pr: Projectile): Player | Monster | Barrel | null {
    const p = this.player;
    if (!pr.fromPlayer && dist(pr.x, pr.y, p.x, p.y) < p.r + 0.15) return p;
    const m = this.monsters.find((o) => o.id !== pr.ownerId && o.state !== 'dead' && dist(pr.x, pr.y, o.x, o.y) < o.r * (pr.fromPlayer ? this.playerHitScale : 1) + 0.15);
    if (m) return m;
    return this.barrels.find((o) => !o.exploded && dist(pr.x, pr.y, o.x, o.y) < o.r + 0.15) ?? null;
  }

  private detonate(pr: Projectile, target: Player | Monster | Barrel | null): void {
    pr.alive = false;
    const dmg = this.rng.int(pr.damage[0], pr.damage[1]);
    if (target === this.player) this.hurtPlayerByEnemy(dmg);
    else if (target && isMonster(target)) this.damageMonster(target, dmg, pr.fromPlayer, { x: pr.x - pr.vx * 0.05, y: pr.y - pr.vy * 0.05 });
    else if (target && isBarrel(target)) this.damageBarrel(target, dmg);
    if (pr.blast) {
      this.blast(pr.x, pr.y, pr.blast, pr.fromPlayer, pr.look === 'orb' ? 'riftblast' : 'explosion');
      return;
    }
    this.effect('burst', pr.x, pr.y);
    this.sound('explode', pr.x, pr.y);
  }

  private blast(x: number, y: number, b: Blast, byPlayer: boolean, effect: EffectKind, source: Barrel | null = null): void {
    this.effect(effect, x, y);
    this.sound('explode', x, y);
    this.alertNearby(x, y, NOISE_RANGE);
    const hurt = (tx: number, ty: number): number => {
      const d = dist(x, y, tx, ty);
      if (d >= b.radius || !this.grid.lineOfFire(x, y, tx, ty)) return 0;
      return Math.round(b.damage * (1 - d / b.radius));
    };
    for (const m of this.monsters) {
      if (m.state === 'dead') continue;
      const dmg = hurt(m.x, m.y);
      if (dmg > 0) this.damageMonster(m, dmg, byPlayer, { x, y });
    }
    for (const o of this.barrels) {
      if (o === source) continue;
      const dmg = hurt(o.x, o.y);
      if (dmg > 0) this.damageBarrel(o, dmg);
    }
    if (!b.hurtsPlayer) return;
    const pd = hurt(this.player.x, this.player.y);
    if (pd > 0) this.damagePlayer(pd);
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
    this.blast(b.x, b.y, { radius: EXPLOSION_RADIUS, damage: EXPLOSION_DAMAGE, hurtsPlayer: true }, false, 'explosion', b);
  }

  // ---------- physics helpers ----------

  private pushOutOfObstacles(e: { x: number; y: number; r: number }, self: Monster | null, solid?: (cx: number, cy: number) => boolean, ignoreHeight = false): void {
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
      const res = this.grid.move(e.x, e.y, e.r, nx * push, ny * push, solid, ignoreHeight);
      e.x = res.x;
      e.y = res.y;
    }
  }

  private slideIntoGap(mx: number, my: number): void {
    const p = this.player;
    const up = reachUp(p.r);
    const vertical = Math.abs(my) > Math.abs(mx);
    const ahead = vertical ? Math.floor(my > 0 ? p.y + p.r + GAP_PROBE : p.y - up - GAP_PROBE) : Math.floor(mx > 0 ? p.x + p.r + GAP_PROBE : p.x - p.r - GAP_PROBE);
    const along = vertical ? p.x : p.y;
    const base = Math.floor(along);
    let best: number | null = null;
    for (let c = base - 1; c <= base + 1; c++) {
      const open = vertical ? !this.grid.isSolid(c, ahead) : !this.grid.isSolid(ahead, c);
      if (!open) continue;
      const target = vertical ? c + 0.5 : c + 0.5 + (up - p.r) / 2;
      if (Math.abs(target - along) < GAP_REACH && (best === null || Math.abs(target - along) < Math.abs(best - along))) best = target;
    }
    if (best === null) return;
    const step = Math.sign(best - along) * Math.min(Math.abs(best - along), Math.hypot(mx, my));
    const res = this.grid.move(p.x, p.y, p.r, vertical ? step : 0, vertical ? 0 : step);
    p.x = res.x;
    p.y = res.y;
  }

  private shoveAside(mx: number, my: number, dt: number): void {
    const p = this.player;
    const len = Math.hypot(mx, my);
    const fx = mx / len;
    const fy = my / len;
    for (const m of this.monsters) {
      if (m.state === 'dead') continue;
      const dx = m.x - p.x;
      const dy = m.y - p.y;
      if (Math.hypot(dx, dy) >= p.r + m.r + SHOVE_REACH || dx * fx + dy * fy <= 0) continue;
      const side = Math.sign(dy * fx - dx * fy) || (m.id % 2 ? 1 : -1);
      const step = MARINE.speed * SHOVE_SPEED * dt;
      const res = this.grid.move(m.x, m.y, m.r, (-fy * side + fx * 0.3) * step, (fx * side + fy * 0.3) * step, this.monsterSolid);
      m.x = res.x;
      m.y = res.y;
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
