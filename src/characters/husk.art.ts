import type { CharacterArt } from './art';
import { humanoid, humanoidCorpse, type Outfit } from './humanoid.art';

const HUSK_OUTFIT: Outfit = {
  skin: 0x9fae8c,
  body: 0x6b6352,
  legs: 0x524b3e,
  boots: 0x2c2620,
  head: 'bare',
  helmet: 0,
  visor: 0,
  eyes: 0xff2a14,
  belt: 0x3a3226,
  weapon: 'pistol',
  spikes: -1,
  blood: true,
  claws: false,
  pad: -1,
};

export const HUSK_ART: CharacterArt = {
  frame: (dir, frame) => humanoid(HUSK_OUTFIT, dir, frame, 'husk'),
  corpse: () => humanoidCorpse('husk', HUSK_OUTFIT.body, HUSK_OUTFIT.skin, (q) => q.rect(14, 16, 9, 2, 0x2c2e33)),
};
