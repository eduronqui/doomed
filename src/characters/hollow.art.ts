import type { Dir } from '../sim/types';
import { Pix, seeded, shade } from '../render/pixel';
import type { CharacterArt } from './art';
import type { Frame } from './humanoid.art';

const ROBE = 0x2a2236;
const ROBE_HI = 0x4a3e5c;
const HOOD = 0x1a1424;
const EYE = 0xb8f0ff;

function hollow(dir: Dir, frame: Frame): Pix {
  const p = new Pix(32, 32);
  const bob = frame === 1 ? -1 : frame === 2 ? 1 : 0;
  const rng = seeded(`hollow${dir}${frame}`);
  for (let y = 10; y < 28; y++) {
    const half = 4 + (y - 10) * 0.45;
    for (let x = Math.round(16 - half); x <= Math.round(16 + half); x++) {
      if (y > 24 && rng.chance(0.35)) continue;
      p.set(x, y + bob, x < 16 ? ROBE : shade(ROBE, -0.15));
    }
  }
  p.ellipse(16, 9 + bob, 5, 5, HOOD).rect(12, 10 + bob, 1, 12, ROBE_HI);
  if (dir === 's') p.set(14, 9 + bob, EYE).set(18, 9 + bob, EYE);
  else if (dir === 'e') p.set(19, 9 + bob, EYE);
  else if (dir === 'w') p.set(13, 9 + bob, EYE);
  if (frame === 3) p.rect(dir === 'w' ? 7 : 21, 13 + bob, 4, 2, EYE);
  return p.outline(0x0a0810);
}

function hollowCorpse(): Pix {
  const p = new Pix(32, 32);
  p.ellipse(16, 22, 10, 4, ROBE).ellipse(14, 21, 5, 2, ROBE_HI).ellipse(20, 22, 3, 2, HOOD);
  return p.outline(0x0a0810);
}

export const HOLLOW_ART: CharacterArt = {
  frame: (dir, frame) => hollow(dir, frame),
  corpse: hollowCorpse,
};
