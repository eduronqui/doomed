import { Pix, mix } from '../render/pixel';
import type { CharacterArt } from './art';
import { BRUTE_ART, BRUTE_PALETTE } from './brute.art';

function obsidian(p: Pix): Pix {
  return p.map((_x, _y, c) => {
    if (c === BRUTE_PALETTE.eye) return 0xffe060;
    const lum = (((c >> 16) & 0xff) * 0.3 + ((c >> 8) & 0xff) * 0.55 + (c & 0xff) * 0.15) / 255;
    return lum > 0.55 ? mix(0x8a2a10, 0xff8a30, (lum - 0.55) * 2) : mix(0x0c0808, 0x5a1c10, lum * 1.6);
  });
}

function doubled(src: Pix): Pix {
  const p = new Pix(src.w * 2, src.h * 2);
  for (let y = 0; y < src.h; y++) {
    for (let x = 0; x < src.w; x++) {
      const c = src.get(x, y);
      if (c === -1) continue;
      const a = src.alpha[y * src.w + x];
      p.rect(x * 2, y * 2, 2, 2, c, a);
    }
  }
  return p;
}

export const GATEKEEPER_ART: CharacterArt = {
  frame: (dir, frame) => doubled(obsidian(BRUTE_ART.frame(dir, frame))),
  corpse: () => doubled(obsidian(BRUTE_ART.corpse())),
};
