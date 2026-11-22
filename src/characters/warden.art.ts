import type { Dir } from '../sim/types';
import { type Pix, mix } from '../render/pixel';
import type { CharacterArt } from './art';
import { BRUTE_ART, BRUTE_PALETTE } from './brute.art';
import type { Frame } from './humanoid.art';

const SHIELD = 0x6a7280;
const SHIELD_HI = 0xa8b0bc;
const SHIELD_DARK = 0x3a4048;
const STRIPE = 0xb02a1e;

function armored(p: Pix): Pix {
  return p.map((_x, _y, c) => {
    if (c === BRUTE_PALETTE.eye) return 0xff5020;
    const lum = (((c >> 16) & 0xff) * 0.3 + ((c >> 8) & 0xff) * 0.55 + (c & 0xff) * 0.15) / 255;
    return mix(0x14181e, 0xb8c0cc, Math.min(1, lum * 1.3));
  });
}

function shield(p: Pix, dir: Dir): Pix {
  if (dir === 'n') return p;
  const [x, y, w, h] = dir === 's' ? [10, 14, 12, 13] : dir === 'e' ? [21, 12, 5, 15] : [6, 12, 5, 15];
  p.rect(x, y, w, h, SHIELD).rect(x, y, w, 1, SHIELD_HI).rect(x, y + h - 1, w, 1, SHIELD_DARK).rect(x, y, 1, h, SHIELD_HI);
  if (dir === 's') p.rect(x + 5, y + 2, 2, h - 4, STRIPE);
  else p.rect(x + 1, y + 6, w - 2, 2, STRIPE);
  return p.outline(0x0c0e12);
}

export const WARDEN_ART: CharacterArt = {
  frame: (dir: Dir, frame: Frame) => shield(armored(BRUTE_ART.frame(dir, frame)), dir),
  corpse: () => armored(BRUTE_ART.corpse()),
};
