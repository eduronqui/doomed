import { Pix } from '../render/pixel';
import { GUN, GUN_HI, ICON_OUTLINE, type WeaponArt } from './held.art';

const FRAME = 0x3a4250;
const FRAME_HI = 0x6a7484;
const COIL = 0x4ad0ff;
const COIL_HI = 0xc8f4ff;

export const ARC_ART: WeaponArt = {
  recoil: true,
  south(p, hands, { kick }) {
    p.rect(14, 13 + kick, 4, 12, FRAME).rect(14, 13 + kick, 1, 12, FRAME_HI);
    for (const y of [16, 19, 22]) p.rect(13, y + kick, 6, 1, COIL).set(15, y + kick, COIL_HI);
    p.rect(12, 18, 1, 2, hands.skin).rect(19, 18, 1, 2, hands.skin);
  },
  north(p, _hands, { kick }) {
    p.rect(14, kick + 1, 4, 5, FRAME).rect(14, kick + 3, 4, 1, COIL);
  },
  east(p, hands, { kick }) {
    p.rect(11 + kick, 15, 19, 3, FRAME).rect(11 + kick, 15, 19, 1, FRAME_HI);
    for (const x of [18, 21, 24, 27]) p.rect(x + kick, 14, 1, 5, COIL).set(x + kick, 14, COIL_HI);
    p.rect(12 + kick, 18, 4, 2, GUN).rect(12 + kick, 18, 4, 1, GUN_HI);
    p.rect(14 + kick, 20, 2, 2, hands.skin).rect(22 + kick, 18, 2, 1, hands.skin);
  },
  icon() {
    const p = new Pix(32, 32);
    p.rect(4, 15, 24, 4, FRAME).rect(4, 15, 24, 1, FRAME_HI);
    for (const x of [13, 17, 21, 25]) p.rect(x, 13, 2, 8, COIL).set(x, 13, COIL_HI);
    p.rect(6, 19, 4, 4, GUN).rect(6, 19, 4, 1, GUN_HI);
    return p.outline(ICON_OUTLINE);
  },
};
