import { parseLevel } from '../sim/level';
import { LEVEL7_HEIGHTS } from './level7.heights';
import { LEVEL7_MAP } from './level7.map';
import { LEVEL7_MUSIC } from './level7.music';
import type { LevelInfo } from './types';

export const LEVEL7: LevelInfo = {
  id: 7,
  title: 'E7: Hunting Grounds',
  briefing:
    'The caverns below the furnaces are dark and wide. Something fast hunts here. It will not come at you straight. Keep your back to the rock.',
  darkness: 0.84,
  par: 420,
  music: LEVEL7_MUSIC,
  ambush: { key: 'yellow', groups: { recruit: 'Shh', veteran: 'SShh', doomed: 'SShhf' } },
  watchDoors: true,
  load: () => parseLevel('Hunting Grounds', LEVEL7_MAP, LEVEL7_HEIGHTS, [{ at: [29, 23], gates: [[11, 11]] }]),
};
