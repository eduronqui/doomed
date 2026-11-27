import type { Link } from './peer';
import { encode, parseClientMessage, parseHostMessage, sanitizeName } from './protocol';

export function hostHandshake(link: Link, name: string, start: (names: string[]) => void): void {
  const own = sanitizeName(name);
  link.onMessage = (raw) => {
    const msg = parseClientMessage(raw, { x: 0, y: 0 });
    if (msg?.t !== 'hello') return;
    const names = [own, msg.name];
    link.send(encode({ t: 'start', names }));
    start(names);
  };
}

export function guestHandshake(link: Link, name: string, start: (names: string[]) => void): void {
  const own = sanitizeName(name);
  link.onOpen = () => link.send(encode({ t: 'hello', name: own }));
  link.onMessage = (raw) => {
    const msg = parseHostMessage(raw, 0, 0);
    if (msg?.t === 'start') start(msg.names);
  };
}
