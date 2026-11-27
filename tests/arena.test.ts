import { describe, expect, it } from 'vitest';
import { ARENA } from '../src/levels/arena';
import { ArenaWorld, FRAG_LIMIT, RESPAWN_TIME } from '../src/sim/arena';
import { parseLevel } from '../src/sim/level';
import { IDLE_INPUT, type Input } from '../src/sim/world';
import { encode, parseHostMessage } from '../src/net/protocol';
import { MAX_PLAYERS, TEAMS, isSlot, teamOf } from '../src/sim/players';

const STEP = 1 / 60;

function run(w: ArenaWorld, seconds: number, a: Partial<Input> = {}, b: Partial<Input> = {}): void {
  for (let t = 0; t < seconds; t += STEP) {
    const [p0, p1] = w.players;
    w.update(STEP, [
      { ...IDLE_INPUT, aimX: p1.x, aimY: p1.y, ...a },
      { ...IDLE_INPUT, aimX: p0.x, aimY: p0.y, ...b },
    ]);
  }
}

const duel = (): ArenaWorld => new ArenaWorld(parseLevel('duel', '##########\n#P......P#\n##########'), ['Green', 'Blue']);

describe('arena', () => {
  it('loads the arena with a green host and a blue guest on different spawns', () => {
    const w = new ArenaWorld(ARENA.load(), ['Ana', 'Bo']);
    expect(w.spawns.length).toBeGreaterThanOrEqual(2);
    expect(w.players.map((p) => [p.name, p.slot, teamOf(p.slot).id])).toEqual([
      ['Ana', 0, 'green'],
      ['Bo', 1, 'blue'],
    ]);
    expect(w.players[0].x).not.toBe(w.players[1].x);
    expect(w.items.some((i) => i.kind === 'medkit')).toBe(true);
    expect(w.items.some((i) => i.kind === 'stimpack')).toBe(true);
  });

  it('frags a player, scores the killer and respawns the victim away from the killer', () => {
    const w = duel();
    w.players[1].health = 1;
    run(w, 0.5, { fire: true });
    expect(w.players[1].alive).toBe(false);
    expect(w.players[0].frags).toBe(1);
    w.players[0].x = 2.5;
    run(w, RESPAWN_TIME + 0.1);
    expect(w.players[1].alive).toBe(true);
    expect(w.players[1].health).toBe(100);
    expect(w.players[1].x).toBe(8.5);
  });

  it('ends the match at the frag limit', () => {
    const w = duel();
    w.players[0].frags = FRAG_LIMIT - 1;
    w.players[1].health = 1;
    run(w, 0.5, { fire: true });
    expect(w.status).toBe('over');
    expect(w.winner).toBe(0);
  });

  it('lets armor absorb a third of the damage', () => {
    const w = duel();
    w.players[1].armor = 100;
    w.players[0].weapon = 'knife';
    w.players[1].x = 2.4;
    run(w, 0.35, { fire: true });
    const p = w.players[1];
    expect(100 - p.health).toBeGreaterThan(0);
    expect(100 - p.armor).toBe(Math.floor((100 - p.health + (100 - p.armor)) / 3));
  });

  it('brings medical aid back after it is taken', () => {
    const w = new ArenaWorld(parseLevel('aid', '########\n#P.m..P#\n########'), ['A', 'B']);
    w.players[0].health = 50;
    run(w, 0.6, { moveX: 1 });
    expect(w.players[0].health).toBe(75);
    expect(w.items[0].respawn).toBeGreaterThan(0);
    run(w, 16);
    expect(w.items[0].respawn).toBe(0);
  });

  it('copies the host state to the guest through a validated snapshot', () => {
    const host = duel();
    run(host, 0.4, { moveX: 1, fire: true }, { moveX: -1 });
    const raw = encode({ t: 'snap', snap: host.snapshot(host.drainEvents()) });
    const msg = parseHostMessage(raw, host.items.length, host.players.length);
    expect(msg?.t).toBe('snap');
    const guest = duel();
    if (msg?.t === 'snap') guest.applySnapshot(msg.snap);
    expect(guest.players.map((p) => [p.x, p.y, p.health, p.ammo.bullets])).toEqual(host.players.map((p) => [p.x, p.y, p.health, p.ammo.bullets]));
  });
});

describe('player count in one place', () => {
  it('has a team color and sprite for every allowed player', () => {
    expect(TEAMS.length).toBeGreaterThanOrEqual(MAX_PLAYERS);
    for (let slot = 0; slot < MAX_PLAYERS; slot++) {
      expect(teamOf(slot).color).toMatch(/^#[0-9a-f]{6}$/);
      expect(teamOf(slot).tint).toBeGreaterThan(0);
      expect(teamOf(slot).tint).toBeLessThanOrEqual(0xffffff);
    }
    expect(new Set(TEAMS.map((t) => t.tint)).size).toBe(TEAMS.length);
  });

  it('accepts only whole slots inside the match size', () => {
    expect(isSlot(0)).toBe(true);
    expect(isSlot(MAX_PLAYERS - 1)).toBe(true);
    expect(isSlot(MAX_PLAYERS)).toBe(false);
    expect(isSlot(2, 3)).toBe(true);
    expect(isSlot(-1)).toBe(false);
    expect(isSlot(0.5)).toBe(false);
    expect(isSlot('0')).toBe(false);
  });

  it('refuses a match with one player, or more players than starts', () => {
    const map = parseLevel('pair', '######\n#P..P#\n######');
    expect(() => new ArenaWorld(map, ['Solo'])).toThrow();
    expect(() => new ArenaWorld(map, ['A', 'B', 'C'])).toThrow();
  });
});

describe('arena rules with three players', () => {
  const trio = (): ArenaWorld => {
    const w = new ArenaWorld(parseLevel('trio', '##############\n#P....P.....P#\n##############'), ['A', 'B', 'C']);
    for (const p of w.players) p.cooldown = 0;
    return w;
  };
  const idle = (w: ArenaWorld): Input[] => w.players.map((p) => ({ ...IDLE_INPUT, aimX: p.x, aimY: p.y + 1 }));

  it('builds one player per name, each on its own start', () => {
    const w = trio();
    expect(w.players.map((p) => p.slot)).toEqual([0, 1, 2]);
    expect(new Set(w.players.map((p) => p.x)).size).toBe(3);
    expect(w.others(w.players[1]).map((p) => p.slot)).toEqual([0, 2]);
  });

  it('a shot hits the nearest player on the line, not the one behind', () => {
    const w = trio();
    const [a, b, c] = w.players;
    b.health = 1;
    c.health = 1;
    const inputs = idle(w);
    inputs[0] = { ...inputs[0], aimX: c.x, aimY: c.y, fire: true };
    w.update(STEP, inputs);
    expect(b.alive).toBe(false);
    expect(c.alive).toBe(true);
    expect(a.frags).toBe(1);
  });

  it('respawns away from the nearest living player', () => {
    const w = trio();
    const [a, b, c] = w.players;
    const starts = [...w.spawns];
    b.health = 1;
    const inputs = idle(w);
    inputs[0] = { ...inputs[0], aimX: b.x, aimY: b.y, fire: true };
    w.update(STEP, inputs);
    expect(b.alive).toBe(false);
    a.x = starts[0].x;
    c.x = starts[0].x + 1;
    for (let t = 0; t < RESPAWN_TIME + 0.2; t += STEP) w.update(STEP, idle(w));
    expect(b.alive).toBe(true);
    expect(b.x).toBe(starts[2].x);
  });

  it('every player scores for themselves, and the first to the limit wins', () => {
    const w = trio();
    const [, b, c] = w.players;
    c.frags = FRAG_LIMIT - 1;
    b.health = 1;
    const inputs = idle(w);
    inputs[2] = { ...inputs[2], aimX: b.x, aimY: b.y, fire: true };
    w.update(STEP, inputs);
    expect(w.status).toBe('over');
    expect(w.winner).toBe(2);
  });

  it('sends every player in the snapshot and copies them to a guest', () => {
    const host = trio();
    const inputs = idle(host);
    inputs[1] = { ...inputs[1], moveX: 1 };
    for (let t = 0; t < 0.3; t += STEP) host.update(STEP, inputs);
    const msg = parseHostMessage(encode({ t: 'snap', snap: host.snapshot(host.drainEvents()) }), host.items.length, 3);
    expect(msg?.t === 'snap' && msg.snap.players).toHaveLength(3);
    const guest = trio();
    if (msg?.t === 'snap') guest.applySnapshot(msg.snap);
    expect(guest.players.map((p) => p.x)).toEqual(host.players.map((p) => p.x));
  });
});
