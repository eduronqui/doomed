import { describe, expect, it } from 'vitest';
import { signalUrl } from '../src/net/peer';
import {
  RATE_WINDOW_MS,
  ROOM_ACTIONS_PER_WINDOW,
  ROOM_CODE_ALPHABET,
  ROOM_CODE_LENGTH,
  SIGNAL_MESSAGE_MAX,
  admit,
  cleanCode,
  encodeSignal,
  isAllowedOrigin,
  otherRole,
  parseClientSignal,
  parseIceServers,
  parseServerSignal,
  randomCode,
  takeAction,
} from '../src/net/signal';

describe('room codes', () => {
  it('are 6 letters without I and O', () => {
    expect(ROOM_CODE_LENGTH).toBe(6);
    expect(ROOM_CODE_ALPHABET).not.toMatch(/[IO]/);
    let seed = 7;
    for (let i = 0; i < 200; i++) {
      const code = randomCode((n) => (seed = (seed * 1103515245 + 12345) % 2 ** 31) % n);
      expect(code).toMatch(/^[A-HJ-NP-Z]{6}$/);
    }
  });

  it('cleans what a player types', () => {
    expect(cleanCode('kmtqrb')).toBe('KMTQRB');
    expect(cleanCode(' kmt-qrb ')).toBe('KMTQRB');
    expect(cleanCode('KMT QRB')).toBe('KMTQRB');
  });

  it('rejects codes with the wrong length or letters that are never used', () => {
    expect(cleanCode('KMTQR')).toBeNull();
    expect(cleanCode('KMTQRBX')).toBeNull();
    expect(cleanCode('KMTQR0')).toBeNull();
    expect(cleanCode('KMTQRI')).toBeNull();
    expect(cleanCode('KMTQRO')).toBeNull();
    expect(cleanCode(123456)).toBeNull();
    expect(cleanCode('A'.repeat(100))).toBeNull();
  });
});

describe('room rules', () => {
  it('lets one host open a room, and refuses a second host', () => {
    expect(admit('host', [])).toBe('ok');
    expect(admit('host', ['host'])).toBe('taken');
  });

  it('lets one guest join a room that has a host', () => {
    expect(admit('guest', [])).toBe('not-found');
    expect(admit('guest', ['host'])).toBe('ok');
    expect(admit('guest', ['host', 'guest'])).toBe('full');
  });

  it('relays to the other role', () => {
    expect(otherRole('host')).toBe('guest');
    expect(otherRole('guest')).toBe('host');
  });
});

describe('signal messages from a browser', () => {
  const offer = { t: 'signal', data: { kind: 'offer', sdp: 'v=0\r\n' } };
  const ice = { t: 'signal', data: { kind: 'ice', candidate: 'candidate:1 1 udp 1 1.2.3.4 5000 typ host', sdpMid: '0', sdpMLineIndex: 0 } };

  it('accepts offers, answers and candidates', () => {
    expect(parseClientSignal(JSON.stringify(offer))).toEqual(offer);
    expect(parseClientSignal(JSON.stringify({ t: 'signal', data: { kind: 'answer', sdp: 'v=0' } }))?.data.kind).toBe('answer');
    expect(parseClientSignal(JSON.stringify(ice))).toEqual(ice);
    expect(parseClientSignal(JSON.stringify({ t: 'signal', data: { kind: 'ice', candidate: '', sdpMid: null, sdpMLineIndex: null } }))).not.toBeNull();
  });

  it('copies only the known fields', () => {
    const parsed = parseClientSignal(JSON.stringify({ ...offer, extra: 1, data: { ...offer.data, evil: 'x' } }));
    expect(parsed).toEqual(offer);
  });

  it('rejects anything else', () => {
    const bad: unknown[] = [
      'not json',
      '[]',
      'null',
      JSON.stringify({ t: 'hosted', code: 'KMTQRB' }),
      JSON.stringify({ t: 'signal' }),
      JSON.stringify({ t: 'signal', data: { kind: 'offer' } }),
      JSON.stringify({ t: 'signal', data: { kind: 'offer', sdp: '' } }),
      JSON.stringify({ t: 'signal', data: { kind: 'offer', sdp: 'x'.repeat(13 * 1024) } }),
      JSON.stringify({ t: 'signal', data: { kind: 'ice', candidate: 'x'.repeat(600), sdpMid: '0', sdpMLineIndex: 0 } }),
      JSON.stringify({ t: 'signal', data: { kind: 'ice', candidate: 'c', sdpMid: 5, sdpMLineIndex: 0 } }),
      JSON.stringify({ t: 'signal', data: { kind: 'ice', candidate: 'c', sdpMid: '0', sdpMLineIndex: -1 } }),
      JSON.stringify({ t: 'signal', data: { kind: 'ice', candidate: 'c', sdpMid: '0', sdpMLineIndex: 1.5 } }),
      JSON.stringify({ t: 'signal', data: { kind: 'chat', text: 'hi' } }),
      'x'.repeat(SIGNAL_MESSAGE_MAX + 1),
      42,
      new ArrayBuffer(8),
    ];
    for (const raw of bad) expect(parseClientSignal(raw)).toBeNull();
  });
});

describe('signal messages from the server', () => {
  it('reads every message type', () => {
    expect(parseServerSignal(encodeSignal({ t: 'hosted', code: 'KMTQRB' }))).toEqual({ t: 'hosted', code: 'KMTQRB' });
    expect(parseServerSignal(encodeSignal({ t: 'joined', iceServers: [] }))).toEqual({ t: 'joined', iceServers: [] });
    expect(parseServerSignal(encodeSignal({ t: 'peer', iceServers: [] }))).toEqual({ t: 'peer', iceServers: [] });
    expect(parseServerSignal(encodeSignal({ t: 'left' }))).toEqual({ t: 'left' });
    expect(parseServerSignal(encodeSignal({ t: 'error', reason: 'full' }))).toEqual({ t: 'error', reason: 'full' });
    expect(parseServerSignal(encodeSignal({ t: 'signal', data: { kind: 'answer', sdp: 'v=0' } }))).toEqual({ t: 'signal', data: { kind: 'answer', sdp: 'v=0' } });
  });

  it('rejects a bad code, an unknown error or an unknown type', () => {
    expect(parseServerSignal(JSON.stringify({ t: 'hosted', code: 'KMT' }))).toBeNull();
    expect(parseServerSignal(JSON.stringify({ t: 'error', reason: '<b>boom</b>' }))).toBeNull();
    expect(parseServerSignal(JSON.stringify({ t: 'start' }))).toBeNull();
  });
});

describe('origin check', () => {
  it('accepts the same site', () => {
    expect(isAllowedOrigin('https://doomed.example.workers.dev', 'https://doomed.example.workers.dev/signal/host')).toBe(true);
  });

  it('accepts local development across ports', () => {
    expect(isAllowedOrigin('http://localhost:5173', 'http://localhost:8787/signal/host')).toBe(true);
    expect(isAllowedOrigin('http://127.0.0.1:5173', 'http://localhost:8787/signal/join?code=KMTQRB')).toBe(true);
  });

  it('refuses other sites and a missing origin', () => {
    expect(isAllowedOrigin('https://evil.example', 'https://doomed.example.workers.dev/signal/host')).toBe(false);
    expect(isAllowedOrigin('http://localhost:5173', 'https://doomed.example.workers.dev/signal/host')).toBe(false);
    expect(isAllowedOrigin(null, 'https://doomed.example.workers.dev/signal/host')).toBe(false);
    expect(isAllowedOrigin('not a url', 'https://doomed.example.workers.dev/signal/host')).toBe(false);
  });
});

describe('signal URL', () => {
  it('uses wss on https and ws on http, on the same host', () => {
    expect(signalUrl('host', null, { protocol: 'https:', host: 'doomed.example.workers.dev' })).toBe('wss://doomed.example.workers.dev/signal/host');
    expect(signalUrl('guest', 'KMTQRB', { protocol: 'http:', host: 'localhost:5173' })).toBe('ws://localhost:5173/signal/join?code=KMTQRB');
  });
});

describe('TURN servers from the server', () => {
  const turn = { urls: ['turn:turn.cloudflare.com:3478?transport=udp', 'turns:turn.cloudflare.com:5349?transport=tcp'], username: 'u1', credential: 'c1' };
  const stun = { urls: 'stun:stun.cloudflare.com:3478' };

  it('reads the list Cloudflare returns, as an array or as one object', () => {
    expect(parseIceServers([stun, turn])).toEqual([{ urls: ['stun:stun.cloudflare.com:3478'] }, turn]);
    expect(parseIceServers(turn)).toEqual([turn]);
  });

  it('passes the servers to the host and the guest in peer and joined', () => {
    expect(parseServerSignal(JSON.stringify({ t: 'peer', iceServers: [turn] }))).toEqual({ t: 'peer', iceServers: [turn] });
    expect(parseServerSignal(JSON.stringify({ t: 'joined', iceServers: [turn] }))).toEqual({ t: 'joined', iceServers: [turn] });
  });

  it('uses no TURN servers when the field is missing or bad, and still connects with STUN', () => {
    expect(parseServerSignal(JSON.stringify({ t: 'joined' }))).toEqual({ t: 'joined', iceServers: [] });
    expect(parseServerSignal(JSON.stringify({ t: 'peer', iceServers: [{ urls: 'http://evil.example' }] }))).toEqual({ t: 'peer', iceServers: [] });
  });

  it('rejects other schemes, odd characters, long values and too many entries', () => {
    expect(parseIceServers([{ urls: 'https://turn.example' }])).toBeNull();
    expect(parseIceServers([{ urls: 'turn:host"onerror' }])).toBeNull();
    expect(parseIceServers([{ urls: [] }])).toBeNull();
    expect(parseIceServers([{ urls: 'turn:a', username: 'x'.repeat(300) }])).toBeNull();
    expect(parseIceServers([{ urls: 'turn:a', credential: 5 }])).toBeNull();
    expect(parseIceServers(Array.from({ length: 5 }, () => stun))).toBeNull();
    expect(parseIceServers('turn:a')).toBeNull();
    expect(parseIceServers(null)).toBeNull();
  });

  it('copies only the known fields', () => {
    expect(parseIceServers([{ ...turn, credentialType: 'password', extra: 1 }])).toEqual([turn]);
  });
});

describe('limit on rooms and joins per address', () => {
  it(`allows ${ROOM_ACTIONS_PER_WINDOW} tries in the window, then refuses`, () => {
    let times: number[] = [];
    for (let i = 0; i < ROOM_ACTIONS_PER_WINDOW; i++) {
      const r = takeAction(times, 1000 + i);
      expect(r.allowed).toBe(true);
      times = r.times;
    }
    expect(takeAction(times, 2000).allowed).toBe(false);
  });

  it('allows tries again when the old ones leave the window', () => {
    const full = Array.from({ length: ROOM_ACTIONS_PER_WINDOW }, (_, i) => i);
    expect(takeAction(full, RATE_WINDOW_MS - 1).allowed).toBe(false);
    expect(takeAction(full, RATE_WINDOW_MS + 5).allowed).toBe(true);
    const later = takeAction(full, RATE_WINDOW_MS + 100);
    expect(later.allowed).toBe(true);
    expect(later.times).toHaveLength(1);
  });
});
