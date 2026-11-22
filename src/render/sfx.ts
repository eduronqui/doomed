import type { SoundId } from '../sim/defs';
import { readFlag, writeFlag } from '../ui/storage';

const SOUND_KEY = 'doomed.sound';
const MASTER_VOLUME = 0.55;

type Wave = OscillatorType;

export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  muted = !readFlag(SOUND_KEY, true);

  get audio(): { ctx: AudioContext; out: AudioNode; noise: AudioBuffer } | null {
    return this.ctx && this.master && this.noise ? { ctx: this.ctx, out: this.master, noise: this.noise } : null;
  }

  unlock(): void {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : MASTER_VOLUME;
      const comp = this.ctx.createDynamicsCompressor();
      this.master.connect(comp).connect(this.ctx.destination);
      const len = this.ctx.sampleRate;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    void this.ctx.resume();
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    writeFlag(SOUND_KEY, !this.muted);
    if (this.master) this.master.gain.value = this.muted ? 0 : MASTER_VOLUME;
    return this.muted;
  }

  play(id: SoundId, volume = 1, pan = 0): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || this.muted || volume <= 0.01) return;
    const out = ctx.createGain();
    out.gain.value = volume;
    const panner = ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    out.connect(panner).connect(this.master);
    const t = ctx.currentTime;
    const n = (dur: number, type: BiquadFilterType, f0: number, f1: number, gain: number, at = 0, q = 1): void =>
      this.noiseBurst(out, t + at, dur, type, f0, f1, gain, q);
    const o = (wave: Wave, f0: number, f1: number, dur: number, gain: number, at = 0): void => this.tone(out, t + at, wave, f0, f1, dur, gain);
    const c = (wave: Wave, pitch: [number, number, number], dur: number, gain: number, vibrato: [number, number] = [0, 0], at = 0): void =>
      this.cry(out, t + at, wave, pitch, dur, gain, vibrato);

    switch (id) {
      case 'pistol':
        n(0.14, 'bandpass', 2200, 500, 0.9, 0, 0.8);
        o('square', 190, 55, 0.09, 0.35);
        break;
      case 'shotgun':
        n(0.4, 'lowpass', 3500, 220, 1.2);
        o('sine', 110, 35, 0.25, 0.8);
        n(0.05, 'highpass', 2500, 2500, 0.35, 0.5);
        n(0.06, 'highpass', 1800, 1800, 0.35, 0.62);
        break;
      case 'rotary':
        n(0.08, 'bandpass', 2600, 900, 0.75, 0, 0.9);
        o('square', 160, 70, 0.05, 0.25);
        break;
      case 'launcher':
        n(0.12, 'lowpass', 900, 200, 0.8, 0, 1.2);
        o('triangle', 140, 60, 0.12, 0.35);
        break;
      case 'flame':
        n(0.11, 'bandpass', 700, 1200, 0.35, 0, 0.8);
        break;
      case 'arc':
        o('sawtooth', 1400, 300, 0.12, 0.18);
        n(0.1, 'highpass', 3000, 5000, 0.4, 0, 1);
        break;
      case 'rift':
        o('sine', 90, 30, 0.7, 0.5);
        o('sawtooth', 600, 80, 0.5, 0.15);
        n(0.6, 'lowpass', 1200, 150, 0.6, 0, 1);
        break;
      case 'knife':
        n(0.13, 'bandpass', 2500, 6000, 0.45, 0, 2);
        break;
      case 'fireball':
        n(0.5, 'bandpass', 500, 1600, 0.7, 0, 1.4);
        o('sawtooth', 80, 160, 0.4, 0.18);
        break;
      case 'explode':
        n(0.9, 'lowpass', 1200, 60, 1.4);
        o('sine', 90, 28, 0.6, 0.9);
        break;
      case 'door':
        o('sawtooth', 62, 58, 0.55, 0.22);
        n(0.55, 'lowpass', 500, 300, 0.35);
        n(0.05, 'highpass', 1500, 1500, 0.3, 0.55);
        break;
      case 'switch':
        o('square', 900, 900, 0.03, 0.3);
        o('square', 420, 420, 0.06, 0.3, 0.05);
        break;
      case 'footstep':
        n(0.05, 'bandpass', 2600, 1800, 0.22, 0, 3);
        o('square', 220, 160, 0.03, 0.05);
        break;
      case 'pickup':
        o('square', 640, 980, 0.07, 0.18);
        o('square', 980, 980, 0.06, 0.14, 0.07);
        break;
      case 'weapon':
        n(0.05, 'highpass', 2000, 2000, 0.4);
        n(0.06, 'highpass', 1400, 1400, 0.4, 0.12);
        o('triangle', 330, 660, 0.18, 0.2, 0.18);
        break;
      case 'powerup':
        [440, 554, 660, 880, 1100].forEach((f, i) => o('sine', f, f, 0.12, 0.25, i * 0.07));
        break;
      case 'secret':
        [392, 523, 659, 784, 1046].forEach((f, i) => o('triangle', f, f, 0.2, 0.22, i * 0.11));
        break;
      case 'alertHusk':
        c('sawtooth', [150, 270, 85], 0.45, 0.3, [7, 14]);
        c('square', [151, 272, 86], 0.45, 0.12, [6, 10]);
        n(0.4, 'bandpass', 800, 380, 0.4, 0.03, 3);
        o('sine', 95, 45, 0.2, 0.35);
        break;
      case 'alertFiend':
        c('sawtooth', [300, 760, 170], 0.55, 0.26, [11, 35]);
        c('square', [150, 380, 85], 0.55, 0.13, [11, 18]);
        n(0.5, 'bandpass', 1100, 2600, 0.35, 0.03, 4);
        o('sine', 120, 50, 0.2, 0.3);
        break;
      case 'alertBrute':
        c('sawtooth', [68, 125, 42], 0.65, 0.4, [5, 7]);
        c('sawtooth', [69, 127, 43], 0.65, 0.3, [4, 6]);
        n(0.6, 'lowpass', 1000, 220, 0.65, 0.03);
        o('sine', 58, 32, 0.5, 0.55);
        break;
      case 'alertBoss':
        c('sawtooth', [55, 90, 40], 1.4, 0.55, [4, 8]);
        o('sine', 45, 30, 1.2, 0.4);
        break;
      case 'monsterPain':
        o('sawtooth', 320, 170, 0.22, 0.28);
        break;
      case 'backstab':
        n(0.12, 'lowpass', 1400, 300, 0.7);
        o('sine', 110, 45, 0.18, 0.4);
        break;
      case 'monsterDeath':
        o('sawtooth', 220, 40, 0.75, 0.35);
        n(0.7, 'lowpass', 900, 120, 0.45);
        break;
      case 'playerPain':
        o('square', 190, 120, 0.18, 0.25);
        n(0.15, 'lowpass', 800, 400, 0.3);
        break;
      case 'playerDeath':
        o('sawtooth', 240, 35, 1.3, 0.4);
        n(1.2, 'lowpass', 900, 80, 0.5);
        break;
      case 'noway':
        o('square', 130, 110, 0.18, 0.28);
        break;
      case 'claw':
        n(0.16, 'highpass', 2400, 700, 0.6);
        o('sine', 120, 60, 0.12, 0.5, 0.03);
        break;
      case 'empty':
        n(0.03, 'highpass', 3000, 3000, 0.3);
        break;
    }
    window.setTimeout(() => panner.disconnect(), 2500);
  }

  private tone(dest: AudioNode, at: number, wave: Wave, f0: number, f1: number, dur: number, gain: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(f0, at);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), at + dur);
    g.gain.setValueAtTime(gain, at);
    g.gain.exponentialRampToValueAtTime(0.001, at + dur);
    osc.connect(g).connect(dest);
    osc.start(at);
    osc.stop(at + dur + 0.02);
  }

  private cry(dest: AudioNode, at: number, wave: Wave, [f0, peak, f1]: [number, number, number], dur: number, gain: number, [rate, depth]: [number, number]): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(f0, at);
    osc.frequency.exponentialRampToValueAtTime(peak, at + dur * 0.3);
    osc.frequency.exponentialRampToValueAtTime(f1, at + dur);
    g.gain.setValueAtTime(0.001, at);
    g.gain.exponentialRampToValueAtTime(gain, at + 0.06);
    g.gain.setValueAtTime(gain, at + dur * 0.45);
    g.gain.exponentialRampToValueAtTime(0.001, at + dur);
    if (rate > 0) {
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = rate;
      lfoGain.gain.value = depth;
      lfo.connect(lfoGain).connect(osc.frequency);
      lfo.start(at);
      lfo.stop(at + dur + 0.02);
    }
    osc.connect(g).connect(dest);
    osc.start(at);
    osc.stop(at + dur + 0.02);
  }

  private noiseBurst(dest: AudioNode, at: number, dur: number, type: BiquadFilterType, f0: number, f1: number, gain: number, q: number): void {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(f0, at);
    filter.frequency.exponentialRampToValueAtTime(Math.max(1, f1), at + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, at);
    g.gain.exponentialRampToValueAtTime(0.001, at + dur);
    src.connect(filter).connect(g).connect(dest);
    src.start(at, Math.random() * 0.5);
    src.stop(at + dur + 0.02);
  }
}
