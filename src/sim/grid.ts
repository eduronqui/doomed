import { FLOOR_HAZARD, type DoorKind, type LevelData, type Tile } from './level';

export type DoorPhase = 'closed' | 'opening' | 'open' | 'closing';

export interface Door {
  index: number;
  x: number;
  y: number;
  kind: DoorKind;
  openness: number;
  phase: DoorPhase;
  timer: number;
  group: Door[];
}

export interface MoveResult {
  x: number;
  y: number;
  bumped: number[];
}

export interface RayHit {
  dist: number;
  hit: boolean;
  cellX: number;
  cellY: number;
}

const DOOR_SPEED = 2.5;
const DOOR_STAY_OPEN = 4;
const PASSABLE_OPENNESS = 0.85;
const EPS = 1e-4;

export class Grid {
  readonly width: number;
  readonly height: number;
  readonly tiles: Tile[];
  readonly doors = new Map<number, Door>();
  readonly doorGroups: Door[][] = [];
  readonly blockers = new Set<number>();
  readonly shotBlockers = new Set<number>();
  readonly rooms: Int32Array;

  constructor(level: LevelData) {
    this.width = level.width;
    this.height = level.height;
    this.tiles = level.tiles;
    level.tiles.forEach((t, i) => {
      if (t.type === 'door' && t.door) {
        this.doors.set(i, {
          index: i,
          x: i % this.width,
          y: Math.floor(i / this.width),
          kind: t.door,
          openness: 0,
          phase: 'closed',
          timer: 0,
          group: [],
        });
      }
    });
    for (const door of this.doors.values()) {
      if (door.group.length > 0) continue;
      const group: Door[] = [];
      const stack = [door];
      door.group = group;
      while (stack.length) {
        const d = stack.pop()!;
        group.push(d);
        for (const [nx, ny] of [
          [d.x + 1, d.y],
          [d.x - 1, d.y],
          [d.x, d.y + 1],
          [d.x, d.y - 1],
        ]) {
          const n = this.doorAt(nx, ny);
          if (n && n.kind === door.kind && n.group.length === 0 && n.group !== group) {
            n.group = group;
            stack.push(n);
          }
        }
      }
      this.doorGroups.push(group);
    }
    this.rooms = this.computeRooms();
  }

  private computeRooms(): Int32Array {
    const rooms = new Int32Array(this.tiles.length).fill(-1);
    let next = 0;
    for (let i = 0; i < this.tiles.length; i++) {
      if (rooms[i] >= 0 || this.tiles[i].type !== 'floor') continue;
      const stack = [i];
      rooms[i] = next;
      while (stack.length) {
        const cur = stack.pop()!;
        const cx = cur % this.width;
        const cy = Math.floor(cur / this.width);
        for (const [nx, ny] of [
          [cx + 1, cy],
          [cx - 1, cy],
          [cx, cy + 1],
          [cx, cy - 1],
        ]) {
          if (!this.inBounds(nx, ny)) continue;
          const ni = this.index(nx, ny);
          if (rooms[ni] < 0 && this.tiles[ni].type === 'floor') {
            rooms[ni] = next;
            stack.push(ni);
          }
        }
      }
      next++;
    }
    return rooms;
  }

  roomsAt(x: number, y: number): number[] {
    const cx = Math.floor(x);
    const cy = Math.floor(y);
    if (!this.inBounds(cx, cy)) return [];
    const own = this.rooms[this.index(cx, cy)];
    if (own >= 0) return [own];
    const out: number[] = [];
    for (const [nx, ny] of [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1],
    ]) {
      if (this.inBounds(nx, ny)) {
        const r = this.rooms[this.index(nx, ny)];
        if (r >= 0 && !out.includes(r)) out.push(r);
      }
    }
    return out;
  }

  index(x: number, y: number): number {
    return y * this.width + x;
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  tile(x: number, y: number): Tile | undefined {
    return this.inBounds(x, y) ? this.tiles[this.index(x, y)] : undefined;
  }

  doorAt(x: number, y: number): Door | undefined {
    return this.inBounds(x, y) ? this.doors.get(this.index(x, y)) : undefined;
  }

  hazardAt(x: number, y: number): number {
    const t = this.tile(Math.floor(x), Math.floor(y));
    return t && t.type === 'floor' ? FLOOR_HAZARD[t.floor] : 0;
  }

  isSolid(x: number, y: number): boolean {
    const t = this.tile(x, y);
    if (!t) return true;
    if (t.type === 'floor') return this.blockers.has(this.index(x, y));
    if (t.type === 'door') return this.doors.get(this.index(x, y))!.openness < PASSABLE_OPENNESS;
    return true;
  }

  isOpaque(x: number, y: number): boolean {
    const t = this.tile(x, y);
    if (!t) return true;
    if (t.type === 'floor') return false;
    if (t.type === 'door') return this.doors.get(this.index(x, y))!.openness < 0.5;
    return true;
  }

  isShotBlocker(x: number, y: number): boolean {
    return this.isOpaque(x, y) || this.shotBlockers.has(this.index(x, y));
  }

  lineOfFire(ax: number, ay: number, bx: number, by: number): boolean {
    const d = Math.hypot(bx - ax, by - ay);
    if (d < EPS) return true;
    return !this.raycast(ax, ay, (bx - ax) / d, (by - ay) / d, d).hit;
  }

  openDoor(door: Door): boolean {
    const lead = door.group[0];
    const wasOpening = lead.phase === 'open' || lead.phase === 'opening';
    for (const d of door.group) {
      d.timer = DOOR_STAY_OPEN;
      if (!wasOpening) d.phase = 'opening';
    }
    return !wasOpening;
  }

  updateDoors(dt: number, occupied: (x: number, y: number) => boolean): Door[] {
    const closing: Door[] = [];
    for (const group of this.doorGroups) {
      const lead = group[0];
      const busy = (): boolean => group.some((d) => occupied(d.x, d.y));
      let phase = lead.phase;
      let openness = lead.openness;
      let timer = lead.timer;
      if (phase === 'opening') {
        openness = Math.min(1, openness + DOOR_SPEED * dt);
        if (openness >= 1) phase = 'open';
      } else if (phase === 'open' && lead.kind !== 'secret') {
        timer -= dt;
        if (timer <= 0) {
          if (busy()) timer = 0.5;
          else {
            phase = 'closing';
            closing.push(group[Math.floor(group.length / 2)]);
          }
        }
      } else if (phase === 'closing') {
        if (busy()) phase = 'opening';
        else {
          openness = Math.max(0, openness - DOOR_SPEED * dt);
          if (openness <= 0) phase = 'closed';
        }
      }
      for (const d of group) {
        d.phase = phase;
        d.openness = openness;
        d.timer = timer;
      }
    }
    return closing;
  }

  move(x: number, y: number, r: number, dx: number, dy: number, solid: (cx: number, cy: number) => boolean = (cx, cy) => this.isSolid(cx, cy)): MoveResult {
    const bumped: number[] = [];
    let nx = x + dx;
    if (dx !== 0) {
      const edge = dx > 0 ? nx + r : nx - r;
      const cx = Math.floor(edge);
      for (let cy = Math.floor(y - r); cy <= Math.floor(y + r - EPS); cy++) {
        if (solid(cx, cy)) {
          bumped.push(this.index(cx, cy));
          nx = dx > 0 ? cx - r - EPS : cx + 1 + r + EPS;
          break;
        }
      }
    }
    let ny = y + dy;
    if (dy !== 0) {
      const edge = dy > 0 ? ny + r : ny - r;
      const cy = Math.floor(edge);
      for (let cx = Math.floor(nx - r); cx <= Math.floor(nx + r - EPS); cx++) {
        if (solid(cx, cy)) {
          bumped.push(this.index(cx, cy));
          ny = dy > 0 ? cy - r - EPS : cy + 1 + r + EPS;
          break;
        }
      }
    }
    return { x: nx, y: ny, bumped };
  }

  raycast(ox: number, oy: number, dx: number, dy: number, maxDist: number, blocks: (cx: number, cy: number) => boolean = (cx, cy) => this.isShotBlocker(cx, cy)): RayHit {
    let cx = Math.floor(ox);
    let cy = Math.floor(oy);
    const stepX = dx > 0 ? 1 : -1;
    const stepY = dy > 0 ? 1 : -1;
    const tDeltaX = dx !== 0 ? Math.abs(1 / dx) : Infinity;
    const tDeltaY = dy !== 0 ? Math.abs(1 / dy) : Infinity;
    let tMaxX = dx !== 0 ? (dx > 0 ? cx + 1 - ox : ox - cx) * tDeltaX : Infinity;
    let tMaxY = dy !== 0 ? (dy > 0 ? cy + 1 - oy : oy - cy) * tDeltaY : Infinity;
    let t = 0;
    while (t <= maxDist) {
      if (tMaxX < tMaxY) {
        t = tMaxX;
        tMaxX += tDeltaX;
        cx += stepX;
      } else {
        t = tMaxY;
        tMaxY += tDeltaY;
        cy += stepY;
      }
      if (t > maxDist) break;
      if (blocks(cx, cy)) return { dist: t, hit: true, cellX: cx, cellY: cy };
    }
    return { dist: maxDist, hit: false, cellX: cx, cellY: cy };
  }

  lineOfSight(ax: number, ay: number, bx: number, by: number): boolean {
    const d = Math.hypot(bx - ax, by - ay);
    if (d < EPS) return true;
    const hit = this.raycast(ax, ay, (bx - ax) / d, (by - ay) / d, d, (cx, cy) => this.isOpaque(cx, cy));
    return !hit.hit;
  }
}
