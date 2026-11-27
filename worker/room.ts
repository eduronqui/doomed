import { DurableObject } from 'cloudflare:workers';
import { turnServers } from './turn';
import { ROOM_LIFETIME_MS, SIGNALS_PER_SOCKET_MAX, admit, encodeSignal, otherRole, parseClientSignal, type ServerSignal, type SignalError, type SignalRole } from '../src/net/signal';

interface Attachment {
  role: SignalRole;
  count: number;
}

const POLICY_VIOLATION = 1008;

function roleOf(ws: WebSocket): SignalRole {
  return (ws.deserializeAttachment() as Attachment).role;
}

function send(ws: WebSocket | undefined, message: ServerSignal): void {
  try {
    ws?.send(encodeSignal(message));
  } catch {
    return;
  }
}

function close(ws: WebSocket, code = 1000, reason = ''): void {
  try {
    ws.close(code, reason);
  } catch {
    return;
  }
}

export class Room extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const role: SignalRole = url.searchParams.get('role') === 'host' ? 'host' : 'guest';
    const code = url.searchParams.get('code') ?? '';
    const verdict = admit(role, this.ctx.getWebSockets().map(roleOf));
    if (verdict === 'taken') return new Response(null, { status: 409 });
    const [client, server] = Object.values(new WebSocketPair());
    if (verdict !== 'ok') {
      server.accept();
      send(server, { t: 'error', reason: verdict });
      close(server, POLICY_VIOLATION, verdict);
      return new Response(null, { status: 101, webSocket: client });
    }
    this.ctx.acceptWebSocket(server, [role]);
    server.serializeAttachment({ role, count: 0 } satisfies Attachment);
    if (role === 'host') {
      send(server, { t: 'hosted', code });
      await this.ctx.storage.setAlarm(Date.now() + ROOM_LIFETIME_MS);
    } else {
      await this.introduce(server);
    }
    return new Response(null, { status: 101, webSocket: client });
  }

  private async introduce(guest: WebSocket): Promise<void> {
    const [host, own] = await Promise.all([turnServers(this.env), turnServers(this.env)]);
    console.log(`turn host: ${host.status}; turn guest: ${own.status}`);
    send(guest, { t: 'joined', iceServers: own.servers });
    send(this.socket('host'), { t: 'peer', iceServers: host.servers });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const attachment = ws.deserializeAttachment() as Attachment;
    const signal = parseClientSignal(message);
    if (!signal) return this.reject(ws, 'bad-request');
    attachment.count++;
    if (attachment.count > SIGNALS_PER_SOCKET_MAX) return this.reject(ws, 'too-many');
    ws.serializeAttachment(attachment);
    send(this.socket(otherRole(attachment.role)), signal);
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    await this.shutdown(ws);
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    await this.shutdown(ws);
  }

  async alarm(): Promise<void> {
    for (const ws of this.ctx.getWebSockets()) close(ws, 1000, 'expired');
    await this.ctx.storage.deleteAll();
  }

  private socket(role: SignalRole): WebSocket | undefined {
    return this.ctx.getWebSockets(role)[0];
  }

  private async reject(ws: WebSocket, reason: SignalError): Promise<void> {
    send(ws, { t: 'error', reason });
    await this.shutdown(ws, POLICY_VIOLATION, reason);
  }

  private async shutdown(from: WebSocket, code = 1000, reason = ''): Promise<void> {
    for (const ws of this.ctx.getWebSockets()) {
      if (ws !== from) send(ws, { t: 'left' });
      close(ws, ws === from ? code : 1000, ws === from ? reason : 'left');
    }
    await this.ctx.storage.deleteAll();
  }
}
