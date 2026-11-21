import type { ItemKind, SoundId } from '../sim/defs';
import type { ProjectileLook, WeaponId } from '../weapons';
import type { Carry } from '../sim/world';

export type MonsterKind = 'husk' | 'shotgunner' | 'fiend' | 'brute' | 'shade' | 'gunner' | 'stalker' | 'warden' | 'hollow' | 'gatekeeper';

export type AttackStyle = 'hitscan' | 'fireball' | 'melee';

export type LostBehavior = 'wander' | 'hold' | 'track';

export interface ShotSpec {
  look: ProjectileLook;
  speed: number;
  count: number;
  spread: number;
  homing: number;
  range: number;
}

export interface Leap {
  range: number;
  speed: number;
  time: number;
}

export interface MonsterDef {
  kind: MonsterKind;
  name: string;
  hp: number;
  speed: number;
  radius: number;
  painChance: number;
  painTime: number;
  ranged: AttackStyle | null;
  weapon: WeaponId | null;
  rangedRange: number;
  rangedChance: number;
  meleeDamage: [number, number] | null;
  rangedDamage: [number, number];
  windup: number;
  cooldown: number;
  alertSound: SoundId;
  drop: ItemKind | null;
  lost: LostBehavior;
  trackTime: number;
  fov: number;
  sightRange: number;
  coverBlocksSight: boolean;
  stealth: boolean;
  lookEvery: [number, number];
  lookSwing: number;
  turnSpeed: number;
  shot?: ShotSpec;
  burst?: number;
  burstGap?: number;
  flank?: boolean;
  leap?: Leap;
  frontArmor?: number;
  floats?: boolean;
  boss?: boolean;
}

export interface MarineDef {
  name: string;
  speed: number;
  radius: number;
  start: Carry;
}
