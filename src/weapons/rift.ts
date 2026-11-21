import type { WeaponDef } from './types';

export const RIFT: WeaponDef = {
  id: 'rift',
  name: 'Rift Cannon',
  slot: 8,
  kind: 'projectile',
  ammo: 'cells',
  ammoPerShot: 40,
  cooldown: 1.5,
  pellets: 1,
  spread: 0,
  damage: [40, 60],
  range: 30,
  sound: 'rift',
  noise: true,
  projectile: { look: 'orb', speed: 6, overCover: false, blast: { radius: 4.5, damage: 300, hurtsPlayer: false } },
};
