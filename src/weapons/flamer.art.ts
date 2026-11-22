import { Pix } from '../render/pixel';
import { GUN, GUN_HI, ICON_OUTLINE, type WeaponArt } from './held.art';

const TANK = 0xa8321e;
const TANK_HI = 0xd8583a;
const PILOT = 0xffa030;

export const FLAMER_ART: WeaponArt = {
  recoil: false,
  south(p, hands, { kick }) {
    p.rect(12, 15 + kick, 4, 7, TANK).rect(12, 15 + kick, 1, 7, TANK_HI);
    p.rect(16, 14 + kick, 3, 10, GUN).rect(16, 14 + kick, 1, 10, GUN_HI);
    p.set(17, 24 + kick, PILOT).set(16, 24 + kick, 0xffe090);
    p.rect(11, 18, 1, 2, hands.skin).rect(19, 18, 1, 2, hands.skin);
  },
  north(p, _hands, { kick }) {
    p.rect(16, kick + 1, 3, 5, GUN).rect(12, 3, 4, 5, TANK);
  },
  east(p, hands, { kick }) {
    p.rect(11 + kick, 17, 7, 5, TANK).rect(11 + kick, 17, 7, 1, TANK_HI);
    p.rect(16 + kick, 15, 13, 2, GUN).rect(16 + kick, 15, 13, 1, GUN_HI);
    p.set(29 + kick, 15, PILOT).set(29 + kick, 16, 0xffe090);
    p.rect(18 + kick, 17, 2, 2, hands.skin).rect(24 + kick, 17, 2, 1, hands.skin);
  },
  icon() {
    const p = new Pix(32, 32);
    p.rect(4, 15, 10, 8, TANK).rect(4, 15, 10, 1, TANK_HI).rect(5, 13, 3, 2, GUN);
    p.rect(13, 16, 15, 3, GUN).rect(13, 16, 15, 1, GUN_HI);
    p.rect(28, 16, 1, 3, PILOT).set(29, 17, 0xffe090);
    p.rect(17, 19, 2, 4, GUN);
    return p.outline(ICON_OUTLINE);
  },
};
