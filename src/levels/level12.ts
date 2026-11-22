import { parseLevel } from '../sim/level';
import { LEVEL12_MAP } from './level12.map';
import { LEVEL12_MUSIC } from './level12.music';
import type { LevelInfo } from './types';

export const LEVEL12: LevelInfo = {
  id: 12,
  title: 'E12: The Gate',
  briefing:
    'The gate stands open at the bottom of the world. Its keeper waits in front of it, a sorcerer who bends the rift to his will. Stock up in the supply room. Then end this.',
  darkness: 0.8,
  par: 240,
  music: LEVEL12_MUSIC,
  watchDoors: true,
  load: () => parseLevel('The Gate', LEVEL12_MAP),
};
