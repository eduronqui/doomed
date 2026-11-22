import type { WeaponDef } from './types';

export const SHOTGUN: WeaponDef = {
  id: 'shotgun',
  name: 'Pump Shotgun',
  slot: 3,
  kind: 'hitscan',
  ammo: 'shells',
  ammoPerShot: 1,
  cooldown: 0.95,
  pellets: 7,
  spread: 0.11,
  damage: [5, 15],
  range: 18,
  sound: 'shotgun',
  noise: true,
};
