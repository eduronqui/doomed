import type { Dir } from '../sim/types';
import { Pix, shade } from '../render/pixel';
import type { CharacterArt } from './art';
import type { Frame } from './humanoid.art';

const CAPE = 0x161018;
const CAPE_HI = 0x2e2232;
const LINING = 0x5a0c24;
const ROBE = 0x2a1e30;
const SKIN = 0x9a9aa8;
const HORN = 0xd8ccb0;
const EYE = 0xd070ff;
const STAFF = 0x3a2a1c;
const ORB = 0xb050ff;
const ORB_HI = 0xf0c8ff;

function sorcerer(dir: Dir, frame: Frame): Pix {
  const p = new Pix(32, 32);
  const bob = frame === 1 ? -1 : frame === 2 ? 1 : 0;
  const flare = frame === 3 ? 2 : frame === 1 ? 1 : 0;
  const y0 = 8 + bob;
  for (let y = y0 + 4; y < 30; y++) {
    const half = 4 + (y - y0 - 4) * 0.42 + (y > 24 ? flare : 0);
    for (let x = Math.round(16 - half); x <= Math.round(16 + half); x++) {
      const edge = x <= Math.round(16 - half) + 1 || x >= Math.round(16 + half) - 1;
      p.set(x, y, dir === 'n' ? (edge ? CAPE_HI : CAPE) : edge ? LINING : CAPE);
    }
  }
  if (dir !== 'n') p.rect(14, y0 + 6, 5, 14, ROBE).rect(14, y0 + 6, 1, 14, shade(ROBE, 0.2));
  p.ellipse(16, y0 + 3, 3.5, 3.5, dir === 'n' ? CAPE_HI : SKIN);
  for (const [hx, hy] of [
    [12, y0 - 2],
    [16, y0 - 3],
    [20, y0 - 2],
  ]) p.rect(hx, hy, 1, 3, HORN).set(hx, hy, shade(HORN, 0.3));
  if (dir === 's') p.set(15, y0 + 3, EYE).set(17, y0 + 3, EYE);
  else if (dir === 'e') p.set(18, y0 + 3, EYE);
  else if (dir === 'w') p.set(14, y0 + 3, EYE);
  const sx = dir === 'w' ? 7 : 24;
  if (dir !== 'n') {
    p.rect(sx, y0 + 2, 1, 20, STAFF);
    p.ellipse(sx + 0.5, y0 + 1, 2, 2, frame === 3 ? ORB_HI : ORB).set(sx, y0, ORB_HI);
  }
  return p.outline(0x08060a);
}

function doubled(src: Pix): Pix {
  const p = new Pix(src.w * 2, src.h * 2);
  for (let y = 0; y < src.h; y++) {
    for (let x = 0; x < src.w; x++) {
      const c = src.get(x, y);
      if (c !== -1) p.rect(x * 2, y * 2, 2, 2, c, src.alpha[y * src.w + x]);
    }
  }
  return p;
}

function remains(): Pix {
  const p = new Pix(32, 32);
  p.ellipse(16, 22, 11, 4, CAPE).ellipse(14, 21, 6, 2, LINING).rect(6, 21, 20, 1, STAFF);
  p.ellipse(25, 21, 2, 2, shade(ORB, -0.5));
  for (const hx of [12, 15, 18]) p.rect(hx, 18, 1, 2, HORN);
  return p.outline(0x08060a);
}

export const GATEKEEPER_ART: CharacterArt = {
  frame: (dir, frame) => doubled(sorcerer(dir, frame)),
  corpse: () => doubled(remains()),
};
