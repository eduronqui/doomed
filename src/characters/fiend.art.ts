import type { CharacterArt } from './art';
import { humanoid, humanoidCorpse, type Outfit } from './humanoid.art';

const FIEND_OUTFIT: Outfit = {
  skin: 0x8a5634,
  body: 0x7a4a2c,
  legs: 0x6a3e24,
  boots: 0x4a2a18,
  head: 'spiked',
  helmet: 0,
  visor: 0,
  eyes: 0xffc030,
  belt: 0x5a321c,
  weapon: 'none',
  spikes: 0xe2d6b4,
  blood: false,
  claws: true,
  pad: -1,
};

export const FIEND_ART: CharacterArt = {
  frame: (dir, frame) => humanoid(FIEND_OUTFIT, dir, frame, 'fiend'),
  corpse: () => humanoidCorpse('fiend', FIEND_OUTFIT.body, FIEND_OUTFIT.skin, (q) => q.set(24, 18, 0xe2d6b4).set(26, 19, 0xe2d6b4)),
};
