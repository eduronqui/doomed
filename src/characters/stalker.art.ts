import type { CharacterArt } from './art';
import { humanoid, humanoidCorpse, type Outfit } from './humanoid.art';

const STALKER_OUTFIT: Outfit = {
  skin: 0x5a4a6a,
  body: 0x2e2236,
  legs: 0x241a2c,
  boots: 0x140c18,
  head: 'spiked',
  helmet: 0,
  visor: 0,
  eyes: 0xff3060,
  belt: 0x1e1424,
  weapon: 'none',
  spikes: 0x9a8ab0,
  blood: false,
  claws: true,
  pad: -1,
};

export const STALKER_ART: CharacterArt = {
  frame: (dir, frame) => humanoid(STALKER_OUTFIT, dir, frame, 'stalker'),
  corpse: () => humanoidCorpse('stalker', STALKER_OUTFIT.body, STALKER_OUTFIT.skin, (q) => q.set(24, 18, 0x9a8ab0).set(26, 19, 0x9a8ab0)),
};
