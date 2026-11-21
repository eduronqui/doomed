import { parseLevel } from '../sim/level';
import { LEVEL8_HEIGHTS } from './level8.heights';
import { LEVEL8_MAP } from './level8.map';
import { LEVEL8_MUSIC } from './level8.music';
import type { LevelInfo } from './types';

export const LEVEL8: LevelInfo = {
  id: 8,
  title: 'E8: Arc Foundry',
  briefing:
    'The foundry that built the gate machines runs on stolen power. Long galleries, long lines of enemies. The arc rifle in the side room cuts through all of them at once.',
  darkness: 0.76,
  par: 360,
  music: LEVEL8_MUSIC,
  ambush: { key: 'red', groups: { recruit: 'SMh', veteran: 'SSMh', doomed: 'SSMMh' } },
  load: () => parseLevel('Arc Foundry', LEVEL8_MAP, LEVEL8_HEIGHTS),
};
