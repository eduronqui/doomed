import { parseLevel } from '../sim/level';
import { LEVEL11_HEIGHTS } from './level11.heights';
import { LEVEL11_MAP } from './level11.map';
import { LEVEL11_MUSIC } from './level11.music';
import type { LevelInfo } from './types';

export const LEVEL11: LevelInfo = {
  id: 11,
  title: 'E11: The Gauntlet',
  briefing:
    'Everything the gate has made waits between you and its keeper. Take the rift cannon from the armory by the start. Spend the cells well.',
  darkness: 0.82,
  par: 540,
  music: LEVEL11_MUSIC,
  ambush: { key: 'yellow', groups: { recruit: 'Swh', veteran: 'SwMh', doomed: 'SSwMV' } },
  watchDoors: true,
  load: () => parseLevel('The Gauntlet', LEVEL11_MAP, LEVEL11_HEIGHTS, [{ at: [59, 39], gates: [[48, 18]] }]),
};
