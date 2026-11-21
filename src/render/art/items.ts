import type { DecoKind, ItemKind } from '../../sim/defs';
import { WEAPON_ART } from '../../weapons/art';
import { Pix, mix, seeded, shade } from '../pixel';

const OUTLINE = 0x140d0a;
const KEY_CARD = { redkey: 0xd02424, bluekey: 0x2a64e0, yellowkey: 0xe8c020 };

function box(p: Pix, x: number, y: number, w: number, h: number, c: number): void {
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const f = j === 0 ? 0.3 : i === 0 ? 0.12 : j === h - 1 || i === w - 1 ? -0.3 : 0;
      p.set(x + i, y + j, shade(c, f));
    }
  }
}

function cross(p: Pix, cx: number, cy: number, s: number, c: number): void {
  p.rect(cx - s, cy, s * 2 + 1, 1, c).rect(cx, cy - s, 1, s * 2 + 1, c);
}

export function itemTexture(kind: ItemKind): Pix {
  const p = new Pix(32, 32);
  switch (kind) {
    case 'stimpack':
      box(p, 11, 17, 10, 7, 0xe8e8e8);
      cross(p, 16, 20, 2, 0xd02020);
      p.rect(14, 15, 4, 2, 0x9aa1ab);
      break;
    case 'medkit':
      box(p, 8, 14, 16, 11, 0xeeeeee);
      p.rect(13, 12, 6, 2, 0x8a909a);
      p.rect(14, 16, 4, 8, 0xd02020).rect(12, 18, 8, 4, 0xd02020);
      break;
    case 'armor':
      p.rect(9, 11, 14, 12, 0x3e8a3a);
      p.rect(9, 11, 3, 3, 0x4fa84a).rect(20, 11, 3, 3, 0x2e6a2a);
      p.rect(13, 11, 6, 3, -1);
      p.rect(11, 23, 10, 2, 0x2e6a2a);
      p.rect(10, 14, 12, 1, 0x6ac862).rect(15, 14, 2, 9, 0x2a5a26);
      p.map((x, y, c) => (y > 20 ? shade(c, -0.2) : x < 12 ? shade(c, 0.1) : c));
      break;
    case 'sphere':
      p.ellipse(16, 16, 7, 7, (_x, _y, nx, ny) => mix(0x8ad8ff, 0x1a4ad0, Math.min(1, Math.hypot(nx + 0.4, ny + 0.4) * 0.7)));
      p.set(13, 12, 0xffffff).set(14, 12, 0xffffff).set(13, 13, 0xffffff);
      break;
    case 'clip':
      box(p, 11, 17, 10, 7, 0x4a4d54);
      for (let x = 12; x < 20; x += 2) p.rect(x, 15, 1, 2, 0xd8a030).set(x, 15, 0xf0d070);
      break;
    case 'shells':
      box(p, 8, 16, 16, 9, 0xa82a1c);
      p.rect(10, 18, 12, 2, 0xd8a030);
      for (let x = 10; x < 22; x += 3) p.set(x, 18, 0xf0d070);
      break;
    case 'grenades':
      box(p, 9, 16, 14, 9, 0x4a5638);
      for (let x = 11; x < 21; x += 3) p.ellipse(x + 1, 15, 1.4, 1.4, 0x7a8a60);
      p.rect(11, 20, 10, 1, 0xd8b02a);
      break;
    case 'fuel':
      box(p, 11, 13, 10, 13, 0xa8321e);
      p.rect(13, 11, 4, 2, 0x50535a).rect(13, 17, 6, 4, 0xd8b02a).rect(15, 18, 2, 2, 0x2a1a10);
      break;
    case 'cells':
      box(p, 10, 15, 12, 10, 0x3a4250);
      p.rect(12, 17, 8, 2, 0x4ad0ff).rect(12, 21, 8, 2, 0x4ad0ff).rect(14, 13, 4, 2, 0x50535a);
      break;
    case 'shotgun':
    case 'rotary':
    case 'launcher':
    case 'flamer':
    case 'arc':
    case 'rift':
      return WEAPON_ART[kind].icon();
    case 'redkey':
    case 'bluekey':
    case 'yellowkey':
      box(p, 11, 15, 11, 7, KEY_CARD[kind]);
      p.rect(13, 17, 3, 3, 0xe8c040).rect(17, 17, 3, 1, 0xffffff);
      break;
  }
  return p.outline(OUTLINE);
}

export function barrelTexture(frame: number): Pix {
  const rng = seeded('barrel');
  const p = new Pix(32, 40);
  const base = 0x9a5a28;
  for (let y = 14; y < 37; y++) {
    for (let x = 9; x < 23; x++) {
      const nx = (x - 16) / 7;
      const f = nx < -0.5 ? 0.15 : nx > 0.55 ? -0.35 : 0;
      p.set(x, y, shade(base, f));
    }
  }
  p.speckle(9, 14, 14, 23, [0x7a4420, 0x6a3a1c, 0xb06a30], 0.18, rng);
  for (const y of [18, 27, 34]) p.rect(9, y, 14, 1, 0x5a3418).rect(9, y - 1, 14, 1, 0xb87a40);
  p.rect(13, 21, 6, 4, 0x1a1a1a).set(15, 22, 0xe8c040).set(16, 22, 0xe8c040).set(15, 23, 0xe8c040);
  p.ellipse(16, 13, 7, 3, 0x4a2a14);
  p.ellipse(16, 13, 5.5, 2, (x, y) => ((x + y + frame) % 3 === 0 ? 0xa8f070 : 0x5ab83a));
  return p.outline(OUTLINE);
}

const STENCIL: Record<string, string[]> = {
  S: ['111', '1..', '111', '..1', '111'],
  V: ['1.1', '1.1', '1.1', '1.1', '.1.'],
  6: ['111', '1..', '111', '1.1', '111'],
};

function stencil(p: Pix, text: string, x: number, y: number, color: number): void {
  [...text].forEach((ch, i) => {
    STENCIL[ch].forEach((row, dy) => {
      [...row].forEach((cell, dx) => {
        if (cell === '1') p.set(x + i * 4 + dx, y + dy, color);
      });
    });
  });
}

export function decoTexture(kind: DecoKind, frame: number): Pix {
  const rng = seeded(`deco${kind}`);
  switch (kind) {
    case 'lamp': {
      const p = new Pix(32, 56);
      p.ellipse(16, 50, 6, 2.5, 0x2a2c30);
      p.rect(14, 16, 4, 34, 0x4a4f58).rect(14, 16, 1, 34, 0x6a717b).rect(17, 16, 1, 34, 0x2e3137);
      p.rect(10, 8, 12, 9, 0x3a3e45).rect(10, 8, 12, 1, 0x6a717b);
      p.rect(11, 10, 10, 5, 0xbff4ff).rect(12, 11, 8, 3, 0xffffff);
      return p.outline(OUTLINE);
    }
    case 'crate': {
      const p = new Pix(32, 44);
      const top = 0x7a6a44;
      const front = 0x5e5034;
      p.rect(1, 1, 30, 29, top);
      p.speckle(1, 1, 30, 29, [shade(top, 0.07), shade(top, -0.07)], 0.3, rng);
      p.rect(1, 1, 30, 1, shade(top, 0.25)).rect(1, 29, 30, 1, shade(top, -0.3));
      p.rect(1, 1, 2, 29, shade(top, 0.12)).rect(29, 1, 2, 29, shade(top, -0.2));
      p.line(3, 3, 28, 27, shade(top, -0.2)).line(3, 4, 28, 28, shade(top, 0.15));
      p.rect(1, 30, 30, 13, front);
      p.rect(1, 30, 30, 1, shade(front, 0.3)).rect(1, 42, 30, 1, shade(front, -0.35));
      p.rect(1, 30, 2, 13, shade(front, 0.15)).rect(29, 30, 2, 13, shade(front, -0.3));
      stencil(p, 'SV6', 11, 34, 0x7e1d14);
      return p.outline(OUTLINE);
    }
    case 'brazier': {
      const p = new Pix(32, 48);
      p.rect(11, 34, 2, 12, 0x3a3030).rect(19, 34, 2, 12, 0x3a3030).rect(15, 36, 2, 10, 0x2a2222);
      p.ellipse(16, 32, 9, 4, 0x4a3a34);
      p.rect(7, 30, 18, 4, 0x5a4840).rect(7, 30, 18, 1, 0x7a6658);
      const flames = [0xc8300e, 0xff6a18, 0xffa830, 0xffe890];
      const sway = [0, 1, -1][frame];
      const tongues = [
        { cx: 16 + sway, h: 17 - frame, w: 6 },
        { cx: 11 - sway, h: 10 + frame, w: 3.5 },
        { cx: 21 + sway, h: 11 + ((frame + 1) % 3), w: 3.5 },
      ];
      for (const t of tongues) {
        for (let y = 0; y < t.h; y++) {
          const f = y / t.h;
          const half = t.w * (1 - f) * (0.75 + 0.25 * Math.sin(f * 6 + frame));
          const off = Math.sin(f * 5 + frame * 2) * 1.2 * f;
          for (let x = Math.round(t.cx - half + off); x <= Math.round(t.cx + half + off); x++) {
            const edge = Math.abs(x - t.cx - off) / Math.max(0.5, half);
            const level = Math.max(0, Math.min(3, Math.floor((1 - f) * 2.6 + (1 - edge) * 1.6 - 0.6)));
            p.set(x, 29 - y, flames[level]);
          }
        }
      }
      return p.outline(0x2a0a04);
    }
    case 'gore': {
      const p = new Pix(32, 32);
      for (let i = 0; i < 5; i++) p.ellipse(rng.int(8, 24), rng.int(10, 24), rng.range(2, 5), rng.range(1.5, 3), rng.chance(0.5) ? 0x6a0a0a : 0x8a1414);
      p.rect(12, 16, 6, 2, 0xe8dcc0).rect(11, 15, 2, 4, 0xe8dcc0).rect(17, 15, 2, 4, 0xe8dcc0);
      p.ellipse(21, 13, 2.5, 2, 0xe8dcc0).set(20, 13, 0x1a1010).set(22, 13, 0x1a1010);
      return p;
    }
    case 'body': {
      const p = new Pix(32, 32);
      p.ellipse(16, 21, 11, 5, 0x5a0808);
      const q = new Pix(32, 32);
      q.rect(8, 18, 12, 5, 0xe8e8e0).rect(8, 18, 12, 1, 0xffffff);
      q.rect(4, 19, 4, 3, 0x3a3a48).ellipse(22, 20, 3, 2.5, 0xd8a47a).rect(21, 17, 3, 2, 0x5a3a20);
      q.set(13, 20, 0x9a1a14).set(14, 21, 0x9a1a14).set(12, 21, 0x7a0e0e);
      q.outline(OUTLINE);
      return p.blit(q, 0, 0);
    }
  }
}

export function fireball(frame: number): Pix {
  const p = new Pix(16, 16);
  const r = frame === 0 ? 5 : 5.5;
  p.ellipse(8, 8, r, r, (_x, _y, nx, ny) => {
    const d = Math.hypot(nx, ny);
    return d < 0.35 ? 0xfff4b0 : d < 0.6 ? 0xffc040 : d < 0.85 ? 0xff7a20 : 0xd8301a;
  });
  if (frame === 1) p.set(3, 4, 0xff7a20).set(12, 12, 0xff7a20);
  return p;
}

export function grenadeShot(frame: number): Pix {
  const p = new Pix(16, 16);
  p.ellipse(8, 8, 3, 2.5, 0x4a5638).ellipse(7, 7, 1.2, 1, 0x7a8a60);
  p.set(frame === 0 ? 11 : 5, frame === 0 ? 6 : 10, 0xff9030);
  return p.outline(0x141a10);
}

export function riftOrb(frame: number): Pix {
  const p = new Pix(24, 24);
  const r = frame === 0 ? 8 : 9;
  p.ellipse(12, 12, r, r, (_x, _y, nx, ny) => {
    const d = Math.hypot(nx, ny);
    return d < 0.3 ? 0xffffff : d < 0.55 ? 0xf0c8ff : d < 0.8 ? 0xb050ff : 0x5a1a9a;
  });
  return p;
}

export function flameFx(frame: number): Pix {
  const p = new Pix(16, 16);
  const rng = seeded(`flame${frame}`);
  const r = 3 + frame * 1.4;
  p.ellipse(8, 9 - frame, r, r * 0.9, (_x, _y, nx, ny) => {
    const d = Math.hypot(nx, ny) + rng.range(-0.15, 0.15);
    if (frame === 2) return d < 0.5 ? 0xff7020 : 0x8a2810;
    return d < 0.35 ? 0xfff0a0 : d < 0.65 ? 0xffb030 : 0xff6018;
  }, frame === 2 ? 170 : 255);
  return p;
}

export function riftBlast(frame: number): Pix {
  const size = 64;
  const p = new Pix(size, size);
  const rng = seeded(`rift${frame}`);
  const c = size / 2;
  const r = (size / 2 - 2) * (0.35 + frame * 0.22);
  const fade = frame >= 3;
  p.ellipse(c, c, r, r, (x, y, nx, ny) => {
    const d = Math.hypot(nx, ny) + rng.range(-0.12, 0.12);
    if (fade) return d < 0.5 ? 0x4a3a5a : 0x2a2234;
    return d < 0.3 + frame * 0.05 ? 0xffffff : d < 0.55 ? 0xf0c8ff : d < 0.8 ? 0xb050ff : (x + y) % 2 === 0 ? 0x6a20b0 : 0x3a1060;
  }, fade ? 150 : 255);
  return p;
}

export function puff(frame: number): Pix {
  const p = new Pix(16, 16);
  const r = 2 + frame * 1.5;
  const c = frame === 0 ? 0xfff0a0 : frame === 1 ? 0xb0aca4 : 0x7a7670;
  p.ellipse(8, 8 - frame, r, r, c, frame === 2 ? 160 : 255);
  if (frame > 0) p.ellipse(7, 7 - frame, r * 0.5, r * 0.5, shade(c, 0.25), frame === 2 ? 160 : 255);
  return p;
}

export function bloodFx(frame: number): Pix {
  const p = new Pix(16, 16);
  const rng = seeded(`blood${frame}`);
  const n = 4 + frame * 2;
  for (let i = 0; i < n; i++) {
    const a = rng.range(0, Math.PI * 2);
    const d = rng.range(0, 2 + frame * 2.2);
    p.set(8 + Math.cos(a) * d, 8 + Math.sin(a) * d + frame, rng.chance(0.5) ? 0xb01818 : 0x7a0a0a);
  }
  if (frame === 0) p.ellipse(8, 8, 2, 2, 0xc82020);
  return p;
}

export function explosion(frame: number, size = 48): Pix {
  const p = new Pix(size, size);
  const rng = seeded(`exp${frame}${size}`);
  const c = size / 2;
  const r = (size / 2 - 2) * (0.35 + frame * 0.22);
  const fade = frame >= 3;
  p.ellipse(c, c, r, r, (x, y, nx, ny) => {
    const d = Math.hypot(nx, ny) + rng.range(-0.15, 0.15);
    if (fade) return d < 0.5 ? 0x5a5450 : 0x3a3634;
    return d < 0.3 + frame * 0.05 ? 0xfff4c0 : d < 0.55 ? 0xffc040 : d < 0.8 ? 0xff7020 : (x + y) % 2 === 0 ? 0xc0301a : 0x8a2010;
  }, fade ? 150 : 255);
  return p;
}

export function scorch(): Pix {
  const p = new Pix(48, 48);
  const rng = seeded('scorch');
  p.ellipse(24, 24, 18, 12, (_x, _y, nx, ny) => (Math.hypot(nx, ny) + rng.range(-0.2, 0.2) < 0.6 ? 0x141010 : 0x2a2420), 170);
  return p;
}

export function muzzle(): Pix {
  const p = new Pix(16, 16);
  p.ellipse(8, 8, 4, 4, 0xffc040).ellipse(8, 8, 2, 2, 0xfff8d0);
  p.line(1, 8, 15, 8, 0xffe080).line(8, 2, 8, 14, 0xffe080);
  return p;
}
