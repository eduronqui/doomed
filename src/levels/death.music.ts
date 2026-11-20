import type { Track } from '../render/tracks';

export const DEATH_MUSIC: Track = {
  title: 'You Died',
  bpm: 60,
  root: 38,
  drive: 45,
  guitar: `
    0 - - - -4 - - - -5 - - - - - - -
    0 - - - -4 - - - -5 - - - -1 - - -`,
  bass: `
    0 - - - -4 - - - -5 - - - - - - -
    0 - - - -4 - - - -5 - - - -1 - - -`,
  lead: `
    . . . . . . . . 24 - 22 - 20 - 19 -
    19 - - - - - - - 22 - 20 - 19 - - -`,
  kick: 'x...x...x....... x...x...x...x...',
  snare: '........x....... ........x.......',
  hat: '................ ................',
};
