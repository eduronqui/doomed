import { describe, expect, it } from 'vitest';
import { ARENA } from '../src/levels/arena';
import { ArenaWorld, FRAG_LIMIT, RESPAWN_TIME } from '../src/sim/arena';
import { parseLevel } from '../src/sim/level';
import { IDLE_INPUT, type Input } from '../src/sim/world';
import { encode, parseHostMessage } from '../src/net/protocol';

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
    expect(w.players.map((p) => [p.name, p.team])).toEqual([
      ['Ana', 'green'],
      ['Bo', 'blue'],
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
    const msg = parseHostMessage(raw, host.items.length);
    expect(msg?.t).toBe('snap');
    const guest = duel();
    if (msg?.t === 'snap') guest.applySnapshot(msg.snap);
    expect(guest.players.map((p) => [p.x, p.y, p.health, p.ammo.bullets])).toEqual(host.players.map((p) => [p.x, p.y, p.health, p.ammo.bullets]));
  });
});
