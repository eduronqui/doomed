export interface Vec {
  x: number;
  y: number;
}

export type Dir = 'n' | 'e' | 's' | 'w';

export function dirFromAngle(angle: number): Dir {
  const a = Math.atan2(Math.sin(angle), Math.cos(angle));
  if (a >= -Math.PI / 4 && a < Math.PI / 4) return 'e';
  if (a >= Math.PI / 4 && a < (3 * Math.PI) / 4) return 's';
  if (a >= (-3 * Math.PI) / 4 && a < -Math.PI / 4) return 'n';
  return 'w';
}

export function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(bx - ax, by - ay);
}

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

export function angleDiff(a: number, b: number): number {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}

export function rayCircle(ox: number, oy: number, dx: number, dy: number, cx: number, cy: number, r: number): number {
  const fx = ox - cx;
  const fy = oy - cy;
  const b = fx * dx + fy * dy;
  const c = fx * fx + fy * fy - r * r;
  if (c <= 0) return 0;
  const disc = b * b - c;
  if (disc < 0 || b > 0) return -1;
  return -b - Math.sqrt(disc);
}
