import { describe, expect, it } from 'vitest';
import { packSdp, unpackSdp } from '../src/net/sdp';

const FP = '08:EA:6F:B4:29:94:9B:9B:CE:58:A5:E7:47:C5:C8:92:C0:A0:2D:1E:7C:1D:A0:47:75:98:06:2E:89:EB:CA:E0';
const OFFER = [
  'v=0',
  'o=- 7026734908808006863 2 IN IP4 127.0.0.1',
  's=-',
  't=0 0',
  'a=group:BUNDLE 0',
  'm=application 60439 UDP/DTLS/SCTP webrtc-datachannel',
  'c=IN IP4 203.0.113.5',
  'a=candidate:3968368209 1 udp 2113937151 ec74afa4-45eb-4a85-8f99-4f4d3bb9d6cc.local 60439 typ host generation 0 network-cost 999',
  'a=candidate:527901416 1 udp 1677729535 203.0.113.5 60439 typ srflx raddr 0.0.0.0 rport 0 generation 0 network-cost 999',
  'a=candidate:1 1 tcp 1518280447 203.0.113.5 9 typ host tcptype active generation 0',
  'a=ice-ufrag:21TE',
  'a=ice-pwd:IbmMO9kVyJP7+x9+U6897Yp+',
  'a=ice-options:trickle',
  `a=fingerprint:sha-256 ${FP}`,
  'a=setup:actpass',
  'a=mid:0',
  'a=sctp-port:5000',
  '',
].join('\r\n');

describe('connection codes', () => {
  it('packs an offer into a short code', () => {
    const code = packSdp(OFFER, 'offer');
    expect(code.length).toBeLessThan(160);
    expect(code.startsWith('O~21TE~IbmMO9kVyJP7+x9+U6897Yp+~')).toBe(true);
  });

  it('rebuilds the session data with the same keys and routes', () => {
    const sdp = unpackSdp(packSdp(OFFER, 'offer'), 'offer');
    expect(sdp).toContain('a=ice-ufrag:21TE');
    expect(sdp).toContain('a=ice-pwd:IbmMO9kVyJP7+x9+U6897Yp+');
    expect(sdp).toContain(`a=fingerprint:sha-256 ${FP}`);
    expect(sdp).toContain('ec74afa4-45eb-4a85-8f99-4f4d3bb9d6cc.local 60439 typ host');
    expect(sdp).toContain('203.0.113.5 60439 typ srflx');
    expect(sdp).not.toContain('tcp');
    expect(sdp).toContain('a=setup:actpass');
  });

  it('marks the reply as the active side', () => {
    const answer = OFFER.replace('a=setup:actpass', 'a=setup:active');
    expect(unpackSdp(packSdp(answer, 'answer'), 'answer')).toContain('a=setup:active');
  });

  it('rejects codes of the wrong kind or with bad parts', () => {
    const code = packSdp(OFFER, 'offer');
    expect(() => unpackSdp(code, 'answer')).toThrow(/reply/);
    expect(() => unpackSdp(code.replace('203.0.113.5', '203.0.113.300'), 'offer')).toThrow();
    expect(() => unpackSdp(code.replace('~21TE~', '~2\r\na=x~'), 'offer')).toThrow();
    expect(() => unpackSdp(`${code}~extra`, 'offer')).toThrow();
    expect(() => unpackSdp('O~abcd~short~fp~h1:1', 'offer')).toThrow();
  });
});
