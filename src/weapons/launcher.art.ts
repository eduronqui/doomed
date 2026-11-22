import { Pix } from '../render/pixel';
import { GUN, GUN_HI, ICON_OUTLINE, MUZZLE, type WeaponArt } from './held.art';

const BODY = 0x4a5638;
const BODY_HI = 0x6a7a50;
const DRUM = 0x33382c;

export const LAUNCHER_ART: WeaponArt = {
  recoil: true,
  south(p, hands, { kick }) {
    p.rect(13, 14 + kick, 6, 10, BODY).rect(13, 14 + kick, 1, 10, BODY_HI).rect(18, 14 + kick, 1, 10, DRUM);
    p.rect(12, 17 + kick, 8, 4, DRUM).rect(12, 17 + kick, 8, 1, GUN_HI);
    p.rect(14, 23 + kick, 4, 2, MUZZLE).rect(14, 23 + kick, 4, 1, GUN);
    p.rect(11, 18, 1, 2, hands.skin).rect(20, 18, 1, 2, hands.skin);
  },
  north(p, _hands, { kick }) {
    p.rect(13, kick + 1, 6, 5, BODY).rect(13, kick + 1, 1, 5, BODY_HI);
  },
  east(p, hands, { kick }) {
    p.rect(11 + kick, 15, 18, 4, BODY).rect(11 + kick, 15, 18, 1, BODY_HI).rect(28 + kick, 15, 1, 4, MUZZLE);
    p.rect(15 + kick, 13, 6, 8, DRUM).rect(15 + kick, 13, 6, 1, GUN_HI);
    p.rect(13 + kick, 19, 2, 2, hands.skin).rect(23 + kick, 19, 2, 1, hands.skin);
  },
  icon() {
    const p = new Pix(32, 32);
    p.rect(4, 15, 24, 5, BODY).rect(4, 15, 24, 1, BODY_HI).rect(27, 15, 1, 5, MUZZLE);
    p.rect(10, 12, 8, 11, DRUM).rect(10, 12, 8, 1, GUN_HI);
    for (const y of [14, 17, 20]) p.rect(11, y, 6, 1, GUN);
    p.rect(6, 20, 3, 4, GUN);
    return p.outline(ICON_OUTLINE);
  },
};
