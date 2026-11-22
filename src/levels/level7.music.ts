import type { Track } from '../render/tracks';

export const LEVEL7_MUSIC: Track = {
  title: 'Hunting Grounds',
  bpm: 132,
  root: 35,
  drive: 45,
  guitar: `
    0 - - . 0 . 0 . 1 - - . 0 . 0 .
    0 - - . 0 . 0 . 3 - - . 1 . 0 .
    0 - - . 0 . 0 . 1 - - . 0 . 0 .
    6 - - - 5 - - - 1 - - - 0 - - -`,
  bass: `
    0 - - . 0 . 0 . 1 - - . 0 . 0 .
    0 - - . 0 . 0 . 3 - - . 1 . 0 .
    0 - - . 0 . 0 . 1 - - . 0 . 0 .
    6 - - - 5 - - - 1 - - - 0 - - -`,
  lead: `
    . . . . . . . . . . . . . . . .
    36 - - - - - - - 35 - - - - - - -
    . . . . . . . . . . . . . . . .
    37 - - - 36 - - - 32 - - - 31 - - -`,
  kick: 'x...x.x.x...x.x. x...x.x.x...x.x. x...x.x.x...x.x. x.x.x.x.x.x.xxxx',
  snare: '....x.......x... ....x.......x... ....x.......x... ....x.......x.x.',
  hat: '..x...x...x...x. ..x...x...x...x. ..x...x...x...x. x.x.x.x.x.x.x.x.',
};
