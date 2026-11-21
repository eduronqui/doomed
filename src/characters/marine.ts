import type { MarineDef } from './types';

export const MARINE: MarineDef = {
  name: 'Marine',
  speed: 5,
  radius: 0.3,
  start: { health: 100, armor: 0, ammo: { bullets: 40, shells: 0, grenades: 0, fuel: 0, cells: 0 }, weapons: ['knife', 'pistol'], weapon: 'pistol' },
};
