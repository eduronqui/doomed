import { Pix, shadedRect } from '../render/pixel';
import { ICON_OUTLINE, WOOD, STEEL, type WeaponArt } from './held.art';

export const KNIFE_ART: WeaponArt = {
  recoil: false,
  south(p, hands, { attack }) {
    p.rect(13, 18, 2, 2, hands.skin).rect(17, 18, 2, 2, hands.skin).rect(17, 17, 2, 1, WOOD);
    const len = attack ? 6 : 3;
    for (let i = 0; i < len; i++) p.set(18, 20 + i, STEEL).set(17, 20 + i, i < len - 1 ? 0x8a909a : STEEL);
  },
  north(p, _hands) {
    p.rect(19, 3, 1, 3, STEEL).set(20, 4, 0x8a909a);
  },
  east(p, hands, { attack }) {
    const reach = attack ? 4 : 0;
    shadedRect(p, 15, 16, 3 + reach, 2, hands.body);
    p.rect(18 + reach, 16, 2, 2, hands.skin).rect(19 + reach, 17, 1, 1, WOOD);
    p.rect(20 + reach, 16, 5, 1, STEEL).rect(20 + reach, 17, 4, 1, 0x8a909a);
  },
  icon() {
    const p = new Pix(32, 32);
    p.line(9, 23, 13, 19, 0x3a2a1c).line(10, 23, 14, 19, 0x5a3e24);
    p.rect(12, 18, 4, 2, 0x50535a);
    for (let i = 0; i < 9; i++) p.set(15 + i, 17 - i, 0xc8ced8).set(16 + i, 17 - i, 0x8a909a);
    return p.outline(ICON_OUTLINE);
  },
};
