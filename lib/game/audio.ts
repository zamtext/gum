/**
 * Procedural Web Audio API sound synthesizer.
 * Operates without external asset files, providing instant, reliable, zero-latency sound effects.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private thrusterOsc: OscillatorNode | null = null;
  private thrusterGain: GainNode | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private init() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.isMuted ? 0 : 0.4;
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.4, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playLaser(type: 'standard' | 'spread' | 'railgun' | 'homing' = 'standard') {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (type === 'railgun') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.22);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.23);
      return;
    }

    if (type === 'homing') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.linearRampToValueAtTime(850, now + 0.1);
      osc.frequency.linearRampToValueAtTime(300, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.21);
      return;
    }

    // Standard & Spread
    osc.type = type === 'spread' ? 'triangle' : 'square';
    const startFreq = type === 'spread' ? 700 : 880;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playExplosion(intensity: 'small' | 'medium' | 'large' = 'medium') {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const duration = intensity === 'large' ? 0.8 : intensity === 'medium' ? 0.5 : 0.3;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-3 * (i / bufferSize));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(intensity === 'large' ? 400 : 800, now);
    filter.frequency.exponentialRampToValueAtTime(50, now + duration);

    const gain = this.ctx.createGain();
    const peakGain = intensity === 'large' ? 0.6 : intensity === 'medium' ? 0.35 : 0.2;
    gain.gain.setValueAtTime(peakGain, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
  }

  public playHit() {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playShieldDeflect() {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(1040, now + 0.15);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playPowerUp() {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const noteTime = now + idx * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.18, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(noteTime);
      osc.stop(noteTime + 0.13);
    });
  }

  public playVictory() {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const noteTime = now + idx * 0.12;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.25, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(noteTime);
      osc.stop(noteTime + 0.45);
    });
  }

  public setThruster(active: boolean, boost: boolean = false) {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    if (active) {
      if (!this.thrusterOsc) {
        this.thrusterOsc = this.ctx.createOscillator();
        this.thrusterGain = this.ctx.createGain();

        this.thrusterOsc.type = 'sawtooth';
        this.thrusterOsc.frequency.setValueAtTime(boost ? 140 : 85, this.ctx.currentTime);

        this.thrusterGain.gain.setValueAtTime(0.06, this.ctx.currentTime);
        this.thrusterOsc.connect(this.thrusterGain);
        this.thrusterGain.connect(this.masterGain);
        this.thrusterOsc.start();
      } else if (this.thrusterGain) {
        this.thrusterOsc.frequency.setTargetAtTime(boost ? 150 : 90, this.ctx.currentTime, 0.05);
        this.thrusterGain.gain.setTargetAtTime(boost ? 0.12 : 0.06, this.ctx.currentTime, 0.05);
      }
    } else {
      if (this.thrusterOsc && this.thrusterGain) {
        this.thrusterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
        setTimeout(() => {
          if (this.thrusterOsc) {
            try {
              this.thrusterOsc.stop();
              this.thrusterOsc.disconnect();
            } catch (e) {}
            this.thrusterOsc = null;
            this.thrusterGain = null;
          }
        }, 60);
      }
    }
  }
}

export const soundManager = new SoundManager();
