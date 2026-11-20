import type { Track } from '../render/tracks';

export const LEVEL3_MUSIC: Track = {
  title: 'Ember Gate',
  bpm: 152,
  root: 37,
  drive: 55,
  guitar: `
    0 . 0 0 0 . 0 0 1 - 0 0 0 . 0 0
    0 . 0 0 0 . 0 0 3 - 1 - 0 . 0 0
    0 . 0 0 0 . 0 0 1 - 0 0 5 - 3 -
    7 - - - 6 - - - 1 - - - 0 - - -`,
  bass: `
    0 . 0 0 0 . 0 0 1 - 0 0 0 . 0 0
    0 . 0 0 0 . 0 0 3 - 1 - 0 . 0 0
    0 . 0 0 0 . 0 0 1 - 0 0 5 - 3 -
    7 - - - 6 - - - 1 - - - 0 - - -`,
  lead: `
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
    36 - - - 37 - - - 36 - 34 - 32 - - -
    31 - - - - - - - - - - - . . . .`,
  kick: 'x.xxx.xxx.xxx.xx x.xxx.xxx.xxx.xx x.xxx.xxx.xxx.xx x...x...x...x...',
  snare: '....x.......x... ....x.......x... ....x.......x... ....x...x...xxxx',
  hat: 'x.x.x.x.x.x.x.x. x.x.x.x.x.x.x.x. x.x.x.x.x.x.x.x. x.x.x.x.x.x.x.x.',
};
