import type { MonsterKind } from '../characters';
import type { DecoKind, ItemKind } from './defs';

export type FloorKind = 'metal' | 'concrete' | 'grate' | 'rock' | 'slime' | 'lava';
export type WallKind = 'tech' | 'stone';
export type DoorKind = 'normal' | 'red' | 'blue' | 'yellow' | 'secret' | 'trap';
export type TileType = 'void' | 'floor' | 'wall' | 'door' | 'exit';

export interface Tile {
  type: TileType;
  floor: FloorKind;
  wall: WallKind;
  door: DoorKind | null;
  secretId: number;
}

export type SpawnKind = 'player' | 'barrel' | MonsterKind | ItemKind | DecoKind;

export interface Spawn {
  kind: SpawnKind;
  x: number;
  y: number;
}

export interface LevelData {
  name: string;
  width: number;
  height: number;
  tiles: Tile[];
  spawns: Spawn[];
  secretCount: number;
}

const FLOORS: Record<string, FloorKind> = {
  '.': 'metal',
  ',': 'concrete',
  ':': 'grate',
  r: 'rock',
  '~': 'slime',
  '=': 'lava',
  '?': 'metal',
};

const SPAWNS: Record<string, SpawnKind> = {
  P: 'player',
  h: 'husk',
  H: 'shotgunner',
  f: 'fiend',
  b: 'brute',
  '+': 'stimpack',
  m: 'medkit',
  a: 'armor',
  v: 'sphere',
  c: 'clip',
  s: 'shells',
  G: 'shotgun',
  W: 'rotary',
  k: 'redkey',
  j: 'bluekey',
  y: 'yellowkey',
  g: 'shade',
  o: 'barrel',
  l: 'lamp',
  C: 'crate',
  t: 'brazier',
  x: 'gore',
  z: 'body',
};

const DOOR_CHARS: Record<string, DoorKind> = { D: 'normal', R: 'red', B: 'blue', Y: 'yellow', X: 'secret', T: 'trap' };

export function monsterOfChar(c: string): MonsterKind | null {
  const kind = SPAWNS[c];
  return kind && MONSTER_KINDS.has(kind) ? (kind as MonsterKind) : null;
}

export function looksLikeWall(kind: DoorKind | null): boolean {
  return kind === 'secret' || kind === 'trap';
}

export const FLOOR_HAZARD: Record<FloorKind, number> = {
  metal: 0,
  concrete: 0,
  grate: 0,
  rock: 0,
  slime: 5,
  lava: 10,
};

function floorTile(floor: FloorKind, secretId = -1): Tile {
  return { type: 'floor', floor, wall: 'tech', door: null, secretId };
}

function wallOfNeighbours(rows: string[], x: number, y: number): WallKind {
  for (const [dx, dy] of [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ]) {
    const c = rows[y + dy]?.[x + dx];
    if (c === '%') return 'stone';
    if (c === '#') return 'tech';
  }
  return 'tech';
}

export function parseLevel(name: string, map: string): LevelData {
  const rows = map.split('\n').filter((r, i, all) => !(r.trim() === '' && (i === 0 || i === all.length - 1)));
  const height = rows.length;
  const width = Math.max(...rows.map((r) => r.length));
  const tiles: Tile[] = [];
  const spawns: Spawn[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const c = rows[y][x] ?? ' ';
      let tile: Tile;
      if (c === ' ') tile = { type: 'void', floor: 'metal', wall: 'tech', door: null, secretId: -1 };
      else if (c === '#' || c === '%') tile = { type: 'wall', floor: 'metal', wall: c === '%' ? 'stone' : 'tech', door: null, secretId: -1 };
      else if (c in DOOR_CHARS) {
        const under = tiles[y * width + x - 1];
        tile = {
          type: 'door',
          floor: under && under.type === 'floor' ? under.floor : 'metal',
          wall: wallOfNeighbours(rows, x, y),
          door: DOOR_CHARS[c],
          secretId: -1,
        };
      } else if (c === 'E') tile = { type: 'exit', floor: 'metal', wall: wallOfNeighbours(rows, x, y), door: null, secretId: -1 };
      else if (FLOORS[c]) tile = floorTile(FLOORS[c], c === '?' ? 0 : -1);
      else if (SPAWNS[c]) {
        const left = x > 0 ? tiles[y * width + x - 1] : undefined;
        tile = left && left.type === 'floor' ? floorTile(left.floor, left.secretId) : floorTile('metal');
        spawns.push({ kind: SPAWNS[c], x: x + 0.5, y: y + 0.5 });
      } else throw new Error(`Unknown map char '${c}' at ${x},${y}`);
      tiles.push(tile);
    }
  }

  tiles.forEach((t, i) => {
    if (t.type !== 'exit') return;
    const ex = i % width;
    const ey = Math.floor(i / width);
    const below = tiles[i + width];
    if (!below || below.type !== 'floor') throw new Error(`Exit switch at ${ex},${ey} must sit on a top wall, with floor below it`);
    if (!hasGuard(tiles, spawns, width, height, ex, ey + 1)) {
      throw new Error(`Exit switch at ${ex},${ey} needs a monster within ${EXIT_GUARD_RADIUS} tiles in the same room to guard it`);
    }
  });

  const secretCount = labelSecrets(tiles, width, height);
  return { name, width, height, tiles, spawns, secretCount };
}

export const EXIT_GUARD_RADIUS = 5;
const MONSTER_KINDS: ReadonlySet<SpawnKind> = new Set<SpawnKind>(['husk', 'shotgunner', 'fiend', 'brute', 'shade']);

function hasGuard(tiles: Tile[], spawns: Spawn[], width: number, height: number, fx: number, fy: number): boolean {
  const room = new Set<number>([fy * width + fx]);
  const stack = [fy * width + fx];
  while (stack.length) {
    const cur = stack.pop()!;
    const cx = cur % width;
    const cy = Math.floor(cur / width);
    for (const [nx, ny] of [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1],
    ]) {
      const ni = ny * width + nx;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height || room.has(ni) || tiles[ni].type !== 'floor') continue;
      room.add(ni);
      stack.push(ni);
    }
  }
  return spawns.some(
    (s) =>
      MONSTER_KINDS.has(s.kind) &&
      room.has(Math.floor(s.y) * width + Math.floor(s.x)) &&
      Math.hypot(s.x - (fx + 0.5), s.y - (fy + 0.5)) <= EXIT_GUARD_RADIUS,
  );
}

function labelSecrets(tiles: Tile[], width: number, height: number): number {
  const seen = new Uint8Array(tiles.length);
  let next = 0;
  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i].secretId < 0 || seen[i]) continue;
    const stack = [i];
    seen[i] = 1;
    while (stack.length) {
      const cur = stack.pop()!;
      tiles[cur].secretId = next;
      const cx = cur % width;
      const cy = Math.floor(cur / width);
      for (const [nx, ny] of [
        [cx + 1, cy],
        [cx - 1, cy],
        [cx, cy + 1],
        [cx, cy - 1],
      ]) {
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const ni = ny * width + nx;
        if (!seen[ni] && tiles[ni].secretId >= 0) {
          seen[ni] = 1;
          stack.push(ni);
        }
      }
    }
    next++;
  }
  return next;
}
