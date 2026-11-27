import { afterEach, describe, expect, it } from 'vitest';
import { clearGame, loadGame, saveGame, type SavedGame } from '../src/ui/progress';

const LEVEL_COUNT = 12;
const SAVE_KEY = 'doomed.save';

const game: SavedGame = {
  level: 4,
  difficulty: 'veteran',
  carry: { health: 80, armor: 30, ammo: { bullets: 90, shells: 12, grenades: 3, fuel: 0, cells: 40 }, weapons: ['knife', 'pistol', 'shotgun'], weapon: 'shotgun' },
};

function fakeStorage(initial: Record<string, string> = {}): Map<string, string> {
  const store = new Map(Object.entries(initial));
  (globalThis as { window?: unknown }).window = {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
  };
  return store;
}

function stored(patch: (raw: Record<string, unknown>) => void): Record<string, string> {
  const raw = JSON.parse(JSON.stringify({ version: 1, ...game })) as Record<string, unknown>;
  patch(raw);
  return { [SAVE_KEY]: JSON.stringify(raw) };
}

describe('saved game', () => {
  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
  });

  it('has nothing to load before the first save', () => {
    fakeStorage();
    expect(loadGame(LEVEL_COUNT)).toBeNull();
  });

  it('loads what it saved', () => {
    fakeStorage();
    saveGame(game);
    expect(loadGame(LEVEL_COUNT)).toEqual(game);
  });

  it('forgets the game after clearGame', () => {
    const store = fakeStorage();
    saveGame(game);
    clearGame();
    expect(store.has(SAVE_KEY)).toBe(false);
    expect(loadGame(LEVEL_COUNT)).toBeNull();
  });

  it('ignores text that is not JSON', () => {
    fakeStorage({ [SAVE_KEY]: '{oops' });
    expect(loadGame(LEVEL_COUNT)).toBeNull();
  });

  it('ignores a save from another version', () => {
    fakeStorage(stored((raw) => (raw.version = 2)));
    expect(loadGame(LEVEL_COUNT)).toBeNull();
  });

  it('ignores a level that does not exist', () => {
    fakeStorage(stored((raw) => (raw.level = 12)));
    expect(loadGame(LEVEL_COUNT)).toBeNull();
    fakeStorage(stored((raw) => (raw.level = -1)));
    expect(loadGame(LEVEL_COUNT)).toBeNull();
    fakeStorage(stored((raw) => (raw.level = 1.5)));
    expect(loadGame(LEVEL_COUNT)).toBeNull();
  });

  it('ignores an unknown difficulty', () => {
    fakeStorage(stored((raw) => (raw.difficulty = 'nightmare')));
    expect(loadGame(LEVEL_COUNT)).toBeNull();
  });

  it('ignores a loadout with an unknown current weapon, or no weapons', () => {
    fakeStorage(stored((raw) => ((raw.carry as Record<string, unknown>).weapon = 'bfg')));
    expect(loadGame(LEVEL_COUNT)).toBeNull();
    fakeStorage(stored((raw) => ((raw.carry as Record<string, unknown>).weapons = [])));
    expect(loadGame(LEVEL_COUNT)).toBeNull();
    fakeStorage(stored((raw) => ((raw.carry as Record<string, unknown>).weapon = 'rift')));
    expect(loadGame(LEVEL_COUNT)).toBeNull();
  });

  it('drops unknown weapon names from the loadout', () => {
    fakeStorage(stored((raw) => ((raw.carry as Record<string, unknown>).weapons = ['knife', 'pistol', 'shotgun', 'bfg'])));
    expect(loadGame(LEVEL_COUNT)?.carry.weapons).toEqual(['knife', 'pistol', 'shotgun']);
  });

  it('ignores numbers that are not finite and limits numbers that are too big', () => {
    fakeStorage(stored((raw) => ((raw.carry as Record<string, unknown>).health = 'full')));
    expect(loadGame(LEVEL_COUNT)).toBeNull();
    fakeStorage(stored((raw) => ((raw.carry as { ammo: Record<string, unknown> }).ammo.shells = null)));
    expect(loadGame(LEVEL_COUNT)).toBeNull();
    fakeStorage(
      stored((raw) => {
        const carry = raw.carry as { health: number; armor: number; ammo: Record<string, number> };
        carry.health = 9999;
        carry.armor = -5;
        carry.ammo.bullets = 99999;
      }),
    );
    const carry = loadGame(LEVEL_COUNT)?.carry;
    expect(carry?.health).toBe(200);
    expect(carry?.armor).toBe(0);
    expect(carry?.ammo.bullets).toBe(200);
  });

  it('does not throw and loads nothing when storage is blocked', () => {
    (globalThis as { window?: unknown }).window = {
      get localStorage(): Storage {
        throw new Error('blocked');
      },
    };
    expect(loadGame(LEVEL_COUNT)).toBeNull();
    expect(() => saveGame(game)).not.toThrow();
    expect(() => clearGame()).not.toThrow();
  });
});
