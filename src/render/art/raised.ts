import { CLEAR, Pix, shade } from '../pixel';
import { TILE, floorTexture } from './tiles';

export const RAISE = 12;
export const STAIR_FLOORS = ['metal', 'concrete', 'rock'] as const;
export const RAISED_FLOORS = ['metal', 'concrete', 'grate', 'rock'] as const;
export type RaisedFloor = (typeof RAISED_FLOORS)[number];
export const STAIR_DIRS = ['n', 's', 'w', 'e'] as const;
export type StairFloor = (typeof STAIR_FLOORS)[number];
export type StairDir = (typeof STAIR_DIRS)[number];

const STEPS = 4;
const STEP = TILE / STEPS;
const RISE = RAISE / STEPS;
const SIDE_FACE = 0x000000;
const SIDE_FACE_ALPHA = 140;

function tint(p: Pix, x: number, y: number, w: number, h: number, f: number): void {
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const c = p.get(x + i, y + j);
      if (c !== CLEAR) p.set(x + i, y + j, shade(c, f), p.alpha[(y + j) * p.w + x + i]);
    }
  }
}

export function stairsTexture(floor: StairFloor, up: StairDir): Pix {
  const plate = floorTexture(floor, 0);
  const p = new Pix(TILE, TILE + RAISE);
  const tread = (sx: number, sy: number, w: number, h: number, dx: number, dy: number): void => {
    p.blitRegion(plate, sx, sy, w, h, dx, dy);
    tint(p, dx, dy, w, h, 0.1);
  };
  if (up === 'n') {
    for (let k = STEPS - 1; k >= 0; k--) {
      const ty = RAISE + (STEPS - 1 - k) * STEP - RISE * (k + 1);
      tread(0, (STEPS - 1 - k) * STEP, TILE, STEP, 0, ty);
      p.blitRegion(plate, 0, TILE - RISE, TILE, RISE, 0, ty + STEP);
      tint(p, 0, ty + STEP, TILE, RISE, -0.42);
      tint(p, 0, ty + STEP, TILE, 1, 0.35);
    }
    tint(p, 0, 0, 1, TILE + RAISE, -0.35);
    tint(p, TILE - 1, 0, 1, TILE + RAISE, -0.35);
  } else if (up === 's') {
    for (let k = 0; k < STEPS; k++) {
      const ty = RAISE + k * STEP - RISE * (k + 1);
      tread(0, k * STEP, TILE, STEP, 0, ty);
      tint(p, 0, ty, TILE, 1, -0.35);
      tint(p, 0, ty + 1, TILE, 1, 0.35);
    }
  } else {
    for (let k = 0; k < STEPS; k++) {
      const col = up === 'e' ? k : STEPS - 1 - k;
      const cx = col * STEP;
      const lift = RISE * (k + 1);
      tread(cx, 0, STEP, TILE, cx, RAISE - lift);
      tint(p, up === 'e' ? cx : cx + STEP - 1, RAISE - lift, 1, TILE, 0.35);
      tint(p, cx, RAISE - lift, STEP, 1, 0.3);
      p.rect(cx, TILE + RAISE - lift, STEP, lift, SIDE_FACE, SIDE_FACE_ALPHA);
    }
  }
  return p;
}

const EDGE_LIGHT = 0xffffff;
const EDGE_LIGHT_ALPHA = 77;
const EDGE_DARK = 0x000000;
const EDGE_DARK_ALPHA = 89;

export function raisedTopTexture(floor: RaisedFloor, variant: number): Pix {
  const p = new Pix(TILE, TILE).blit(floorTexture(floor, variant), 0, 0);
  tint(p, 0, 0, TILE, TILE, 0.08);
  return p;
}

export function raisedFaceTexture(floor: RaisedFloor, variant: number): Pix {
  const p = new Pix(TILE, RAISE).blitRegion(floorTexture(floor, variant), 0, TILE - RAISE, TILE, RAISE, 0, 0);
  tint(p, 0, 0, TILE, RAISE, -0.55);
  tint(p, 0, 0, TILE, 1, 0.3);
  return p;
}

export function ledgeRimTexture(vertical: boolean): Pix {
  return vertical ? new Pix(2, TILE).rect(0, 0, 2, TILE, EDGE_LIGHT, EDGE_LIGHT_ALPHA) : new Pix(TILE, 2).rect(0, 0, TILE, 2, EDGE_LIGHT, EDGE_LIGHT_ALPHA);
}

export function ledgeSideTexture(): Pix {
  return new Pix(1, RAISE).rect(0, 0, 1, RAISE, EDGE_DARK, EDGE_DARK_ALPHA);
}
