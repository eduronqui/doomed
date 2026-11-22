import type { DoorKind, FloorKind } from '../../sim/level';
import { Pix, mix, seeded, shade } from '../pixel';

export const TILE = 32;
export const WALL_HEIGHT = 24;

function bevel(p: Pix, x: number, y: number, w: number, h: number, base: number, light = 0.16, dark = -0.32): void {
  p.rect(x, y, w, 1, shade(base, light));
  p.rect(x, y, 1, h, shade(base, light * 0.7));
  p.rect(x, y + h - 1, w, 1, shade(base, dark));
  p.rect(x + w - 1, y, 1, h, shade(base, dark * 0.8));
}

function metalFloor(variant: number): Pix {
  const rng = seeded(`metal${variant}`);
  const base = 0x4a4f58;
  const p = new Pix(32, 32).rect(0, 0, 32, 32, base);
  p.speckle(0, 0, 32, 32, [shade(base, 0.05), shade(base, -0.07)], 0.18, rng);
  for (const [qx, qy] of [
    [0, 0],
    [16, 0],
    [0, 16],
    [16, 16],
  ]) {
    bevel(p, qx, qy, 16, 16, base);
    for (const [rx, ry] of [
      [2, 2],
      [13, 2],
      [2, 13],
      [13, 13],
    ]) {
      p.set(qx + rx, qy + ry, 0x7b828d).set(qx + rx + 1, qy + ry + 1, shade(base, -0.35));
    }
  }
  if (variant === 1) {
    for (let y = 3; y < 13; y += 3) for (let x = 19; x < 29; x += 3) p.set(x, y, shade(base, 0.2)).set(x + 1, y + 1, shade(base, -0.2));
  }
  if (variant === 2) {
    const rust = 0x6d4733;
    p.map((x, y, c) => {
      const d = Math.hypot(x - 22, y - 22);
      return d < 7 && rng.chance(0.8 - d / 10) ? mix(c, rust, 0.55) : c;
    });
  }
  return p;
}

function concreteFloor(variant: number): Pix {
  const rng = seeded(`concrete${variant}`);
  const base = 0x5c574f;
  const p = new Pix(32, 32).rect(0, 0, 32, 32, base);
  p.speckle(0, 0, 32, 32, [shade(base, 0.08), shade(base, -0.08), shade(base, 0.03), shade(base, -0.15)], 0.45, rng);
  p.rect(0, 31, 32, 1, shade(base, -0.18)).rect(31, 0, 1, 32, shade(base, -0.14));
  if (variant > 0) {
    let x = rng.int(4, 27);
    let y = rng.int(4, 27);
    for (let i = 0; i < 14; i++) {
      p.set(x, y, shade(base, -0.4));
      x += rng.int(-1, 1);
      y += rng.int(0, 1) || -1;
    }
  }
  if (variant === 2) p.ellipse(10, 20, 5, 3, (_x, _y, nx, ny) => mix(base, 0x3b3a2e, 0.5 - (nx * nx + ny * ny) * 0.3));
  return p;
}

function grateFloor(): Pix {
  const p = new Pix(32, 32).rect(0, 0, 32, 32, 0x17191c);
  for (let i = 0; i < 32; i += 4) {
    p.rect(i, 0, 1, 32, 0x4a5058);
    p.rect(0, i, 32, 1, 0x4a5058);
  }
  for (let y = 1; y < 32; y += 4) for (let x = 1; x < 32; x += 4) p.set(x, y, 0x262a2e);
  p.set(9, 13, 0x2e5a2e).set(22, 26, 0x2e5a2e);
  bevel(p, 0, 0, 32, 32, 0x50565f, 0.12, -0.4);
  return p;
}

function rockFloor(variant: number): Pix {
  const rng = seeded(`rock${variant}`);
  const base = 0x4b2a22;
  const p = new Pix(32, 32).rect(0, 0, 32, 32, base);
  p.speckle(0, 0, 32, 32, [0x5a3428, 0x3e221b, 0x643a2c, 0x35201a], 0.5, rng);
  for (let i = 0; i < 3; i++) {
    const cx = rng.int(4, 27);
    const cy = rng.int(4, 27);
    p.ellipse(cx, cy, rng.range(2, 4), rng.range(1.5, 3), (_x, _y, _nx, ny) => (ny < -0.3 ? 0x6e4232 : ny > 0.4 ? 0x2c1813 : 0x5a3529));
  }
  if (variant > 0) {
    let x = rng.int(2, 10);
    let y = rng.int(6, 26);
    for (let i = 0; i < 22; i++) {
      p.set(x, y, 0xd0541c);
      if (rng.chance(0.4)) p.set(x, y - 1, 0x7a2a10);
      x += 1;
      y += rng.int(-1, 1);
    }
  }
  return p;
}

function liquid(frame: number, colors: number[], bubble: number, key: string): Pix {
  const rng = seeded(key);
  const p = new Pix(32, 32);
  const ph = (frame * Math.PI * 2) / 3;
  const k = (Math.PI * 2) / 32;
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const v =
        Math.sin(x * k * 2 + ph + Math.sin(y * k) * 1.4) * 0.6 +
        Math.cos(y * k * 2 - ph + Math.cos(x * k) * 1.2) * 0.6 +
        Math.sin((x + y) * k * 3 + ph * 2) * 0.35;
      const t = (v + 1.55) / 3.1;
      const idx = Math.max(0, Math.min(colors.length - 1, Math.floor(t * t * colors.length * 1.1)));
      p.set(x, y, colors[idx]);
    }
  }
  for (let i = 0; i < 3; i++) {
    const bx = (rng.int(3, 28) + frame * 2) % 32;
    const by = (rng.int(3, 28) + 32 - frame * 3) % 32;
    p.set(bx, by, bubble).set(bx + 1, by, bubble).set(bx, by - 1, shade(bubble, 0.4));
  }
  return p;
}

export function floorTexture(kind: FloorKind, variant: number): Pix {
  switch (kind) {
    case 'metal':
      return metalFloor(variant % 3);
    case 'concrete':
      return concreteFloor(variant % 3);
    case 'grate':
      return grateFloor();
    case 'rock':
      return rockFloor(variant % 3);
    case 'slime':
      return liquid(variant % 3, [0x1a4a16, 0x22591c, 0x2b6b22, 0x3a8a2c, 0x5aa83a], 0x9ae070, 'slime');
    case 'lava':
      return liquid(variant % 3, [0x7a1e0a, 0x962a0e, 0xb83a12, 0xe0661c, 0xffb040], 0xffe080, 'lava');
  }
}

function techTop(p: Pix, rng: ReturnType<typeof seeded>): void {
  const base = 0x353940;
  p.rect(0, 0, 32, 32, base);
  p.speckle(1, 1, 30, 30, [shade(base, 0.05), shade(base, -0.08)], 0.2, rng);
  bevel(p, 0, 0, 32, 32, base, 0.18, -0.4);
  bevel(p, 4, 4, 24, 24, base, -0.25, 0.1);
}

function techFront(p: Pix, variant: number, rng: ReturnType<typeof seeded>): void {
  const base = 0x5a6069;
  const y0 = 32;
  p.rect(0, y0, 32, 24, base);
  p.speckle(0, y0, 32, 24, [shade(base, 0.05), shade(base, -0.06)], 0.2, rng);
  p.rect(0, y0, 32, 1, 0x8a919c).rect(0, y0 + 1, 32, 1, 0x707782);
  p.rect(0, y0 + 2, 1, 22, shade(base, 0.12)).rect(31, y0 + 2, 1, 22, shade(base, -0.35));
  p.rect(15, y0 + 2, 1, 18, shade(base, -0.3)).rect(16, y0 + 2, 1, 18, shade(base, 0.12));
  p.rect(0, y0 + 19, 32, 1, shade(base, -0.3));
  p.rect(0, y0 + 20, 32, 4, 0x2c2f35).rect(0, y0 + 20, 32, 1, 0x40444b);
  if (variant === 1) {
    p.rect(3, y0 + 6, 26, 3, 0x2a5f6b).rect(4, y0 + 7, 24, 1, 0x8ff0ff);
  } else if (variant === 2) {
    p.rect(7, y0 + 4, 18, 12, 0x1d2024);
    p.rect(8, y0 + 5, 16, 10, 0x0e2a19);
    for (let r = 0; r < 4; r++) p.rect(9, y0 + 6 + r * 2, rng.int(4, 13), 1, r === 0 ? 0x8cff9a : 0x45d060);
  } else if (variant === 3) {
    for (const py of [y0 + 6, y0 + 12]) {
      p.rect(0, py, 32, 3, 0x6e6048).rect(0, py, 32, 1, 0x9a8a68).rect(0, py + 2, 32, 1, 0x463c2c);
      p.rect(10, py - 1, 2, 5, 0x3a3a3a);
    }
  } else {
    for (const [x, y] of [
      [3, 4],
      [28, 4],
      [3, 16],
      [28, 16],
    ]) {
      p.set(x, y0 + y, 0x8a919c).set(x + 1, y0 + y + 1, 0x33363c);
    }
  }
}

export function wallTexture(kind: 'tech' | 'stone', variant: number): Pix {
  const rng = seeded(`wall${kind}${variant}`);
  const p = new Pix(32, 32 + WALL_HEIGHT);
  if (kind === 'tech') {
    techTop(p, rng);
    techFront(p, variant % 4, rng);
    return p;
  }
  const top = 0x3a231d;
  p.rect(0, 0, 32, 32, top);
  p.speckle(0, 0, 32, 32, [0x452a22, 0x2e1b16, 0x4d3026], 0.5, rng);
  bevel(p, 0, 0, 32, 32, top, 0.15, -0.45);
  const mortar = 0x1f110d;
  p.rect(0, 32, 32, 24, mortar);
  for (let row = 0; row < 4; row++) {
    const y = 32 + row * 6;
    const off = row % 2 === 0 ? 0 : 8;
    for (let bx = -16 + off; bx < 32; bx += 16) {
      const c = mix(0x6e3b2e, rng.chance(0.5) ? 0x5a2f25 : 0x7a4434, rng.next());
      for (let j = 0; j < 5; j++) {
        for (let i = 0; i < 15; i++) {
          const x = bx + i;
          if (x < 0 || x > 31) continue;
          const col = j === 0 ? shade(c, 0.18) : j === 4 ? shade(c, -0.3) : rng.chance(0.15) ? shade(c, -0.12) : c;
          p.set(x, y + j, col);
        }
      }
    }
  }
  p.rect(0, 32, 32, 1, 0x80503e);
  if (variant % 3 === 1) {
    for (let i = 0; i < 3; i++) {
      const x = rng.int(3, 28);
      const len = rng.int(5, 16);
      for (let j = 0; j < len; j++) p.set(x, 33 + j, j === len - 1 ? 0x5a0606 : 0x8c1010);
    }
  } else if (variant % 3 === 2) {
    const glow = 0xff6a20;
    for (const [x, y] of [
      [15, 38],
      [16, 38],
      [14, 39],
      [17, 39],
      [15, 40],
      [16, 40],
      [15, 41],
      [16, 41],
      [13, 42],
      [18, 42],
      [15, 43],
      [16, 43],
    ]) {
      p.set(x, y, glow);
    }
  }
  return p;
}

const HAZARD: Record<DoorKind, number> = { normal: 0xd8b02a, red: 0xc42020, blue: 0x2a5ad8, yellow: 0xf0d020, secret: 0xd8b02a, trap: 0xd8b02a, gate: 0x28b8c8 };

export const KEY_LIGHT: Record<'red' | 'blue' | 'yellow', { light: number; dark: number }> = {
  red: { light: 0xff3a3a, dark: 0x5a0a0a },
  blue: { light: 0x6ab0ff, dark: 0x0a1a5a },
  yellow: { light: 0xfff070, dark: 0x5a4a0a },
};

const DOOR_LIGHT: Record<'red' | 'blue' | 'yellow' | 'gate', { light: number; dark: number }> = {
  ...KEY_LIGHT,
  gate: { light: 0x70f0ff, dark: 0x0a3a44 },
};

export function doorTexture(kind: DoorKind, wall: 'tech' | 'stone'): Pix {
  if (kind === 'secret') {
    const p = wallTexture(wall, 0);
    const crack = wall === 'tech' ? 0x3b4048 : 0x26140f;
    const scratch = wall === 'tech' ? 0x6a717b : 0x5a3a2e;
    p.line(20, 36, 23, 44, crack).line(23, 44, 21, 50, crack);
    p.rect(7, 7, 18, 1, scratch).rect(7, 24, 18, 1, scratch).rect(7, 7, 1, 18, scratch).rect(24, 7, 1, 18, scratch);
    for (const [x, y] of [
      [11, 12],
      [14, 16],
      [18, 11],
    ]) {
      p.line(x, y, x + 4, y + 3, scratch);
    }
    return p;
  }
  const rng = seeded(`door${kind}`);
  const p = new Pix(32, 32 + WALL_HEIGHT);
  const top = 0x40444c;
  p.rect(0, 0, 32, 32, top);
  bevel(p, 0, 0, 32, 32, top, 0.18, -0.4);
  for (let i = 0; i < 32; i++) {
    const stripe = Math.floor((i + 0) / 4) % 2 === 0 ? HAZARD[kind] : 0x1a1a1a;
    p.set(i, 2, stripe).set(i, 29, stripe).set(2, i, stripe).set(29, i, stripe);
  }
  p.rect(15, 4, 2, 24, 0x23262b);
  const base = 0x6c727c;
  p.rect(0, 32, 32, 24, base);
  p.speckle(0, 32, 32, 24, [shade(base, 0.06), shade(base, -0.05)], 0.2, rng);
  p.rect(0, 32, 32, 1, 0x9aa1ab);
  p.rect(3, 35, 26, 12, shade(base, -0.15));
  bevel(p, 3, 35, 26, 12, shade(base, -0.15), -0.25, 0.2);
  p.rect(15, 33, 2, 23, 0x2a2d32);
  for (let x = 0; x < 32; x++) {
    for (let y = 48; y < 54; y++) p.set(x, y, Math.floor((x + y) / 3) % 2 === 0 ? HAZARD[kind] : 0x1a1a1a);
  }
  p.rect(0, 54, 32, 2, 0x26292e);
  if (kind === 'red' || kind === 'blue' || kind === 'yellow') {
    const { light, dark } = KEY_LIGHT[kind];
    p.rect(12, 37, 8, 4, dark).rect(13, 38, 6, 2, light);
    p.rect(13, 13, 6, 6, dark).rect(14, 14, 4, 4, light);
  }
  return p;
}

const GLYPHS: Record<string, string[]> = {
  E: ['111', '100', '110', '100', '111'],
  X: ['101', '101', '010', '101', '101'],
  I: ['111', '010', '010', '010', '111'],
  T: ['111', '010', '010', '010', '010'],
};

export function exitTexture(wall: 'tech' | 'stone', on: boolean): Pix {
  const p = wallTexture(wall, 0);
  if (wall === 'stone') p.rect(6, 33, 20, 19, 0x1f110d);
  p.rect(7, 34, 18, 7, 0x1a0606);
  let x = 9;
  for (const ch of 'EXIT') {
    GLYPHS[ch].forEach((row, j) => [...row].forEach((b, i) => b === '1' && p.set(x + i, 35 + j, on ? 0x60ff70 : 0xff4030)));
    x += 4;
  }
  p.rect(10, 43, 12, 8, 0x26292e);
  bevel(p, 10, 43, 12, 8, 0x26292e, 0.2, -0.3);
  const knob = on ? 0x30d040 : 0xd02020;
  if (on) p.rect(15, 47, 2, 3, 0x9aa1ab).rect(14, 46, 4, 2, knob);
  else p.rect(15, 44, 2, 3, 0x9aa1ab).rect(14, 44, 4, 2, knob);
  return p;
}

export function switchTexture(wall: 'tech' | 'stone', on: boolean): Pix {
  const p = wallTexture(wall, 0);
  const { light, dark } = DOOR_LIGHT.gate;
  const rim = on ? light : 0x28b8c8;
  p.rect(6, 33, 20, 21, 0x15171a);
  p.rect(6, 33, 20, 1, rim).rect(6, 53, 20, 1, rim).rect(6, 33, 1, 21, rim).rect(25, 33, 1, 21, rim);
  p.rect(8, 35, 16, 17, 0x26292e);
  bevel(p, 8, 35, 16, 17, 0x26292e, 0.2, -0.3);
  p.rect(10, 37, 12, 3, on ? light : dark);
  p.rect(13, 42, 6, 9, 0x0c0d0f);
  if (on) p.rect(15, 46, 2, 4, 0x9aa1ab).rect(13, 48, 6, 3, light);
  else p.rect(15, 43, 2, 4, 0x9aa1ab).rect(13, 42, 6, 3, 0x28b8c8);
  return p;
}

export function doorPiece(kind: Exclude<DoorKind, 'secret' | 'trap'>, cellsW: number, cellsH: number): Pix {
  const rng = seeded(`doorpiece${kind}${cellsW}x${cellsH}`);
  const w = cellsW * 32;
  const topH = cellsH * 32;
  const p = new Pix(w, topH + WALL_HEIGHT);
  const top = 0x40444c;
  p.rect(0, 0, w, topH, top);
  p.speckle(0, 0, w, topH, [shade(top, 0.05), shade(top, -0.06)], 0.15, rng);
  bevel(p, 0, 0, w, topH, top, 0.18, -0.4);
  const hazard = HAZARD[kind];
  for (let i = 0; i < w; i++) {
    const c = Math.floor(i / 4) % 2 === 0 ? hazard : 0x1a1a1a;
    p.set(i, 2, c).set(i, topH - 3, c);
  }
  for (let j = 0; j < topH; j++) {
    const c = Math.floor(j / 4) % 2 === 0 ? hazard : 0x1a1a1a;
    p.set(2, j, c).set(w - 3, j, c);
  }
  if (cellsW >= cellsH) for (let x = 8; x < w - 8; x += 6) p.rect(x, 6, 1, topH - 12, shade(top, -0.25)).rect(x + 1, 6, 1, topH - 12, shade(top, 0.1));
  else for (let y = 8; y < topH - 8; y += 6) p.rect(6, y, w - 12, 1, shade(top, -0.25)).rect(6, y + 1, w - 12, 1, shade(top, 0.1));
  if (kind !== 'normal') {
    const { light, dark } = DOOR_LIGHT[kind];
    const cx = Math.floor(w / 2);
    const cy = Math.floor(topH / 2);
    p.rect(cx - 4, cy - 4, 8, 8, dark).rect(cx - 3, cy - 3, 6, 6, light);
  }

  const y0 = topH;
  const base = 0x6c727c;
  p.rect(0, y0, w, WALL_HEIGHT, base);
  p.speckle(0, y0, w, WALL_HEIGHT, [shade(base, 0.06), shade(base, -0.05)], 0.2, rng);
  p.rect(0, y0, w, 1, 0x9aa1ab);
  for (let y = y0 + 3; y < y0 + 15; y += 3) p.rect(3, y, w - 6, 1, shade(base, -0.22)).rect(3, y + 1, w - 6, 1, shade(base, 0.1));
  p.rect(0, y0 + 1, 2, WALL_HEIGHT - 1, shade(base, 0.15)).rect(w - 2, y0 + 1, 2, WALL_HEIGHT - 1, shade(base, -0.35));
  for (let x = 0; x < w; x++) {
    for (let y = y0 + 16; y < y0 + 22; y++) p.set(x, y, Math.floor((x + y) / 3) % 2 === 0 ? hazard : 0x1a1a1a);
  }
  p.rect(0, y0 + 22, w, 2, 0x26292e);
  if (kind !== 'normal') {
    const { light, dark } = DOOR_LIGHT[kind];
    const cx = Math.floor(w / 2);
    p.rect(cx - 5, y0 + 5, 10, 4, dark).rect(cx - 4, y0 + 6, 8, 2, light);
  }
  return p;
}

export function hiddenPiece(kind: 'secret' | 'trap', wall: 'tech' | 'stone', cellsW: number, cellsH: number): Pix {
  const src = kind === 'secret' ? doorTexture('secret', wall) : wallTexture(wall, 0);
  const p = new Pix(cellsW * 32, cellsH * 32 + WALL_HEIGHT);
  for (let j = 0; j < cellsH; j++) {
    for (let i = 0; i < cellsW; i++) {
      p.blitRegion(src, 0, 0, 32, 32, i * 32, j * 32);
      if (j === cellsH - 1) p.blitRegion(src, 0, 32, 32, WALL_HEIGHT, i * 32, cellsH * 32);
    }
  }
  return p;
}
