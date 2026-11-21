import { parseLevel } from '../sim/level';
import { LEVEL10_HEIGHTS } from './level10.heights';
import { LEVEL10_MAP } from './level10.map';
import { LEVEL10_MUSIC } from './level10.music';
import type { LevelInfo } from './types';

export const LEVEL10: LevelInfo = {
  id: 10,
  title: 'E10: Drowned Pit',
  briefing:
    'The gate drains into a pit of slime. Shapes drift over it without touching the surface, and their light follows you. The red keycard waits on the platform in the middle.',
  darkness: 0.82,
  par: 390,
  music: LEVEL10_MUSIC,
  ambush: { key: 'red', groups: { recruit: 'Vhh', veteran: 'VVhh', doomed: 'VVhhS' } },
  load: () => parseLevel('Drowned Pit', LEVEL10_MAP, LEVEL10_HEIGHTS),
};
