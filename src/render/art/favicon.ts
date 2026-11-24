import { GLYPHS } from '../../ui/logo';

export interface Icon {
  size: number;
  rgba: Uint8Array;
}

export type Rgb = [number, number, number];
type Stops = [number, Rgb][];

interface Palette {
  face: Stops;
  depth: (t: number) => Rgb;
}

export const FIRE: Stops = [
  [0, [0xff, 0xf3, 0xb0]],
  [0.18, [0xff, 0xc8, 0x40]],
  [0.5, [0xf0, 0x70, 0x1c]],
  [0.8, [0xb8, 0x24, 0x0e]],
  [1, [0x6a, 0x0e, 0x06]],
];

const SLIME: Stops = [
  [0, [0xe8, 0xff, 0xc0]],
  [0.18, [0x9c, 0xf0, 0x50]],
  [0.5, [0x40, 0xc0, 0x2a]],
  [0.8, [0x1c, 0x7a, 0x18]],
  [1, [0x0a, 0x40, 0x0c]],
];

export const PALETTES = {
  fire: { face: FIRE, depth: (t: number): Rgb => [Math.round(110 - 70 * t), Math.round(24 - 16 * t), Math.round(8 - 4 * t)] },
  slime: { face: SLIME, depth: (t: number): Rgb => [Math.round(20 - 12 * t), Math.round(90 - 60 * t), Math.round(18 - 12 * t)] },
} satisfies Record<string, Palette>;

export function gradient(stops: Stops, t: number): Rgb {
  for (let i = 1; i < stops.length; i++) {
    const [t1, c1] = stops[i];
    if (t <= t1) {
      const [t0, c0] = stops[i - 1];
      const k = (t - t0) / (t1 - t0);
      return [0, 1, 2].map((j) => Math.round(c0[j] + (c1[j] - c0[j]) * k)) as Rgb;
    }
  }
  return stops[stops.length - 1][1];
}

export function drawIcon(size: number, background: Rgb | null, palette: Palette = PALETTES.fire): Icon {
  const rgba = new Uint8Array(size * size * 4);
  const paint = (x: number, y: number, w: number, h: number, c: Rgb, a = 1): void => {
    for (let j = Math.max(0, y); j < Math.min(size, y + h); j++) {
      for (let i = Math.max(0, x); i < Math.min(size, x + w); i++) {
        const o = (j * size + i) * 4;
        const under = rgba[o + 3] / 255;
        const out = a + under * (1 - a);
        for (let k = 0; k < 3; k++) rgba[o + k] = Math.round((c[k] * a + rgba[o + k] * under * (1 - a)) / out);
        rgba[o + 3] = Math.round(out * 255);
      }
    }
  };

  if (background) paint(0, 0, size, size, background);
  const glyph = GLYPHS.D;
  const rows = glyph.length;
  const cols = glyph[0].length;
  const pad = background ? Math.round(size * 0.14) : 1;
  const depth = Math.max(1, Math.round(size * 0.07));
  const edge = Math.max(1, Math.round(size / 32));
  const box = size - pad * 2 - depth - edge * 2;
  const ox = pad + edge;
  const oy = pad + edge;
  const filled = (x: number, y: number): boolean => glyph[y]?.[x] === '#';
  const cells: [number, number, number, number, number, number][] = [];
  glyph.forEach((row, gy) =>
    [...row].forEach((ch, gx) => {
      if (ch !== '#') return;
      const x0 = ox + Math.round((gx * box) / cols);
      const y0 = oy + Math.round((gy * box) / rows);
      cells.push([x0, y0, ox + Math.round(((gx + 1) * box) / cols) - x0, oy + Math.round(((gy + 1) * box) / rows) - y0, gx, gy]);
    }),
  );

  for (const [x, y, w, h] of cells) paint(x - edge, y - edge, w + edge * 2 + depth, h + edge * 2 + depth, [0, 0, 0]);
  for (let k = depth; k >= 1; k--) {
    const t = k / depth;
    const c = palette.depth(t);
    for (const [x, y, w, h] of cells) paint(x + k, y + k, w, h, c);
  }
  for (const [x, y, w, h] of cells) for (let j = 0; j < h; j++) paint(x, y + j, w, 1, gradient(palette.face, (y + j - oy) / box));
  const line = Math.max(1, Math.round(size / 48));
  for (const [x, y, w, h, gx, gy] of cells) {
    if (!filled(gx, gy - 1)) paint(x, y, w, line, [255, 255, 220], 0.75);
    if (!filled(gx - 1, gy)) paint(x, y, line, h, [255, 240, 180], 0.45);
    if (!filled(gx, gy + 1)) paint(x, y + h - line, w, line, [40, 0, 0], 0.7);
    if (!filled(gx + 1, gy)) paint(x + w - line, y, line, h, [40, 0, 0], 0.55);
  }
  return { size, rgba };
}

export const ICONS: { file: string; size: number; background: Rgb | null; palette: Palette }[] = [
  { file: 'favicon.png', size: 32, background: null, palette: PALETTES.fire },
  { file: 'favicon-dev.png', size: 32, background: null, palette: PALETTES.slime },
  { file: 'apple-touch-icon.png', size: 180, background: [0x1a, 0x13, 0x10], palette: PALETTES.fire },
  { file: 'icon-192.png', size: 192, background: [0x1a, 0x13, 0x10], palette: PALETTES.fire },
  { file: 'icon-512.png', size: 512, background: [0x1a, 0x13, 0x10], palette: PALETTES.fire },
  { file: 'apple-touch-icon-dev.png', size: 180, background: [0x10, 0x1a, 0x12], palette: PALETTES.slime },
  { file: 'icon-192-dev.png', size: 192, background: [0x10, 0x1a, 0x12], palette: PALETTES.slime },
  { file: 'icon-512-dev.png', size: 512, background: [0x10, 0x1a, 0x12], palette: PALETTES.slime },
];
