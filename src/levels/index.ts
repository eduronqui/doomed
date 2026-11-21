import { LEVEL1 } from './level1';
import { LEVEL2 } from './level2';
import { LEVEL3 } from './level3';
import { LEVEL4 } from './level4';
import { LEVEL5 } from './level5';
import { LEVEL6 } from './level6';
import { TRAINING } from './training';
import type { LevelInfo } from './types';

export type { LevelInfo, Tip } from './types';
export { TRAINING };

export const TRAINING_INDEX = -1;

export const LEVELS: LevelInfo[] = [LEVEL1, LEVEL2, LEVEL3, LEVEL4, LEVEL5, LEVEL6];

export const ALL_LEVELS: LevelInfo[] = [TRAINING, ...LEVELS];

export function levelInfo(index: number): LevelInfo {
  return index === TRAINING_INDEX ? TRAINING : LEVELS[index];
}
