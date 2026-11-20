import type { Pix } from '../render/pixel';

export interface Hands {
  skin: number;
  body: number;
}

export interface HeldPose {
  kick: number;
  attack: boolean;
}

export interface WeaponArt {
  recoil: boolean;
  south(p: Pix, hands: Hands, pose: HeldPose): void;
  north(p: Pix, hands: Hands, pose: HeldPose): void;
  east(p: Pix, hands: Hands, pose: HeldPose): void;
  icon(): Pix;
}

export const ICON_OUTLINE = 0x140d0a;
export const MUZZLE = 0x0a0a0c;
export const GUN = 0x2c2e33;
export const GUN_HI = 0x50535a;
export const WOOD = 0x6a4424;
export const WOOD_HI = 0x8a5c34;
export const STEEL = 0xc8ced8;
