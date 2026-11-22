import { parseLevel } from '../sim/level';
import { LEVEL5_HEIGHTS } from './level5.heights';
import { LEVEL5_MAP } from './level5.map';
import { LEVEL5_MUSIC } from './level5.music';
import type { LevelInfo } from './types';

export const LEVEL5: LevelInfo = {
  id: 5,
  title: 'E5: Coolant Works',
  briefing:
    'Deeper down, the coolant plant still pumps. Something heavier walks the catwalks now, and it carries a rotary gun. Keep your head down and lob grenades over the cover.',
  darkness: 0.76,
  par: 390,
  music: LEVEL5_MUSIC,
  ambush: { key: 'blue', groups: { recruit: 'hhM', veteran: 'hhMH', doomed: 'hhMHf' } },
  watchDoors: true,
  load: () => parseLevel('Coolant Works', LEVEL5_MAP, LEVEL5_HEIGHTS, [{ at: [5, 31], gates: [[29, 20]] }]),
};
