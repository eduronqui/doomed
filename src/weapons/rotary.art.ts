import { Pix } from '../render/pixel';
import { ICON_OUTLINE, MUZZLE, GUN, GUN_HI, type WeaponArt } from './held.art';

export const ROTARY_ART: WeaponArt = {
  recoil: true,
  south(p, hands, { kick }) {
    p.rect(11, 17 + kick, 10, 5, 0x4a4d54).rect(11, 17 + kick, 10, 1, 0x7a7e88).rect(11, 21 + kick, 10, 1, 0x2a2c30);
    for (const x of [12, 15, 18]) p.rect(x, 22 + kick, 2, 3, GUN).set(x, 22 + kick, GUN_HI).set(x + 1, 24 + kick, MUZZLE);
    p.rect(10, 18, 1, 3, hands.skin).rect(21, 18, 1, 3, hands.skin);
  },
  north(p, _hands, { kick }) {
    p.rect(12, 2 + kick, 8, 4, 0x4a4d54).rect(12, 2 + kick, 8, 1, 0x7a7e88);
    for (const x of [13, 15, 17]) p.rect(x, kick + 0, 1, 2, GUN);
  },
  east(p, hands, { kick }) {
    p.rect(11 + kick, 15, 10, 6, 0x4a4d54).rect(11 + kick, 15, 10, 1, 0x7a7e88).rect(11 + kick, 20, 10, 1, 0x2a2c30);
    for (const y of [15, 17, 19]) p.rect(21 + kick, y, 9, 1, GUN).set(21 + kick, y, GUN_HI);
    p.rect(21 + kick, 14, 2, 7, 0x3a3c42).rect(27 + kick, 14, 2, 7, 0x3a3c42);
    p.rect(13 + kick, 21, 3, 2, hands.skin).rect(17 + kick, 13, 3, 2, hands.skin);
  },
  icon() {
    const p = new Pix(32, 32);
    p.rect(5, 15, 10, 6, 0x4a4d54).rect(5, 15, 10, 1, 0x7a7e88);
    p.rect(15, 14, 13, 1, 0x5c606a).rect(15, 16, 13, 1, 0x50535a).rect(15, 18, 13, 1, 0x5c606a).rect(15, 20, 12, 1, 0x50535a);
    p.rect(15, 15, 13, 1, 0x2a2c30).rect(15, 17, 13, 1, 0x2a2c30).rect(15, 19, 13, 1, 0x2a2c30);
    p.rect(15, 13, 2, 9, 0x3a3c42).rect(25, 13, 2, 9, 0x3a3c42);
    p.rect(8, 21, 3, 4, 0x2c2e33).rect(11, 12, 3, 3, 0x2c2e33);
    return p.outline(ICON_OUTLINE);
  },
};
