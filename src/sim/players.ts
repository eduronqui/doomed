export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 2;

export const TEAMS = [
  { id: 'green', tint: 0x6fa056, color: '#30d030' },
  { id: 'blue', tint: 0x5c83cb, color: '#4a9aff' },
] as const;

export type Team = (typeof TEAMS)[number];
export type TeamId = Team['id'];
export type Slot = number;

export const HOST_SLOT: Slot = 0;

export function isSlot(value: unknown, count: number = MAX_PLAYERS): value is Slot {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < count;
}

export function teamOf(slot: Slot): Team {
  const team = TEAMS[slot];
  if (!team) throw new Error(`No team color for player slot ${slot}`);
  return team;
}
