export type SdpType = 'offer' | 'answer';

interface Candidate {
  kind: 'host' | 'srflx';
  address: string;
  port: number;
}

const ICE_CHARS = /^[A-Za-z0-9+/]+$/;
const IPV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const MDNS = /^[0-9a-f]{32}$/;
const MAX_CANDIDATES = 4;
const PRIORITY = { host: 2113937151, srflx: 1677729535 } as const;
const PREFIX: Record<SdpType, string> = { offer: 'O', answer: 'A' };

function line(sdp: string, name: string): string {
  const found = sdp.split(/\r?\n/).find((l) => l.startsWith(`a=${name}:`));
  if (!found) throw new Error(`The connection data has no ${name}.`);
  return found.slice(name.length + 3).trim();
}

function toBase64(hex: string): string {
  const bytes = hex.split(':').map((h) => parseInt(h, 16));
  return btoa(String.fromCharCode(...bytes)).replace(/=+$/, '');
}

function fromBase64(b64: string): string {
  const raw = atob(b64);
  return [...raw].map((c) => c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')).join(':');
}

function candidates(sdp: string): Candidate[] {
  const out: Candidate[] = [];
  for (const l of sdp.split(/\r?\n/)) {
    const m = /^a=candidate:\S+ 1 udp \d+ (\S+) (\d+) typ (host|srflx)\b/i.exec(l);
    if (!m) continue;
    const address = m[1].toLowerCase();
    const mdns = /^([0-9a-f-]{36})\.local$/.exec(address);
    if (!mdns && !IPV4.test(address)) continue;
    out.push({ kind: m[3].toLowerCase() as Candidate['kind'], address: mdns ? mdns[1].replace(/-/g, '') : address, port: Number(m[2]) });
    if (out.length === MAX_CANDIDATES) break;
  }
  if (out.length === 0) throw new Error('No network route was found. Check the connection and try again.');
  return out;
}

export function packSdp(sdp: string, type: SdpType): string {
  const fingerprint = line(sdp, 'fingerprint').replace(/^sha-256\s+/i, '');
  const cands = candidates(sdp).map((c) => `${c.kind === 'host' ? 'h' : 's'}${c.address}:${c.port}`);
  return [PREFIX[type], line(sdp, 'ice-ufrag'), line(sdp, 'ice-pwd'), toBase64(fingerprint), cands.join(',')].join('~');
}

export function unpackSdp(code: string, type: SdpType): string {
  const parts = code.replace(/\s+/g, '').split('~');
  if (parts.length !== 5 || parts[0] !== PREFIX[type]) throw new Error(`This is not ${type === 'offer' ? "a host's" : 'a reply'} code.`);
  const [, ufrag, pwd, fp, list] = parts;
  if (ufrag.length < 4 || ufrag.length > 32 || !ICE_CHARS.test(ufrag)) throw new Error('The code is not valid.');
  if (pwd.length < 22 || pwd.length > 64 || !ICE_CHARS.test(pwd)) throw new Error('The code is not valid.');
  if (fp.length !== 43 || !ICE_CHARS.test(fp)) throw new Error('The code is not valid.');
  const cands = list.split(',').map((c): Candidate => {
    const m = /^([hs])([0-9a-f]{32}|[\d.]+):(\d{1,5})$/.exec(c);
    const port = m ? Number(m[3]) : 0;
    if (!m || port < 1 || port > 65535 || !(MDNS.test(m[2]) || IPV4.test(m[2]))) throw new Error('The code is not valid.');
    const address = MDNS.test(m[2]) ? `${m[2].replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5')}.local` : m[2];
    return { kind: m[1] === 'h' ? 'host' : 'srflx', address, port };
  });
  if (cands.length > MAX_CANDIDATES) throw new Error('The code is not valid.');
  const candidateLines = cands.map(
    (c, i) => `a=candidate:${i + 1} 1 udp ${PRIORITY[c.kind] - i} ${c.address} ${c.port} typ ${c.kind}${c.kind === 'srflx' ? ' raddr 0.0.0.0 rport 0' : ''} generation 0`,
  );
  return [
    'v=0',
    `o=- ${Date.now()} 2 IN IP4 127.0.0.1`,
    's=-',
    't=0 0',
    'a=group:BUNDLE 0',
    'a=msid-semantic: WMS',
    `m=application ${cands[0].port} UDP/DTLS/SCTP webrtc-datachannel`,
    'c=IN IP4 0.0.0.0',
    ...candidateLines,
    `a=ice-ufrag:${ufrag}`,
    `a=ice-pwd:${pwd}`,
    'a=ice-options:trickle',
    `a=fingerprint:sha-256 ${fromBase64(fp)}`,
    `a=setup:${type === 'offer' ? 'actpass' : 'active'}`,
    'a=mid:0',
    'a=sctp-port:5000',
    'a=max-message-size:262144',
    '',
  ].join('\r\n');
}
