import { type Pix, mix } from '../render/pixel';
import type { CharacterArt } from './art';
import { BRUTE_ART, BRUTE_PALETTE } from './brute.art';

function ghostly(p: Pix): Pix {
  return p.map((_x, _y, c) => {
    if (c === BRUTE_PALETTE.eye) return 0x9af0ff;
    const lum = (((c >> 16) & 0xff) * 0.3 + ((c >> 8) & 0xff) * 0.55 + (c & 0xff) * 0.15) / 255;
    return mix(0x141c2c, 0xd8e4ff, Math.min(1, lum * 1.5));
  });
}

export const SHADE_ART: CharacterArt = {
  frame: (dir, frame) => ghostly(BRUTE_ART.frame(dir, frame)),
  corpse: () => ghostly(BRUTE_ART.corpse()),
};
