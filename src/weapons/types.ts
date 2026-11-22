import type { SoundId } from '../sim/defs';

export type WeaponId = 'knife' | 'pistol' | 'shotgun' | 'rotary' | 'launcher' | 'flamer' | 'arc' | 'rift';
export type AmmoType = 'bullets' | 'shells' | 'grenades' | 'fuel' | 'cells';
export type FireKind = 'melee' | 'hitscan' | 'projectile' | 'flame' | 'beam';
export type ProjectileLook = 'fireball' | 'grenade' | 'orb' | 'wisp' | 'bolt';

export interface Blast {
  radius: number;
  damage: number;
  hurtsPlayer: boolean;
}

export interface ProjectileSpec {
  look: ProjectileLook;
  speed: number;
  overCover: boolean;
  blast: Blast;
}

export interface WeaponDef {
  id: WeaponId;
  name: string;
  slot: number;
  kind: FireKind;
  ammo: AmmoType | null;
  ammoPerShot: number;
  cooldown: number;
  pellets: number;
  spread: number;
  damage: [number, number];
  range: number;
  sound: SoundId;
  noise: boolean;
  projectile?: ProjectileSpec;
}
