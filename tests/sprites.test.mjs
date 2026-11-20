import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { decodePng } from '../scripts/png.mjs';
import { buildSheet } from '../src/render/art/catalog.ts';

describe('sprite sheet', () => {
  const sheet = buildSheet();
  const atlas = JSON.parse(readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8'));
  const png = decodePng(readFileSync(new URL('../public/assets/sprites.png', import.meta.url)));

  it('matches the art code (run `npm run sprites` after art changes)', () => {
    expect(atlas).toEqual(sheet.atlas);
    expect([png.width, png.height]).toEqual([sheet.width, sheet.height]);
    expect(Buffer.from(png.rgba).equals(Buffer.from(sheet.rgba))).toBe(true);
  });

  it('keeps every frame inside the image without overlaps', () => {
    const rects = Object.values(atlas.frames).map((f) => f.frame);
    for (const r of rects) {
      expect(r.x >= 0 && r.y >= 0 && r.x + r.w <= png.width && r.y + r.h <= png.height).toBe(true);
    }
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i];
        const b = rects[j];
        expect(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y).toBe(true);
      }
    }
  });
});
