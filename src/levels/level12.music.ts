import type { Track } from '../render/tracks';

export const LEVEL12_MUSIC: Track = {
  title: 'The Gate',
  bpm: 172,
  root: 33,
  drive: 75,
  guitar: `
    0 0 0 0 0 0 1 0 0 0 0 0 0 0 3 1
    0 0 0 0 0 0 1 0 0 0 0 0 6 5 3 1
    0 0 0 0 0 0 1 0 0 0 0 0 0 0 3 1
    6 6 6 6 5 5 5 5 3 3 3 3 1 1 1 1`,
  bass: `
    0 0 0 0 0 0 1 0 0 0 0 0 0 0 3 1
    0 0 0 0 0 0 1 0 0 0 0 0 6 5 3 1
    0 0 0 0 0 0 1 0 0 0 0 0 0 0 3 1
    6 6 6 6 5 5 5 5 3 3 3 3 1 1 1 1`,
  lead: `
    36 - - - 37 - - - 36 - - - 33 - - -
    36 - - - 37 - - - 40 - - - 39 - 37 -
    36 - - - 37 - - - 36 - - - 33 - - -
    42 - - - 41 - - - 40 - - - 37 - - -`,
  kick: 'xxxxxxxxxxxxxxxx xxxxxxxxxxxxxxxx xxxxxxxxxxxxxxxx xxxxxxxxx.x.x.x.',
  snare: '....x.......x... ....x.......x... ....x.......x... ....x.x.x.x.xxxx',
  hat: 'x.x.x.x.x.x.x.x. x.x.x.x.x.x.x.x. x.x.x.x.x.x.x.x. xxxxxxxxxxxxxxxx',
};
