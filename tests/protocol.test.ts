import { describe, expect, it } from 'vitest';
import { MAX_PLAYERS, MIN_PLAYERS } from '../src/sim/players';
import { DEFAULT_NAME, NAME_MAX, encode, isValidName, parseClientMessage, parseHostMessage, sanitizeName } from '../src/net/protocol';

describe('player names', () => {
  it('trims, strips markup and control characters and keeps 12 characters', () => {
    expect(sanitizeName('  Edu  ')).toBe('Edu');
    expect(sanitizeName('<b>Bob</b>\u0007')).toBe('bBobb');
    expect([...sanitizeName('Abcdefghijklmnopq')]).toHaveLength(NAME_MAX);
    expect(sanitizeName('Zoë 1')).toBe('Zoë 1');
  });

  it('falls back to a default name', () => {
    expect(sanitizeName('')).toBe(DEFAULT_NAME);
    expect(sanitizeName('<<>>')).toBe(DEFAULT_NAME);
    expect(sanitizeName(42)).toBe(DEFAULT_NAME);
  });

  it('requires a name with at least one letter or digit before hosting or joining', () => {
    expect(isValidName('Edu')).toBe(true);
    expect(isValidName(' 7 ')).toBe(true);
    expect(isValidName('Zoë')).toBe(true);
    expect(isValidName('')).toBe(false);
    expect(isValidName('   ')).toBe(false);
    expect(isValidName('<<>>')).toBe(false);
    expect(isValidName('-_.!?')).toBe(false);
    expect(isValidName(42)).toBe(false);
  });
});

describe('client messages', () => {
  const origin = { x: 5, y: 5 };

  it('rejects non-JSON, oversized and unknown messages', () => {
    expect(parseClientMessage('not json', origin)).toBeNull();
    expect(parseClientMessage('x'.repeat(600), origin)).toBeNull();
    expect(parseClientMessage(encode({ t: 'start', names: ['a', 'b'] }), origin)).toBeNull();
    expect(parseClientMessage('{"t":"input","input":{"aimX":"a","aimY":1}}', origin)).toBeNull();
    expect(parseClientMessage('{"__proto__":{"t":"hello"}}', origin)).toBeNull();
  });

  it('clamps input values to safe ranges', () => {
    const raw = JSON.stringify({ t: 'input', input: { moveX: 7, moveY: -1, aimX: 1e9, aimY: 5, fire: 'yes', use: true, weaponSlot: 9, cycleWeapon: 1 } });
    const msg = parseClientMessage(raw, origin);
    expect(msg).toEqual({ t: 'input', input: { moveX: 0, moveY: -1, aimX: 45, aimY: 5, fire: false, use: true, weaponSlot: null, cycleWeapon: 1 } });
  });

  it('cleans the name in a hello', () => {
    expect(parseClientMessage(JSON.stringify({ t: 'hello', name: '<img src=x>' }), origin)).toEqual({ t: 'hello', name: 'img srcx' });
  });
});

describe('host messages', () => {
  const player = { x: 1, y: 1, angle: 0, health: 100, armor: 0, bullets: 40, shells: 0, weapons: ['knife', 'pistol'], weapon: 'pistol', alive: true, respawn: 0, frags: 0, moving: false, walkTime: 0, attackTime: 0, hurtTime: 0, flash: 0 };
  const snap = (over: Record<string, unknown> = {}): string =>
    JSON.stringify({ t: 'snap', snap: { time: 1, status: 'playing', winner: null, players: [player, player], items: [true], events: [], ...over } });

  it('accepts a valid snapshot', () => {
    expect(parseHostMessage(snap(), 1, 2)?.t).toBe('snap');
  });

  it('rejects a wrong item count, bad players or too many events', () => {
    expect(parseHostMessage(snap({ items: [true, false] }), 1, 2)).toBeNull();
    expect(parseHostMessage(snap({ players: [player] }), 1, 2)).toBeNull();
    expect(parseHostMessage(snap({ players: [{ ...player, weapon: 'bfg' }, player] }), 1, 2)).toBeNull();
    expect(parseHostMessage(snap({ events: Array.from({ length: 201 }, () => ({ type: 'effect', effect: 'puff', x: 1, y: 1 })) }), 1, 2)).toBeNull();
  });

  it('drops unknown events and cleans message text', () => {
    const events = [
      { type: 'sound', sound: 'nuke', x: 1, y: 1 },
      { type: 'message', slot: null, text: 'hi\u0000‮there' },
      { type: 'script', code: 'alert(1)' },
    ];
    const msg = parseHostMessage(snap({ events }), 1, 2);
    expect(msg?.t === 'snap' && msg.snap.events).toEqual([{ type: 'message', slot: null, text: 'hithere' }]);
  });

  it('checks slots and player counts against the match size', () => {
    const tracer = (slot: number) => ({ type: 'tracer', x1: 1, y1: 1, x2: 2, y2: 2, slot });
    const msg = parseHostMessage(snap({ events: [tracer(1), tracer(2), tracer(-1), tracer(0.5)] }), 1, 2);
    expect(msg?.t === 'snap' && msg.snap.events.map((e) => (e.type === 'tracer' ? e.slot : null))).toEqual([1]);
    expect(parseHostMessage(snap({ winner: 2 }), 1, 2)).toBeNull();
    expect(parseHostMessage(snap({ players: [player, player, player] }), 1, 2)).toBeNull();
    expect(parseHostMessage(snap({ players: [player, player, player], winner: 2 }), 1, 3)?.t).toBe('snap');
  });

  it(`accepts a start message with ${MIN_PLAYERS} to ${MAX_PLAYERS} names only`, () => {
    const start = (names: unknown[]) => parseHostMessage(JSON.stringify({ t: 'start', names }), 0, 0);
    expect(start(['A', 'B'])).toEqual({ t: 'start', names: ['A', 'B'] });
    expect(start(['A'])).toBeNull();
    expect(start(Array.from({ length: MAX_PLAYERS + 1 }, (_, i) => `P${i}`))).toBeNull();
  });
});
