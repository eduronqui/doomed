import { parseLevel } from '../sim/level';
import { ARENA_MAP } from './arena.map';
import { LEVEL3_MUSIC } from './level3.music';

export const ARENA = {
  title: 'Arena: The Pit',
  darkness: 0.55,
  music: LEVEL3_MUSIC,
  load: () => parseLevel('The Pit', ARENA_MAP),
};
