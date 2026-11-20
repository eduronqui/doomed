export interface DevParams {
  autostart: boolean;
  god: boolean;
  arsenal: boolean;
  sight: boolean;
  noMonster: boolean;
  overview: boolean;
  pos: { x: number; y: number } | null;
  level: number | null;
  versus: 'host' | 'join' | null;
}

export function parseDevParams(search: string, levelCount: number): DevParams {
  const params = new URLSearchParams(search);
  const pos = params.get('pos')?.split(',').map(Number);
  const rawLevel = params.get('level');
  const level = Number(rawLevel);
  return {
    autostart: params.has('autostart'),
    god: params.has('god'),
    arsenal: params.has('arsenal'),
    sight: params.has('sight'),
    noMonster: params.has('noMonster'),
    overview: params.has('overview'),
    pos: pos && pos.length === 2 && pos.every(Number.isFinite) ? { x: pos[0], y: pos[1] } : null,
    versus: params.get('versus') === 'host' ? 'host' : params.get('versus') === 'join' ? 'join' : null,
    level: rawLevel !== null && Number.isInteger(level) && level >= 0 && level <= levelCount ? level : null,
  };
}
