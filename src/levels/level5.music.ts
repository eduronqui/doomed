import type { Track } from '../render/tracks';

export const LEVEL5_MUSIC: Track = {
  title: 'Coolant Works',
  bpm: 146,
  root: 38,
  drive: 55,
  guitar: `
    0 0 . 0 0 . 3 . 0 0 . 0 5 . 3 .
    0 0 . 0 0 . 3 . 0 0 . 0 7 - 5 -
    0 0 . 0 0 . 3 . 0 0 . 0 5 . 3 .
    8 - - - 7 - - - 5 - - - 3 - 2 -`,
  bass: `
    0 0 . 0 0 . 3 . 0 0 . 0 5 . 3 .
    0 0 . 0 0 . 3 . 0 0 . 0 7 - 5 -
    0 0 . 0 0 . 3 . 0 0 . 0 5 . 3 .
    8 - - - 7 - - - 5 - - - 3 - 2 -`,
  lead: `
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
    27 - - - 26 - - - 24 - 22 - 24 - - -
    19 - - - - - - - 22 - - - 24 - - -`,
  kick: 'x.x.x.xx..x.x.xx x.x.x.xx..x.x.xx x.x.x.xx..x.x.xx x...x...x...xxxx',
  snare: '....x.......x... ....x.......x... ....x.......x... ....x...x...x.x.',
  hat: 'x.x.x.x.x.x.x.x. x.x.x.x.x.x.x.x. x.x.x.x.x.x.x.x. x.x.x.x.x.x.x.x.',
};
