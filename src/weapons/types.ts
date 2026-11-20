import type { SoundId } from '../sim/defs';

export type WeaponId = 'knife' | 'pistol' | 'shotgun' | 'rotary';
export type AmmoType = 'bullets' | 'shells';

export interface WeaponDef {
  id: WeaponId;
  name: string;
  slot: number;
  ammo: AmmoType | null;
  cooldown: number;
  pellets: number;
  spread: number;
  damage: [number, number];
  range: number;
  sound: SoundId;
  noise: boolean;
}
