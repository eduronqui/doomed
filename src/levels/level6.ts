import { parseLevel } from '../sim/level';
import { LEVEL6_HEIGHTS } from './level6.heights';
import { LEVEL6_MAP } from './level6.map';
import { LEVEL6_MUSIC } from './level6.music';
import type { LevelInfo } from './types';

export const LEVEL6: LevelInfo = {
  id: 6,
  title: 'E6: Furnace Deck',
  briefing:
    'The furnaces that forge the gate still burn. Packs of the dead crowd the deck. Take the flamer from the alcove by the start and set them alight.',
  darkness: 0.78,
  par: 390,
  music: LEVEL6_MUSIC,
  ambush: { key: 'red', groups: { recruit: 'hhhf', veteran: 'hhhff', doomed: 'hhhffb' } },
  watchDoors: true,
  load: () => parseLevel('Furnace Deck', LEVEL6_MAP, LEVEL6_HEIGHTS, [{ at: [32, 13], gates: [[29, 17]] }]),
};
