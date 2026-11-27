import { describe, expect, it } from 'vitest';
import { MARINE_ART, marineCorpseLayers, marineLayers, type MarineLayers } from '../src/characters/marine.art';
import { CLEAR, type Pix } from '../src/render/pixel';
import { TEAMS } from '../src/sim/players';
import { WEAPON_ORDER } from '../src/weapons';

const DIRS = ['n', 'e', 's', 'w'] as const;
const FRAMES = [0, 1, 2, 3] as const;
const channels = (c: number): number[] => [(c >> 16) & 0xff, (c >> 8) & 0xff, c & 0xff];

function rebuild(layers: MarineLayers, tint: number): Pix {
  const out = layers.base;
  const t = channels(tint);
  for (let i = 0; i < layers.team.data.length; i++) {
    const c = layers.team.data[i];
    if (c === CLEAR) continue;
    const g = (c & 0xff) / 255;
    out.data[i] = (Math.round(t[0] * g) << 16) | (Math.round(t[1] * g) << 8) | Math.round(t[2] * g);
  }
  return out;
}

function compare(original: Pix, layers: MarineLayers): { overlap: number; missing: number; gray: boolean; error: number; worst: number } {
  let overlap = 0;
  let missing = 0;
  let gray = true;
  for (let i = 0; i < original.data.length; i++) {
    const b = layers.base.data[i] !== CLEAR;
    const t = layers.team.data[i] !== CLEAR;
    if (b && t) overlap++;
    if ((original.data[i] !== CLEAR) !== (b || t)) missing++;
    if (t) {
      const [r, g, bl] = channels(layers.team.data[i]);
      if (r !== g || g !== bl) gray = false;
    }
  }
  const rebuilt = rebuild(layers, TEAMS[0].tint);
  let sum = 0;
  let count = 0;
  let worst = 0;
  for (let i = 0; i < original.data.length; i++) {
    if (original.data[i] === CLEAR) continue;
    const a = channels(original.data[i]);
    const r = channels(rebuilt.data[i]);
    for (let k = 0; k < 3; k++) {
      const d = Math.abs(a[k] - r[k]);
      sum += d;
      count++;
      worst = Math.max(worst, d);
    }
  }
  return { overlap, missing, gray, error: sum / count, worst };
}

describe('Marine team layers', () => {
  it('split every frame into a base layer and a gray team layer that cover the Marine exactly once', () => {
    for (const w of WEAPON_ORDER) {
      for (const d of DIRS) {
        for (const f of FRAMES) {
          const result = compare(MARINE_ART.frame(d, f, w), marineLayers(d, f, w));
          expect(result.overlap).toBe(0);
          expect(result.missing).toBe(0);
          expect(result.gray).toBe(true);
        }
      }
    }
  });

  it('look like the green episode Marine again when tinted with the green team color', () => {
    let worst = 0;
    for (const w of WEAPON_ORDER) {
      for (const d of DIRS) {
        const result = compare(MARINE_ART.frame(d, 0, w), marineLayers(d, 0, w));
        expect(result.error).toBeLessThan(3);
        worst = Math.max(worst, result.worst);
      }
    }
    expect(worst).toBeLessThan(40);
  });

  it('split the corpse the same way', () => {
    const result = compare(MARINE_ART.corpse(), marineCorpseLayers());
    expect(result.overlap).toBe(0);
    expect(result.missing).toBe(0);
    expect(result.gray).toBe(true);
    expect(result.error).toBeLessThan(3);
  });

  it('keep the team layer free of skin, visor, boots and weapon', () => {
    const { team } = marineLayers('s', 0, 'pistol');
    const visor = 0xffb040;
    expect([...team.data].includes(visor)).toBe(false);
    expect([...team.data].filter((c) => c !== CLEAR).length).toBeGreaterThan(50);
  });
});
