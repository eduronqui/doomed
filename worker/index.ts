import { cleanCode, encodeSignal, isAllowedOrigin, randomCode, type SignalRole } from '../src/net/signal';

export { Room } from './room';
export { Limiter } from './limiter';

const HOST_ATTEMPTS = 5;

function randomIndex(n: number): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] % n;
}

async function allowed(request: Request, env: Env): Promise<boolean> {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
  const name = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return env.LIMITER.get(env.LIMITER.idFromName(name)).take();
}

function tooMany(): Response {
  const [client, server] = Object.values(new WebSocketPair());
  server.accept();
  server.send(encodeSignal({ t: 'error', reason: 'too-many' }));
  server.close(1008, 'too-many');
  return new Response(null, { status: 101, webSocket: client });
}

function roomRequest(request: Request, role: SignalRole, code: string): Request {
  return new Request(`https://room/?role=${role}&code=${code}`, request);
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== '/signal/host' && url.pathname !== '/signal/join') return new Response('Not found', { status: 404 });
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return new Response('Expected a WebSocket', { status: 426 });
    if (!isAllowedOrigin(request.headers.get('Origin'), request.url)) return new Response('Forbidden', { status: 403 });
    if (!(await allowed(request, env))) return tooMany();
    if (url.pathname === '/signal/join') {
      const code = cleanCode(url.searchParams.get('code'));
      if (!code) return new Response('Bad code', { status: 400 });
      return env.ROOM.get(env.ROOM.idFromName(code)).fetch(roomRequest(request, 'guest', code));
    }
    for (let i = 0; i < HOST_ATTEMPTS; i++) {
      const code = randomCode(randomIndex);
      const response = await env.ROOM.get(env.ROOM.idFromName(code)).fetch(roomRequest(request, 'host', code));
      if (response.status !== 409) return response;
    }
    return new Response('Busy', { status: 503 });
  },
} satisfies ExportedHandler<Env>;
