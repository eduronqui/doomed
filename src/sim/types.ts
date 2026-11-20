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
