export class AudioSystem {
  constructor() {
    this.enabled = true;
    this.supported = 'speechSynthesis' in window;
    this.currentUtterance = null;
    this.audioContext = null;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.stopSpeech();
    }
  }

  stopSpeech() {
    if (this.supported) {
      window.speechSynthesis.cancel();
    }
    this.currentUtterance = null;
  }

  ensureAudioContext() {
    if (!this.enabled) return null;
    if (!this.audioContext) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      this.audioContext = new Ctx();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    return this.audioContext;
  }

  speak(text) {
    if (!this.enabled || !this.supported || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  play(type) {
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    switch (type) {
      case 'start':
        this.playTone(ctx, now, 440, 0.08, 'triangle', 0.03);
        this.playTone(ctx, now + 0.09, 660, 0.1, 'triangle', 0.035);
        break;
      case 'correct':
        this.playTone(ctx, now, 620, 0.07, 'sine', 0.04);
        this.playTone(ctx, now + 0.07, 860, 0.12, 'triangle', 0.045);
        break;
      case 'wrong':
        this.playTone(ctx, now, 300, 0.08, 'square', 0.035);
        this.playTone(ctx, now + 0.08, 220, 0.12, 'square', 0.03);
        break;
      case 'item':
        this.playTone(ctx, now, 540, 0.06, 'triangle', 0.03);
        this.playTone(ctx, now + 0.05, 740, 0.09, 'triangle', 0.032);
        break;
      case 'lifeLost':
        this.playTone(ctx, now, 220, 0.12, 'sawtooth', 0.04);
        this.playTone(ctx, now + 0.1, 160, 0.18, 'square', 0.035);
        break;
      case 'stageClear':
        this.playTone(ctx, now, 523.25, 0.09, 'triangle', 0.04);
        this.playTone(ctx, now + 0.09, 659.25, 0.1, 'triangle', 0.045);
        this.playTone(ctx, now + 0.18, 783.99, 0.18, 'triangle', 0.05);
        break;
      case 'gameOver':
        this.playTone(ctx, now, 260, 0.14, 'square', 0.035);
        this.playTone(ctx, now + 0.13, 200, 0.16, 'square', 0.03);
        this.playTone(ctx, now + 0.28, 160, 0.24, 'sawtooth', 0.028);
        break;
      default:
        break;
    }
  }

  playTone(ctx, start, frequency, duration, type, volume) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }
}
