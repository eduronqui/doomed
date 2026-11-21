import { ARC } from './arc';
import { FLAMER } from './flamer';
import { KNIFE } from './knife';
import { LAUNCHER } from './launcher';
import { PISTOL } from './pistol';
import { RIFT } from './rift';
import { ROTARY } from './rotary';
import { SHOTGUN } from './shotgun';
import type { AmmoType, WeaponDef, WeaponId } from './types';

export type { AmmoType, Blast, FireKind, ProjectileLook, ProjectileSpec, WeaponDef, WeaponId } from './types';

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  knife: KNIFE,
  pistol: PISTOL,
  shotgun: SHOTGUN,
  rotary: ROTARY,
  launcher: LAUNCHER,
  flamer: FLAMER,
  arc: ARC,
  rift: RIFT,
};

export const WEAPON_ORDER: WeaponId[] = ['knife', 'pistol', 'shotgun', 'rotary', 'launcher', 'flamer', 'arc', 'rift'];

export const FALLBACK_ORDER: WeaponId[] = ['arc', 'shotgun', 'rotary', 'flamer', 'pistol', 'knife'];

export const MAX_AMMO: Record<AmmoType, number> = { bullets: 200, shells: 50, grenades: 30, fuel: 200, cells: 300 };

export const AMMO_ORDER: AmmoType[] = ['bullets', 'shells', 'grenades', 'fuel', 'cells'];
