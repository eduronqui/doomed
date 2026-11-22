import type { Dir } from '../sim/types';
import { Pix, shade } from '../render/pixel';
import type { CharacterArt } from './art';
import type { Frame } from './humanoid.art';

const S = 64;
const OUTLINE = 0x08060a;
const CAPE = 0x1c1426;
const CAPE_HI = 0x34283f;
const CAPE_DK = 0x0e0a14;
const LINING = 0x7a1022;
const LINING_HI = 0xa81c30;
const ARMOR = 0x2e2a3c;
const ARMOR_HI = 0x4e4862;
const ARMOR_DK = 0x1a1724;
const SLEEVE = 0x241c30;
const GOLD = 0xb8903a;
const GOLD_HI = 0xe8c060;
const SKIN = 0x8e93a6;
const SKIN_DK = 0x5e6276;
const HORN = 0xd6c8a8;
const HORN_DK = 0x8a7e66;
const EYE = 0xe080ff;
const GEM = 0xb040ff;
const GEM_HI = 0xf6d0ff;
const STAFF = 0x3a2c22;
const STAFF_HI = 0x5a4634;
const AURA_ALPHA = 80;
const BASE_DROP = 2;

function lit(p: Pix, cx: number, cy: number, rx: number, ry: number, base: number): void {
  p.ellipse(cx, cy, rx, ry, (_x, _y, nx, ny) => {
    if (ny < -0.4 && nx < 0.3) return shade(base, 0.25);
    if (ny > 0.5 || nx > 0.55) return shade(base, -0.35);
    return base;
  });
}

function thick(p: Pix, pts: [number, number][], color: number, width: number): void {
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const w = Math.max(1, Math.round(width * (1 - i / pts.length)));
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2;
    for (let s = 0; s <= steps; s++) {
      const x = x0 + ((x1 - x0) * s) / steps;
      const y = y0 + ((y1 - y0) * s) / steps;
      p.rect(Math.round(x - w / 2), Math.round(y - w / 2), w, w, color);
    }
  }
}

function horns(p: Pix, cx: number, top: number, profile: boolean): void {
  const left: [number, number][] = [
    [cx - 4, top + 2],
    [cx - 9, top],
    [cx - 12, top - 3],
    [cx - 13, top - 7],
    [cx - 11, top - 11],
  ];
  thick(p, left, HORN, 4);
  thick(p, left.map(([x, y]) => [x + 1, y + 1]), HORN_DK, 1);
  if (profile) return;
  const right = left.map(([x, y]) => [2 * cx - x, y] as [number, number]);
  thick(p, right, HORN, 4);
  thick(p, right.map(([x, y]) => [x - 1, y + 1]), HORN_DK, 1);
  p.rect(cx, top - 3, 1, 4, HORN).set(cx, top - 3, shade(HORN, 0.3));
}

function cape(p: Pix, cx: number, top: number, bottom: number, spread: number, sway: number, lining: boolean): void {
  for (let y = top; y <= bottom; y++) {
    const half = 9 + (y - top) * spread;
    const x0 = Math.round(cx - half);
    const x1 = Math.round(cx + half);
    for (let x = x0; x <= x1; x++) {
      const hem = bottom - ((x + sway) % 6 < 3 ? 0 : 2);
      if (y > hem) continue;
      const edge = x - x0 < 2 || x1 - x < 2;
      const fold = y > top + 8 && (x - cx + 64) % 7 === 0;
      const foldHi = y > top + 8 && (x - cx + 64) % 7 === 1;
      p.set(x, y, edge && lining ? LINING : fold ? CAPE_DK : foldHi ? CAPE_HI : CAPE);
    }
  }
}

function staff(p: Pix, x: number, top: number, bottom: number, casting: boolean): void {
  p.rect(x, top + 4, 2, bottom - top - 4, STAFF).rect(x, top + 4, 1, bottom - top - 4, STAFF_HI);
  for (const y of [top + 10, bottom - 12]) p.rect(x - 1, y, 4, 2, GOLD).rect(x - 1, y, 4, 1, GOLD_HI);
  thick(p, [[x - 2, top + 5], [x - 3, top + 1]], GOLD, 1);
  thick(p, [[x + 3, top + 5], [x + 4, top + 1]], GOLD, 1);
  lit(p, x + 0.5, top + 1, casting ? 4 : 3.2, casting ? 4 : 3.2, GEM);
  p.ellipse(x - 0.5, top, 1.4, 1.4, GEM_HI);
}

function face(p: Pix, cx: number, cy: number): void {
  lit(p, cx, cy, 6, 7, SKIN);
  p.rect(cx - 4, cy - 2, 9, 1, SKIN_DK);
  p.rect(cx - 4, cy - 1, 3, 1, EYE).rect(cx + 2, cy - 1, 3, 1, EYE).set(cx - 3, cy - 1, GEM_HI).set(cx + 3, cy - 1, GEM_HI);
  p.set(cx - 3, cy, SKIN_DK).set(cx + 3, cy, SKIN_DK);
  p.rect(cx - 1, cy + 3, 3, 1, 0x2a1020);
  p.rect(cx - 6, cy - 7, 13, 3, ARMOR).rect(cx - 6, cy - 5, 13, 1, GOLD).set(cx, cy - 6, GEM);
}

function collar(p: Pix, cx: number, base: number): void {
  for (const side of [-1, 1]) {
    for (let i = 0; i < 8; i++) {
      const w = Math.round(3 - i / 4);
      const x = cx + side * (9 + Math.round(i / 3));
      p.rect(side < 0 ? x - w : x, base - i, w, 1, i < 2 ? CAPE : LINING);
      p.set(side < 0 ? x - w : x + w - 1, base - i, CAPE);
    }
  }
}

function front(p: Pix, frame: Frame, oy: number, back: boolean): void {
  const casting = frame === 3;
  const sway = frame === 1 ? 1 : frame === 2 ? 4 : 0;
  const cx = 32;
  cape(p, cx, 16 + oy, 56 + oy, 0.45, sway, !back);
  if (back) {
    p.rect(cx - 1, 26 + oy, 2, 24, CAPE_DK);
    for (let i = 0; i < 6; i++) p.rect(cx - i, 34 + oy + i, 2 * i + 1, 1, i === 5 ? LINING_HI : LINING);
    for (let i = 0; i < 5; i++) p.rect(cx - 4 + i, 40 + oy + i, 9 - 2 * i, 1, LINING);
  } else {
    for (let y = 34; y <= 54; y++) {
      const half = 7 + (y - 34) * 0.35;
      p.rect(Math.round(cx - half), y + oy, Math.round(half * 2) + 1, 1, y === 54 ? GOLD : ARMOR_DK);
    }
    p.rect(cx, 38 + oy, 1, 16, GOLD);
    for (let y = 41; y < 54; y += 5) p.rect(cx - 1, y + oy, 3, 1, GOLD).set(cx, y + oy - 1, GOLD_HI).set(cx, y + oy + 1, GOLD_HI);
    lit(p, cx, 29 + oy, 8, 8, ARMOR);
    lit(p, cx, 27 + oy, 6, 4.5, ARMOR_HI);
    p.ellipse(cx, 28 + oy, 2, 2, casting ? GEM_HI : GEM);
    p.rect(cx - 8, 36 + oy, 17, 2, GOLD).rect(cx - 1, 35 + oy, 3, 4, GOLD_HI);
  }
  for (const side of [-1, 1]) {
    const px = cx + side * 10;
    lit(p, px, 23 + oy, 6.5, 4.5, ARMOR_HI);
    thick(p, [[px + side * 4, 21 + oy], [px + side * 8, 18 + oy], [px + side * 9, 14 + oy]], HORN, 3);
  }
  const staffX = back ? 47 : 15;
  if (!back) {
    p.rect(17, 26 + oy, 5, 14, SLEEVE).rect(17, 26 + oy, 1, 14, shade(SLEEVE, 0.25));
    lit(p, 18, 41 + oy, 3, 2.5, SKIN_DK);
  }
  staff(p, staffX, 6 + oy, 58 + oy, casting);
  if (casting && !back) {
    thick(p, [[44, 24 + oy], [49, 18 + oy], [52, 13 + oy]], SLEEVE, 5);
    lit(p, 53, 11 + oy, 2.5, 2.5, SKIN_DK);
    lit(p, 54, 8 + oy, 4, 4, EYE);
    p.ellipse(54, 8 + oy, 1.6, 1.6, GEM_HI);
  } else if (!back) {
    p.rect(42, 26 + oy, 5, 13, SLEEVE).rect(46, 26 + oy, 1, 13, shade(SLEEVE, -0.3));
    lit(p, 44, 40 + oy, 3, 2.5, SKIN_DK);
    p.set(44, 43 + oy, EYE);
  }
  collar(p, cx, 22 + oy);
  if (back) {
    lit(p, cx, 16 + oy, 5.5, 6, CAPE_HI);
    p.rect(cx - 5, 11 + oy, 11, 2, ARMOR).rect(cx - 5, 12 + oy, 11, 1, GOLD);
  } else face(p, cx, 17 + oy);
  horns(p, cx, 11 + oy, false);
}

function side(p: Pix, frame: Frame, oy: number): void {
  const casting = frame === 3;
  const sway = frame === 1 ? 1 : frame === 2 ? 4 : 0;
  for (let y = 18; y <= 56; y++) {
    const x0 = Math.round(26 - (y - 18) * 0.55);
    const x1 = 34;
    for (let x = x0; x <= x1; x++) {
      const hem = 56 - ((x + sway) % 6 < 3 ? 0 : 2);
      if (y > hem) continue;
      const fold = y > 26 && (x + 64) % 6 === 0;
      p.set(x, y + oy, x - x0 < 2 ? LINING : fold ? CAPE_DK : CAPE);
    }
  }
  for (let y = 34; y <= 54; y++) p.rect(28, y + oy, 9 + Math.round((y - 34) * 0.2), 1, y === 54 ? GOLD : ARMOR_DK);
  lit(p, 33, 29 + oy, 6, 8, ARMOR);
  p.rect(36, 27 + oy, 2, 2, casting ? GEM_HI : GEM);
  p.rect(27, 36 + oy, 12, 2, GOLD);
  lit(p, 31, 23 + oy, 6, 4.5, ARMOR_HI);
  thick(p, [[27, 21 + oy], [23, 18 + oy], [22, 14 + oy]], HORN, 3);
  for (let i = 0; i < 8; i++) p.rect(26 - Math.round(i / 3), 22 + oy - i, 3, 1, i < 2 ? CAPE : LINING);
  lit(p, 35, 17 + oy, 4.5, 6, SKIN);
  p.set(39, 18 + oy, SKIN).rect(36, 16 + oy, 2, 1, EYE).rect(36, 21 + oy, 2, 1, 0x2a1020);
  p.rect(31, 11 + oy, 8, 3, ARMOR).rect(31, 13 + oy, 8, 1, GOLD);
  horns(p, 36, 11 + oy, true);
  if (casting) {
    thick(p, [[37, 25 + oy], [43, 21 + oy], [48, 18 + oy]], SLEEVE, 4);
    lit(p, 50, 16 + oy, 4, 4, EYE);
    p.ellipse(50, 16 + oy, 1.6, 1.6, GEM_HI);
    staff(p, 42, 8 + oy, 58 + oy, true);
  } else {
    p.rect(36, 26 + oy, 4, 12, SLEEVE);
    lit(p, 41, 37 + oy, 2.5, 2.5, SKIN_DK);
    staff(p, 42, 8 + oy, 58 + oy, false);
  }
}

function sorcerer(dir: Dir, frame: Frame): Pix {
  if (dir === 'w') return sorcerer('e', frame).mirror();
  const p = new Pix(S, S);
  const oy = BASE_DROP + (frame === 1 ? -1 : frame === 2 ? 1 : 0);
  if (dir === 'e') side(p, frame, oy);
  else front(p, frame, oy, dir === 'n');
  p.outline(OUTLINE);
  const aura = new Pix(S, S);
  aura.ellipse(32, 59 + BASE_DROP, frame === 3 ? 22 : 18, 2.5, GEM, frame === 3 ? AURA_ALPHA + 40 : AURA_ALPHA);
  return aura.blit(p, 0, 0);
}

function remains(): Pix {
  const p = new Pix(S, S);
  p.ellipse(32, 50, 24, 7, (_x, _y, nx) => (Math.abs(nx) > 0.8 ? LINING : CAPE));
  p.ellipse(28, 48, 9, 3, CAPE_HI);
  thick(p, [[8, 54], [30, 49], [55, 44]], STAFF, 2);
  p.ellipse(56, 43, 3, 3, shade(GEM, -0.5));
  lit(p, 40, 45, 5, 4, ARMOR);
  thick(p, [[37, 43], [33, 39], [31, 35]], HORN, 3);
  thick(p, [[43, 43], [47, 39], [49, 35]], HORN, 3);
  p.rect(36, 44, 9, 1, GOLD);
  return p.outline(OUTLINE);
}

export const GATEKEEPER_ART: CharacterArt = {
  frame: (dir, frame) => sorcerer(dir, frame),
  corpse: remains,
};
