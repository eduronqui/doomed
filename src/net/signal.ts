export const ROOM_CODE_LENGTH = 6;
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
export const SIGNAL_MESSAGE_MAX = 16 * 1024;
export const SIGNALS_PER_SOCKET_MAX = 200;
export const ROOM_LIFETIME_MS = 5 * 60 * 1000;
const SDP_MAX = 12 * 1024;
const CANDIDATE_MAX = 512;
const MID_MAX = 32;
const CODE_PATTERN = new RegExp(`^[${ROOM_CODE_ALPHABET}]{${ROOM_CODE_LENGTH}}$`);

export type SignalRole = 'host' | 'guest';
export type SignalError = 'not-found' | 'full' | 'bad-request' | 'too-many' | 'unreachable';

export type SignalData =
  | { kind: 'offer' | 'answer'; sdp: string }
  | { kind: 'ice'; candidate: string; sdpMid: string | null; sdpMLineIndex: number | null };

export type ClientSignal = { t: 'signal'; data: SignalData };

export type ServerSignal =
  | { t: 'hosted'; code: string }
  | { t: 'joined' }
  | { t: 'peer' }
  | { t: 'signal'; data: SignalData }
  | { t: 'left' }
  | { t: 'error'; reason: SignalError };

const ERRORS: ReadonlySet<string> = new Set<SignalError>(['not-found', 'full', 'bad-request', 'too-many', 'unreachable']);

export function randomCode(randomIndex: (n: number) => number): string {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) code += ROOM_CODE_ALPHABET[randomIndex(ROOM_CODE_ALPHABET.length)];
  return code;
}

export function cleanCode(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.length > 32) return null;
  const code = raw.toUpperCase().replace(/[\s-]/g, '');
  return CODE_PATTERN.test(code) ? code : null;
}

export function admit(role: SignalRole, present: readonly SignalRole[]): 'ok' | 'taken' | 'not-found' | 'full' {
  if (role === 'host') return present.includes('host') ? 'taken' : 'ok';
  if (!present.includes('host')) return 'not-found';
  return present.includes('guest') ? 'full' : 'ok';
}

export function otherRole(role: SignalRole): SignalRole {
  return role === 'host' ? 'guest' : 'host';
}

function parseObject(raw: unknown): Record<string, unknown> | null {
  if (typeof raw !== 'string' || raw.length > SIGNAL_MESSAGE_MAX) return null;
  try {
    const value: unknown = JSON.parse(raw);
    return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function parseData(raw: unknown): SignalData | null {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const d = raw as Record<string, unknown>;
  if (d.kind === 'offer' || d.kind === 'answer') {
    return typeof d.sdp === 'string' && d.sdp.length > 0 && d.sdp.length <= SDP_MAX ? { kind: d.kind, sdp: d.sdp } : null;
  }
  if (d.kind !== 'ice' || typeof d.candidate !== 'string' || d.candidate.length > CANDIDATE_MAX) return null;
  const sdpMid = d.sdpMid === null || d.sdpMid === undefined ? null : typeof d.sdpMid === 'string' && d.sdpMid.length <= MID_MAX ? d.sdpMid : undefined;
  const index = d.sdpMLineIndex;
  const sdpMLineIndex = index === null || index === undefined ? null : typeof index === 'number' && Number.isInteger(index) && index >= 0 && index < 16 ? index : undefined;
  if (sdpMid === undefined || sdpMLineIndex === undefined) return null;
  return { kind: 'ice', candidate: d.candidate, sdpMid, sdpMLineIndex };
}

export function parseClientSignal(raw: unknown): ClientSignal | null {
  const m = parseObject(raw);
  if (m?.t !== 'signal') return null;
  const data = parseData(m.data);
  return data ? { t: 'signal', data } : null;
}

export function parseServerSignal(raw: unknown): ServerSignal | null {
  const m = parseObject(raw);
  if (!m) return null;
  switch (m.t) {
    case 'hosted': {
      const code = cleanCode(m.code);
      return code ? { t: 'hosted', code } : null;
    }
    case 'joined':
    case 'peer':
    case 'left':
      return { t: m.t };
    case 'signal': {
      const data = parseData(m.data);
      return data ? { t: 'signal', data } : null;
    }
    case 'error':
      return typeof m.reason === 'string' && ERRORS.has(m.reason) ? { t: 'error', reason: m.reason as SignalError } : null;
    default:
      return null;
  }
}

export function encodeSignal(message: ClientSignal | ServerSignal): string {
  return JSON.stringify(message);
}

export function isAllowedOrigin(origin: string | null, requestUrl: string): boolean {
  if (!origin) return false;
  try {
    const from = new URL(origin);
    const to = new URL(requestUrl);
    if (from.host === to.host) return true;
    return (from.hostname === 'localhost' || from.hostname === '127.0.0.1') && (to.hostname === 'localhost' || to.hostname === '127.0.0.1');
  } catch {
    return false;
  }
}

export const SIGNAL_ERROR_TEXT: Record<SignalError, string> = {
  'not-found': 'Room not found. Check the code.',
  full: 'Room is full.',
  'bad-request': 'The server did not accept the request.',
  'too-many': 'Too many messages. Try again.',
  unreachable: 'Could not reach the server.',
};
