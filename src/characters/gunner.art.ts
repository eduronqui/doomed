import type { CharacterArt } from './art';
import { humanoid, humanoidCorpse, type Outfit } from './humanoid.art';

const GUNNER_OUTFIT: Outfit = {
  skin: 0x9a8a80,
  body: 0x3a3a42,
  legs: 0x2c2c32,
  boots: 0x18181c,
  head: 'helmet',
  helmet: 0x4a4a54,
  visor: 0xff3020,
  eyes: 0xff3020,
  belt: 0x5a4a20,
  weapon: 'rotary',
  spikes: -1,
  blood: true,
  claws: false,
  pad: 0x6a6a74,
};

export const GUNNER_ART: CharacterArt = {
  frame: (dir, frame) => humanoid(GUNNER_OUTFIT, dir, frame, 'gunner'),
  corpse: () => humanoidCorpse('gunner', GUNNER_OUTFIT.body, GUNNER_OUTFIT.skin, (q) => q.rect(12, 16, 12, 3, 0x4a4d54).rect(12, 16, 12, 1, 0x7a7e88)),
};
