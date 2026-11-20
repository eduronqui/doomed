import type { CharacterArt } from './art';
import { humanoid, humanoidCorpse, type Outfit } from './humanoid.art';

const MARINE_OUTFIT: Outfit = {
  skin: 0xd8a47a,
  body: 0x4f7a3a,
  legs: 0x3b5a2c,
  boots: 0x3a2e24,
  head: 'helmet',
  helmet: 0x5a8a42,
  visor: 0xffb040,
  eyes: 0,
  belt: 0x5a4630,
  weapon: 'pistol',
  spikes: -1,
  blood: false,
  claws: false,
  pad: 0x6e9a52,
};

export const MARINE_ART: CharacterArt = {
  frame: (dir, frame, held = 'pistol') => humanoid({ ...MARINE_OUTFIT, weapon: held }, dir, frame, 'marine'),
  corpse: () => humanoidCorpse('marine', MARINE_OUTFIT.body, MARINE_OUTFIT.skin, (q) => q.rect(14, 16, 9, 2, 0x2c2e33)),
};
