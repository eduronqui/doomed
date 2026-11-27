import { WEAPON_ORDER, type WeaponId } from '../weapons';
import type { SoundId } from '../sim/defs';
import type { ArenaEvent, ArenaSnapshot, PlayerState, Slot } from '../sim/arena';
import type { Input } from '../sim/world';

export const NAME_MAX = 12;
export const DEFAULT_NAME = 'Marine';
const CLIENT_MESSAGE_MAX = 512;
const HOST_MESSAGE_MAX = 64 * 1024;
const MAX_EVENTS = 200;
const MAX_AIM_REACH = 40;
const MESSAGE_TEXT_MAX = 64;

const SOUNDS: ReadonlySet<SoundId> = new Set<SoundId>([
  'pistol',
  'shotgun',
  'rotary',
  'knife',
  'playerPain',
  'playerDeath',
  'powerup',
  'pickup',
  'weapon',
]);

export type ClientMessage = { t: 'hello'; name: string } | { t: 'input'; input: Input };
export type HostMessage = { t: 'start'; names: [string, string] } | { t: 'snap'; snap: ArenaSnapshot };

function cleanName(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const clean = [...raw.normalize('NFC')].filter((ch) => /[\p{L}\p{N}\p{Zs}\-_.'!?]/u.test(ch)).join('').replace(/\s+/g, ' ').trim();
  return [...clean].slice(0, NAME_MAX).join('').trim();
}

export function isValidName(raw: unknown): boolean {
  return /[\p{L}\p{N}]/u.test(cleanName(raw));
}

export function sanitizeName(raw: unknown): string {
  const name = cleanName(raw);
  return name.length > 0 ? name : DEFAULT_NAME;
}

function parseObject(raw: unknown, max: number): Record<string, unknown> | null {
  if (typeof raw !== 'string' || raw.length > max) return null;
  try {
    const value: unknown = JSON.parse(raw);
    return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isBool = (v: unknown): v is boolean => typeof v === 'boolean';
const isWeapon = (v: unknown): v is WeaponId => typeof v === 'string' && (WEAPON_ORDER as readonly string[]).includes(v);
const isSlot = (v: unknown): v is Slot => v === 0 || v === 1;
const axis = (v: unknown): number => (v === -1 || v === 0 || v === 1 ? v : 0);

export function encode(message: ClientMessage | HostMessage): string {
  return JSON.stringify(message);
}

export function parseClientMessage(raw: unknown, origin: { x: number; y: number }): ClientMessage | null {
  const m = parseObject(raw, CLIENT_MESSAGE_MAX);
  if (!m) return null;
  if (m.t === 'hello') return { t: 'hello', name: sanitizeName(m.name) };
  if (m.t !== 'input' || typeof m.input !== 'object' || m.input === null) return null;
  const i = m.input as Record<string, unknown>;
  if (!isNum(i.aimX) || !isNum(i.aimY)) return null;
  const slot = i.weaponSlot;
  return {
    t: 'input',
    input: {
      moveX: axis(i.moveX),
      moveY: axis(i.moveY),
      aimX: origin.x + Math.max(-MAX_AIM_REACH, Math.min(MAX_AIM_REACH, i.aimX - origin.x)),
      aimY: origin.y + Math.max(-MAX_AIM_REACH, Math.min(MAX_AIM_REACH, i.aimY - origin.y)),
      fire: i.fire === true,
      use: i.use === true,
      weaponSlot: slot === 1 || slot === 2 || slot === 3 || slot === 4 ? slot : null,
      cycleWeapon: axis(i.cycleWeapon),
    },
  };
}

function parsePlayer(v: unknown): PlayerState | null {
  if (typeof v !== 'object' || v === null) return null;
  const p = v as Record<string, unknown>;
  const nums = ['x', 'y', 'angle', 'health', 'armor', 'bullets', 'shells', 'respawn', 'frags', 'walkTime', 'attackTime', 'hurtTime', 'flash'] as const;
  if (!nums.every((k) => isNum(p[k]))) return null;
  if (!isBool(p.alive) || !isBool(p.moving) || !isWeapon(p.weapon)) return null;
  if (!Array.isArray(p.weapons) || p.weapons.length > WEAPON_ORDER.length || !p.weapons.every(isWeapon)) return null;
  return {
    x: p.x as number,
    y: p.y as number,
    angle: p.angle as number,
    health: Math.max(0, Math.min(200, Math.round(p.health as number))),
    armor: Math.max(0, Math.min(200, Math.round(p.armor as number))),
    bullets: Math.max(0, Math.min(999, Math.round(p.bullets as number))),
    shells: Math.max(0, Math.min(999, Math.round(p.shells as number))),
    weapons: p.weapons as WeaponId[],
    weapon: p.weapon,
    alive: p.alive,
    respawn: p.respawn as number,
    frags: Math.max(0, Math.min(999, Math.round(p.frags as number))),
    moving: p.moving,
    walkTime: p.walkTime as number,
    attackTime: p.attackTime as number,
    hurtTime: p.hurtTime as number,
    flash: p.flash as number,
  };
}

function parseEvent(v: unknown): ArenaEvent | null {
  if (typeof v !== 'object' || v === null) return null;
  const e = v as Record<string, unknown>;
  switch (e.type) {
    case 'sound':
      return typeof e.sound === 'string' && SOUNDS.has(e.sound as SoundId) && isNum(e.x) && isNum(e.y) ? { type: 'sound', sound: e.sound as SoundId, x: e.x, y: e.y } : null;
    case 'tracer':
      return isNum(e.x1) && isNum(e.y1) && isNum(e.x2) && isNum(e.y2) && isSlot(e.slot) ? { type: 'tracer', x1: e.x1, y1: e.y1, x2: e.x2, y2: e.y2, slot: e.slot } : null;
    case 'damage':
      return isNum(e.x) && isNum(e.y) && isNum(e.amount) && isSlot(e.slot) ? { type: 'damage', x: e.x, y: e.y, amount: Math.round(e.amount), slot: e.slot } : null;
    case 'effect':
      return (e.effect === 'blood' || e.effect === 'puff') && isNum(e.x) && isNum(e.y) ? { type: 'effect', effect: e.effect, x: e.x, y: e.y } : null;
    case 'message':
      return (e.slot === null || isSlot(e.slot)) && typeof e.text === 'string'
        ? { type: 'message', slot: e.slot, text: [...e.text.replace(/[\p{Cc}\p{Cf}]/gu, '')].slice(0, MESSAGE_TEXT_MAX).join('') }
        : null;
    default:
      return null;
  }
}

export function parseHostMessage(raw: unknown, itemCount: number): HostMessage | null {
  const m = parseObject(raw, HOST_MESSAGE_MAX);
  if (!m) return null;
  if (m.t === 'start') {
    if (!Array.isArray(m.names) || m.names.length !== 2) return null;
    return { t: 'start', names: [sanitizeName(m.names[0]), sanitizeName(m.names[1])] };
  }
  if (m.t !== 'snap' || typeof m.snap !== 'object' || m.snap === null) return null;
  const s = m.snap as Record<string, unknown>;
  if (!isNum(s.time) || (s.status !== 'playing' && s.status !== 'over') || !(s.winner === null || isSlot(s.winner))) return null;
  if (!Array.isArray(s.players) || s.players.length !== 2) return null;
  const players = s.players.map(parsePlayer);
  if (players.some((p) => p === null)) return null;
  if (!Array.isArray(s.items) || s.items.length !== itemCount || !s.items.every(isBool)) return null;
  if (!Array.isArray(s.events) || s.events.length > MAX_EVENTS) return null;
  const events = s.events.map(parseEvent).filter((e): e is ArenaEvent => e !== null);
  return {
    t: 'snap',
    snap: { time: s.time, status: s.status, winner: s.winner, players: players as [PlayerState, PlayerState], items: s.items as boolean[], events },
  };
}
