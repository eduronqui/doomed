import type { ItemKind, SoundId, WeaponId } from '../sim/defs';
import type { Carry } from '../sim/world';

export type MonsterKind = 'husk' | 'shotgunner' | 'fiend' | 'brute' | 'shade';

export type AttackStyle = 'hitscan' | 'fireball' | 'melee';

export type LostBehavior = 'wander' | 'hold' | 'track';

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
}

export interface MarineDef {
  name: string;
  speed: number;
  radius: number;
  start: Carry;
}
