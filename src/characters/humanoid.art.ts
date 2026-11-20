import type { Dir } from '../sim/types';
import { Pix, seeded, shade, shadedRect } from '../render/pixel';
import type { WeaponId } from '../weapons';
import { WEAPON_ART } from '../weapons/art';

export type Frame = 0 | 1 | 2 | 3;
export type HeldWeapon = WeaponId | 'none';
export const FRAMES: Frame[] = [0, 1, 2, 3];
export const DIRS: Dir[] = ['n', 'e', 's', 'w'];

export interface Outfit {
  skin: number;
  body: number;
  legs: number;
  boots: number;
  head: 'helmet' | 'bare' | 'spiked';
  helmet: number;
  visor: number;
  eyes: number;
  belt: number;
  weapon: HeldWeapon;
  spikes: number;
  blood: boolean;
  claws: boolean;
  pad: number;
}

export const OUTLINE = 0x140d0a;

function legs(p: Pix, o: Outfit, dir: Dir, frame: Frame): void {
  const lift = (leg: 0 | 1): number => (frame === 1 && leg === 0) || (frame === 2 && leg === 1) ? 1 : 0;
  if (dir === 'n' || dir === 's') {
    for (const leg of [0, 1] as const) {
      const x = leg === 0 ? 12 : 17;
      const l = lift(leg);
      shadedRect(p, x, 22 - l, 3, 6, o.legs);
      shadedRect(p, x, 27 - l, 3, 2, o.boots);
    }
  } else {
    const spread = frame === 1 ? 2 : frame === 2 ? -2 : 0;
    shadedRect(p, 14 - spread, 22, 3, 5, shade(o.legs, -0.15));
    shadedRect(p, 14 - spread, 27, 3, 2, shade(o.boots, -0.15));
    shadedRect(p, 15 + spread, 22, 3, 5, o.legs);
    shadedRect(p, 15 + spread, 27, 4, 2, o.boots);
  }
}

function torso(p: Pix, o: Outfit, dir: Dir, frame: Frame, rngKey: string): void {
  const side = dir === 'e' || dir === 'w';
  const x0 = side ? 12 : 11;
  const w = side ? 8 : 10;
  shadedRect(p, x0, 13, w, 9, o.body);
  p.rect(x0, 20, w, 1, o.belt);
  if (!side) {
    p.rect(x0 + 2, 15, w - 4, 1, shade(o.body, 0.16));
    p.set(x0 + 4, 20, shade(o.belt, 0.5));
  }
  if (dir === 'n') shadedRect(p, 13, 14, 6, 6, shade(o.body, -0.22));
  if (o.blood) {
    const rng = seeded(rngKey);
    for (let i = 0; i < 6; i++) p.set(x0 + rng.int(1, w - 2), 14 + rng.int(0, 6), rng.chance(0.5) ? 0x7a0e0e : 0x9a1a14);
  }
  const swing = frame === 1 ? 1 : frame === 2 ? -1 : 0;
  if (!side && o.weapon !== 'none') {
    shadedRect(p, 9, 14, 2, 4, o.body);
    shadedRect(p, 21, 14, 2, 4, o.body);
    if (o.pad >= 0) p.rect(8, 13, 4, 2, o.pad).rect(20, 13, 4, 2, shade(o.pad, -0.2));
  } else if (!side) {
    const raise = frame === 3 ? -4 : 0;
    shadedRect(p, 9, 14 + swing + raise, 2, 7, o.body);
    shadedRect(p, 21, 14 - swing + raise, 2, 7, o.body);
    p.rect(9, 21 + swing + raise, 2, 1, o.skin).rect(21, 21 - swing + raise, 2, 1, o.skin);
    if (o.pad >= 0) {
      p.rect(8, 13, 4, 2, o.pad).rect(20, 13, 4, 2, shade(o.pad, -0.2));
    }
    if (o.claws) p.set(9, 22 + swing + raise, 0xe8dcc0).set(22, 22 - swing + raise, 0xe8dcc0);
  } else if (o.weapon === 'none') {
    const ay = frame === 3 ? 12 : 15;
    shadedRect(p, 15 - swing, ay, 3, 6, shade(o.body, 0.05));
    p.rect(16 - swing, ay + 6, 2, 1, o.skin);
    if (o.claws) p.set(18 - swing, ay + 6, 0xe8dcc0).set(18 - swing, ay + 5, 0xe8dcc0);
    if (o.pad >= 0) p.rect(13, 12, 5, 2, o.pad);
  }
  if (o.spikes >= 0) {
    if (side) {
      p.set(13, 11, o.spikes).set(12, 10, o.spikes).set(16, 11, o.spikes).set(16, 10, shade(o.spikes, 0.2));
    } else {
      p.set(9, 12, o.spikes).set(8, 11, o.spikes).set(7, 10, shade(o.spikes, 0.3));
      p.set(22, 12, o.spikes).set(23, 11, o.spikes).set(24, 10, shade(o.spikes, 0.3));
    }
  }
}

function head(p: Pix, o: Outfit, dir: Dir): void {
  const side = dir === 'e' || dir === 'w';
  const x0 = side ? 13 : 12;
  const w = side ? 7 : 8;
  const hc = o.head === 'helmet' ? o.helmet : o.skin;
  for (let j = 0; j < 9; j++) {
    for (let i = 0; i < w; i++) {
      if ((j === 0 || j === 8) && (i === 0 || i === w - 1)) continue;
      const f = i <= 1 ? 0.15 : i >= w - 2 ? -0.25 : j <= 1 ? 0.1 : 0;
      p.set(x0 + i, 4 + j, shade(hc, f));
    }
  }
  if (dir === 'n') {
    if (o.head === 'spiked') p.set(14, 3, o.spikes).set(17, 3, o.spikes).set(15, 2, o.spikes);
    return;
  }
  const eyes = o.eyes;
  if (o.head === 'helmet') {
    if (side) {
      p.rect(16, 8, 4, 3, o.skin).rect(16, 8, 4, 1, o.visor).rect(17, 9, 3, 1, shade(o.visor, -0.3));
    } else {
      p.rect(13, 8, 6, 4, o.skin).rect(13, 8, 6, 2, o.visor).rect(14, 8, 4, 1, shade(o.visor, 0.4));
      p.rect(15, 11, 2, 1, shade(o.skin, -0.3));
    }
  } else {
    if (side) {
      p.set(18, 8, eyes).set(19, 10, shade(o.skin, -0.35));
    } else {
      p.set(14, 8, eyes).set(17, 8, eyes).rect(14, 11, 4, 1, shade(o.skin, -0.45));
    }
    if (o.head === 'spiked') {
      p.set(13, 3, o.spikes).set(12, 2, o.spikes).set(18, 3, o.spikes).set(19, 2, o.spikes).set(15, 3, shade(o.spikes, -0.1));
    }
  }
}

function forearmsSouth(p: Pix, o: Outfit): void {
  shadedRect(p, 10, 17, 4, 2, o.body);
  shadedRect(p, 18, 17, 4, 2, o.body);
}

function forearmsNorth(p: Pix, o: Outfit): void {
  p.rect(10, 15, 3, 2, shade(o.body, -0.2)).rect(19, 15, 3, 2, shade(o.body, -0.3));
}

function weapon(p: Pix, o: Outfit, dir: Dir, frame: Frame): void {
  if (o.weapon === 'none') return;
  const art = WEAPON_ART[o.weapon];
  const attack = frame === 3;
  const pose = { attack, kick: attack && art.recoil ? -1 : 0 };
  if (dir === 's') {
    forearmsSouth(p, o);
    art.south(p, o, pose);
  } else if (dir === 'n') {
    forearmsNorth(p, o);
    art.north(p, o, pose);
  } else art.east(p, o, pose);
}

export function humanoid(o: Outfit, dir: Dir, frame: Frame, key: string): Pix {
  if (dir === 'w') return humanoid(o, 'e', frame, key).mirror();
  const p = new Pix(32, 32);
  legs(p, o, dir, frame);
  if (dir === 'n') {
    torso(p, o, dir, frame, key);
    weapon(p, o, dir, frame);
    head(p, o, dir);
  } else {
    torso(p, o, dir, frame, key);
    head(p, o, dir);
    weapon(p, o, dir, frame);
  }
  if (frame === 3 && o.weapon === 'none' && o.claws) {
    const glow = 0xffa030;
    if (dir === 's') p.ellipse(16, 8, 2.5, 2.5, glow).set(16, 8, 0xfff0a0);
    else if (dir === 'e') p.ellipse(19, 10, 2.5, 2.5, glow).set(19, 10, 0xfff0a0);
  }
  return p.outline(OUTLINE);
}

export function bloodPool(seedKey: string): Pix {
  const rng = seeded(`corpse${seedKey}`);
  const p = new Pix(32, 32);
  p.ellipse(16, 22, 12, 6, (_x, _y, nx, ny) => (nx * nx + ny * ny > 0.7 ? 0x5a0808 : 0x6e0c0c));
  for (let i = 0; i < 6; i++) p.set(rng.int(3, 28), rng.int(14, 29), 0x7a1010);
  return p;
}

export function humanoidCorpse(seedKey: string, body: number, skin: number, extra: (q: Pix) => void = () => undefined): Pix {
  const q = new Pix(32, 32);
  q.rect(9, 19, 11, 5, body).rect(9, 19, 11, 1, shade(body, 0.15));
  q.rect(4, 20, 5, 3, shade(body, -0.2));
  q.ellipse(23, 21, 3.5, 3, skin);
  q.rect(12, 17, 2, 2, skin).rect(15, 24, 3, 1, skin);
  extra(q);
  q.outline(OUTLINE);
  return bloodPool(seedKey).blit(q, 0, 0);
}
