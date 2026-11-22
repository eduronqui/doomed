import { parseLevel } from '../sim/level';
import { LEVEL2_MAP } from './level2.map';
import { LEVEL2_MUSIC } from './level2.music';
import type { LevelInfo } from './types';

export const LEVEL2: LevelInfo = {
  id: 2,
  title: 'E2: Toxin Refinery',
  briefing:
    'The vault gate led to the refinery that feeds the outpost. Slime channels, settling basins and something that moves like smoke. The workers did not leave.',
  darkness: 0.76,
  par: 300,
  music: LEVEL2_MUSIC,
  ambush: { key: 'blue', groups: { recruit: 'hhff', veteran: 'hhffHb', doomed: 'hhffHbg' } },
  load: () => parseLevel('Toxin Refinery', LEVEL2_MAP, undefined, [{ at: [11, 30], gates: [[14, 36]] }]),
};
