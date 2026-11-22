import type { Track } from '../render/tracks';

export const LEVEL8_MUSIC: Track = {
  title: 'Arc Foundry',
  bpm: 156,
  root: 39,
  drive: 58,
  guitar: `
    0 . 0 . 0 0 . 0 2 . 0 . 3 . 2 .
    0 . 0 . 0 0 . 0 2 . 0 . 5 . 3 .
    0 . 0 . 0 0 . 0 2 . 0 . 3 . 2 .
    7 . 5 . 3 . 2 . 0 - - - 10 - - -`,
  bass: `
    0 . 0 . 0 0 . 0 2 . 0 . 3 . 2 .
    0 . 0 . 0 0 . 0 2 . 0 . 5 . 3 .
    0 . 0 . 0 0 . 0 2 . 0 . 3 . 2 .
    7 . 5 . 3 . 2 . 0 - - - 10 - - -`,
  lead: `
    31 - 29 - 27 - 26 - 24 - - - - - - -
    . . . . . . . . . . . . . . . .
    31 - 29 - 27 - 26 - 27 - - - 29 - - -
    . . . . . . . . . . . . . . . .`,
  kick: 'x.x.x.x.x.x.x.x. x.x.x.x.x.x.x.x. x.x.x.x.x.x.x.x. xxxxxxxxx.x.x.x.',
  snare: '....x.......x... ....x.......x..x ....x.......x... ....x...x...x...',
  hat: 'xxxxxxxxxxxxxxxx xxxxxxxxxxxxxxxx xxxxxxxxxxxxxxxx x.x.x.x.x.x.x.x.',
};
