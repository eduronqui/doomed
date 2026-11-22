import { parseLevel } from '../sim/level';
import { LEVEL3_MAP } from './level3.map';
import { LEVEL3_MUSIC } from './level3.music';
import type { LevelInfo } from './types';

export const LEVEL3: LevelInfo = {
  id: 3,
  title: 'E3: Ember Gate',
  briefing:
    'Below the refinery the base is gone. Only rock, fire and the gate the demons came through. It is still open, and it is still hungry.',
  darkness: 0.8,
  par: 360,
  music: LEVEL3_MUSIC,
  ambush: { key: 'red', groups: { recruit: 'hhfffg', veteran: 'hhfffgHHb', doomed: 'hhfffgHHbgb' } },
  load: () => parseLevel('Ember Gate', LEVEL3_MAP, undefined, [{ at: [55, 10], gates: [[45, 3]] }]),
};
