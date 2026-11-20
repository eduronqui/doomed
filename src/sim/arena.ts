import { MARINE } from '../characters';
import { FALLBACK_ORDER, MAX_AMMO, WEAPONS, WEAPON_ORDER, type AmmoType, type WeaponId } from '../weapons';
import { DECO_POSTS, ITEM_NAMES, SOLID_DECOS, type DecoKind, type ItemKind, type KeyColor, type SoundId } from './defs';
import { Grid } from './grid';
import type { LevelData } from './level';
import { Rng } from './rng';
import { angleDiff, clamp, dirFromAngle, dist, rayCircle, type Dir } from './types';
import type { Input } from './world';

export type Team = 'green' | 'blue';
export type Slot = 0 | 1;

export const FRAG_LIMIT = 10;
export const RESPAWN_TIME = 2.5;
const SPAWN_ARMOR = 0;
const SPAWN_BULLETS = 40;
const MELEE_ARC = 0.9;
const PICKUP_REACH = 0.45;
const ITEM_RESPAWN: Partial<Record<ItemKind, number>> = { shotgun: 20, rotary: 30, sphere: 45, armor: 30 };
const DEFAULT_RESPAWN = 15;
const ARENA_ITEMS: ReadonlySet<ItemKind> = new Set<ItemKind>(['stimpack', 'medkit', 'armor', 'sphere', 'clip', 'shells', 'shotgun', 'rotary']);

export interface ArenaPlayer {
  slot: Slot;
  team: Team;
  name: string;
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
  keys: ReadonlySet<KeyColor>;
  cooldown: number;
  flash: number;
  moving: boolean;
  walkTime: number;
  attackTime: number;
  hurtTime: number;
  alive: boolean;
  respawn: number;
  frags: number;
}

export interface ArenaItem {
  id: number;
  kind: ItemKind;
  x: number;
  y: number;
  respawn: number;
}

export interface ArenaDeco {
  kind: DecoKind;
  x: number;
  y: number;
}

export type ArenaEvent =
  | { type: 'sound'; sound: SoundId; x: number; y: number }
  | { type: 'tracer'; x1: number; y1: number; x2: number; y2: number; slot: Slot }
  | { type: 'damage'; x: number; y: number; amount: number; slot: Slot }
  | { type: 'effect'; effect: 'blood' | 'puff'; x: number; y: number }
  | { type: 'message'; slot: Slot | null; text: string };

export type ArenaStatus = 'playing' | 'over';

export interface PlayerState {
  x: number;
  y: number;
  angle: number;
  health: number;
  armor: number;
  bullets: number;
  shells: number;
  weapons: WeaponId[];
  weapon: WeaponId;
  alive: boolean;
  respawn: number;
  frags: number;
  moving: boolean;
  walkTime: number;
  attackTime: number;
  hurtTime: number;
  flash: number;
}

export interface ArenaSnapshot {
  time: number;
  status: ArenaStatus;
  winner: Slot | null;
  players: [PlayerState, PlayerState];
  items: boolean[];
  events: ArenaEvent[];
}

export class ArenaWorld {
  readonly grid: Grid;
  readonly players: [ArenaPlayer, ArenaPlayer];
  readonly items: ArenaItem[] = [];
  readonly decos: ArenaDeco[] = [];
  readonly spawns: { x: number; y: number }[];
  readonly revealedRooms = new Set<number>();
  status: ArenaStatus = 'playing';
  winner: Slot | null = null;
  time = 0;
  private events: ArenaEvent[] = [];
  private rng: Rng;
  private posts: { x: number; y: number; r: number }[] = [];

  constructor(level: LevelData, names: [string, string], seed = 1) {
    this.grid = new Grid(level);
    this.rng = new Rng(seed);
    this.spawns = level.spawns.filter((s) => s.kind === 'player').map((s) => ({ x: s.x, y: s.y }));
    if (this.spawns.length < 2) throw new Error(`Arena ${level.name} needs at least two player starts`);
    let id = 1;
    for (const s of level.spawns) {
      if (s.kind in ITEM_NAMES && ARENA_ITEMS.has(s.kind as ItemKind)) this.items.push({ id: id++, kind: s.kind as ItemKind, x: s.x, y: s.y, respawn: 0 });
      else if (s.kind === 'lamp' || s.kind === 'crate' || s.kind === 'brazier' || s.kind === 'gore' || s.kind === 'body') {
        const kind = s.kind;
        this.decos.push({ kind, x: s.x, y: s.y });
        const cell = this.grid.index(Math.floor(s.x), Math.floor(s.y));
        if (SOLID_DECOS.has(kind)) this.grid.blockers.add(cell);
        if (kind === 'crate') this.grid.shotBlockers.add(cell);
        const postRadius = DECO_POSTS.get(kind);
        if (postRadius !== undefined) this.posts.push({ x: s.x, y: s.y, r: postRadius });
      }
    }
    for (let r = 0; r < this.grid.rooms.length; r++) if (this.grid.rooms[r] >= 0) this.revealedRooms.add(this.grid.rooms[r]);
    this.players = [this.makePlayer(0, 'green', names[0], this.spawns[0]), this.makePlayer(1, 'blue', names[1], this.spawns[1])];
  }

  private makePlayer(slot: Slot, team: Team, name: string, at: { x: number; y: number }): ArenaPlayer {
    const p: ArenaPlayer = {
      slot,
      team,
      name,
      x: at.x,
      y: at.y,
      r: MARINE.radius,
      angle: 0,
      dir: 's',
      health: 0,
      armor: 0,
      ammo: { bullets: 0, shells: 0 },
      weapons: new Set(),
      weapon: 'pistol',
      keys: new Set(),
      cooldown: 0,
      flash: 0,
      moving: false,
      walkTime: 0,
      attackTime: 0,
      hurtTime: 0,
      alive: true,
      respawn: 0,
      frags: 0,
    };
    this.resetLoadout(p);
    return p;
  }

  private resetLoadout(p: ArenaPlayer): void {
    p.health = 100;
    p.armor = SPAWN_ARMOR;
    p.ammo = { bullets: SPAWN_BULLETS, shells: 0 };
    p.weapons = new Set<WeaponId>(['knife', 'pistol']);
    p.weapon = 'pistol';
    p.cooldown = 0.3;
    p.hurtTime = 0;
    p.alive = true;
  }

  isRevealedAt(): boolean {
    return true;
  }

  hiddenCloset(): null {
    return null;
  }

  snapshot(events: ArenaEvent[]): ArenaSnapshot {
    const state = (p: ArenaPlayer): PlayerState => ({
      x: p.x,
      y: p.y,
      angle: p.angle,
      health: p.health,
      armor: p.armor,
      bullets: p.ammo.bullets,
      shells: p.ammo.shells,
      weapons: [...p.weapons],
      weapon: p.weapon,
      alive: p.alive,
      respawn: p.respawn,
      frags: p.frags,
      moving: p.moving,
      walkTime: p.walkTime,
      attackTime: p.attackTime,
      hurtTime: p.hurtTime,
      flash: p.flash,
    });
    return {
      time: this.time,
      status: this.status,
      winner: this.winner,
      players: [state(this.players[0]), state(this.players[1])],
      items: this.items.map((i) => i.respawn === 0),
      events,
    };
  }

  applySnapshot(snap: ArenaSnapshot): void {
    this.time = snap.time;
    this.status = snap.status;
    this.winner = snap.winner;
    snap.players.forEach((s, i) => {
      const p = this.players[i];
      Object.assign(p, {
        x: s.x,
        y: s.y,
        angle: s.angle,
        dir: dirFromAngle(s.angle),
        health: s.health,
        armor: s.armor,
        ammo: { bullets: s.bullets, shells: s.shells },
        weapons: new Set(s.weapons),
        weapon: s.weapon,
        alive: s.alive,
        respawn: s.respawn,
        frags: s.frags,
        moving: s.moving,
        walkTime: s.walkTime,
        attackTime: s.attackTime,
        hurtTime: s.hurtTime,
        flash: s.flash,
      });
    });
    snap.items.forEach((present, i) => {
      this.items[i].respawn = present ? 0 : 1;
    });
  }

  drainEvents(): ArenaEvent[] {
    const out = this.events;
    this.events = [];
    return out;
  }

  update(dt: number, inputs: [Input, Input]): void {
    if (this.status !== 'playing') return;
    this.time += dt;
    for (const item of this.items) if (item.respawn > 0) item.respawn = Math.max(0, item.respawn - dt);
    for (const p of this.players) this.updatePlayer(p, dt, inputs[p.slot]);
  }

  private updatePlayer(p: ArenaPlayer, dt: number, input: Input): void {
    p.flash = Math.max(0, p.flash - dt);
    p.attackTime = Math.max(0, p.attackTime - dt);
    p.hurtTime = Math.max(0, p.hurtTime - dt);
    if (!p.alive) {
      p.respawn -= dt;
      if (p.respawn <= 0) this.respawnPlayer(p);
      return;
    }
    p.cooldown -= dt;
    if (input.weaponSlot !== null) {
      const w = WEAPON_ORDER.find((id) => WEAPONS[id].slot === input.weaponSlot);
      if (w && p.weapons.has(w)) p.weapon = w;
    }
    if (input.cycleWeapon !== 0) this.cycleWeapon(p, input.cycleWeapon);

    const len = Math.hypot(input.moveX, input.moveY);
    p.moving = len > 0.01;
    if (p.moving) {
      const mx = (input.moveX / Math.max(1, len)) * MARINE.speed * dt;
      const my = (input.moveY / Math.max(1, len)) * MARINE.speed * dt;
      const res = this.grid.move(p.x, p.y, p.r, mx, my);
      p.x = res.x;
      p.y = res.y;
      p.walkTime += dt;
      this.pushOut(p);
    }
    p.angle = Math.atan2(input.aimY - p.y, input.aimX - p.x);
    p.dir = dirFromAngle(p.angle);

    for (const item of this.items) {
      if (item.respawn === 0 && dist(item.x, item.y, p.x, p.y) < p.r + PICKUP_REACH) this.tryPickup(p, item);
    }
    if (input.fire && p.cooldown <= 0) this.fire(p);
  }

  private pushOut(p: ArenaPlayer): void {
    const other = this.players[p.slot === 0 ? 1 : 0];
    const solids = [...this.posts, ...(other.alive ? [other] : [])];
    for (const o of solids) {
      const dx = p.x - o.x;
      const dy = p.y - o.y;
      const d = Math.hypot(dx, dy);
      const min = p.r + o.r;
      if (d >= min) continue;
      const nx = d > 1e-6 ? dx / d : 1;
      const ny = d > 1e-6 ? dy / d : 0;
      const push = clamp(min - d, 0, 0.3);
      const res = this.grid.move(p.x, p.y, p.r, nx * push, ny * push);
      p.x = res.x;
      p.y = res.y;
    }
  }

  private cycleWeapon(p: ArenaPlayer, dir: number): void {
    const owned = WEAPON_ORDER.filter((w) => p.weapons.has(w));
    const i = owned.indexOf(p.weapon);
    p.weapon = owned[(i + Math.sign(dir) + owned.length) % owned.length];
  }

  private hasAmmo(p: ArenaPlayer, w: WeaponId): boolean {
    const type = WEAPONS[w].ammo;
    return type === null || p.ammo[type] > 0;
  }

  private fire(p: ArenaPlayer): void {
    if (!this.hasAmmo(p, p.weapon)) {
      p.weapon = FALLBACK_ORDER.find((w) => p.weapons.has(w) && this.hasAmmo(p, w)) ?? 'knife';
      p.cooldown = 0.2;
      return;
    }
    const w = WEAPONS[p.weapon];
    p.cooldown = w.cooldown;
    p.attackTime = 0.15;
    if (w.ammo) p.ammo[w.ammo]--;
    this.sound(w.sound, p.x, p.y);
    const other = this.players[p.slot === 0 ? 1 : 0];
    if (w.ammo === null) {
      const reach = dist(p.x, p.y, other.x, other.y) - other.r;
      const ahead = Math.abs(angleDiff(Math.atan2(other.y - p.y, other.x - p.x), p.angle)) < MELEE_ARC;
      if (other.alive && reach <= w.range && ahead && this.grid.lineOfSight(p.x, p.y, other.x, other.y)) {
        this.effect('blood', other.x, other.y);
        this.damage(other, this.rng.int(w.damage[0], w.damage[1]), p);
      }
      return;
    }
    p.flash = 0.06;
    let total = 0;
    for (let i = 0; i < w.pellets; i++) {
      const a = p.angle + this.rng.range(-w.spread, w.spread);
      const dx = Math.cos(a);
      const dy = Math.sin(a);
      const wall = this.grid.raycast(p.x, p.y, dx, dy, w.range);
      const t = other.alive ? rayCircle(p.x, p.y, dx, dy, other.x, other.y, other.r) : -1;
      const hit = t >= 0 && t < wall.dist;
      const end = hit ? t : wall.dist;
      const ex = p.x + dx * end;
      const ey = p.y + dy * end;
      this.events.push({ type: 'tracer', x1: p.x + dx * 0.4, y1: p.y + dy * 0.4, x2: ex, y2: ey, slot: p.slot });
      if (hit) {
        total += this.rng.int(w.damage[0], w.damage[1]);
        this.effect('blood', ex, ey);
      } else if (wall.hit) this.effect('puff', ex, ey);
    }
    if (total > 0) this.damage(other, total, p);
  }

  private damage(target: ArenaPlayer, amount: number, attacker: ArenaPlayer): void {
    if (!target.alive) return;
    let taken = amount;
    if (target.armor > 0) {
      const saved = Math.min(target.armor, Math.floor(amount / 3));
      target.armor -= saved;
      taken -= saved;
    }
    target.health -= taken;
    target.hurtTime = 0.35;
    this.events.push({ type: 'damage', x: target.x, y: target.y, amount: taken, slot: target.slot });
    if (target.health > 0) {
      this.sound('playerPain', target.x, target.y);
      return;
    }
    target.health = 0;
    target.alive = false;
    target.respawn = RESPAWN_TIME;
    target.moving = false;
    attacker.frags++;
    this.sound('playerDeath', target.x, target.y);
    this.message(null, `${attacker.name} fragged ${target.name}.`);
    if (attacker.frags >= FRAG_LIMIT) {
      this.status = 'over';
      this.winner = attacker.slot;
      this.message(null, `${attacker.name} wins!`);
    }
  }

  private respawnPlayer(p: ArenaPlayer): void {
    const other = this.players[p.slot === 0 ? 1 : 0];
    const spot = [...this.spawns].sort((a, b) => dist(b.x, b.y, other.x, other.y) - dist(a.x, a.y, other.x, other.y))[0];
    p.x = spot.x;
    p.y = spot.y;
    this.resetLoadout(p);
    this.sound('powerup', p.x, p.y);
  }

  private tryPickup(p: ArenaPlayer, item: ArenaItem): void {
    switch (item.kind) {
      case 'stimpack':
      case 'medkit':
        if (p.health >= 100) return;
        p.health = Math.min(100, p.health + (item.kind === 'stimpack' ? 10 : 25));
        break;
      case 'sphere':
        p.health = Math.min(200, p.health + 100);
        break;
      case 'armor':
        if (p.armor >= 100) return;
        p.armor = 100;
        break;
      case 'clip':
        if (!this.giveAmmo(p, 'bullets', 10)) return;
        break;
      case 'shells':
        if (!this.giveAmmo(p, 'shells', 8)) return;
        break;
      case 'shotgun':
      case 'rotary': {
        const isNew = !p.weapons.has(item.kind);
        const gave = this.giveAmmo(p, item.kind === 'shotgun' ? 'shells' : 'bullets', item.kind === 'shotgun' ? 8 : 20);
        if (!isNew && !gave) return;
        p.weapons.add(item.kind);
        if (isNew) p.weapon = item.kind;
        break;
      }
      default:
        return;
    }
    item.respawn = ITEM_RESPAWN[item.kind] ?? DEFAULT_RESPAWN;
    this.sound(item.kind === 'shotgun' || item.kind === 'rotary' ? 'weapon' : item.kind === 'sphere' ? 'powerup' : 'pickup', item.x, item.y);
    this.message(p.slot, `You picked up ${ITEM_NAMES[item.kind]}.`);
  }

  private giveAmmo(p: ArenaPlayer, type: AmmoType, amount: number): boolean {
    if (p.ammo[type] >= MAX_AMMO[type]) return false;
    p.ammo[type] = Math.min(MAX_AMMO[type], p.ammo[type] + amount);
    return true;
  }

  private sound(sound: SoundId, x: number, y: number): void {
    this.events.push({ type: 'sound', sound, x, y });
  }

  private effect(effect: 'blood' | 'puff', x: number, y: number): void {
    this.events.push({ type: 'effect', effect, x, y });
  }

  private message(slot: Slot | null, text: string): void {
    this.events.push({ type: 'message', slot, text });
  }
}
