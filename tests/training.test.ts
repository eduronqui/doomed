import { afterEach, describe, expect, it } from 'vitest';
import { TRAINING } from '../src/levels';
import type { MonsterKind } from '../src/characters';
import { IDLE_INPUT, World } from '../src/sim/world';
import { isTrainingDone, markTrainingDone } from '../src/ui/progress';

describe('training', () => {
  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
  });

  it('remembers in localStorage that the training is done', () => {
    const store = new Map<string, string>();
    (globalThis as { window?: unknown }).window = {
      localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v) },
    };
    expect(isTrainingDone()).toBe(false);
    markTrainingDone();
    expect(isTrainingDone()).toBe(true);
    expect(store.get('doomed.trainingDone')).toBe('1');
  });

  it('treats a blocked localStorage as not done and does not throw', () => {
    (globalThis as { window?: unknown }).window = {
      get localStorage(): Storage {
        throw new Error('blocked');
      },
    };
    expect(isTrainingDone()).toBe(false);
    expect(() => markTrainingDone()).not.toThrow();
  });

  it('wakes the training brute as soon as the marine steps into its room', () => {
    const enter = (options?: { alertOnEntry?: MonsterKind[] }): World => {
      const w = new World(TRAINING.load(), 1, undefined, TRAINING.startCarry, options);
      w.player.x = 28.5;
      w.player.y = 6.5;
      w.update(1 / 30, { ...IDLE_INPUT, aimX: 40, aimY: 6.5 });
      return w;
    };
    const brute = (w: World): World['monsters'][number] => w.monsters.find((m) => m.kind === 'brute')!;
    expect(brute(enter()).state).toBe('idle');
    const alerted = enter({ alertOnEntry: TRAINING.alertOnEntry });
    expect(brute(alerted).state).toBe('chase');
    expect(alerted.monsters.filter((m) => m.kind === 'husk').every((m) => m.state === 'idle')).toBe(true);
  });

  it('starts the marine hurt so resting shows, with a tip for each room', () => {
    const w = new World(TRAINING.load(), 1, undefined, TRAINING.startCarry);
    expect(w.player.health).toBe(50);
    expect(TRAINING.tips).toHaveLength(3);
    const inTip = (x: number, y: number): boolean => TRAINING.tips!.some(({ area: [x0, y0, x1, y1] }) => x >= x0 && x <= x1 && y >= y0 && y <= y1);
    expect(inTip(Math.floor(w.player.x), Math.floor(w.player.y))).toBe(true);
    for (const m of w.monsters) expect(inTip(Math.floor(m.x), Math.floor(m.y))).toBe(true);
    expect(w.monsters.map((m) => m.kind).sort()).toEqual(['brute', 'husk', 'husk']);
  });
});
