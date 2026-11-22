import { describe, expect, it } from 'vitest';
import { ALL_LEVELS } from '../src/levels';
import { parseLevel, type DoorKind, type LevelData } from '../src/sim/level';

const KEY_OF: Record<string, DoorKind> = { redkey: 'red', bluekey: 'blue', yellowkey: 'yellow' };
const SOLID_DECOS = ['crate'];

function gateCells(level: LevelData, from: [number, number]): number[] {
  const start = from[1] * level.width + from[0];
  const cells = [start];
  const seen = new Set(cells);
  for (let k = 0; k < cells.length; k++) {
    const i = cells[k];
    for (const n of [i + 1, i - 1, i + level.width, i - level.width]) {
      if (!seen.has(n) && level.tiles[n]?.door === 'gate') {
        seen.add(n);
        cells.push(n);
      }
    }
  }
  return cells;
}

function openedGates(level: LevelData, area: Set<number>): Set<number> {
  const open = new Set<number>();
  for (const link of level.switches) {
    if (!area.has((link.at[1] + 1) * level.width + link.at[0])) continue;
    for (const g of link.gates) for (const c of gateCells(level, g)) open.add(c);
  }
  return open;
}

function reachable(level: LevelData, from: { x: number; y: number }, keys: Set<DoorKind>, gates = new Set<number>()): Set<number> {
  const seen = new Set<number>();
  const start = Math.floor(from.y) * level.width + Math.floor(from.x);
  const stack = [start];
  seen.add(start);
  while (stack.length) {
    const i = stack.pop()!;
    const x = i % level.width;
    const y = Math.floor(i / level.width);
    for (const [nx, ny] of [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ]) {
      const ni = ny * level.width + nx;
      const t = level.tiles[ni];
      if (!t || seen.has(ni) || nx < 0 || nx >= level.width) continue;
      const door = t.type === 'door' ? t.door! : null;
      const passable = t.type === 'floor' || door === 'normal' || door === 'secret' || door === 'seal' || (door === 'gate' ? gates.has(ni) : door !== null && keys.has(door));
      if (passable) {
        seen.add(ni);
        stack.push(ni);
      }
    }
  }
  return seen;
}

function solve(level: LevelData, from: { x: number; y: number }, startKeys: DoorKind[], collect: { kind: string; x: number; y: number }[] = []): Set<number> {
  const keys = new Set<DoorKind>(startKeys);
  let gates = new Set<number>();
  let area = reachable(level, from, keys, gates);
  for (;;) {
    const found = collect.filter((s) => area.has(Math.floor(s.y) * level.width + Math.floor(s.x)) && !keys.has(KEY_OF[s.kind]));
    for (const s of found) keys.add(KEY_OF[s.kind]);
    const nextGates = openedGates(level, area);
    if (found.length === 0 && nextGates.size === gates.size) return area;
    gates = nextGates;
    area = reachable(level, from, keys, gates);
  }
}

describe.each(ALL_LEVELS.map((info) => [info.title, info] as const))('%s', (_title, info) => {
  const level = info.load();
  const player = level.spawns.find((s) => s.kind === 'player')!;
  const cellOf = (s: { x: number; y: number }): number => Math.floor(s.y) * level.width + Math.floor(s.x);
  const keySpawns = level.spawns.filter((s) => s.kind in KEY_OF);
  const lockedColors = new Set(level.tiles.filter((t) => t.type === 'door' && t.door && t.door in { red: 1, blue: 1, yellow: 1 }).map((t) => t.door!));
  const exitIdx = level.tiles.findIndex((t) => t.type === 'exit');

  it('has one player start, monsters, a secret and one exit', () => {
    expect(level.spawns.filter((s) => s.kind === 'player')).toHaveLength(1);
    const monsters = level.spawns.filter((s) => ['husk', 'shotgunner', 'fiend', 'brute', 'shade', 'gunner', 'stalker', 'warden', 'hollow', 'gatekeeper'].includes(s.kind)).length;
    if (info.training) expect(monsters).toBeGreaterThan(0);
    else {
      expect(monsters).toBeGreaterThan(15);
      expect(level.secretCount).toBeGreaterThanOrEqual(1);
    }
    expect(level.tiles.filter((t) => t.type === 'exit')).toHaveLength(1);
  });

  it('never lets a walkable cell touch the void', () => {
    level.tiles.forEach((t, i) => {
      if (t.type === 'void' || t.type === 'wall' || t.type === 'exit') return;
      const x = i % level.width;
      const y = Math.floor(i / level.width);
      for (const [nx, ny] of [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
      ]) {
        const n = level.tiles[ny * level.width + nx];
        expect(n && n.type !== 'void', `cell ${x},${y} leaks`).toBe(true);
      }
    });
  });

  it('puts the exit switch on a north wall that faces a room', () => {
    expect(level.tiles[exitIdx + level.width].type).toBe('floor');
  });

  it('has a key for every locked door, reachable without that door', () => {
    for (const color of lockedColors) {
      const key = keySpawns.find((s) => KEY_OF[s.kind] === color);
      expect(key, `${color} key`).toBeDefined();
      const others = [...lockedColors].filter((c) => c !== color);
      expect(solve(level, player, [...others]).has(cellOf(key!)), `${color} key behind its own door`).toBe(true);
    }
  });

  it('needs the keys to reach the exit, and collecting them in order is enough', () => {
    const exitNeighbours = [exitIdx + level.width, exitIdx - level.width, exitIdx + 1, exitIdx - 1];
    if (lockedColors.size > 0) {
      const none = reachable(level, player, new Set());
      expect(exitNeighbours.some((n) => none.has(n))).toBe(false);
    }
    const area = solve(level, player, [], keySpawns);
    expect(exitNeighbours.some((n) => area.has(n))).toBe(true);
  });

  it('places every non-solid spawn and every switch on reachable ground', () => {
    const all = solve(level, player, ['red', 'blue', 'yellow']);
    for (const link of level.switches) expect(all.has((link.at[1] + 1) * level.width + link.at[0]), `switch at ${link.at}`).toBe(true);
    for (const s of level.spawns) {
      if (SOLID_DECOS.includes(s.kind)) continue;
      expect(all.has(cellOf(s)), `${s.kind} at ${s.x},${s.y}`).toBe(true);
    }
  });
});

describe('parseLevel', () => {
  it('only accepts an exit switch on a top wall', () => {
    expect(() => parseLevel('ok', '##E##\n#.P.#\n#.h.#\n#####')).not.toThrow();
    expect(() => parseLevel('side', '#####\n#.P.E\n#.h.#\n#####')).toThrow(/top wall/);
    expect(() => parseLevel('bottom', '#####\n#.h.#\n#.P.#\n##E##')).toThrow(/top wall/);
  });

  it('requires a monster guarding the exit switch in the same room', () => {
    expect(() => parseLevel('none', '##E##\n#.P.#\n#####')).toThrow(/guard/);
    expect(() => parseLevel('far', '##E##\n#.P.#\n#...#\n#...#\n#...#\n#...#\n#...#\n#.b.#\n#####')).toThrow(/guard/);
    expect(() => parseLevel('behind a door', '##E##\n#.P.#\n##D##\n#.f.#\n#####')).toThrow(/guard/);
    expect(() => parseLevel('guarded', '##E##\n#.P.#\n#...#\n#.g.#\n#####')).not.toThrow();
  });

  it('rejects unknown characters', () => {
    expect(() => parseLevel('bad', '###\n#!#\n###')).toThrow(/Unknown map char/);
  });

  it('copies floor and secret flag from the left neighbour to entity cells', () => {
    const lvl = parseLevel('t', '#####\n#?c.#\n#,h.#\n#####');
    expect(lvl.tiles[1 * 5 + 2].secretId).toBe(0);
    expect(lvl.tiles[2 * 5 + 2].floor).toBe('concrete');
  });

  it('reads colored doors, keycards and shades', () => {
    const lvl = parseLevel('t', '#######\n#PjyBg#\n###Y###');
    expect(lvl.spawns.map((s) => s.kind)).toEqual(['player', 'bluekey', 'yellowkey', 'shade']);
    expect(lvl.tiles[1 * 7 + 4].door).toBe('blue');
    expect(lvl.tiles[2 * 7 + 3].door).toBe('yellow');
  });
});
