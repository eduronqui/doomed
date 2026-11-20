import { describe, expect, it } from 'vitest';
import { Grid } from '../src/sim/grid';
import { parseLevel } from '../src/sim/level';
import { findPath } from '../src/sim/pathfind';

const MAP = `
#########
#.......#
#...#...#
#...#...#
#...D...#
#########`;

describe('Grid', () => {
  const make = (): Grid => new Grid(parseLevel('g', MAP));

  it('stops movement against walls', () => {
    const g = make();
    const res = g.move(3.5, 2.5, 0.3, 0.5, 0);
    expect(res.x).toBeCloseTo(4 - 0.3, 3);
    expect(res.bumped).toContain(g.index(4, 2));
  });

  it('slides along a wall on the free axis', () => {
    const g = make();
    const res = g.move(3.6, 2.5, 0.3, 0.3, 0.3);
    expect(res.y).toBeCloseTo(2.8, 3);
    expect(res.x).toBeLessThan(4 - 0.29);
  });

  it('raycasts to the first wall', () => {
    const g = make();
    const hit = g.raycast(1.5, 2.5, 1, 0, 20);
    expect(hit.hit).toBe(true);
    expect(hit.cellX).toBe(4);
    expect(hit.dist).toBeCloseTo(2.5, 5);
  });

  it('blocks sight through a closed door and opens it over time', () => {
    const g = make();
    expect(g.lineOfSight(3.5, 4.5, 5.5, 4.5)).toBe(false);
    const door = g.doorAt(4, 4)!;
    g.openDoor(door);
    for (let i = 0; i < 30; i++) g.updateDoors(0.05, () => false);
    expect(door.phase).toBe('open');
    expect(g.isSolid(4, 4)).toBe(false);
    expect(g.lineOfSight(3.5, 4.5, 5.5, 4.5)).toBe(true);
  });

  it('opens and closes a wide door as one group', () => {
    const g = new Grid(parseLevel('w', '#####\n#...#\n#DDD#\n#...#\n#####'));
    const doors = [g.doorAt(1, 2)!, g.doorAt(2, 2)!, g.doorAt(3, 2)!];
    expect(doors[0].group).toHaveLength(3);
    g.openDoor(doors[2]);
    for (let i = 0; i < 30; i++) g.updateDoors(0.05, () => false);
    expect(doors.every((d) => d.phase === 'open' && !g.isSolid(d.x, d.y))).toBe(true);
    for (let i = 0; i < 200; i++) g.updateDoors(0.05, () => false);
    expect(doors.every((d) => d.phase === 'closed')).toBe(true);
  });

  it('does not close a door on an occupant', () => {
    const g = make();
    const door = g.doorAt(4, 4)!;
    g.openDoor(door);
    for (let i = 0; i < 200; i++) g.updateDoors(0.05, () => true);
    expect(door.openness).toBe(1);
  });
});

describe('findPath', () => {
  const g = new Grid(parseLevel('p', MAP));
  const passable = (x: number, y: number): boolean => !g.isSolid(x, y);

  it('routes around a wall', () => {
    const path = findPath(g.width, g.height, passable, 2, 3, 6, 3)!;
    expect(path.at(-1)).toEqual({ x: 6.5, y: 3.5 });
    expect(path.every((p) => passable(Math.floor(p.x), Math.floor(p.y)))).toBe(true);
    expect(path.some((p) => p.y < 2)).toBe(true);
  });

  it('returns null when the target is sealed off', () => {
    expect(findPath(g.width, g.height, (x, y) => passable(x, y) && x !== 4, 2, 3, 6, 3)).toBeNull();
  });
});
