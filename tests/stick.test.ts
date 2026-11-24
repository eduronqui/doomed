import { describe, expect, it } from 'vitest';
import { heading, knobOffset, stickVector } from '../src/ui/stick';

describe('stickVector', () => {
  it('stays idle inside the dead zone', () => {
    const v = stickVector(5, 0, 50, 0.2);
    expect(v).toMatchObject({ x: 0, y: 0, isActive: false });
  });

  it('reaches full strength at the radius and beyond', () => {
    expect(stickVector(50, 0, 50, 0.2).x).toBeCloseTo(1);
    expect(stickVector(500, 0, 50, 0.2).x).toBeCloseTo(1);
  });

  it('scales smoothly between the dead zone and the radius', () => {
    expect(stickVector(30, 0, 50, 0.2).x).toBeCloseTo(0.5);
  });

  it('reports the raw strength, capped at 1', () => {
    expect(stickVector(25, 0, 50, 0.2).strength).toBeCloseTo(0.5);
    expect(stickVector(80, 0, 50, 0.2).strength).toBe(1);
  });

  it('reports the angle of the drag', () => {
    expect(stickVector(0, 40, 50, 0.2).angle).toBeCloseTo(Math.PI / 2);
    expect(stickVector(-40, 0, 50, 0.2).angle).toBeCloseTo(Math.PI);
  });
});

describe('knobOffset', () => {
  it('follows the finger inside the radius', () => {
    expect(knobOffset(10, -20, 56)).toEqual({ x: 10, y: -20 });
  });

  it('clamps to the radius', () => {
    const k = knobOffset(300, 400, 50);
    expect(Math.hypot(k.x, k.y)).toBeCloseTo(50);
    expect(k.x / k.y).toBeCloseTo(0.75);
  });
});

describe('heading', () => {
  it('has full length at any drag distance past the dead zone', () => {
    for (const drag of [12, 30, 55, 400]) {
      const h = heading(stickVector(drag * 0.6, drag * 0.8, 56, 0.15));
      expect(Math.hypot(h.x, h.y)).toBeCloseTo(1);
      expect(h.y / h.x).toBeCloseTo(4 / 3);
    }
  });

  it('is zero inside the dead zone', () => {
    expect(heading(stickVector(2, 1, 56, 0.15))).toEqual({ x: 0, y: 0 });
  });
});
