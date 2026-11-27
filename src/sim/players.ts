export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 2;

export const TEAMS = [
  { id: 'green', color: '#30d030', sprite: 'marine' },
  { id: 'blue', color: '#4a9aff', sprite: 'marine-blue' },
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

export function teamById(id: TeamId): Team {
  return TEAMS.find((t) => t.id === id)!;
}
