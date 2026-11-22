import type { WeaponDef } from './types';

export const FLAMER: WeaponDef = {
  id: 'flamer',
  name: 'Flamer',
  slot: 6,
  kind: 'flame',
  ammo: 'fuel',
  ammoPerShot: 1,
  cooldown: 0.09,
  pellets: 1,
  spread: 0.35,
  damage: [2, 4],
  range: 3.4,
  sound: 'flame',
  noise: true,
};
