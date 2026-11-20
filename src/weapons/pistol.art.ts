import { Pix, shadedRect } from '../render/pixel';
import { ICON_OUTLINE, MUZZLE, GUN, GUN_HI, WOOD, type WeaponArt } from './held.art';

export const PISTOL_ART: WeaponArt = {
  recoil: true,
  south(p, hands, { kick }) {
    p.rect(14, 17 + kick, 4, 4, GUN).rect(14, 17 + kick, 4, 1, GUN_HI).rect(15, 19 + kick, 2, 2, MUZZLE);
    p.rect(13, 18, 1, 3, hands.skin).rect(18, 18, 1, 3, hands.skin);
  },
  north(p, _hands, { kick }) {
    p.rect(15, 2 + kick, 2, 3, GUN).rect(15, 2 + kick, 1, 3, GUN_HI);
  },
  east(p, hands, { kick }) {
    shadedRect(p, 15, 15, 5, 2, hands.body);
    p.rect(20, 15, 2, 2, hands.skin);
    p.rect(21 + kick, 14, 5, 2, GUN).rect(21 + kick, 14, 5, 1, GUN_HI).rect(22 + kick, 16, 2, 2, WOOD);
  },
  icon() {
    const p = new Pix(32, 32);
    p.rect(10, 13, 13, 4, 0x3a3c42).rect(10, 13, 13, 1, 0x6a6e78).rect(22, 14, 1, 1, 0x18191c);
    p.rect(11, 17, 4, 7, 0x5a3e24).rect(11, 17, 1, 7, 0x7a5430).rect(15, 17, 3, 2, 0x2a2c30);
    return p.outline(ICON_OUTLINE);
  },
};
