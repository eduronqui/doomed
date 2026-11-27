import { SIGNAL_ERROR_TEXT, encodeSignal, parseServerSignal, type ServerSignal, type SignalData, type SignalRole } from './signal';

const ICE_SERVERS: RTCIceServer[] = [{ urls: 'stun:stun.cloudflare.com:3478' }];
const CONNECT_TIMEOUT_MS = 20000;
const SIGNAL_LINGER_MS = 3000;
const NO_CONNECTION = 'Could not connect to the other player. A strict network can block direct connections.';
const PEER_LEFT = 'The other player left.';

export interface Link {
  onMessage: (data: string) => void;
  onOpen: () => void;
  onClose: () => void;
  send(data: string): void;
  close(): void;
}

export function signalUrl(role: SignalRole, code: string | null, location: { protocol: string; host: string }): string {
  const scheme = location.protocol === 'https:' ? 'wss' : 'ws';
  return role === 'host' ? `${scheme}://${location.host}/signal/host` : `${scheme}://${location.host}/signal/join?code=${code}`;
}

interface Waiting {
  resolve: (code: string) => void;
  reject: (error: Error) => void;
}

export class PeerLink implements Link {
  onMessage: (data: string) => void = () => undefined;
  onOpen: () => void = () => undefined;
  onClose: () => void = () => undefined;
  onFail: (message: string) => void = () => undefined;
  private channel: RTCDataChannel | null = null;
  private closed = false;
  private opened = false;
  private queue: Promise<void> = Promise.resolve();
  private timer: number | undefined;
  private waiting: Waiting | null = null;
  private readonly ready: Promise<string>;

  private constructor(
    private readonly role: SignalRole,
    private readonly pc: RTCPeerConnection,
    private readonly ws: WebSocket,
  ) {
    this.ready = new Promise<string>((resolve, reject) => (this.waiting = { resolve, reject }));
    pc.addEventListener('connectionstatechange', () => {
      if (pc.connectionState === 'failed') this.fail(NO_CONNECTION);
    });
    pc.addEventListener('icecandidate', (e) => {
      const c = e.candidate;
      if (c?.candidate) this.signal({ kind: 'ice', candidate: c.candidate, sdpMid: c.sdpMid, sdpMLineIndex: c.sdpMLineIndex });
    });
    ws.addEventListener('message', (e) => {
      const message = parseServerSignal(e.data);
      if (message) this.queue = this.queue.then(() => this.handle(message)).catch(() => this.fail(NO_CONNECTION));
    });
    ws.addEventListener('error', () => this.fail(SIGNAL_ERROR_TEXT.unreachable));
    ws.addEventListener('close', () => {
      if (!this.opened && !this.connected()) this.fail(SIGNAL_ERROR_TEXT.unreachable);
    });
  }

  static host(location: { protocol: string; host: string }): { link: PeerLink; code: Promise<string> } {
    const link = new PeerLink('host', new RTCPeerConnection({ iceServers: ICE_SERVERS }), new WebSocket(signalUrl('host', null, location)));
    link.attach(link.pc.createDataChannel('game', { ordered: true }));
    return { link, code: link.ready };
  }

  static join(code: string, location: { protocol: string; host: string }): { link: PeerLink; joined: Promise<void> } {
    const link = new PeerLink('guest', new RTCPeerConnection({ iceServers: ICE_SERVERS }), new WebSocket(signalUrl('guest', code, location)));
    link.pc.addEventListener('datachannel', (e) => link.attach(e.channel));
    return { link, joined: link.ready.then(() => undefined) };
  }

  send(data: string): void {
    if (this.channel?.readyState === 'open') this.channel.send(data);
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    window.clearTimeout(this.timer);
    this.waiting?.reject(new Error(SIGNAL_ERROR_TEXT.unreachable));
    this.waiting = null;
    this.channel?.close();
    this.pc.close();
    this.ws.close();
    this.onClose();
  }

  private fail(message: string): void {
    if (this.closed || this.opened) return;
    const waiting = this.waiting;
    this.waiting = null;
    if (waiting) waiting.reject(new Error(message));
    else this.onFail(message);
    this.close();
  }

  private connected(): boolean {
    return this.pc.connectionState === 'connected';
  }

  private signal(data: SignalData): void {
    if (this.ws.readyState === WebSocket.OPEN) this.ws.send(encodeSignal({ t: 'signal', data }));
  }

  private settle(value: string): void {
    this.waiting?.resolve(value);
    this.waiting = null;
    this.timer = window.setTimeout(() => this.fail(NO_CONNECTION), CONNECT_TIMEOUT_MS);
  }

  private async handle(message: ServerSignal): Promise<void> {
    if (this.closed) return;
    switch (message.t) {
      case 'hosted':
        if (this.role === 'host') this.waiting?.resolve(message.code);
        this.waiting = null;
        return;
      case 'joined':
        if (this.role === 'guest') this.settle('');
        return;
      case 'peer':
        if (this.role !== 'host') return;
        this.settle('');
        await this.pc.setLocalDescription(await this.pc.createOffer());
        this.signal({ kind: 'offer', sdp: this.pc.localDescription!.sdp });
        return;
      case 'signal':
        return this.handleSignal(message.data);
      case 'left':
        return this.connected() ? undefined : this.fail(PEER_LEFT);
      case 'error':
        return this.fail(SIGNAL_ERROR_TEXT[message.reason]);
    }
  }

  private async handleSignal(data: SignalData): Promise<void> {
    if (data.kind === 'offer' && this.role === 'guest') {
      await this.pc.setRemoteDescription({ type: 'offer', sdp: data.sdp });
      await this.pc.setLocalDescription(await this.pc.createAnswer());
      this.signal({ kind: 'answer', sdp: this.pc.localDescription!.sdp });
    } else if (data.kind === 'answer' && this.role === 'host') {
      await this.pc.setRemoteDescription({ type: 'answer', sdp: data.sdp });
    } else if (data.kind === 'ice') {
      await this.pc.addIceCandidate({ candidate: data.candidate, sdpMid: data.sdpMid, sdpMLineIndex: data.sdpMLineIndex }).catch(() => undefined);
    }
  }

  private attach(channel: RTCDataChannel): void {
    this.channel = channel;
    channel.addEventListener('open', () => {
      this.opened = true;
      window.clearTimeout(this.timer);
      window.setTimeout(() => this.ws.close(1000), SIGNAL_LINGER_MS);
      this.onOpen();
    });
    channel.addEventListener('close', () => this.close());
    channel.addEventListener('message', (e) => {
      if (typeof e.data === 'string') this.onMessage(e.data);
    });
  }
}
