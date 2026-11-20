import { packSdp, unpackSdp, type SdpType } from './sdp';

const ICE_SERVERS: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];
const GATHER_TIMEOUT_MS = 4000;
const CODE_MAX = 512;

function encodeCode(desc: RTCSessionDescriptionInit): string {
  return packSdp(desc.sdp ?? '', desc.type === 'offer' ? 'offer' : 'answer');
}

function decodeCode(code: string, type: SdpType): RTCSessionDescriptionInit {
  if (code.length === 0 || code.length > CODE_MAX) throw new Error('The code is empty or too long.');
  try {
    return { type, sdp: unpackSdp(code, type) };
  } catch (e) {
    throw e instanceof Error && e.message.startsWith('This is not') ? e : new Error('The code is not valid.');
  }
}

function gathered(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === 'complete') return Promise.resolve();
  return new Promise((resolve) => {
    const done = (): void => {
      pc.removeEventListener('icegatheringstatechange', check);
      resolve();
    };
    const check = (): void => {
      if (pc.iceGatheringState === 'complete') done();
    };
    pc.addEventListener('icegatheringstatechange', check);
    window.setTimeout(done, GATHER_TIMEOUT_MS);
  });
}

export interface Link {
  onMessage: (data: string) => void;
  onOpen: () => void;
  onClose: () => void;
  send(data: string): void;
  close(): void;
}

export class PeerLink implements Link {
  onMessage: (data: string) => void = () => undefined;
  onOpen: () => void = () => undefined;
  onClose: () => void = () => undefined;
  private channel: RTCDataChannel | null = null;
  private closed = false;

  private constructor(private readonly pc: RTCPeerConnection) {
    pc.addEventListener('connectionstatechange', () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') this.close();
    });
  }

  static async host(): Promise<{ link: PeerLink; offerCode: string }> {
    const link = new PeerLink(new RTCPeerConnection({ iceServers: ICE_SERVERS }));
    link.attach(link.pc.createDataChannel('game', { ordered: true }));
    await link.pc.setLocalDescription(await link.pc.createOffer());
    await gathered(link.pc);
    return { link, offerCode: encodeCode(link.pc.localDescription!) };
  }

  static async join(offerCode: string): Promise<{ link: PeerLink; answerCode: string }> {
    const offer = decodeCode(offerCode, 'offer');
    const link = new PeerLink(new RTCPeerConnection({ iceServers: ICE_SERVERS }));
    link.pc.addEventListener('datachannel', (e) => link.attach(e.channel));
    await link.pc.setRemoteDescription(offer);
    await link.pc.setLocalDescription(await link.pc.createAnswer());
    await gathered(link.pc);
    return { link, answerCode: encodeCode(link.pc.localDescription!) };
  }

  async acceptAnswer(answerCode: string): Promise<void> {
    await this.pc.setRemoteDescription(decodeCode(answerCode, 'answer'));
  }

  send(data: string): void {
    if (this.channel?.readyState === 'open') this.channel.send(data);
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.channel?.close();
    this.pc.close();
    this.onClose();
  }

  private attach(channel: RTCDataChannel): void {
    this.channel = channel;
    channel.addEventListener('open', () => this.onOpen());
    channel.addEventListener('close', () => this.close());
    channel.addEventListener('message', (e) => {
      if (typeof e.data === 'string') this.onMessage(e.data);
    });
  }
}
