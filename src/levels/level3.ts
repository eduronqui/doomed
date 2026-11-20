import { parseLevel } from '../sim/level';
import { LEVEL3_MAP } from './level3.map';
import { LEVEL3_MUSIC } from './level3.music';
import type { LevelInfo } from './types';

export const LEVEL3: LevelInfo = {
  id: 3,
  title: 'E3: Ember Gate',
  briefing:
    'Below the refinery the base is gone. Only rock, fire and the gate the demons came through. Take the yellow and red keys from its wings and close the gate from the sanctum.',
  darkness: 0.8,
  par: 360,
  startMessage: 'Find the yellow keycard, then the red one.',
  music: LEVEL3_MUSIC,
  load: () => parseLevel('Ember Gate', LEVEL3_MAP),
};
