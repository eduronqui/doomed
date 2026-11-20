import { Pix, shade } from '../render/pixel';
import { ICON_OUTLINE, MUZZLE, GUN, GUN_HI, WOOD, WOOD_HI, type WeaponArt } from './held.art';

export const SHOTGUN_ART: WeaponArt = {
  recoil: true,
  south(p, hands, { kick }) {
    p.rect(14, 14 + kick, 2, 11, GUN).rect(16, 14 + kick, 2, 11, GUN).rect(14, 14 + kick, 1, 11, GUN_HI).rect(16, 14 + kick, 1, 11, GUN_HI);
    p.rect(13, 19 + kick, 6, 2, WOOD).rect(13, 19 + kick, 6, 1, WOOD_HI);
    p.set(15, 24 + kick, MUZZLE).set(16, 24 + kick, MUZZLE).set(14, 24 + kick, 0x18191c).set(17, 24 + kick, 0x18191c);
    p.rect(12, 19, 1, 2, hands.skin).rect(19, 19, 1, 2, hands.skin).rect(18, 15, 2, 2, hands.skin);
  },
  north(p, _hands, { kick }) {
    p.rect(14, kick + 1, 2, 5, GUN).rect(16, kick + 1, 2, 5, GUN).rect(14, kick + 1, 1, 5, GUN_HI).rect(16, kick + 1, 1, 5, GUN_HI);
    p.rect(18, 12, 2, 3, WOOD).rect(18, 12, 1, 3, WOOD_HI);
  },
  east(p, hands, { kick }) {
    p.rect(10 + kick, 17, 6, 3, WOOD).rect(10 + kick, 17, 6, 1, WOOD_HI);
    p.rect(15 + kick, 15, 15, 2, GUN).rect(15 + kick, 15, 15, 1, GUN_HI).rect(29 + kick, 15, 1, 1, 0x18191c);
    p.rect(20 + kick, 17, 5, 2, WOOD).rect(20 + kick, 17, 5, 1, WOOD_HI);
    p.rect(15 + kick, 17, 2, 2, hands.skin).rect(22 + kick, 19, 2, 1, shade(hands.skin, -0.2));
  },
  icon() {
    const p = new Pix(32, 32);
    p.rect(4, 17, 9, 3, 0x6a4424).rect(4, 17, 9, 1, 0x8a5c34).rect(4, 20, 4, 2, 0x5a381c);
    p.rect(12, 16, 16, 2, 0x34363c).rect(12, 16, 16, 1, 0x5c606a);
    p.rect(14, 18, 8, 2, 0x7a5030).rect(14, 18, 8, 1, 0x9a6a40);
    p.rect(12, 18, 2, 3, 0x2a2c30);
    return p.outline(ICON_OUTLINE);
  },
};
