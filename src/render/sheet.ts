import { CLEAR, type Pix } from './pixel';

export interface AtlasFrame {
  frame: { x: number; y: number; w: number; h: number };
  rotated: false;
  trimmed: false;
  spriteSourceSize: { x: number; y: number; w: number; h: number };
  sourceSize: { w: number; h: number };
}

export interface Atlas {
  frames: Record<string, AtlasFrame>;
  meta: { app: string; image: string; format: 'RGBA8888'; size: { w: number; h: number }; scale: '1' };
}

export interface Sheet {
  width: number;
  height: number;
  rgba: Uint8Array;
  atlas: Atlas;
}

const PAD = 1;

export function packSheet(art: Map<string, Pix>, image: string, maxWidth = 1024): Sheet {
  const entries = [...art.entries()].sort(([an, a], [bn, b]) => b.h - a.h || b.w - a.w || (an < bn ? -1 : an > bn ? 1 : 0));
  const placed: { name: string; pix: Pix; x: number; y: number }[] = [];
  let x = PAD;
  let y = PAD;
  let shelf = 0;
  let width = 0;
  for (const [name, pix] of entries) {
    if (pix.w + PAD * 2 > maxWidth) throw new Error(`Sprite ${name} is wider than the sheet`);
    if (x + pix.w + PAD > maxWidth) {
      x = PAD;
      y += shelf + PAD;
      shelf = 0;
    }
    placed.push({ name, pix, x, y });
    x += pix.w + PAD;
    shelf = Math.max(shelf, pix.h);
    width = Math.max(width, x);
  }
  const height = y + shelf + PAD;
  const rgba = new Uint8Array(width * height * 4);
  const frames: Record<string, AtlasFrame> = {};
  for (const { name, pix, x: ox, y: oy } of placed.sort((a, b) => (a.name < b.name ? -1 : 1))) {
    for (let py = 0; py < pix.h; py++) {
      for (let px = 0; px < pix.w; px++) {
        const c = pix.data[py * pix.w + px];
        if (c === CLEAR) continue;
        const o = ((oy + py) * width + ox + px) * 4;
        rgba[o] = (c >> 16) & 0xff;
        rgba[o + 1] = (c >> 8) & 0xff;
        rgba[o + 2] = c & 0xff;
        rgba[o + 3] = pix.alpha[py * pix.w + px];
      }
    }
    frames[name] = {
      frame: { x: ox, y: oy, w: pix.w, h: pix.h },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: pix.w, h: pix.h },
      sourceSize: { w: pix.w, h: pix.h },
    };
  }
  return {
    width,
    height,
    rgba,
    atlas: { frames, meta: { app: 'doomed sprite builder', image, format: 'RGBA8888', size: { w: width, h: height }, scale: '1' } },
  };
}
