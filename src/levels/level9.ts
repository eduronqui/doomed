import { parseLevel } from '../sim/level';
import { LEVEL9_HEIGHTS } from './level9.heights';
import { LEVEL9_MAP } from './level9.map';
import { LEVEL9_MUSIC } from './level9.music';
import type { LevelInfo } from './types';

export const LEVEL9: LevelInfo = {
  id: 9,
  title: 'E9: Iron Bastion',
  briefing:
    'Past the foundry stands a bastion of black stone. Its wardens carry shields that turn your shots aside. They turn slowly. Get around them.',
  darkness: 0.8,
  par: 450,
  music: LEVEL9_MUSIC,
  ambush: { key: 'blue', groups: { recruit: 'whh', veteran: 'wwh', doomed: 'wwhS' } },
  watchDoors: true,
  load: () => parseLevel('Iron Bastion', LEVEL9_MAP, LEVEL9_HEIGHTS, [{ at: [53, 38], gates: [[29, 27]] }]),
};
