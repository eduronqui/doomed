import type { CharacterArt } from './art';
import { humanoid, humanoidCorpse, type Frame, type Outfit } from './humanoid.art';
import { CLEAR, Pix } from '../render/pixel';
import type { Dir } from '../sim/types';
import type { WeaponId } from '../weapons';

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

const TEAM_PROBE: Pick<Outfit, 'body' | 'legs' | 'helmet' | 'pad'> = { body: 0xff00ff, legs: 0x00ffff, helmet: 0xffff00, pad: 0x0000ff };
export const TEAM_LIGHT = 137;

export interface MarineLayers {
  base: Pix;
  team: Pix;
}

export function luminance(color: number): number {
  return 0.299 * ((color >> 16) & 0xff) + 0.587 * ((color >> 8) & 0xff) + 0.114 * (color & 0xff);
}

export function splitTeamLayers(normal: Pix, probe: Pix): MarineLayers {
  const base = new Pix(normal.w, normal.h);
  const team = new Pix(normal.w, normal.h);
  for (let i = 0; i < normal.data.length; i++) {
    const c = normal.data[i];
    if (c === CLEAR) continue;
    const target = c === probe.data[i] ? base : team;
    const gray = Math.min(255, Math.round((255 * luminance(c)) / TEAM_LIGHT));
    target.data[i] = target === base ? c : (gray << 16) | (gray << 8) | gray;
    target.alpha[i] = normal.alpha[i];
  }
  return { base, team };
}

function corpse(body: number): Pix {
  return humanoidCorpse('marine', body, MARINE_OUTFIT.skin, (q) => q.rect(14, 16, 9, 2, 0x2c2e33));
}

export function marineLayers(dir: Dir, frame: Frame, held: WeaponId): MarineLayers {
  const normal = humanoid({ ...MARINE_OUTFIT, weapon: held }, dir, frame, 'marine');
  const probe = humanoid({ ...MARINE_OUTFIT, ...TEAM_PROBE, weapon: held }, dir, frame, 'marine');
  return splitTeamLayers(normal, probe);
}

export function marineCorpseLayers(): MarineLayers {
  return splitTeamLayers(corpse(MARINE_OUTFIT.body), corpse(TEAM_PROBE.body));
}

export const MARINE_ART: CharacterArt = {
  frame: (dir, frame, held = 'pistol') => humanoid({ ...MARINE_OUTFIT, weapon: held }, dir, frame, 'marine'),
  corpse: () => corpse(MARINE_OUTFIT.body),
};

