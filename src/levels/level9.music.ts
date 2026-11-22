import type { Track } from '../render/tracks';

export const LEVEL9_MUSIC: Track = {
  title: 'Iron Bastion',
  bpm: 138,
  root: 34,
  drive: 62,
  guitar: `
    0 . . 0 . . 0 . 1 . . 1 . . 3 .
    0 . . 0 . . 0 . 1 . . 1 . . 5 .
    0 . . 0 . . 0 . 1 . . 1 . . 3 .
    6 - - - - - 5 - 3 - - - 1 - - -`,
  bass: `
    0 . . 0 . . 0 . 1 . . 1 . . 3 .
    0 . . 0 . . 0 . 1 . . 1 . . 5 .
    0 . . 0 . . 0 . 1 . . 1 . . 3 .
    6 - - - - - 5 - 3 - - - 1 - - -`,
  lead: `
    . . . . . . . . . . . . . . . .
    24 - - - - - - - 25 - - - 27 - - -
    . . . . . . . . . . . . . . . .
    30 - - - 29 - - - 25 - - - 24 - - -`,
  kick: 'x..x..x.x..x..x. x..x..x.x..x..x. x..x..x.x..x..x. x.x.x.x.x.x.xxxx',
  snare: '....x.......x... ....x.......x... ....x.......x... ....x.......xxxx',
  hat: 'x.x.x.x.x.x.x.x. x.x.x.x.x.x.x.x. x.x.x.x.x.x.x.x. x.x.x.x.x.x.x.x.',
};
