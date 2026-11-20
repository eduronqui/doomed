import { KNIFE_ART } from './knife.art';
import { PISTOL_ART } from './pistol.art';
import { ROTARY_ART } from './rotary.art';
import { SHOTGUN_ART } from './shotgun.art';
import type { WeaponArt } from './held.art';
import type { WeaponId } from './types';

export type { Hands, HeldPose, WeaponArt } from './held.art';

export const WEAPON_ART: Record<WeaponId, WeaponArt> = { knife: KNIFE_ART, pistol: PISTOL_ART, shotgun: SHOTGUN_ART, rotary: ROTARY_ART };
