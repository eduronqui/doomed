import { describe, expect, it } from 'vitest';
import { parseLevel } from '../src/sim/level';
import { DIFFICULTIES } from '../src/sim/defs';
import { IDLE_INPUT, World, type Carry, type Input } from '../src/sim/world';
import type { AmmoType, WeaponId } from '../src/weapons';

function run(world: World, seconds: number, input: Partial<Input> = {}): void {
  const full = { ...IDLE_INPUT, aimX: world.player.x + 1, aimY: world.player.y, ...input };
  for (let t = 0; t < seconds; t += 1 / 60) world.update(1 / 60, full);
}

function armed(map: string, weapon: WeaponId, ammo: Partial<Record<AmmoType, number>>): World {
  const carry: Carry = {
    health: 100,
    armor: 0,
    ammo: { bullets: 0, shells: 0, grenades: 0, fuel: 0, cells: 0, ...ammo },
    weapons: ['knife', 'pistol', weapon],
    weapon,
  };
  return new World(parseLevel('t', map), 1, DIFFICULTIES[1], carry);
}

const fireOnce = (w: World, aimX: number, aimY: number): void => {
  w.update(1 / 60, { ...IDLE_INPUT, fire: true, aimX, aimY });
};

describe('grenade launcher', () => {
  it('lobs a grenade over a crate and hurts a whole group with its blast', () => {
    const w = armed('##############\n#P..C....bb..#\n#.........b..#\n##############', 'launcher', { grenades: 5 });
    fireOnce(w, 9.5, 1.5);
    run(w, 1.5);
    expect(w.player.ammo.grenades).toBe(4);
    expect(w.monsters.every((m) => m.hp < m.def.hp)).toBe(true);
  });

  it('hurts you when it blows up close to you', () => {
    const w = armed('######\n#P.#.#\n######', 'launcher', { grenades: 1 });
    fireOnce(w, 3.5, 1.5);
    run(w, 0.5);
    expect(w.player.health).toBeLessThan(100);
  });
});

describe('flamer', () => {
  it('sets an enemy in front on fire, and the fire keeps hurting it', () => {
    const w = armed('##########\n#P.b.....#\n##########', 'flamer', { fuel: 50 });
    const brute = w.monsters[0];
    run(w, 0.3, { fire: true, aimX: brute.x, aimY: brute.y });
    expect(brute.burn).toBeGreaterThan(0);
    const after = brute.hp;
    run(w, 1);
    expect(brute.hp).toBeLessThan(after);
  });

  it('does not reach past its short range or through walls', () => {
    const far = armed('##########\n#P.....b.#\n##########', 'flamer', { fuel: 50 });
    run(far, 0.5, { fire: true, aimX: far.monsters[0].x, aimY: 1.5 });
    expect(far.monsters[0].hp).toBe(far.monsters[0].def.hp);
    const walled = armed('##########\n#P.#b....#\n##########', 'flamer', { fuel: 50 });
    run(walled, 0.5, { fire: true, aimX: walled.monsters[0].x, aimY: 1.5 });
    expect(walled.monsters[0].hp).toBe(walled.monsters[0].def.hp);
  });
});

describe('arc rifle', () => {
  it('hits every enemy in a line, up to the first wall', () => {
    const w = armed('##############\n#P..b..b.#.b.#\n##############', 'arc', { cells: 10 });
    fireOnce(w, 12, 1.5);
    const [first, second, behindWall] = w.monsters;
    expect(first.hp).toBeLessThan(first.def.hp);
    expect(second.hp).toBeLessThan(second.def.hp);
    expect(behindWall.hp).toBe(behindWall.def.hp);
    expect(w.player.ammo.cells).toBe(9);
  });
});

describe('rift cannon', () => {
  it('needs 40 cells for a shot', () => {
    const w = armed('##########\n#P.....b.#\n##########', 'rift', { cells: 39 });
    run(w, 0.2, { fire: true, aimX: 8, aimY: 1.5 });
    expect(w.player.ammo.cells).toBe(39);
    expect(w.projectiles).toHaveLength(0);
  });

  it('clears a group with one orb and spares you', () => {
    const w = armed('###########\n#P..ffff..#\n#...ffff..#\n###########', 'rift', { cells: 40 });
    fireOnce(w, 6, 1.5);
    run(w, 2);
    expect(w.player.ammo.cells).toBe(0);
    expect(w.monsters.every((m) => m.state === 'dead')).toBe(true);
    expect(w.player.health).toBe(100);
  });
});

describe('new pickups', () => {
  it('gives each new weapon with its ammo and selects it', () => {
    const cases: [string, WeaponId, AmmoType, number][] = [
      ['L', 'launcher', 'grenades', 6],
      ['F', 'flamer', 'fuel', 60],
      ['A', 'arc', 'cells', 40],
      ['Q', 'rift', 'cells', 80],
    ];
    for (const [char, weapon, ammo, amount] of cases) {
      const w = new World(parseLevel('t', `#####\n#P${char}.#\n#####`));
      run(w, 0.5, { moveX: 1 });
      expect(w.player.weapons.has(weapon)).toBe(true);
      expect(w.player.weapon).toBe(weapon);
      expect(w.player.ammo[ammo]).toBe(amount);
    }
  });

  it('picks up grenades, fuel and cells', () => {
    const w = new World(parseLevel('t', '#######\n#Pnue.#\n#######'));
    run(w, 1, { moveX: 1 });
    expect([w.player.ammo.grenades, w.player.ammo.fuel, w.player.ammo.cells]).toEqual([4, 50, 40]);
  });

  it('switches to slots 5 to 8 with the number keys', () => {
    const w = armed('#####\n#P..#\n#####', 'rift', { cells: 80 });
    w.player.weapons.add('launcher');
    w.player.weapons.add('flamer');
    w.player.weapons.add('arc');
    for (const [slot, weapon] of [
      [5, 'launcher'],
      [6, 'flamer'],
      [7, 'arc'],
      [8, 'rift'],
    ] as const) {
      w.update(1 / 60, { ...IDLE_INPUT, weaponSlot: slot });
      expect(w.player.weapon).toBe(weapon);
    }
  });
});
