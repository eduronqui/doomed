import { describe, expect, it } from 'vitest';
import { parseDevParams } from '../src/render/devParams';

describe('dev URL parameters', () => {
  it('reads every flag and value', () => {
    expect(parseDevParams('?autostart&god&arsenal&sight&noMonster&pos=50,26&level=2', 3)).toEqual({
      autostart: true,
      god: true,
      arsenal: true,
      sight: true,
      noMonster: true,
      pos: { x: 50, y: 26 },
      level: 2,
    });
  });

  it('defaults to nothing on an empty query', () => {
    expect(parseDevParams('', 3)).toEqual({ autostart: false, god: false, arsenal: false, sight: false, noMonster: false, pos: null, level: null });
  });

  it('ignores a bad position or level', () => {
    const dev = parseDevParams('?pos=1,x&level=9', 3);
    expect(dev.pos).toBeNull();
    expect(dev.level).toBeNull();
    expect(parseDevParams('?level=0', 3).level).toBe(0);
    expect(parseDevParams('?level=1.5', 3).level).toBeNull();
  });
});
