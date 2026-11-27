import { DIFFICULTIES, type DifficultyId } from '../sim/defs';
import type { Carry } from '../sim/world';
import { AMMO_ORDER, MAX_AMMO, WEAPON_ORDER } from '../weapons';
import { readFlag, readText, removeItem, writeFlag, writeText } from './storage';

const TRAINING_KEY = 'doomed.trainingDone';
const SAVE_KEY = 'doomed.save';
const SAVE_VERSION = 1;
const MAX_HEALTH = 200;
const MAX_ARMOR = 200;

export interface SavedGame {
  level: number;
  difficulty: DifficultyId;
  carry: Carry;
}

export function isTrainingDone(): boolean {
  return readFlag(TRAINING_KEY, false);
}

export function markTrainingDone(): void {
  writeFlag(TRAINING_KEY, true);
}

export function saveGame(game: SavedGame): void {
  writeText(SAVE_KEY, JSON.stringify({ version: SAVE_VERSION, ...game }));
}

export function clearGame(): void {
  removeItem(SAVE_KEY);
}

export function loadGame(levelCount: number): SavedGame | null {
  const text = readText(SAVE_KEY);
  if (text === null) return null;
  try {
    return parseSave(JSON.parse(text), levelCount);
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function clamped(value: unknown, min: number, max: number): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : null;
}

function parseCarry(raw: unknown): Carry | null {
  if (!isRecord(raw) || !isRecord(raw.ammo) || !Array.isArray(raw.weapons)) return null;
  const health = clamped(raw.health, 1, MAX_HEALTH);
  const armor = clamped(raw.armor, 0, MAX_ARMOR);
  if (health === null || armor === null) return null;
  const weapons = WEAPON_ORDER.filter((id) => (raw.weapons as unknown[]).includes(id));
  if (weapons.length === 0 || !weapons.includes(raw.weapon as Carry['weapon'])) return null;
  const ammo = {} as Carry['ammo'];
  for (const type of AMMO_ORDER) {
    const amount = clamped(raw.ammo[type], 0, MAX_AMMO[type]);
    if (amount === null) return null;
    ammo[type] = amount;
  }
  return { health, armor, ammo, weapons, weapon: raw.weapon as Carry['weapon'] };
}

function parseSave(raw: unknown, levelCount: number): SavedGame | null {
  if (!isRecord(raw) || raw.version !== SAVE_VERSION) return null;
  const level = raw.level;
  if (typeof level !== 'number' || !Number.isInteger(level) || level < 0 || level >= levelCount) return null;
  const difficulty = DIFFICULTIES.find((d) => d.id === raw.difficulty)?.id;
  const carry = parseCarry(raw.carry);
  return difficulty && carry ? { level, difficulty, carry } : null;
}
