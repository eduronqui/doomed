import { describe, expect, it } from 'vitest';
import { LEVELS } from '../src/levels';
import { parseLevel } from '../src/sim/level';
import { MONSTERS } from '../src/characters';
import { DIFFICULTIES } from '../src/sim/defs';
import { IDLE_INPUT, World, type Input } from '../src/sim/world';
import type { WeaponId } from '../src/weapons';

function run(world: World, seconds: number, input: Partial<Input> = {}): void {
  const full = { ...IDLE_INPUT, aimX: world.player.x + 1, aimY: world.player.y, ...input };
  for (let t = 0; t < seconds; t += 1 / 60) world.update(1 / 60, full);
}

function events(world: World): string[] {
  return world.drainEvents().map((e) => (e.type === 'message' ? e.text : e.type === 'sound' ? `sound:${e.sound}` : e.type));
}

describe('World', () => {
  it('picks up items and counts them', () => {
    const w = new World(parseLevel('t', '#######\n#P.m..#\n#######'));
    w.player.health = 50;
    run(w, 0.6, { moveX: 1 });
    expect(w.player.health).toBe(75);
    expect(w.stats.items).toBe(1);
    expect(events(w)).toContain('You picked up a medikit.');
  });

  it('equips a new weapon on pickup and gives its ammo', () => {
    const w = new World(parseLevel('t', '#######\n#P.G..#\n#######'));
    run(w, 0.6, { moveX: 1 });
    expect(w.player.weapon).toBe('shotgun');
    expect(w.player.ammo.shells).toBe(8);
  });

  it('falls back to the knife when the current weapon runs dry', () => {
    const w = new World(parseLevel('t', '#######\n#P....#\n#######'));
    w.player.ammo.bullets = 1;
    run(w, 1.5, { fire: true });
    expect(w.player.ammo.bullets).toBe(0);
    expect(w.player.weapon).toBe('knife');
  });

  it('leaves health items when the player is at full health', () => {
    const w = new World(parseLevel('t', '#######\n#P.+..#\n#######'));
    run(w, 0.6, { moveX: 1 });
    expect(w.items[0].taken).toBe(false);
  });

  it('kills a husk with pistol fire and drops a clip', () => {
    const w = new World(parseLevel('t', '##########\n#P.....h.#\n##########'), 7);
    const husk = w.monsters[0];
    run(w, 6, { fire: true, aimX: husk.x, aimY: husk.y });
    expect(husk.state).toBe('dead');
    expect(w.stats.kills).toBe(1);
    expect(w.player.ammo.bullets).toBeLessThan(50);
    expect(w.items.some((i) => i.kind === 'clip' && i.dropped)).toBe(true);
  });

  it.each([
    ['brute', 'b'],
    ['shade', 'g'],
  ])('makes a dead %s drop a stimpack that heals and does not count as an item', (_name, char) => {
    const w = new World(parseLevel('t', `##########\n#P....${char}..#\n##########`));
    const monster = w.monsters[0];
    w.damageMonster(monster, 1000);
    const stimpack = w.items.find((i) => i.kind === 'stimpack' && i.dropped)!;
    expect(stimpack).toBeDefined();
    w.player.health = 50;
    w.player.x = stimpack.x;
    w.player.y = stimpack.y;
    run(w, 0.1);
    expect(stimpack.taken).toBe(true);
    expect(w.player.health).toBe(60);
    expect(w.stats.items).toBe(0);
  });

  it('wakes monsters that hear gunfire and they chase the player', () => {
    const w = new World(parseLevel('t', '#############\n#P....#....b#\n#...........#\n#############'), 3);
    const brute = w.monsters[0];
    run(w, 0.1, { fire: true, aimX: 1.5, aimY: 0 });
    expect(brute.state).not.toBe('idle');
    const startDist = Math.hypot(brute.x - w.player.x, brute.y - w.player.y);
    run(w, 1.5);
    expect(Math.hypot(brute.x - w.player.x, brute.y - w.player.y)).toBeLessThan(startDist - 2);
  });

  it('treats a light pole as a thin post, not a full tile', () => {
    const map = '#######\n#.....#\n#P.l..#\n#.....#\n#######';
    const past = new World(parseLevel('t', map));
    past.player.y = 2;
    run(past, 0.8, { moveX: 1 });
    expect(past.player.x).toBeGreaterThan(4);
    const headOn = new World(parseLevel('t', map));
    run(headOn, 0.8, { moveX: 1 });
    expect(headOn.player.x).toBeLessThan(3.5 - 0.45);
    expect(headOn.player.x).toBeGreaterThan(3);
  });

  it('stops bullets and fireballs at crates', () => {
    const w = new World(parseLevel('t', '##########\n#P..C..h.#\n##########'), 2);
    const husk = w.monsters[0];
    run(w, 3, { fire: true, aimX: husk.x, aimY: husk.y });
    expect(husk.hp).toBe(husk.def.hp);
    expect(w.player.ammo.bullets).toBeLessThan(50);
  });

  it('keeps monsters off slime even when the player stands across it', () => {
    const w = new World(parseLevel('t', '###########\n#P..~~~..f#\n#...~~~...#\n###########'), 4);
    const fiend = w.monsters[0];
    w.player.health = 10000;
    run(w, 6, { aimX: fiend.x, aimY: fiend.y, fire: true });
    run(w, 6);
    const onHazard = (x: number): boolean => x > 4 && x < 8;
    expect(onHazard(fiend.x)).toBe(false);
    expect(fiend.state).not.toBe('idle');
  });

  it('makes calm fiends scan the room often', () => {
    const w = new World(parseLevel('t', '#####\n#P#f#\n#####'), 4);
    const fiend = w.monsters[0];
    const dirs = new Set<string>();
    for (let t = 0; t < 6; t += 0.1) {
      run(w, 0.1);
      dirs.add(fiend.dir);
    }
    expect(fiend.state).toBe('idle');
    expect(dirs.size).toBeGreaterThanOrEqual(3);
    expect(fiend.def.lookEvery[1]).toBeLessThan(MONSTERS.husk.lookEvery[0]);
  });

  it('lets idle monsters see only inside their view cone', () => {
    const room = (rows: string[]): World => new World(parseLevel('t', ['#########', ...rows, '#########'].join('\n')));
    const empty = '#.......#';
    const behind = room(['#...P...#', empty, empty, '#...h...#', empty]);
    run(behind, 0.5, { aimX: 4.5, aimY: 0 });
    expect(behind.monsters[0].state).toBe('idle');

    const front = room([empty, '#...h...#', empty, empty, '#...P...#']);
    run(front, 0.5, { aimX: 4.5, aimY: 0 });
    expect(front.monsters[0].state).not.toBe('idle');
  });

  describe('knife backstab', () => {
    const setup = (rows: string[]): World => {
      const w = new World(parseLevel('t', ['#########', ...rows, '#########'].join('\n')), 5);
      w.player.weapon = 'knife';
      for (const m of w.monsters) {
        m.angle = Math.PI / 2;
        m.turnTo = Math.PI / 2;
        m.lookAround = 99;
      }
      return w;
    };

    it('kills a calm enemy from behind at once without waking the others', () => {
      const w = setup(['#...P...#', '#...b...#', '#.......#', '#.b.....#']);
      const [target, other] = w.monsters;
      run(w, 1, { aimX: target.x, aimY: target.y });
      expect(target.state).toBe('idle');
      run(w, 0.1, { fire: true, aimX: target.x, aimY: target.y });
      const log = events(w);
      expect(target.state).toBe('dead');
      expect(other.state).toBe('idle');
      expect(log).toContain('Silent kill.');
      expect(log).toContain('sound:backstab');
      expect(log).not.toContain('sound:monsterDeath');
    });

    it('does normal knife damage from the front', () => {
      const w = setup(['#...b...#', '#...P...#', '#.......#']);
      const brute = w.monsters[0];
      run(w, 0.1, { fire: true, aimX: brute.x, aimY: brute.y });
      expect(brute.state).not.toBe('dead');
      expect(brute.hp).toBeLessThan(brute.def.hp);
    });

    it('wakes the others when a knife kill is not a backstab', () => {
      const w = setup(['#...b...#', '#...P...#', '#.......#', '#.......#', '#.....b.#']);
      const [target, other] = w.monsters;
      target.hp = 1;
      run(w, 0.1, { fire: true, aimX: target.x, aimY: target.y });
      const log = events(w);
      expect(target.state).toBe('dead');
      expect(log).toContain('sound:monsterDeath');
      expect(log).not.toContain('Silent kill.');
      expect(other.state).toBe('chase');
    });

    it('does normal knife damage to an enemy that is already hunting', () => {
      const w = setup(['#...P...#', '#...b...#', '#.......#']);
      const brute = w.monsters[0];
      w.damageMonster(brute, 1);
      brute.angle = Math.PI / 2;
      run(w, 0.1, { fire: true, aimX: brute.x, aimY: brute.y });
      expect(brute.state).not.toBe('dead');
    });
  });

  describe('when the player is out of sight', () => {
    const SEALED = '##############\n#P..#........#\n#...#....X...#\n#...#........#\n##############';
    const setup = (kind: string): { w: World; m: World['monsters'][number] } => {
      const w = new World(parseLevel('t', SEALED.replace('X', kind)), 9);
      const m = w.monsters[0];
      w.damageMonster(m, 1);
      return { w, m };
    };

    it('husks give up and wander around', () => {
      const { w, m } = setup('h');
      run(w, 1);
      expect(m.state).toBe('wander');
      const seen = new Set<string>();
      for (let i = 0; i < 10; i++) {
        run(w, 1);
        seen.add(`${Math.round(m.x)},${Math.round(m.y)}`);
      }
      expect(seen.size).toBeGreaterThan(1);
    });

    it('fiends stop and hold position', () => {
      const { w, m } = setup('f');
      const start = { x: m.x, y: m.y };
      run(w, 3);
      expect(m.state).toBe('hold');
      expect({ x: m.x, y: m.y }).toEqual(start);
      w.player.x = 7.5;
      w.player.y = 2.5;
      run(w, 0.5);
      expect(['chase', 'windup', 'pain']).toContain(m.state);
    });

    it('brutes track for a while, then walk back home', () => {
      const { w, m } = setup('b');
      m.x = 11.5;
      m.y = 1.5;
      run(w, 3);
      expect(m.state).toBe('chase');
      run(w, 8);
      expect(m.state).toBe('idle');
      expect(Math.hypot(m.x - m.home.x, m.y - m.home.y)).toBeLessThan(0.3);
    });
  });

  it('makes a fiend lose track when a crate is between it and the player', () => {
    const w = new World(parseLevel('t', '###########\n#.........#\n#P...C...f#\n#.........#\n###########'), 3);
    const fiend = w.monsters[0];
    w.player.y = 1.5;
    run(w, 0.5, { aimX: 1.5, aimY: 0 });
    fiend.state = 'chase';
    fiend.angle = Math.PI;
    w.player.y = 2.5;
    run(w, 1, { aimX: 1.5, aimY: 0 });
    expect(fiend.state).toBe('hold');
  });

  it('starts resting after 10 still seconds, then recovers 1 hp every 2 seconds', () => {
    const w = new World(parseLevel('t', '##########\n#P.......#\n####D#####\n#....h...#\n##########'));
    w.player.health = 20;
    run(w, 9.9);
    expect(w.player.health).toBe(20);
    expect(w.player.resting).toBe(false);
    run(w, 6.15);
    expect(w.player.resting).toBe(true);
    expect(w.player.health).toBe(23);
    run(w, 3, { moveX: 1 });
    expect(w.player.health).toBe(23);
  });

  it('rests only up to the difficulty cap: 60 on Recruit, 30 on Veteran, never on Doomed', () => {
    const map = '##########\n#P.......#\n##########';
    const [recruit, veteran, doomed] = DIFFICULTIES;
    const rest = (d: (typeof DIFFICULTIES)[number], hp: number): World => {
      const w = new World(parseLevel('t', map), 1, d);
      w.player.health = hp;
      run(w, 40);
      return w;
    };
    expect(rest(recruit, 55).player.health).toBe(60);
    expect(rest(veteran, 25).player.health).toBe(30);
    const capped = rest(veteran, 30);
    expect([capped.player.health, capped.player.resting]).toEqual([30, false]);
    expect(rest(doomed, 10).player.health).toBe(10);
  });

  it('restarts the rest delay when the player moves or shoots', () => {
    const w = new World(parseLevel('t', '############\n#P.........#\n############'));
    w.player.health = 20;
    run(w, 8);
    run(w, 0.2, { moveX: 1 });
    run(w, 8);
    expect(w.player.resting).toBe(false);
    run(w, 0.1, { fire: true });
    run(w, 9);
    expect(w.player.resting).toBe(false);
    expect(w.player.health).toBe(20);
  });

  it('does not recover while an enemy shares the room', () => {
    const w = new World(parseLevel('t', '#########################\n#P.....................h#\n#########################'));
    w.player.health = 10;
    run(w, 15);
    expect(w.monsters[0].state).toBe('idle');
    expect(w.player.health).toBe(10);
  });

  it('never lets a monster open a door, but lets it pass an open one', () => {
    const map = '#############\n#P....#.....#\n#.....D...b.#\n#.....#.....#\n#############';
    const closed = new World(parseLevel('t', map), 6);
    closed.damageMonster(closed.monsters[0], 1);
    run(closed, 4);
    expect(closed.grid.doorAt(6, 2)!.phase).toBe('closed');
    expect(closed.monsters[0].x).toBeGreaterThan(6);

    const open = new World(parseLevel('t', map), 6);
    const door = open.grid.doorAt(6, 2)!;
    open.grid.openDoor(door);
    door.openness = 1;
    door.phase = 'open';
    door.timer = 100;
    open.damageMonster(open.monsters[0], 1);
    open.player.health = 10000;
    run(open, 4);
    expect(open.monsters[0].x).toBeLessThan(6);
  });

  it('scales enemy damage and ammo pickups with the difficulty', () => {
    const map = '#######\n#P.c..#\n#######';
    const [recruit, veteran, doomed] = DIFFICULTIES;
    const hits = [recruit, veteran, doomed].map((d) => {
      const w = new World(parseLevel('t', map), 1, d);
      run(w, 0.6, { moveX: 1 });
      (w as unknown as { hurtPlayerByEnemy(n: number): void }).hurtPlayerByEnemy(20);
      return { hp: w.player.health, bullets: w.player.ammo.bullets };
    });
    expect(hits.map((h) => h.hp)).toEqual([90, 80, 70]);
    expect(hits.map((h) => h.bullets)).toEqual([80, 50, 28]);
  });

  it('starts a fresh game with 60, 40 or 20 bullets by difficulty, but keeps carried ammo', () => {
    const map = '#####\n#P..#\n#####';
    const fresh = DIFFICULTIES.map((d) => new World(parseLevel('t', map), 1, d).player.ammo);
    expect(fresh).toEqual([
      { bullets: 60, shells: 0 },
      { bullets: 40, shells: 0 },
      { bullets: 20, shells: 0 },
    ]);
    const carry = { health: 80, armor: 10, ammo: { bullets: 123, shells: 7 }, weapons: ['knife', 'pistol'] as WeaponId[], weapon: 'pistol' as const };
    expect(new World(parseLevel('t', map), 1, DIFFICULTIES[2], carry).player.ammo).toEqual({ bullets: 123, shells: 7 });
  });

  describe('key ambush', () => {
    const map = '#########\n#P.k....#\n#####TT##\n    #..#\n    #..#\n    ####';
    const ambush = { key: 'red' as const, groups: { recruit: 'h', veteran: 'hh', doomed: 'hf' } };
    const make = (d = DIFFICULTIES[1]): World => new World(parseLevel('t', map), 1, d, undefined, { ambush });
    const trap = (w: World) => [...w.grid.doors.values()].find((d) => d.kind === 'trap')!;

    it('hides a group that depends on the difficulty and counts it in the kill total', () => {
      const kinds = DIFFICULTIES.map((d) => make(d).monsters.map((m) => m.kind).join(','));
      expect(kinds).toEqual(['husk', 'husk,husk', 'husk,fiend']);
      expect(make().stats.totalKills).toBe(2);
    });

    it('lets a group that wakes at once give a single cry', () => {
      const w = make(DIFFICULTIES[2]);
      w.player.health = 10000;
      const log: string[] = [];
      for (let t = 0; t < 0.4; t += 1 / 60) {
        w.update(1 / 60, { ...IDLE_INPUT, moveX: 1 });
        log.push(...events(w));
      }
      expect(w.monsters.filter((m) => m.state !== 'idle')).toHaveLength(2);
      expect(log.filter((e) => e.startsWith('sound:alert'))).toHaveLength(1);
    });

    it('rejects a trap door narrower than its closet', () => {
      const narrow = '#########\n#P.k....#\n#####T###\n    #..#\n    ####';
      expect(() => new World(parseLevel('t', narrow), 1, DIFFICULTIES[1], undefined, { ambush })).toThrow(/as wide as its closet/);
    });

    it('leaves two medkits on the back row of the closet', () => {
      const wide = '#########\n#P.k....#\n###TTT###\n  #...#\n  #...#\n  #####';
      const medkits = new World(parseLevel('t', wide), 1, DIFFICULTIES[1], undefined, { ambush }).items.filter((i) => i.kind === 'medkit');
      expect(medkits.map((i) => [i.x, i.y])).toEqual([[3.5, 4.5], [5.5, 4.5]]);
    });

    it('treats a closet that sticks out of the room as unknown area', () => {
      expect(make().hiddenCloset()!.embedded).toBe(false);
    });

    it('treats a closet walled in by rooms as part of the wall', () => {
      const inside = '##########\n#P.k.....#\n#..#TT#..#\n#..#..#..#\n#..#..#..#\n#..####..#\n#........#\n##########';
      expect(new World(parseLevel('t', inside), 1, DIFFICULTIES[1], undefined, { ambush }).hiddenCloset()!.embedded).toBe(true);
    });

    it('keeps the trap door shut against use and bumps', () => {
      const w = make();
      w.player.x = 5.5;
      run(w, 0.5, { use: true, moveY: 1, aimX: 5.5, aimY: 4 });
      expect(trap(w).openness).toBe(0);
    });

    it('opens the trap door and wakes the group when the player takes the key', () => {
      const w = make();
      run(w, 1, { moveX: 1 });
      expect(w.player.keys.has('red')).toBe(true);
      expect(trap(w).openness).toBeGreaterThan(0);
      expect(w.monsters.every((m) => m.state !== 'idle')).toBe(true);
    });
  });

  it.each(LEVELS.filter((l) => l.ambush).map((l) => [l.title, l] as const))('%s fits its ambush on every difficulty', (_t, info) => {
    for (const d of DIFFICULTIES) {
      const plain = new World(info.load(), 1, d).monsters.length;
      const w = new World(info.load(), 1, d, undefined, { ambush: info.ambush });
      expect(w.monsters.length - plain).toBe(info.ambush!.groups[d.id].length);
      expect(w.items.filter((i) => i.kind === 'medkit').length - new World(info.load(), 1, d).items.filter((i) => i.kind === 'medkit').length).toBe(2);
      expect(w.monsters.slice(plain).every((m) => !w.isRevealedAt(m.x, m.y))).toBe(true);
    }
  });

  it('lets an enemy cry only the first time it becomes alert', () => {
    const w = new World(parseLevel('t', '#######\n#P..f.#\n#######'));
    const fiend = w.monsters[0];
    const wake = (): string[] => {
      (w as unknown as { wake(m: typeof fiend): void }).wake(fiend);
      return events(w).filter((e) => e.startsWith('sound:alert'));
    };
    expect(wake()).toHaveLength(1);
    fiend.state = 'hold';
    w.time += 2;
    expect(wake()).toHaveLength(0);
    expect(fiend.state).toBe('chase');
  });

  describe('footsteps', () => {
    const walk = (floor: string, wall = false): World => {
      const mid = wall ? '#' : floor;
      const w = new World(parseLevel('t', `##########\n#P${floor}${floor}${mid}${floor}h..#\n##########`));
      w.monsters[0].angle = 0;
      run(w, 0.5, { moveX: 1, aimX: 9, aimY: 1.5 });
      return w;
    };

    it('wakes a calm enemy within 4 tiles when the marine walks on metal', () => {
      expect(walk('.').monsters[0].state).toBe('chase');
    });

    it('scales the hearing range with the difficulty: 3.4, 4 and 5 tiles', () => {
      const heard = (d: (typeof DIFFICULTIES)[number], gap: number): boolean => {
        const w = new World(parseLevel('t', '############\n#P.........#\n############'), 1, d);
        const husk = w.spawnMonster('husk', 0, 1.5);
        husk.angle = 0;
        husk.x = 1.5 + gap;
        run(w, 0.36, { moveX: 1, aimX: 10, aimY: 1.5 });
        return husk.state === 'chase';
      };
      const [recruit, veteran, doomed] = DIFFICULTIES;
      expect([heard(recruit, 4.9), heard(recruit, 5.4)]).toEqual([true, false]);
      expect([heard(veteran, 5.5), heard(veteran, 6)]).toEqual([true, false]);
      expect([heard(doomed, 6.5), heard(doomed, 7)]).toEqual([true, false]);
    });

    it('stays quiet on concrete', () => {
      expect(walk(',').monsters[0].state).toBe('idle');
    });

    it('does not carry through a wall', () => {
      expect(walk('.', true).monsters[0].state).toBe('idle');
    });

    it('lets a heard step alarm the group around the enemy', () => {
      const w = new World(parseLevel('t', '##############\n#P...h......h#\n##############'));
      for (const m of w.monsters) m.angle = 0;
      run(w, 0.5, { moveX: 1, aimX: 13, aimY: 1.5 });
      expect(w.monsters.map((m) => m.state)).toEqual(['chase', 'chase']);
    });
  });

  it('lets a wounded enemy alarm its neighbors, but not one hurt by a barrel', () => {
    const map = '##############\n#P.........hh#\n##############';
    const byPlayer = new World(parseLevel('t', map));
    byPlayer.damageMonster(byPlayer.monsters[0], 1, true);
    expect(byPlayer.monsters[1].state).toBe('chase');
    const byBarrel = new World(parseLevel('t', map));
    byBarrel.damageMonster(byBarrel.monsters[0], 1);
    expect(byBarrel.monsters[1].state).toBe('idle');
  });

  describe('spotting the player', () => {
    const spot = (gap: number): string => {
      const width = 6 + gap;
      const row = `#P..h${'.'.repeat(gap - 1)}h.#`;
      const w = new World(parseLevel('t', `${'#'.repeat(width + 2)}\n${row}\n${'#'.repeat(width + 2)}`));
      const [seer, other] = w.monsters;
      seer.angle = Math.PI;
      other.angle = 0;
      run(w, 0.3);
      expect(seer.state).toBe('chase');
      expect(other.seesPlayer).toBe(false);
      return other.state;
    };

    it('wakes enemies within 10 tiles of the one that sees the player', () => {
      expect(spot(9)).toBe('chase');
    });

    it('leaves enemies farther away calm', () => {
      expect(spot(12)).toBe('idle');
    });
  });

  it('lets a husk next to the player shoot at point-blank range', () => {
    const w = new World(parseLevel('t', '#######\n#P.h..#\n#######'), 3);
    w.player.health = 10000;
    const husk = w.monsters[0];
    husk.x = w.player.x + 0.65;
    husk.y = w.player.y;
    w.damageMonster(husk, 1);
    const log: string[] = [];
    for (let t = 0; t < 4; t += 1 / 60) {
      w.update(1 / 60, IDLE_INPUT);
      log.push(...events(w));
    }
    expect(Math.hypot(husk.x - w.player.x, husk.y - w.player.y)).toBeLessThan(1);
    expect(log).toContain('sound:pistol');
  });

  describe('husk guns', () => {
    const fireOnce = (kind: string): string[] => {
      const w = new World(parseLevel('t', `##########\n#P....${kind}..#\n##########`), 4);
      w.player.health = 10000;
      w.damageMonster(w.monsters[0], 1);
      const log: string[] = [];
      for (let t = 0; t < 6 && !log.some((e) => e.startsWith('sound:pistol') || e.startsWith('sound:shotgun')); t += 1 / 60) {
        w.update(1 / 60, { ...IDLE_INPUT, aimX: w.player.x + 1, aimY: w.player.y });
        log.push(...events(w));
      }
      return log;
    };

    it('lets a husk fire the sidearm: one shot with the sidearm sound', () => {
      const log = fireOnce('h');
      expect(log).toContain('sound:pistol');
      expect(log.filter((e) => e === 'tracer')).toHaveLength(1);
    });

    it('lets a shotgun husk fire the pump shotgun: seven pellets with the shotgun sound', () => {
      const log = fireOnce('H');
      expect(log).toContain('sound:shotgun');
      expect(log.filter((e) => e === 'tracer')).toHaveLength(7);
    });

    it('drops 5 rounds of the held gun ammo on Veteran, scaled by the difficulty', () => {
      const [recruit, veteran, doomed] = DIFFICULTIES;
      const loot = (kind: string, d = veteran): { bullets: number; shells: number } => {
        const w = new World(parseLevel('t', `########\n#P.${kind}...#\n########`), 1, d);
        const start = { ...w.player.ammo };
        w.damageMonster(w.monsters[0], 999);
        run(w, 0.8, { moveX: 1 });
        return { bullets: w.player.ammo.bullets - start.bullets, shells: w.player.ammo.shells - start.shells };
      };
      expect(loot('h')).toEqual({ bullets: 5, shells: 0 });
      expect(loot('H')).toEqual({ bullets: 0, shells: 5 });
      expect(loot('h', recruit).bullets).toBe(10);
      expect(loot('H', doomed).shells).toBe(4);
    });
  });

  it('hides rooms behind closed doors until a door opens into them', () => {
    const w = new World(parseLevel('t', '###########\n#P...D...h#\n###########'));
    const husk = w.monsters[0];
    expect(w.isRevealedAt(w.player.x, w.player.y)).toBe(true);
    expect(w.isRevealedAt(husk.x, husk.y)).toBe(false);
    run(w, 1.2, { moveX: 1 });
    expect(w.isRevealedAt(husk.x, husk.y)).toBe(true);
  });

  it('opens blue and yellow doors only with the matching keycard', () => {
    const w = new World(parseLevel('t', '############\n#PyB....j..#\n############'));
    run(w, 1, { moveX: 1 });
    expect(w.player.keys.has('yellow')).toBe(true);
    expect(w.player.x).toBeLessThan(3.5);
    expect(events(w)).toContain('You need a blue keycard to open this door.');
  });

  it('carries weapons, ammo, health and armor into the next level', () => {
    const map = '#######\n#P....#\n#######';
    const first = new World(parseLevel('t', map));
    first.player.weapons.add('shotgun');
    first.player.weapon = 'shotgun';
    first.player.ammo.shells = 12;
    first.player.health = 64;
    first.player.armor = 30;
    first.player.keys.add('red');
    const next = new World(parseLevel('t', map), 1, undefined, first.carry());
    expect(next.player.weapon).toBe('shotgun');
    expect(next.player.ammo.shells).toBe(12);
    expect([next.player.health, next.player.armor]).toEqual([64, 30]);
    expect(next.player.keys.size).toBe(0);
  });

  it('gives shades the brute fighting style with a longer hunt', () => {
    const w = new World(parseLevel('t', '#####\n#P.g#\n#####'));
    const shade = w.monsters[0];
    expect(shade.def.stealth).toBe(true);
    expect(shade.def.meleeDamage).toEqual(MONSTERS.brute.meleeDamage);
    expect(shade.def.trackTime).toBeGreaterThan(6);
  });

  it('blocks the red door without the key and opens it with the key', () => {
    const map = '########\n#P.R...#\n########';
    const w = new World(parseLevel('t', map));
    run(w, 1, { moveX: 1 });
    expect(w.player.x).toBeLessThan(3);
    expect(events(w)).toContain('You need a red keycard to open this door.');

    const w2 = new World(parseLevel('t', map));
    w2.player.keys.add('red');
    run(w2, 2, { moveX: 1 });
    expect(w2.player.x).toBeGreaterThan(4);
  });

  it('opens secret walls only with the use key and counts the secret', () => {
    const w = new World(parseLevel('t', '#######\n#P.X??#\n#######'));
    run(w, 0.8, { moveX: 1 });
    expect(w.player.x).toBeLessThan(3);
    w.update(1 / 60, { ...IDLE_INPUT, use: true, aimX: 5, aimY: 1.5 });
    run(w, 1.5, { moveX: 1 });
    expect(w.stats.secrets).toBe(1);
    expect(events(w)).toContain('You found a secret area!');
  });

  it('hurts the player on slime but armor does not help there', () => {
    const w = new World(parseLevel('t', '#####\n#P~~#\n#####'));
    w.player.armor = 100;
    w.player.x = 2.5;
    run(w, 2.1);
    expect(w.player.health).toBe(85);
    expect(w.player.armor).toBe(100);
  });

  it('lets armor absorb a third of monster damage', () => {
    const w = new World(parseLevel('t', '####\n#P.#\n####'));
    w.player.armor = 50;
    w.damagePlayer(30);
    expect(w.player.health).toBe(80);
    expect(w.player.armor).toBe(40);
  });

  it('chains barrel explosions and hurts nearby monsters', () => {
    const w = new World(parseLevel('t', '############\n#P....oo.f.#\n############'), 5);
    const fiend = w.monsters[0];
    w.damageBarrel(w.barrels[0], 50);
    run(w, 0.6);
    expect(w.barrels.every((b) => b.exploded)).toBe(true);
    expect(fiend.hp).toBeLessThan(fiend.def.hp);
  });

  it('ends with death when health runs out', () => {
    const w = new World(parseLevel('t', '####\n#P.#\n####'));
    w.damagePlayer(500);
    expect(w.status).toBe('dead');
    run(w, 1, { moveX: 1 });
    expect(w.player.x).toBe(1.5);
  });

  it('wins when the player uses the exit switch', () => {
    const w = new World(parseLevel('t', '##E##\n#.P.#\n#..h#\n#####'));
    w.update(1 / 60, { ...IDLE_INPUT, use: true, aimX: 2.5, aimY: 0 });
    expect(w.status).toBe('won');
  });

  it('runs level 1 for a while with an idle player without errors', () => {
    const w = new World(LEVELS[0].load(), 11);
    expect(() => run(w, 20, { fire: true, aimX: 20, aimY: 5 })).not.toThrow();
    expect(w.stats.totalSecrets).toBe(1);
  });
});
