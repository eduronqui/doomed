import { parseLevel } from '../sim/level';
import { LEVEL4_HEIGHTS } from './level4.heights';
import { LEVEL4_MAP } from './level4.map';
import { LEVEL4_MUSIC } from './level4.music';
import type { LevelInfo } from './types';

export const LEVEL4: LevelInfo = {
  id: 4,
  title: 'E4: Freight Lift',
  briefing:
    'The gate has a supply line. Freight lifts haul ammunition down to the deep levels, and the dead now guard them. Find the launcher in the armory and clear the cargo hall.',
  darkness: 0.74,
  par: 360,
  music: LEVEL4_MUSIC,
  ambush: { key: 'yellow', groups: { recruit: 'hhf', veteran: 'hhff', doomed: 'hhffH' } },
  watchDoors: true,
  load: () => parseLevel('Freight Lift', LEVEL4_MAP, LEVEL4_HEIGHTS, [{ at: [57, 0], gates: [[36, 21]] }]),
};
