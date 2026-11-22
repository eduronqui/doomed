import { describe, expect, it } from 'vitest';
import { parseLevel } from '../src/sim/level';
import { DIFFICULTIES } from '../src/sim/defs';
import { IDLE_INPUT, World, type Input } from '../src/sim/world';

function run(world: World, seconds: number, input: Partial<Input> = {}): string[] {
  const full = { ...IDLE_INPUT, aimX: world.player.x + 1, aimY: world.player.y, ...input };
  const log: string[] = [];
  for (let t = 0; t < seconds; t += 1 / 60) {
    world.update(1 / 60, full);
    for (const e of world.drainEvents()) if (e.type === 'message') log.push(e.text);
  }
  return log;
}

const MAP = ['##K######', '#P..#...#', '#...J.h.#', '#...#...#', '#########'].join('\n');
const LINKS = [{ at: [2, 0] as [number, number], gates: [[4, 2] as [number, number]] }];

describe('switches and gates', () => {
  it('keeps a gate shut when you use it', () => {
    const w = new World(parseLevel('t', MAP, undefined, LINKS));
    w.player.x = 3.5;
    w.player.y = 2.5;
    const log = run(w, 0.1, { use: true, aimX: 4.5, aimY: 2.5 });
    run(w, 1);
    expect(w.grid.doorAt(4, 2)!.openness).toBe(0);
    expect(log).toContain('This gate opens from a switch.');
  });

  it('opens the linked gate for good when you use the switch', () => {
    const w = new World(parseLevel('t', MAP, undefined, LINKS));
    w.player.x = 2.5;
    w.player.y = 1.5;
    const log = run(w, 0.1, { use: true, aimX: 2.5, aimY: 0.5 });
    expect(w.switchesOn.has(0)).toBe(true);
    expect(log).toContain('A gate opens somewhere.');
    run(w, 15);
    expect(w.grid.doorAt(4, 2)!.openness).toBe(1);
  });

  it('does not let monsters open a gate', () => {
    const w = new World(parseLevel('t', MAP, undefined, LINKS), 1, DIFFICULTIES[1]);
    w.monsters[0].state = 'chase';
    w.monsters[0].lookTimer = 0;
    run(w, 3);
    expect(w.grid.doorAt(4, 2)!.openness).toBe(0);
    expect(w.monsters[0].x).toBeGreaterThan(5);
  });

  it('rejects a switch without a link, a link to a non gate, and a gate without a switch', () => {
    expect(() => parseLevel('t', MAP)).toThrow(/no link/);
    expect(() => parseLevel('t', MAP, undefined, [{ at: [2, 0], gates: [[3, 2]] }])).toThrow(/not a gate/);
    expect(() => new World(parseLevel('t', MAP.replace('K', '#')))).toThrow(/has no switch/);
  });
});

describe('monsters watching doors', () => {
  const map = ['#########', '#P......#', '####D####', '#.......#', '#.h...h.#', '#########'].join('\n');

  it('face the nearest door of their room', () => {
    const w = new World(parseLevel('t', map), 1, DIFFICULTIES[1], undefined, { watchDoors: true });
    for (const m of w.monsters) {
      const toDoor = Math.atan2(2.5 - m.y, 4.5 - m.x);
      expect(m.angle).toBeCloseTo(toDoor, 5);
    }
  });

  it('keep their default facing without the option', () => {
    const w = new World(parseLevel('t', map));
    for (const m of w.monsters) expect(m.angle).toBeCloseTo(Math.PI / 2, 5);
  });
});
