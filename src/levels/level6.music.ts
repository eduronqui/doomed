import type { Track } from '../render/tracks';

export const LEVEL6_MUSIC: Track = {
  title: 'Furnace Deck',
  bpm: 150,
  root: 36,
  drive: 60,
  guitar: `
    0 . 0 . 1 . 0 . 0 . 0 . 6 - 5 -
    0 . 0 . 1 . 0 . 0 . 0 . 3 - 1 -
    0 . 0 . 1 . 0 . 0 . 0 . 6 - 5 -
    8 - 7 - 6 - 5 - 3 - - - 1 - - -`,
  bass: `
    0 . 0 . 1 . 0 . 0 . 0 . 6 - 5 -
    0 . 0 . 1 . 0 . 0 . 0 . 3 - 1 -
    0 . 0 . 1 . 0 . 0 . 0 . 6 - 5 -
    8 - 7 - 6 - 5 - 3 - - - 1 - - -`,
  lead: `
    24 - - - 25 - - - 24 - - - 30 - 29 -
    . . . . . . . . . . . . . . . .
    24 - - - 25 - - - 27 - - - 25 - 24 -
    20 - - - - - - - . . . . . . . .`,
  kick: 'x.x.x.x.x.x.x.x. x.x.x.x.x.x.x.x. x.x.x.x.x.x.x.x. xxx.xxx.xxx.xxxx',
  snare: '....x.......x... ....x.......x... ....x.......x... ....x...x...x...',
  hat: 'x.xxx.xxx.xxx.xx x.xxx.xxx.xxx.xx x.xxx.xxx.xxx.xx x.x.x.x.x.x.x.x.',
};
