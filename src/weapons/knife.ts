import type { WeaponDef } from './types';

export const KNIFE: WeaponDef = {
  id: 'knife',
  name: 'Combat Knife',
  slot: 1,
  ammo: null,
  cooldown: 0.4,
  pellets: 1,
  spread: 0,
  damage: [6, 20],
  range: 1.25,
  sound: 'knife',
  noise: false,
};
