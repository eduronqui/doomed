import { parseLevel } from '../sim/level';
import { LEVEL2_MAP } from './level2.map';
import { LEVEL2_MUSIC } from './level2.music';
import type { LevelInfo } from './types';

export const LEVEL2: LevelInfo = {
  id: 2,
  title: 'E2: Toxin Refinery',
  briefing:
    'The vault gate led to the refinery that feeds the outpost. Slime channels, settling basins and something that moves like smoke. The exit lift sits behind a blue security door.',
  darkness: 0.76,
  par: 300,
  startMessage: 'Find the blue keycard.',
  music: LEVEL2_MUSIC,
  load: () => parseLevel('Toxin Refinery', LEVEL2_MAP),
};
