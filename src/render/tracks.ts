export interface Track {
  title: string;
  bpm: number;
  root: number;
  drive: number;
  guitar: string;
  bass: string;
  lead: string;
  kick: string;
  snare: string;
  hat: string;
}

export interface NoteEvent {
  step: number;
  offset: number;
  steps: number;
  muted: boolean;
}

export const STEPS_PER_BAR = 16;

function melodic(pattern: string): string[] {
  return pattern.trim().split(/\s+/);
}

function percussive(pattern: string): string[] {
  return pattern.replace(/\s+/g, '').split('');
}

export function trackLength(track: Track): number {
  return melodic(track.guitar).length;
}

export function parseLine(pattern: string): NoteEvent[] {
  const tokens = melodic(pattern);
  const out: NoteEvent[] = [];
  tokens.forEach((t, i) => {
    if (t === '-' || t === '.') return;
    const muted = t === 'x';
    const offset = muted ? 0 : Number(t);
    if (!Number.isFinite(offset)) throw new Error(`Bad note token '${t}' at step ${i}`);
    let steps = 1;
    while (tokens[i + steps] === '-') steps++;
    out.push({ step: i, offset, steps: muted ? 0.5 : steps, muted });
  });
  return out;
}

export function parseHits(pattern: string): number[] {
  return percussive(pattern).flatMap((c, i) => (c === 'x' ? [i] : []));
}

export function validateTrack(track: Track): void {
  const len = trackLength(track);
  if (len % STEPS_PER_BAR !== 0) throw new Error(`${track.title}: length ${len} is not whole bars`);
  for (const [name, pattern] of [
    ['bass', track.bass],
    ['lead', track.lead],
  ] as const) {
    if (melodic(pattern).length !== len) throw new Error(`${track.title}: ${name} has ${melodic(pattern).length} steps, expected ${len}`);
    parseLine(pattern);
  }
  for (const [name, pattern] of [
    ['kick', track.kick],
    ['snare', track.snare],
    ['hat', track.hat],
  ] as const) {
    if (percussive(pattern).length !== len) throw new Error(`${track.title}: ${name} has ${percussive(pattern).length} steps, expected ${len}`);
  }
  parseLine(track.guitar);
}

export const rest = (bars: number): string => Array(bars * STEPS_PER_BAR).fill('.').join(' ');
