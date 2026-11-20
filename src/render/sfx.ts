import type { SoundId } from '../sim/defs';

type Wave = OscillatorType;

export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  muted = false;

  get audio(): { ctx: AudioContext; out: AudioNode; noise: AudioBuffer } | null {
    return this.ctx && this.master && this.noise ? { ctx: this.ctx, out: this.master, noise: this.noise } : null;
  }

  unlock(): void {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
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
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.55;
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

    switch (id) {
      case 'pistol':
        n(0.14, 'bandpass', 2200, 500, 0.9, 0, 0.8);
        o('square', 190, 55, 0.09, 0.35);
        break;
      case 'huskShot':
        n(0.16, 'bandpass', 1500, 380, 0.8, 0, 0.8);
        o('square', 150, 45, 0.1, 0.3);
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
        o('sawtooth', 170, 85, 0.55, 0.3);
        n(0.5, 'bandpass', 600, 300, 0.4, 0, 3);
        break;
      case 'alertFiend':
        o('sawtooth', 240, 100, 0.7, 0.3);
        o('square', 120, 60, 0.7, 0.15);
        n(0.6, 'bandpass', 900, 400, 0.35, 0, 4);
        break;
      case 'alertBrute':
        o('sawtooth', 95, 48, 0.8, 0.45);
        n(0.8, 'lowpass', 700, 200, 0.6);
        break;
      case 'monsterPain':
        o('sawtooth', 320, 170, 0.22, 0.28);
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
