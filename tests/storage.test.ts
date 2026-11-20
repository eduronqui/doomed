import { afterEach, describe, expect, it } from 'vitest';
import { Music } from '../src/render/music';
import { Sfx } from '../src/render/sfx';
import { readFlag, writeFlag } from '../src/ui/storage';

const fakeStorage = (initial: Record<string, string> = {}): Map<string, string> => {
  const store = new Map(Object.entries(initial));
  (globalThis as { window?: unknown }).window = {
    localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v) },
  };
  return store;
};

describe('stored settings', () => {
  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
  });

  it('reads the fallback until a flag is written', () => {
    const store = fakeStorage();
    expect(readFlag('doomed.test', true)).toBe(true);
    writeFlag('doomed.test', false);
    expect(store.get('doomed.test')).toBe('0');
    expect(readFlag('doomed.test', true)).toBe(false);
  });

  it('uses the fallback and does not throw when storage is blocked', () => {
    (globalThis as { window?: unknown }).window = {
      get localStorage(): Storage {
        throw new Error('blocked');
      },
    };
    expect(readFlag('doomed.test', true)).toBe(true);
    expect(() => writeFlag('doomed.test', false)).not.toThrow();
  });

  it('remembers the sound mute (M) like the music toggle (N)', () => {
    const store = fakeStorage();
    const sfx = new Sfx();
    const music = new Music(sfx);
    expect(sfx.muted).toBe(false);
    expect(music.enabled).toBe(true);
    sfx.toggleMute();
    music.toggle();
    expect(store.get('doomed.sound')).toBe('0');
    expect(store.get('doomed.music')).toBe('0');
    expect(new Sfx().muted).toBe(true);
    expect(new Music(new Sfx()).enabled).toBe(false);
  });
});
