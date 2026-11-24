import { GLYPHS } from '../../ui/logo';
import { FIRE, gradient, type Rgb } from './favicon';

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;

const BLOCK = 16;
const DEPTH = 14;
const EDGE = 3;
const GAP_COLUMNS = 2;
const BACKGROUND: Rgb = [0x1a, 0x13, 0x10];

export function drawCard(text = 'DOOMED'): { width: number; height: number; rgba: Uint8Array } {
  const rgba = new Uint8Array(CARD_WIDTH * CARD_HEIGHT * 4);
  const paint = (x: number, y: number, w: number, h: number, c: Rgb, a = 1): void => {
    for (let j = Math.max(0, y); j < Math.min(CARD_HEIGHT, y + h); j++) {
      for (let i = Math.max(0, x); i < Math.min(CARD_WIDTH, x + w); i++) {
        const o = (j * CARD_WIDTH + i) * 4;
        for (let k = 0; k < 3; k++) rgba[o + k] = Math.round(c[k] * a + rgba[o + k] * (1 - a));
        rgba[o + 3] = 255;
      }
    }
  };

  paint(0, 0, CARD_WIDTH, CARD_HEIGHT, BACKGROUND);
  for (let y = 0; y < CARD_HEIGHT; y += 4) paint(0, y, CARD_WIDTH, 1, [0, 0, 0], 0.18);

  const glyphs = [...text].map((c) => GLYPHS[c]);
  const columns = glyphs.reduce((sum, g) => sum + g[0].length, 0) + GAP_COLUMNS * (glyphs.length - 1);
  const rows = glyphs[0].length;
  const logoWidth = columns * BLOCK;
  const logoHeight = rows * BLOCK;
  const ox = Math.round((CARD_WIDTH - logoWidth - DEPTH) / 2);
  const oy = Math.round((CARD_HEIGHT - logoHeight - DEPTH) / 2);

  const cells: { x: number; y: number; top: boolean; left: boolean; bottom: boolean; right: boolean }[] = [];
  let column = 0;
  for (const glyph of glyphs) {
    const filled = (gx: number, gy: number): boolean => glyph[gy]?.[gx] === '#';
    glyph.forEach((row, gy) =>
      [...row].forEach((ch, gx) => {
        if (ch !== '#') return;
        cells.push({
          x: ox + (column + gx) * BLOCK,
          y: oy + gy * BLOCK,
          top: !filled(gx, gy - 1),
          left: !filled(gx - 1, gy),
          bottom: !filled(gx, gy + 1),
          right: !filled(gx + 1, gy),
        });
      }),
    );
    column += glyph[0].length + GAP_COLUMNS;
  }

  for (const { x, y } of cells) paint(x - EDGE, y - EDGE, BLOCK + EDGE * 2 + DEPTH, BLOCK + EDGE * 2 + DEPTH, [0, 0, 0]);
  for (let k = DEPTH; k >= 1; k--) {
    const t = k / DEPTH;
    const c: Rgb = [Math.round(110 - 70 * t), Math.round(24 - 16 * t), Math.round(8 - 4 * t)];
    for (const { x, y } of cells) paint(x + k, y + k, BLOCK, BLOCK, c);
  }
  for (const { x, y } of cells) for (let j = 0; j < BLOCK; j++) paint(x, y + j, BLOCK, 1, gradient(FIRE, (y + j - oy) / logoHeight));
  const line = 3;
  for (const { x, y, top, left, bottom, right } of cells) {
    if (top) paint(x, y, BLOCK, line, [255, 255, 220], 0.75);
    if (left) paint(x, y, line, BLOCK, [255, 240, 180], 0.45);
    if (bottom) paint(x, y + BLOCK - line, BLOCK, line, [40, 0, 0], 0.7);
    if (right) paint(x + BLOCK - line, y, line, BLOCK, [40, 0, 0], 0.55);
  }
  return { width: CARD_WIDTH, height: CARD_HEIGHT, rgba };
}
