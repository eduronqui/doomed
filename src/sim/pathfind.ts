import type { Vec } from './types';

const SQRT2 = Math.SQRT2;
const NEIGHBOURS: [number, number, number][] = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, SQRT2],
  [1, -1, SQRT2],
  [-1, 1, SQRT2],
  [-1, -1, SQRT2],
];

class MinHeap {
  private items: { key: number; f: number }[] = [];

  get size(): number {
    return this.items.length;
  }

  push(key: number, f: number): void {
    const a = this.items;
    a.push({ key, f });
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p].f <= a[i].f) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }

  pop(): number {
    const a = this.items;
    const top = a[0];
    const last = a.pop()!;
    if (a.length > 0) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && a[l].f < a[m].f) m = l;
        if (r < a.length && a[r].f < a[m].f) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top.key;
  }
}

export function findPath(
  width: number,
  height: number,
  passable: (x: number, y: number) => boolean,
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  maxNodes = 3000,
  canStep: (ax: number, ay: number, bx: number, by: number) => boolean = () => true,
): Vec[] | null {
  if (sx === tx && sy === ty) return [];
  const size = width * height;
  const g = new Float32Array(size).fill(Infinity);
  const from = new Int32Array(size).fill(-1);
  const closed = new Uint8Array(size);
  const start = sy * width + sx;
  const goal = ty * width + tx;
  const h = (x: number, y: number): number => {
    const dx = Math.abs(x - tx);
    const dy = Math.abs(y - ty);
    return Math.max(dx, dy) + (SQRT2 - 1) * Math.min(dx, dy);
  };
  const open = new MinHeap();
  g[start] = 0;
  open.push(start, h(sx, sy));
  let expanded = 0;

  while (open.size > 0) {
    const cur = open.pop();
    if (closed[cur]) continue;
    if (cur === goal) break;
    closed[cur] = 1;
    if (++expanded > maxNodes) return null;
    const cx = cur % width;
    const cy = Math.floor(cur / width);
    for (const [dx, dy, cost] of NEIGHBOURS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const ni = ny * width + nx;
      if (closed[ni]) continue;
      if (ni !== goal && !passable(nx, ny)) continue;
      if (!canStep(cx, cy, nx, ny)) continue;
      if (dx !== 0 && dy !== 0 && (!passable(cx + dx, cy) || !passable(cx, cy + dy) || !canStep(cx, cy, cx + dx, cy) || !canStep(cx, cy, cx, cy + dy) || !canStep(cx + dx, cy, cx, cy + dy))) continue;
      const ng = g[cur] + cost;
      if (ng < g[ni]) {
        g[ni] = ng;
        from[ni] = cur;
        open.push(ni, ng + h(nx, ny));
      }
    }
  }

  if (from[goal] < 0) return null;
  const path: Vec[] = [];
  for (let c = goal; c !== start; c = from[c]) {
    path.push({ x: (c % width) + 0.5, y: Math.floor(c / width) + 0.5 });
  }
  return path.reverse();
}
