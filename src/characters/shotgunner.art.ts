import type { CharacterArt } from './art';
import { humanoid, humanoidCorpse, type Outfit } from './humanoid.art';

const SHOTGUNNER_OUTFIT: Outfit = {
  skin: 0x9fae8c,
  body: 0x3e4a36,
  legs: 0x33392c,
  boots: 0x1e1c18,
  head: 'bare',
  helmet: 0,
  visor: 0,
  eyes: 0xff2a14,
  belt: 0x5a3a20,
  weapon: 'shotgun',
  spikes: -1,
  blood: true,
  claws: false,
  pad: 0x5a3a20,
};

export const SHOTGUNNER_ART: CharacterArt = {
  frame: (dir, frame) => humanoid(SHOTGUNNER_OUTFIT, dir, frame, 'shotgunner'),
  corpse: () => humanoidCorpse('shotgunner', SHOTGUNNER_OUTFIT.body, SHOTGUNNER_OUTFIT.skin, (q) => q.rect(13, 16, 11, 2, 0x2c2e33).rect(13, 18, 3, 1, 0x5a3e24)),
};
