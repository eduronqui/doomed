import { Rng } from '../sim/rng';

export const CLEAR = -1;

export function shade(color: number, f: number): number {
  const ch = (shift: number): number => {
    const v = (color >> shift) & 0xff;
    const out = f >= 0 ? v + (255 - v) * f : v * (1 + f);
    return Math.max(0, Math.min(255, Math.round(out)));
  };
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

export function mix(a: number, b: number, t: number): number {
  const ch = (shift: number): number => Math.round(((a >> shift) & 0xff) * (1 - t) + ((b >> shift) & 0xff) * t);
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

export class Pix {
  readonly w: number;
  readonly h: number;
  readonly data: Int32Array;
  readonly alpha: Uint8Array;

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.data = new Int32Array(w * h).fill(CLEAR);
    this.alpha = new Uint8Array(w * h).fill(255);
  }

  get(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return CLEAR;
    return this.data[y * this.w + x];
  }

  set(x: number, y: number, c: number, a = 255): this {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return this;
    this.data[y * this.w + x] = c;
    this.alpha[y * this.w + x] = a;
    return this;
  }

  rect(x: number, y: number, w: number, h: number, c: number, a = 255): this {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c, a);
    return this;
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, c: number | ((x: number, y: number, nx: number, ny: number) => number), a = 255): this {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const nx = (x + 0.5 - cx) / rx;
        const ny = (y + 0.5 - cy) / ry;
        if (nx * nx + ny * ny <= 1) this.set(x, y, typeof c === 'number' ? c : c(x, y, nx, ny), a);
      }
    }
    return this;
  }

  line(x0: number, y0: number, x1: number, y1: number, c: number, a = 255): this {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= steps; i++) this.set(x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps, c, a);
    return this;
  }

  speckle(x: number, y: number, w: number, h: number, colors: number[], density: number, rng: Rng): this {
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        if (rng.chance(density)) this.set(x + i, y + j, colors[Math.floor(rng.next() * colors.length)]);
      }
    }
    return this;
  }

  map(fn: (x: number, y: number, c: number) => number): this {
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const c = this.get(x, y);
        if (c !== CLEAR) this.data[y * this.w + x] = fn(x, y, c);
      }
    }
    return this;
  }

  outline(c = 0x120c0a): this {
    const add: number[] = [];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.get(x, y) !== CLEAR) continue;
        if (this.get(x + 1, y) !== CLEAR || this.get(x - 1, y) !== CLEAR || this.get(x, y + 1) !== CLEAR || this.get(x, y - 1) !== CLEAR) {
          add.push(y * this.w + x);
        }
      }
    }
    for (const i of add) {
      this.data[i] = c;
      this.alpha[i] = 255;
    }
    return this;
  }

  mirror(): Pix {
    const out = new Pix(this.w, this.h);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        out.data[y * this.w + (this.w - 1 - x)] = this.data[y * this.w + x];
        out.alpha[y * this.w + (this.w - 1 - x)] = this.alpha[y * this.w + x];
      }
    }
    return out;
  }

  blit(src: Pix, ox: number, oy: number): this {
    for (let y = 0; y < src.h; y++) {
      for (let x = 0; x < src.w; x++) {
        const c = src.get(x, y);
        if (c !== CLEAR) this.set(ox + x, oy + y, c, src.alpha[y * src.w + x]);
      }
    }
    return this;
  }

  blitRegion(src: Pix, sx: number, sy: number, w: number, h: number, dx: number, dy: number): this {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const c = src.get(sx + x, sy + y);
        if (c !== CLEAR) this.set(dx + x, dy + y, c, src.alpha[(sy + y) * src.w + sx + x]);
      }
    }
    return this;
  }

}

export function shadedRect(p: Pix, x: number, y: number, w: number, h: number, c: number): void {
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const f = i === 0 ? 0.14 : i === w - 1 ? -0.3 : j === 0 ? 0.08 : 0;
      p.set(x + i, y + j, shade(c, f));
    }
  }
}

export function seeded(key: string): Rng {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return new Rng(h >>> 0);
}
