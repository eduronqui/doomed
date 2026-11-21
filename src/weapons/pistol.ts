import type { WeaponDef } from './types';

export const PISTOL: WeaponDef = {
  id: 'pistol',
  name: 'Sidearm',
  slot: 2,
  kind: 'hitscan',
  ammo: 'bullets',
  ammoPerShot: 1,
  cooldown: 0.38,
  pellets: 1,
  spread: 0.035,
  damage: [5, 15],
  range: 22,
  sound: 'pistol',
  noise: true,
};
