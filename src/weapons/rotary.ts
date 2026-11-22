import type { WeaponDef } from './types';

export const ROTARY: WeaponDef = {
  id: 'rotary',
  name: 'Rotary Gun',
  slot: 4,
  kind: 'hitscan',
  ammo: 'bullets',
  ammoPerShot: 1,
  cooldown: 0.11,
  pellets: 1,
  spread: 0.06,
  damage: [5, 15],
  range: 22,
  sound: 'rotary',
  noise: true,
};
