import { TURN_TTL_SECONDS, parseIceServers, type IceServer } from '../src/net/signal';

const TURN_TIMEOUT_MS = 3000;

export interface TurnResult {
  servers: IceServer[];
  status: string;
}

function shape(value: unknown): string {
  const list = Array.isArray(value) ? value : [value];
  return list
    .map((item) => {
      if (item === null || typeof item !== 'object') return typeof item;
      const entry = item as Record<string, unknown>;
      const urls = Array.isArray(entry.urls) ? entry.urls : [entry.urls];
      const schemes = urls.map((u) => (typeof u === 'string' ? `${u.split(':')[0]}(${u.length})` : typeof u)).join(' ');
      return `{${Object.keys(entry).sort().join(',')}} ${schemes}`;
    })
    .join(' | ');
}

export async function turnServers(env: Env): Promise<TurnResult> {
  if (!env.TURN_KEY_ID || !env.TURN_KEY_TOKEN) return { servers: [], status: 'off: secrets TURN_KEY_ID or TURN_KEY_TOKEN missing' };
  try {
    const response = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(env.TURN_KEY_ID)}/credentials/generate-ice-servers`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.TURN_KEY_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ttl: TURN_TTL_SECONDS }),
      signal: AbortSignal.timeout(TURN_TIMEOUT_MS),
    });
    if (!response.ok) return { servers: [], status: `http ${response.status}` };
    const body: unknown = await response.json();
    const raw = body !== null && typeof body === 'object' ? (body as { iceServers?: unknown }).iceServers : undefined;
    const servers = parseIceServers(raw);
    return servers ? { servers, status: `ok ${servers.length} servers` } : { servers: [], status: `bad response: ${shape(raw)}` };
  } catch (e) {
    return { servers: [], status: `error ${e instanceof Error ? e.name : 'unknown'}` };
  }
}
