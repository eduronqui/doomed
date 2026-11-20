import type { WeaponId } from '../weapons';
import type { Dir } from '../sim/types';
import type { Pix } from '../render/pixel';
import { BRUTE_ART } from './brute.art';
import { FIEND_ART } from './fiend.art';
import { HUSK_ART } from './husk.art';
import type { Frame } from './humanoid.art';
import { MARINE_ART } from './marine.art';
import { SHADE_ART } from './shade.art';
import { SHOTGUNNER_ART } from './shotgunner.art';
import type { MonsterKind } from './types';

export { DIRS, FRAMES, type Frame } from './humanoid.art';

export interface CharacterArt {
  frame(dir: Dir, frame: Frame, held?: WeaponId): Pix;
  corpse(): Pix;
}

export type CharacterKind = 'marine' | MonsterKind;

export const CHARACTER_ART: Record<CharacterKind, CharacterArt> = {
  marine: MARINE_ART,
  husk: HUSK_ART,
  shotgunner: SHOTGUNNER_ART,
  fiend: FIEND_ART,
  brute: BRUTE_ART,
  shade: SHADE_ART,
};

export const CHARACTERS = Object.keys(CHARACTER_ART) as CharacterKind[];
