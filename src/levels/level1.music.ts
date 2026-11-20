import type { Track } from '../render/tracks';

export const LEVEL1_MUSIC: Track = {
  title: 'Outpost Breach',
  bpm: 140,
  root: 40,
  drive: 40,
  guitar: `
    x x 0 - x x 3 - x x 5 - 3 - 0 -
    x x 0 - x x 3 - x x 7 - 5 - 3 -
    x x 0 - x x 3 - x x 5 - 3 - 1 -
    0 - - - 7 - 5 - 3 - - - 1 - - -`,
  bass: `
    0 0 0 - 0 0 3 - 0 0 5 - 3 - 0 -
    0 0 0 - 0 0 3 - 0 0 7 - 5 - 3 -
    0 0 0 - 0 0 3 - 0 0 5 - 3 - 1 -
    0 - - - 7 - 5 - 3 - - - 1 - - -`,
  lead: `
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
    . . . . . . . . 31 - - - 29 - 27 -
    26 - - - - - - - . . . . . . . .`,
  kick: 'x...x.x.x...x.x. x...x.x.x...x.x. x...x.x.x...x.x. x.......x.......',
  snare: '....x.......x... ....x.......x... ....x.......x... ....x...x.x.xxxx',
  hat: 'x.x.x.x.x.x.x.x. x.x.x.x.x.x.x.x. x.x.x.x.x.x.x.x. x.x.x.x.........',
};
