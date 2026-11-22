import { ARC_ART } from './arc.art';
import { FLAMER_ART } from './flamer.art';
import { KNIFE_ART } from './knife.art';
import { LAUNCHER_ART } from './launcher.art';
import { PISTOL_ART } from './pistol.art';
import { RIFT_ART } from './rift.art';
import { ROTARY_ART } from './rotary.art';
import { SHOTGUN_ART } from './shotgun.art';
import type { WeaponArt } from './held.art';
import type { WeaponId } from './types';

export type { Hands, HeldPose, WeaponArt } from './held.art';

export const WEAPON_ART: Record<WeaponId, WeaponArt> = {
  knife: KNIFE_ART,
  pistol: PISTOL_ART,
  shotgun: SHOTGUN_ART,
  rotary: ROTARY_ART,
  launcher: LAUNCHER_ART,
  flamer: FLAMER_ART,
  arc: ARC_ART,
  rift: RIFT_ART,
};
