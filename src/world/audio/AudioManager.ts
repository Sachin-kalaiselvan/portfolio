/**
 * All sound is synthesised with the Web Audio API (decision D6): no files to
 * download, nothing borrowed. The AudioContext is only created from a user
 * gesture, and sound stays off until the visitor turns it on.
 */
export interface AudioFrame {
  speed: number;
  topSpeed: number;
  throttle: number;
  /** 0..1 how hard the tyres are working sideways. */
  slip: number;
  braking: boolean;
  /** Suspension compression change this frame (m), for bumps. */
  bump: number;
}

export class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private motorOsc: OscillatorNode[] = [];
  private motorGain: GainNode | null = null;
  private motorFilter: BiquadFilterNode | null = null;
  private tyreGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private sources: AudioScheduledSourceNode[] = [];
  private lastBump = 0;
  enabled = false;

  /** Call from a click or key handler only. */
  enable(): boolean {
    if (!this.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return false;
      try {
        this.ctx = new AC();
      } catch {
        return false;
      }
      this.setup();
    }
    void this.ctx.resume();
    this.enabled = true;
    this.master!.gain.setTargetAtTime(0.55, this.ctx.currentTime, 0.2);
    return true;
  }

  disable() {
    this.enabled = false;
    if (this.ctx && this.master) this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
  }

  get created() {
    return this.ctx !== null;
  }

  private setup() {
    const ctx = this.ctx!;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    this.master.connect(comp).connect(ctx.destination);

    // Noise buffer shared by tyres, wind and bumps (brown-ish noise).
    const len = ctx.sampleRate * 2;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      data[i] = last * 3.5;
    }

    // Motor: two detuned saws through a low-pass. A small electric hum, not a petrol engine.
    this.motorFilter = ctx.createBiquadFilter();
    this.motorFilter.type = 'lowpass';
    this.motorFilter.frequency.value = 300;
    this.motorFilter.Q.value = 2;
    this.motorGain = ctx.createGain();
    this.motorGain.gain.value = 0;
    this.motorFilter.connect(this.motorGain).connect(this.master);
    for (const detune of [0, 7]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = 60;
      o.detune.value = detune;
      o.connect(this.motorFilter);
      o.start();
      this.motorOsc.push(o);
      this.sources.push(o);
    }

    // Tyres: band-passed noise, louder with slip.
    this.tyreGain = ctx.createGain();
    this.tyreGain.gain.value = 0;
    const tyreF = ctx.createBiquadFilter();
    tyreF.type = 'bandpass';
    tyreF.frequency.value = 900;
    tyreF.Q.value = 0.8;
    this.loopNoise(tyreF);
    tyreF.connect(this.tyreGain).connect(this.master);

    // Ambience: low wind across the board.
    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0.05;
    const windF = ctx.createBiquadFilter();
    windF.type = 'lowpass';
    windF.frequency.value = 380;
    this.loopNoise(windF);
    windF.connect(this.windGain).connect(this.master);
  }

  private loopNoise(into: AudioNode) {
    const src = this.ctx!.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    src.loopStart = Math.random();
    src.connect(into);
    src.start();
    this.sources.push(src);
  }

  update(f: AudioFrame) {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    const v = Math.min(1, Math.abs(f.speed) / f.topSpeed);
    const pitch = 55 + v * 140 + f.throttle * 20;
    for (const o of this.motorOsc) o.frequency.setTargetAtTime(pitch, t, 0.08);
    this.motorFilter!.frequency.setTargetAtTime(220 + v * 900 + f.throttle * 400, t, 0.1);
    this.motorGain!.gain.setTargetAtTime(0.04 + v * 0.1 + f.throttle * 0.05, t, 0.1);
    const tyre = Math.min(1, f.slip * 1.5) * Math.min(1, v * 3) + (f.braking && v > 0.1 ? 0.3 : 0);
    this.tyreGain!.gain.setTargetAtTime(tyre * 0.25, t, 0.06);
    this.windGain!.gain.setTargetAtTime(0.04 + v * 0.06, t, 0.4);
    if (f.bump > 0.05 && t - this.lastBump > 0.15) {
      this.lastBump = t;
      this.thud(Math.min(1, f.bump * 4));
    }
  }

  private thud(strength: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 160;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0.5 * strength, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    src.connect(f).connect(g).connect(this.master!);
    src.start(t, Math.random());
    src.stop(t + 0.3);
  }

  horn() {
    if (!this.ctx || !this.enabled) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.12, t + 0.02);
    g.gain.setValueAtTime(0.12, t + 0.32);
    g.gain.linearRampToValueAtTime(0, t + 0.4);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 2200;
    g.connect(f).connect(this.master!);
    for (const hz of [392, 494]) {
      const o = ctx.createOscillator();
      o.type = 'square';
      o.frequency.value = hz;
      o.connect(g);
      o.start(t);
      o.stop(t + 0.42);
    }
  }

  /** Short soft tick for interface actions and discoveries. */
  chime(kind: 'ui' | 'discover' = 'ui') {
    if (!this.ctx || !this.enabled) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const notes = kind === 'discover' ? [660, 880, 1320] : [880];
    notes.forEach((hz, i) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = hz;
      const g = ctx.createGain();
      const t0 = t + i * 0.08;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.08, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.5);
      o.connect(g).connect(this.master!);
      o.start(t0);
      o.stop(t0 + 0.55);
    });
  }

  suspend() {
    void this.ctx?.suspend();
  }

  resume() {
    if (this.enabled) void this.ctx?.resume();
  }

  dispose() {
    for (const s of this.sources) {
      try {
        s.stop();
      } catch {
        /* already stopped */
      }
    }
    this.sources = [];
    void this.ctx?.close();
    this.ctx = null;
  }
}
