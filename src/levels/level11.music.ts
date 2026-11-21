import type { Track } from '../render/tracks';

export const LEVEL11_MUSIC: Track = {
  title: 'The Gauntlet',
  bpm: 164,
  root: 37,
  drive: 70,
  guitar: `
    0 0 0 0 1 1 0 0 3 3 1 1 0 0 6 5
    0 0 0 0 1 1 0 0 3 3 5 5 6 6 5 3
    0 0 0 0 1 1 0 0 3 3 1 1 0 0 6 5
    8 - 7 - 6 - 5 - 6 - 5 - 3 - 1 -`,
  bass: `
    0 0 0 0 1 1 0 0 3 3 1 1 0 0 6 5
    0 0 0 0 1 1 0 0 3 3 5 5 6 6 5 3
    0 0 0 0 1 1 0 0 3 3 1 1 0 0 6 5
    8 - 7 - 6 - 5 - 6 - 5 - 3 - 1 -`,
  lead: `
    36 - 37 - 36 - 34 - 33 - - - 31 - - -
    36 - 37 - 39 - 37 - 36 - - - - - - -
    36 - 37 - 36 - 34 - 33 - - - 31 - - -
    32 - 31 - 30 - 29 - 30 - - - 24 - - -`,
  kick: 'x.x.x.x.xx.x.x.x x.x.x.x.xx.x.x.x x.x.x.x.xx.x.x.x xxxxxxxxxxxxxxxx',
  snare: '....x.......x... ....x.......x... ....x.......x... ....x.x.x.x.xxxx',
  hat: 'xxxxxxxxxxxxxxxx xxxxxxxxxxxxxxxx xxxxxxxxxxxxxxxx x.x.x.x.x.x.x.x.',
};
