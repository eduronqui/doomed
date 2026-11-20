import type { Sfx } from './sfx';
import { readFlag, writeFlag } from '../ui/storage';
import { STEPS_PER_BAR, parseHits, parseLine, trackLength, type NoteEvent, type Track } from './tracks';

const LOOKAHEAD = 0.12;
const TICK_MS = 25;
const MUSIC_VOLUME = 0.42;
const PREF_KEY = 'doomed.music';

interface Compiled {
  track: Track;
  length: number;
  stepTime: number;
  guitar: Map<number, NoteEvent>;
  bass: Map<number, NoteEvent>;
  lead: Map<number, NoteEvent>;
  kick: Set<number>;
  snare: Set<number>;
  hat: Set<number>;
}

function byStep(events: NoteEvent[]): Map<number, NoteEvent> {
  return new Map(events.map((e) => [e.step, e]));
}

function compile(track: Track): Compiled {
  return {
    track,
    length: trackLength(track),
    stepTime: 60 / track.bpm / (STEPS_PER_BAR / 4),
    guitar: byStep(parseLine(track.guitar)),
    bass: byStep(parseLine(track.bass)),
    lead: byStep(parseLine(track.lead)),
    kick: new Set(parseHits(track.kick)),
    snare: new Set(parseHits(track.snare)),
    hat: new Set(parseHits(track.hat)),
  };
}

function freq(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

function distortionCurve(amount: number): Float32Array<ArrayBuffer> {
  const n = 1024;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((3 + amount) * x * 20 * (Math.PI / 180)) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

export class Music {
  private sfx: Sfx;
  private current: Compiled | null = null;
  private bus: GainNode | null = null;
  private timer: number | null = null;
  private step = 0;
  private nextTime = 0;
  private curves = new Map<number, Float32Array<ArrayBuffer>>();
  enabled = readFlag(PREF_KEY, true);

  constructor(sfx: Sfx) {
    this.sfx = sfx;
  }

  play(track: Track): void {
    this.stop();
    this.current = compile(track);
    this.step = 0;
    this.start();
  }

  stop(): void {
    this.halt();
    this.current = null;
  }

  pause(): void {
    this.halt();
  }

  resume(): void {
    if (this.current && this.timer === null) this.start();
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    writeFlag(PREF_KEY, this.enabled);
    if (this.enabled) this.resume();
    else this.halt();
    return this.enabled;
  }

  private start(): void {
    const audio = this.sfx.audio;
    if (!audio || !this.enabled || !this.current) return;
    this.bus = audio.ctx.createGain();
    this.bus.gain.value = MUSIC_VOLUME;
    this.bus.connect(audio.out);
    this.step -= this.step % STEPS_PER_BAR;
    this.nextTime = audio.ctx.currentTime + 0.08;
    this.timer = window.setInterval(() => this.schedule(), TICK_MS);
    this.schedule();
  }

  private halt(): void {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    const bus = this.bus;
    const audio = this.sfx.audio;
    if (bus && audio) {
      bus.gain.setTargetAtTime(0, audio.ctx.currentTime, 0.05);
      window.setTimeout(() => bus.disconnect(), 400);
    }
    this.bus = null;
  }

  private schedule(): void {
    const audio = this.sfx.audio;
    const c = this.current;
    if (!audio || !c || !this.bus) return;
    while (this.nextTime < audio.ctx.currentTime + LOOKAHEAD) {
      this.playStep(c, this.step % c.length, this.nextTime);
      this.nextTime += c.stepTime;
      this.step++;
    }
  }

  private playStep(c: Compiled, step: number, t: number): void {
    const root = c.track.root;
    const g = c.guitar.get(step);
    if (g) this.guitar(t, root + g.offset, g.steps * c.stepTime, g.muted, c.track.drive);
    const b = c.bass.get(step);
    if (b) this.bass(t, root - 12 + b.offset, b.steps * c.stepTime);
    const l = c.lead.get(step);
    if (l) this.lead(t, root + l.offset, l.steps * c.stepTime);
    if (c.kick.has(step)) this.kick(t);
    if (c.snare.has(step)) this.snare(t);
    if (c.hat.has(step)) this.hat(t);
  }

  private env(ctx: AudioContext, t: number, peak: number, dur: number, release: number): GainNode {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.005);
    g.gain.setValueAtTime(peak, t + Math.max(0.006, dur - release));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + release);
    g.connect(this.bus!);
    return g;
  }

  private curve(drive: number): Float32Array<ArrayBuffer> {
    let c = this.curves.get(drive);
    if (!c) {
      c = distortionCurve(drive);
      this.curves.set(drive, c);
    }
    return c;
  }

  private guitar(t: number, midi: number, dur: number, muted: boolean, drive: number): void {
    const { ctx } = this.sfx.audio!;
    const out = this.env(ctx, t, muted ? 0.22 : 0.16, muted ? 0.06 : dur * 0.95, muted ? 0.05 : 0.08);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = muted ? 900 : 2600;
    const shaper = ctx.createWaveShaper();
    shaper.curve = this.curve(drive);
    shaper.oversample = '2x';
    shaper.connect(filter).connect(out);
    const end = t + dur + 0.2;
    for (const [interval, detune] of [
      [0, -8],
      [0, 8],
      [7, -5],
      [12, 5],
    ]) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq(midi + interval);
      osc.detune.value = detune;
      osc.connect(shaper);
      osc.start(t);
      osc.stop(end);
    }
  }

  private bass(t: number, midi: number, dur: number): void {
    const { ctx } = this.sfx.audio!;
    const out = this.env(ctx, t, 0.3, dur * 0.9, 0.06);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 520;
    filter.connect(out);
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq(midi);
    osc.connect(filter);
    osc.start(t);
    osc.stop(t + dur + 0.2);
  }

  private lead(t: number, midi: number, dur: number): void {
    const { ctx } = this.sfx.audio!;
    const out = this.env(ctx, t, 0.07, dur * 0.95, 0.15);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2400;
    filter.connect(out);
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq(midi);
    const vibrato = ctx.createOscillator();
    const depth = ctx.createGain();
    vibrato.frequency.value = 5.5;
    depth.gain.value = 9;
    vibrato.connect(depth).connect(osc.detune);
    osc.connect(filter);
    for (const o of [osc, vibrato]) {
      o.start(t);
      o.stop(t + dur + 0.3);
    }
  }

  private kick(t: number): void {
    const { ctx } = this.sfx.audio!;
    const out = this.env(ctx, t, 0.9, 0.02, 0.14);
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    osc.connect(out);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  private noise(t: number, dur: number, type: BiquadFilterType, f: number, peak: number): void {
    const { ctx, noise } = this.sfx.audio!;
    const out = this.env(ctx, t, peak, 0.005, dur);
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = f;
    filter.connect(out);
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.connect(filter);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.05);
  }

  private snare(t: number): void {
    const { ctx } = this.sfx.audio!;
    this.noise(t, 0.12, 'bandpass', 1900, 0.5);
    const out = this.env(ctx, t, 0.25, 0.01, 0.07);
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 190;
    osc.connect(out);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  private hat(t: number): void {
    this.noise(t, 0.03, 'highpass', 8000, 0.16);
  }
}
