import type { CharacterArt } from './art';
import { humanoid, humanoidCorpse, type Outfit } from './humanoid.art';
import { teamById, type TeamId } from '../sim/players';

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

const BLUE_OUTFIT: Outfit = {
  ...MARINE_OUTFIT,
  body: 0x3a5a9a,
  legs: 0x2c4472,
  helmet: 0x4a72b8,
  pad: 0x6a92d0,
};

const TEAM_OUTFITS: Record<TeamId, Outfit> = { green: MARINE_OUTFIT, blue: BLUE_OUTFIT };

export function marineArt(team: TeamId): CharacterArt {
  const outfit = TEAM_OUTFITS[team];
  const name = teamById(team).sprite;
  return {
    frame: (dir, frame, held = 'pistol') => humanoid({ ...outfit, weapon: held }, dir, frame, name),
    corpse: () => humanoidCorpse(name, outfit.body, outfit.skin, (q) => q.rect(14, 16, 9, 2, 0x2c2e33)),
  };
}

export const MARINE_ART: CharacterArt = marineArt('green');
