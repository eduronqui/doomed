import { describe, expect, it } from 'vitest';
import { parseLevel } from '../src/sim/level';
import { WARDEN } from '../src/characters/warden';
import { DIFFICULTIES } from '../src/sim/defs';
import { IDLE_INPUT, World, type Carry, type Input, type Monster } from '../src/sim/world';

function run(world: World, seconds: number, input: Partial<Input> = {}): string[] {
  const full = { ...IDLE_INPUT, aimX: world.player.x + 1, aimY: world.player.y, ...input };
  const log: string[] = [];
  for (let t = 0; t < seconds; t += 1 / 60) {
    world.update(1 / 60, full);
    for (const e of world.drainEvents()) log.push(e.type);
  }
  return log;
}

function tough(w: World): World {
  w.player.health = 100000;
  return w;
}

function hunt(m: Monster): void {
  m.state = 'chase';
  m.lookTimer = 0;
}

describe('Gunner', () => {
  it('fires a burst of shots for each attack', () => {
    const w = tough(new World(parseLevel('t', '############\n#P.......M.#\n############'), 2));
    hunt(w.monsters[0]);
    const log = run(w, 4);
    expect(log.filter((e) => e === 'tracer').length).toBeGreaterThanOrEqual(6);
  });
});

describe('Stalker', () => {
  it('leaps at you from mid range', () => {
    const w = tough(new World(parseLevel('t', '############\n#P.....S...#\n############'), 2));
    const stalker = w.monsters[0];
    hunt(stalker);
    let leapt = false;
    for (let t = 0; t < 3 && !leapt; t += 1 / 60) {
      w.update(1 / 60, { ...IDLE_INPUT, aimX: 9, aimY: 1.5 });
      leapt = stalker.leapTime > 0;
    }
    expect(leapt).toBe(true);
  });
});

describe('Warden', () => {
  const carry: Carry = { health: 100, armor: 0, ammo: { bullets: 50, shells: 0, grenades: 0, fuel: 0, cells: 50 }, weapons: ['knife', 'pistol', 'arc', 'rift'], weapon: 'pistol' };
  const sturdy = 100000;
  const hit = (shieldAngle: number, weapon: Carry['weapon'] = 'pistol'): number => {
    const w = new World(parseLevel('t', '##########\n#P....w..#\n##########'), 1, DIFFICULTIES[1], { ...carry, weapon });
    const warden = w.monsters[0];
    warden.hp = sturdy;
    warden.shieldAngle = shieldAngle;
    warden.angle = shieldAngle;
    const aim = { aimX: warden.x, aimY: warden.y };
    w.update(1 / 60, { ...IDLE_INPUT, ...aim, fire: true });
    for (let t = 0; t < 2; t += 1 / 60) w.update(1 / 60, { ...IDLE_INPUT, ...aim });
    return sturdy - warden.hp;
  };

  it('blocks most damage from the front, but not from behind', () => {
    const front = hit(Math.PI);
    const back = hit(0);
    expect(back).toBeGreaterThanOrEqual(5);
    expect(front).toBeLessThanOrEqual(3);
  });

  it('does not block the arc rifle beam', () => {
    expect(hit(Math.PI, 'arc')).toBeGreaterThanOrEqual(18);
  });

  it('does not block the rift cannon direct hit or blast', () => {
    const front = hit(Math.PI, 'rift');
    expect(front).toBeGreaterThanOrEqual(300);
  });

  it('turns slower than 60 degrees per second', () => {
    expect(WARDEN.turnSpeed).toBeLessThan(Math.PI / 3);
  });
});

describe('Arc rifle', () => {
  const carry: Carry = { health: 100, armor: 0, ammo: { bullets: 0, shells: 0, grenades: 0, fuel: 0, cells: 50 }, weapons: ['knife', 'arc'], weapon: 'arc' };
  const sturdy = 100000;
  const fireAlongRow = (row: string): number[] => {
    const w = new World(parseLevel('t', `############\n${row}\n############`), 1, DIFFICULTIES[1], carry);
    for (const m of w.monsters) m.hp = sturdy;
    w.update(1 / 60, { ...IDLE_INPUT, fire: true, aimX: w.monsters[0].x, aimY: w.monsters[0].y });
    return w.monsters.map((m) => sturdy - m.hp);
  };

  it('hits every enemy in the line', () => {
    const [near, far] = fireAlongRow('#P...h...h.#');
    expect(near).toBeGreaterThanOrEqual(18);
    expect(far).toBeGreaterThanOrEqual(18);
  });

  it('stops at the first wall', () => {
    const [near, behindWall] = fireAlongRow('#P...h.#.h.#');
    expect(near).toBeGreaterThanOrEqual(18);
    expect(behindWall).toBe(0);
  });
});

describe('Hollow', () => {
  it('floats over slime and ledges to reach you', () => {
    const heights = ['            ', '            ', '    111     ', '            ', '            '].join('\n');
    const w = tough(new World(parseLevel('t', '############\n#P~~~~~~~~V#\n#.~~...~~~.#\n#.~~~~~~~~.#\n############', heights), 1));
    const hollow = w.monsters[0];
    hunt(hollow);
    w.player.x = 1.5;
    w.player.y = 3.5;
    run(w, 6);
    expect(hollow.x).toBeLessThan(8);
  });

  it('fires slow wisps that turn toward you', () => {
    const w = tough(new World(parseLevel('t', '############\n#P.......V.#\n#..........#\n############'), 3));
    hunt(w.monsters[0]);
    let wisp = w.projectiles.find((p) => p.look === 'wisp');
    for (let t = 0; t < 4 && !wisp; t += 1 / 60) {
      w.update(1 / 60, { ...IDLE_INPUT, aimX: 9, aimY: 1.5 });
      wisp = w.projectiles.find((p) => p.look === 'wisp');
    }
    expect(wisp).toBeDefined();
    w.player.y = 2.5;
    const before = Math.atan2(wisp!.vy, wisp!.vx);
    w.update(0.2, IDLE_INPUT);
    expect(Math.atan2(wisp!.vy, wisp!.vx)).not.toBeCloseTo(before, 2);
  });
});

describe('Gatekeeper', () => {
  const arena = '#################\n#P..............#\n#...............#\n#..........Z....#\n#...............#\n#################';

  it('cannot be backstabbed', () => {
    const w = new World(parseLevel('t', arena));
    const boss = w.monsters[0];
    boss.angle = 0;
    w.player.x = boss.x - 1.3;
    w.player.y = boss.y;
    w.update(1 / 60, { ...IDLE_INPUT, weaponSlot: 1 });
    w.player.cooldown = 0;
    w.update(1 / 60, { ...IDLE_INPUT, fire: true, aimX: boss.x, aimY: boss.y });
    expect(boss.state).not.toBe('dead');
  });

  it('summons adds below two thirds of its health, and they do not count as kills', () => {
    const w = tough(new World(parseLevel('t', arena), 2));
    const boss = w.monsters[0];
    hunt(boss);
    boss.hp = boss.def.hp * 0.6;
    boss.summonTimer = 0;
    run(w, 0.2);
    const adds = w.monsters.filter((m) => m.summoned);
    expect(adds.length).toBeGreaterThan(0);
    expect(w.stats.totalKills).toBe(1);
    for (const add of adds) w.damageMonster(add, 1000);
    expect(w.stats.kills).toBe(0);
  });

  it('teleports away after taking heavy damage, staying in its room', () => {
    const w = tough(new World(parseLevel('t', arena), 2));
    const boss = w.monsters[0];
    hunt(boss);
    boss.teleportTimer = 99;
    const start = { x: boss.x, y: boss.y };
    w.damageMonster(boss, 320, true);
    w.update(1 / 60, IDLE_INPUT);
    expect(Math.hypot(boss.x - start.x, boss.y - start.y)).toBeGreaterThan(0.5);
    expect(w.grid.tile(Math.floor(boss.x), Math.floor(boss.y))!.type).toBe('floor');
  });

  it('fires a ring of bolts below one third of its health', () => {
    const w = tough(new World(parseLevel('t', arena), 2));
    const boss = w.monsters[0];
    hunt(boss);
    boss.hp = boss.def.hp * 0.3;
    boss.slamTimer = 0;
    boss.summonTimer = 99;
    w.update(1 / 60, IDLE_INPUT);
    expect(w.projectiles.length).toBeGreaterThanOrEqual(12);
  });
});

describe('Losing sight behind a pillar', () => {
  const pillarRoom = '############\n#P....#....#\n#.....#..f.#\n#.....#....#\n#..........#\n############';

  it('keeps a Fiend chasing for a short while instead of stopping at once', () => {
    const w = tough(new World(parseLevel('t', pillarRoom), 2));
    const fiend = w.monsters[0];
    hunt(fiend);
    run(w, 1, { aimX: 1.5, aimY: 1.5 });
    expect(fiend.state).toBe('chase');
    expect(fiend.seesPlayer).toBe(false);
  });

  it('still gives up after the grace period when it never sees the player again', () => {
    const closed = '############\n#P....#....#\n#.....#..f.#\n#.....#....#\n#.....#....#\n############';
    const w = tough(new World(parseLevel('t', closed), 2));
    const fiend = w.monsters[0];
    hunt(fiend);
    run(w, 4, { aimX: 1.5, aimY: 1.5 });
    expect(fiend.state).toBe('hold');
  });
});
