import type { Dir } from '../sim/types';
import { Pix, shade } from '../render/pixel';
import type { CharacterArt } from './art';
import { OUTLINE, bloodPool, shadedRect, type Frame } from './humanoid.art';

export const BRUTE_PALETTE = {
  skin: 0x8e3a2c,
  light: 0xb85a40,
  dark: 0x5a2018,
  belly: 0xc87a58,
  bone: 0xe6dcc0,
  boneDark: 0x9a8e70,
  eye: 0xffe040,
  mouth: 0x2a0606,
  foot: 0x2a1410,
};

function muscle(p: Pix, cx: number, cy: number, rx: number, ry: number, base = BRUTE_PALETTE.skin): void {
  p.ellipse(cx, cy, rx, ry, (_x, _y, nx, ny) => {
    if (ny < -0.45 && nx < 0.35) return shade(base, 0.22);
    if (ny > 0.55 || nx > 0.6) return shade(base, -0.35);
    return base;
  });
}

function bruteLegs(p: Pix, xs: [number, number], frame: Frame): void {
  xs.forEach((x, i) => {
    const lift = (frame === 1 && i === 0) || (frame === 2 && i === 1) ? 1 : 0;
    shadedRect(p, x, 23 - lift, 4, 5, i === 0 ? shade(BRUTE_PALETTE.skin, -0.15) : BRUTE_PALETTE.skin);
    p.rect(x - 1, 28 - lift, 5, 2, BRUTE_PALETTE.foot);
  });
}

function bruteFront(p: Pix, frame: Frame, back: boolean): void {
  const B = BRUTE_PALETTE;
  const attack = frame === 3;
  const swing = frame === 1 ? 1 : frame === 2 ? -1 : 0;
  bruteLegs(p, [10, 18], frame);
  if (attack) {
    shadedRect(p, 3, 6, 4, 9, B.skin);
    shadedRect(p, 25, 6, 4, 9, B.skin);
  } else {
    shadedRect(p, 3, 15 + swing, 4, 8, B.skin);
    shadedRect(p, 25, 15 - swing, 4, 8, B.skin);
  }
  muscle(p, 16, 18, 8.5, 6.5);
  muscle(p, 7, 13, 4, 3.5);
  muscle(p, 25, 13, 4, 3.5);
  if (back) {
    p.line(12, 14, 14, 20, B.dark).line(20, 14, 18, 20, B.dark);
    for (let y = 12; y <= 22; y += 2) p.set(16, y, B.bone).set(16, y + 1, B.boneDark);
  } else {
    p.ellipse(16, 20, 4.5, 3.5, B.belly);
    p.rect(16, 18, 1, 5, shade(B.belly, -0.25)).rect(13, 20, 7, 1, shade(B.belly, -0.2));
    p.ellipse(12.5, 15, 3.2, 2, shade(B.skin, 0.12)).ellipse(19.5, 15, 3.2, 2, shade(B.skin, 0.05));
  }
  for (const [x, y] of [
    [6, 9],
    [6, 10],
    [7, 10],
    [26, 9],
    [26, 10],
    [25, 10],
  ]) {
    p.set(x, y, B.bone);
  }
  const clawY = attack ? 5 : 23;
  for (const x of [3, 5, 25, 27]) p.set(x, clawY + (attack ? 0 : x < 16 ? swing : -swing), B.bone);
  muscle(p, 16, 11, 4.5, 3.8, shade(B.skin, -0.05));
  for (const [x, y] of [
    [12, 9],
    [11, 8],
    [10, 7],
    [10, 6],
    [10, 5],
    [11, 4],
  ]) {
    p.set(x, y, B.bone).set(32 - x, y, B.bone);
  }
  p.set(11, 3, B.boneDark).set(21, 3, B.boneDark);
  if (back) return;
  p.rect(13, 9, 7, 1, B.dark);
  p.set(14, 10, B.eye).set(18, 10, B.eye);
  if (attack) {
    p.rect(13, 12, 7, 3, B.mouth);
    for (const x of [13, 15, 17, 19]) p.set(x, 12, B.bone);
    for (const x of [14, 16, 18]) p.set(x, 14, B.bone);
  } else {
    p.rect(14, 13, 5, 1, B.mouth);
    p.set(13, 12, B.bone).set(13, 13, B.bone).set(19, 12, B.bone).set(19, 13, B.bone);
  }
}

function bruteSide(p: Pix, frame: Frame): void {
  const B = BRUTE_PALETTE;
  const attack = frame === 3;
  const step = frame === 1 ? 1 : frame === 2 ? -1 : 0;
  bruteLegs(p, [10 - step, 17 + step], frame);
  muscle(p, 15, 18, 8, 6.5);
  muscle(p, 11, 13, 5.5, 4.5);
  p.ellipse(18, 20, 3.5, 3, B.belly);
  for (const [x, y] of [
    [8, 9],
    [9, 8],
    [11, 8],
    [12, 7],
    [14, 8],
  ]) {
    p.set(x, y, B.bone);
  }
  muscle(p, 23, 15, 4.5, 3.5, shade(B.skin, -0.05));
  for (const [x, y] of [
    [22, 11],
    [21, 10],
    [20, 9],
    [19, 8],
    [18, 8],
  ]) {
    p.set(x, y, B.bone);
  }
  p.set(17, 8, B.boneDark);
  p.rect(23, 13, 3, 1, B.dark).set(24, 14, B.eye);
  if (attack) {
    p.rect(24, 16, 4, 3, B.mouth);
    p.set(24, 16, B.bone).set(26, 16, B.bone).set(25, 18, B.bone).set(27, 18, B.bone);
    shadedRect(p, 18, 13, 9, 3, B.skin);
    p.set(27, 12, B.bone).set(28, 13, B.bone).set(27, 15, B.bone);
  } else {
    p.rect(24, 17, 4, 1, B.mouth);
    p.set(26, 16, B.bone).set(26, 15, B.bone);
    shadedRect(p, 17, 14 + Math.max(0, step), 3, 9, B.skin);
    p.set(17, 23 + Math.max(0, step), B.bone).set(19, 23 + Math.max(0, step), B.bone);
  }
}

function brute(dir: Dir, frame: Frame): Pix {
  if (dir === 'w') return brute('e', frame).mirror();
  const p = new Pix(32, 32);
  if (dir === 'e') bruteSide(p, frame);
  else bruteFront(p, frame, dir === 'n');
  return p.outline(OUTLINE);
}

function bruteCorpse(): Pix {
  const q = new Pix(32, 32);
  muscle(q, 15, 21, 9, 4.5);
  muscle(q, 23, 20, 3.5, 3, shade(BRUTE_PALETTE.skin, -0.05));
  q.ellipse(14, 22, 4, 2, BRUTE_PALETTE.belly);
  for (const [x, y] of [
    [24, 17],
    [25, 16],
    [26, 15],
    [22, 17],
    [21, 16],
  ]) {
    q.set(x, y, BRUTE_PALETTE.bone);
  }
  q.rect(24, 21, 3, 1, BRUTE_PALETTE.mouth).set(9, 18, BRUTE_PALETTE.bone).set(11, 17, BRUTE_PALETTE.bone).set(13, 17, BRUTE_PALETTE.bone);
  q.rect(5, 22, 3, 2, BRUTE_PALETTE.skin).set(4, 23, BRUTE_PALETTE.bone).set(4, 24, BRUTE_PALETTE.bone);
  q.outline(OUTLINE);
  return bloodPool('brute').blit(q, 0, 0);
}

export const BRUTE_ART: CharacterArt = {
  frame: (dir, frame) => brute(dir, frame),
  corpse: bruteCorpse,
};
