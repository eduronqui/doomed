import { parseLevel } from '../sim/level';
import { LEVEL1_MAP } from './level1.map';
import { LEVEL1_MUSIC } from './level1.music';
import type { LevelInfo } from './types';

export const LEVEL1: LevelInfo = {
  id: 1,
  title: 'E1: Outpost Breach',
  briefing:
    'The Kharon research outpost went silent six hours ago. Its gate to the deep vaults is open, and something came through. You are the only one they sent.',
  darkness: 0.72,
  par: 240,
  music: LEVEL1_MUSIC,
  ambush: { key: 'red', groups: { recruit: 'hhff', veteran: 'hhff', doomed: 'hhff' } },
  load: () => parseLevel('Outpost Breach', LEVEL1_MAP),
};
