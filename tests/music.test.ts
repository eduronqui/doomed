import { describe, expect, it } from 'vitest';
import { ALL_LEVELS, TRAINING } from '../src/levels';
import { DEATH_MUSIC } from '../src/levels/death.music';
import { STEPS_PER_BAR, parseHits, parseLine, trackLength, validateTrack } from '../src/render/tracks';

describe('level music', () => {
  it.each(ALL_LEVELS)('$title has whole bars with matching parts', (info) => {
    expect(() => validateTrack(info.music)).not.toThrow();
    expect(trackLength(info.music) % STEPS_PER_BAR).toBe(0);
  });

  it('has a valid death loop', () => {
    expect(() => validateTrack(DEATH_MUSIC)).not.toThrow();
    expect(trackLength(DEATH_MUSIC) % STEPS_PER_BAR).toBe(0);
  });

  it('gives every level its own track', () => {
    expect(new Set(ALL_LEVELS.map((l) => l.music)).size).toBe(ALL_LEVELS.length);
  });

  it('reads note lengths, muted chugs and rests', () => {
    expect(parseLine('0 - - . x 7 - .')).toEqual([
      { step: 0, offset: 0, steps: 3, muted: false },
      { step: 4, offset: 0, steps: 0.5, muted: true },
      { step: 5, offset: 7, steps: 2, muted: false },
    ]);
    expect(parseHits('x..x x...')).toEqual([0, 3, 4]);
    expect(() => parseLine('0 q')).toThrow(/Bad note/);
  });

  it('rejects a part with the wrong length', () => {
    expect(() => validateTrack({ ...TRAINING.music, kick: 'x...' })).toThrow(/kick/);
  });
});
