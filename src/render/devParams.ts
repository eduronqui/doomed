export interface DevParams {
  autostart: boolean;
  god: boolean;
  sight: boolean;
  noMonster: boolean;
  pos: { x: number; y: number } | null;
  level: number | null;
}

export function parseDevParams(search: string, levelCount: number): DevParams {
  const params = new URLSearchParams(search);
  const pos = params.get('pos')?.split(',').map(Number);
  const rawLevel = params.get('level');
  const level = Number(rawLevel);
  return {
    autostart: params.has('autostart'),
    god: params.has('god'),
    sight: params.has('sight'),
    noMonster: params.has('noMonster'),
    pos: pos && pos.length === 2 && pos.every(Number.isFinite) ? { x: pos[0], y: pos[1] } : null,
    level: rawLevel !== null && Number.isInteger(level) && level >= 0 && level <= levelCount ? level : null,
  };
}
