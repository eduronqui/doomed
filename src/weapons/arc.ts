import type { WeaponDef } from './types';

export const ARC: WeaponDef = {
  id: 'arc',
  name: 'Arc Rifle',
  slot: 7,
  kind: 'beam',
  ammo: 'cells',
  ammoPerShot: 1,
  cooldown: 0.3,
  pellets: 1,
  spread: 0.01,
  damage: [18, 26],
  range: 24,
  sound: 'arc',
  noise: true,
};
