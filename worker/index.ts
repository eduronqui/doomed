import { cleanCode, isAllowedOrigin, randomCode, type SignalRole } from '../src/net/signal';

export { Room } from './room';

const HOST_ATTEMPTS = 5;

function randomIndex(n: number): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] % n;
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
