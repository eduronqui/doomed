import type { WeaponDef } from './types';

export const LAUNCHER: WeaponDef = {
  id: 'launcher',
  name: 'Grenade Launcher',
  slot: 5,
  kind: 'projectile',
  ammo: 'grenades',
  ammoPerShot: 1,
  cooldown: 0.8,
  pellets: 1,
  spread: 0.02,
  damage: [10, 20],
  range: 14,
  sound: 'launcher',
  noise: true,
  projectile: { look: 'grenade', speed: 10, overCover: true, blast: { radius: 2.4, damage: 95, hurtsPlayer: true } },
};
