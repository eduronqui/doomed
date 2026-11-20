import { rest, type Track } from '../render/tracks';

export const TRAINING_MUSIC: Track = {
  title: 'Boot Camp',
  bpm: 100,
  root: 45,
  drive: 12,
  guitar: `
    0 - . . 0 - . . 3 - . . 5 - . .
    0 - . . 0 - . . 7 - 5 - 3 - . .`,
  bass: `
    0 . 0 . 0 . 0 . 3 . 3 . 5 . 5 .
    0 . 0 . 0 . 0 . 7 . 5 . 3 . 3 .`,
  lead: rest(2),
  kick: 'x.......x.x..... x.......x.x.....',
  snare: '....x.......x... ....x.......x...',
  hat: 'x.x.x.x.x.x.x.x. x.x.x.x.x.x.x.x.',
};
