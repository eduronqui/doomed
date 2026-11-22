import { Pix } from '../render/pixel';
import { GUN, GUN_HI, ICON_OUTLINE, MUZZLE, type WeaponArt } from './held.art';

const SHELL = 0x2e2a3a;
const SHELL_HI = 0x5a5270;
const CORE = 0xb050ff;
const CORE_HI = 0xf0c8ff;

export const RIFT_ART: WeaponArt = {
  recoil: true,
  south(p, hands, { kick }) {
    p.rect(12, 13 + kick, 8, 11, SHELL).rect(12, 13 + kick, 1, 11, SHELL_HI);
    p.rect(14, 16 + kick, 4, 4, CORE).rect(15, 17 + kick, 2, 2, CORE_HI);
    p.rect(13, 23 + kick, 6, 2, MUZZLE);
    p.rect(11, 18, 1, 3, hands.skin).rect(20, 18, 1, 3, hands.skin);
  },
  north(p, _hands, { kick }) {
    p.rect(12, kick + 1, 8, 5, SHELL).rect(14, kick + 2, 4, 2, CORE);
  },
  east(p, hands, { kick }) {
    p.rect(10 + kick, 14, 19, 6, SHELL).rect(10 + kick, 14, 19, 1, SHELL_HI).rect(28 + kick, 15, 1, 4, MUZZLE);
    p.rect(17 + kick, 15, 5, 4, CORE).rect(18 + kick, 16, 3, 2, CORE_HI);
    p.rect(12 + kick, 20, 3, 2, GUN).rect(12 + kick, 20, 3, 1, GUN_HI);
    p.rect(13 + kick, 22, 2, 1, hands.skin).rect(24 + kick, 20, 2, 1, hands.skin);
  },
  icon() {
    const p = new Pix(32, 32);
    p.rect(3, 13, 25, 8, SHELL).rect(3, 13, 25, 1, SHELL_HI).rect(27, 14, 1, 6, MUZZLE);
    p.rect(12, 14, 8, 6, CORE).rect(14, 15, 4, 4, CORE_HI);
    p.rect(6, 21, 4, 4, GUN).rect(6, 21, 4, 1, GUN_HI);
    return p.outline(ICON_OUTLINE);
  },
};
