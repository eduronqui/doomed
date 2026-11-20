import { KNIFE } from './knife';
import { PISTOL } from './pistol';
import { ROTARY } from './rotary';
import { SHOTGUN } from './shotgun';
import type { AmmoType, WeaponDef, WeaponId } from './types';

export type { AmmoType, WeaponDef, WeaponId } from './types';

export const WEAPONS: Record<WeaponId, WeaponDef> = { knife: KNIFE, pistol: PISTOL, shotgun: SHOTGUN, rotary: ROTARY };

export const WEAPON_ORDER: WeaponId[] = ['knife', 'pistol', 'shotgun', 'rotary'];

export const FALLBACK_ORDER: WeaponId[] = ['shotgun', 'rotary', 'pistol', 'knife'];

export const MAX_AMMO: Record<AmmoType, number> = { bullets: 200, shells: 50 };
