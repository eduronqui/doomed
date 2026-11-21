import type { Track } from '../render/tracks';

export const LEVEL4_MUSIC: Track = {
  title: 'Freight Lift',
  bpm: 140,
  root: 40,
  drive: 50,
  guitar: `
    0 . 0 0 3 . 0 . 5 . 3 . 0 . 0 0
    0 . 0 0 3 . 0 . 6 - 5 - 3 . 0 .
    0 . 0 0 3 . 0 . 5 . 3 . 0 . 0 0
    7 - - - 5 - - - 3 - - - 2 - - -`,
  bass: `
    0 . 0 0 3 . 0 . 5 . 3 . 0 . 0 0
    0 . 0 0 3 . 0 . 6 - 5 - 3 . 0 .
    0 . 0 0 3 . 0 . 5 . 3 . 0 . 0 0
    7 - - - 5 - - - 3 - - - 2 - - -`,
  lead: `
    . . . . . . . . . . . . . . . .
    24 - - - 27 - - - 29 - 27 - 24 - - -
    . . . . . . . . . . . . . . . .
    31 - - - 29 - - - 27 - - - 26 - - -`,
  kick: 'x.x.x.x.x.x.x.x. x.x.x.x.x.x.x.x. x.x.x.x.x.x.x.x. x...x...x...x...',
  snare: '....x.......x... ....x.......x... ....x.......x... ....x...x..x.x..',
  hat: 'x.x.x.x.x.x.x.x. x.x.x.x.x.x.x.x. x.x.x.x.x.x.x.x. xxxxxxxxxxxxxxxx',
};
