import type { Link } from './peer';

type Packet = { from: 'host' | 'join'; kind: 'join' | 'ready' | 'data' | 'bye'; data?: string };

export class LocalLink implements Link {
  onMessage: (data: string) => void = () => undefined;
  onOpen: () => void = () => undefined;
  onClose: () => void = () => undefined;
  private channel = new BroadcastChannel('doomed-local-versus');
  private open = false;
  private timer: number | null = null;

  constructor(private readonly role: 'host' | 'join') {
    this.channel.onmessage = (e: MessageEvent<Packet>) => this.receive(e.data);
    if (role === 'join') {
      this.post('join');
      this.timer = window.setInterval(() => this.post('join'), 300);
    }
  }

  send(data: string): void {
    if (this.open) this.post('data', data);
  }

  close(): void {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.post('bye');
    this.channel.close();
    this.open = false;
    this.onClose();
  }

  private post(kind: Packet['kind'], data?: string): void {
    this.channel.postMessage({ from: this.role, kind, data } satisfies Packet);
  }

  private receive(p: Packet): void {
    if (!p || p.from === this.role) return;
    if (p.kind === 'join' && this.role === 'host' && !this.open) {
      this.post('ready');
      this.connected();
    } else if (p.kind === 'ready' && this.role === 'join' && !this.open) this.connected();
    else if (p.kind === 'data' && this.open && typeof p.data === 'string') this.onMessage(p.data);
    else if (p.kind === 'bye' && this.open) this.close();
  }

  private connected(): void {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.open = true;
    this.onOpen();
  }
}
