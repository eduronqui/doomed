import { describe, expect, it } from 'vitest';
import { parseLevel } from '../src/sim/level';
import { IDLE_INPUT, World, type Input } from '../src/sim/world';

function run(world: World, seconds: number, input: Partial<Input> = {}): void {
  const full = { ...IDLE_INPUT, aimX: world.player.x + 1, aimY: world.player.y, ...input };
  for (let t = 0; t < seconds; t += 1 / 60) world.update(1 / 60, full);
}

const PLATFORM = ['         ', '     111 ', '     111 ', '    /111 ', '         '].join('\n');

function make(map: string, heights = PLATFORM): World {
  return new World(parseLevel('t', map, heights));
}

describe('raised floor', () => {
  it('reads heights from a separate height map', () => {
    const level = parseLevel('t', '#########\n#P......#\n#.......#\n#.......#\n#########', PLATFORM);
    const at = (x: number, y: number): number => level.tiles[y * level.width + x].height;
    expect([at(2, 1), at(5, 1), at(4, 3)]).toEqual([0, 1, 0.5]);
  });

  it('rejects stairs that do not join low and raised floor', () => {
    const heights = ['         ', ' /       ', '         ', '         ', '         '].join('\n');
    expect(() => parseLevel('t', '#########\n#P......#\n#.......#\n#.......#\n#########', heights)).toThrow(/must join/);
  });

  it('rejects a height on a wall', () => {
    const heights = ['1        ', '         ', '         ', '         ', '         '].join('\n');
    expect(() => parseLevel('t', '#########\n#P......#\n#.......#\n#.......#\n#########', heights)).toThrow(/not on floor/);
  });

  it('stops you at a ledge, up or down', () => {
    const up = make('#########\n#P......#\n#.......#\n#.......#\n#########');
    run(up, 1.5, { moveX: 1 });
    expect(up.player.x).toBeLessThan(5);
    const down = make('#########\n#.....P.#\n#.......#\n#.......#\n#########');
    run(down, 1.5, { moveX: -1 });
    expect(down.player.x).toBeGreaterThan(5);
  });

  it('keeps your body out of a raised side while you stand below it', () => {
    const w = make('#########\n#..P....#\n#.......#\n#.......#\n#########');
    run(w, 1.5, { moveX: 1 });
    expect(w.player.x + w.player.r).toBeLessThanOrEqual(5);
  });

  it('lets you climb stairs onto the raised floor', () => {
    const w = make('#########\n#.......#\n#.......#\n#.P.....#\n#########');
    run(w, 1.5, { moveX: 1 });
    expect(w.player.x).toBeGreaterThan(5.5);
    expect(w.grid.standHeight(w.player.x, w.player.y)).toBe(1);
  });

  it('lets you use a one-tile stair without lining up exactly', () => {
    const w = make('#########\n#P......#\n#.......#\n#.......#\n#########');
    w.player.x = 5.5;
    w.player.y = 3.25;
    run(w, 1.5, { moveX: -1 });
    expect(w.player.x).toBeLessThan(4);
    w.player.y = 3.25;
    run(w, 1.5, { moveX: 1 });
    expect(w.player.x).toBeGreaterThan(5.5);
  });

  it('lets shots cross between heights', () => {
    const w = make('#########\n#P....h.#\n#.......#\n#.......#\n#########');
    const husk = w.monsters[0];
    const full = husk.hp;
    run(w, 3, { fire: true, aimX: husk.x, aimY: husk.y });
    expect(husk.hp).toBeLessThan(full);
  });

  it('keeps a melee enemy from striking across a ledge', () => {
    const noStairs = ['         ', '     111 ', '     111 ', '     111 ', '         '].join('\n');
    const w = make('#########\n#...b.P.#\n#.......#\n#.......#\n#########', noStairs);
    w.player.health = 100;
    run(w, 3);
    expect(w.player.health).toBe(100);
  });

  it('sends a melee enemy up the stairs to reach you', () => {
    const w = make('#########\n#.....P.#\n#.b.....#\n#.......#\n#########');
    w.player.health = 1000;
    w.update(1 / 60, { ...IDLE_INPUT, fire: true, aimX: 7.5, aimY: 0 });
    run(w, 6);
    expect(w.player.health).toBeLessThan(1000);
    expect(w.grid.standHeight(w.monsters[0].x, w.monsters[0].y)).toBeGreaterThan(0);
  });
});
