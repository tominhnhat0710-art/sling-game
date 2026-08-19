import { TUNE as T } from './TUNE.js';

/* Am thanh toi gian bang WebAudio, khong tai file nao ca.
   iOS bat buoc phai khoi tao trong mot cu cham that, nen init() duoc goi tu pointerdown. */
export class Audio {
  constructor() { this.ac = null; this.on = true; this.wind = null; this.master = null; }

  init() {
    if (this.ac) { if (this.ac.state === 'suspended') this.ac.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ac = new AC();
      this.master = this.ac.createGain();
      this.master.gain.value = T.volume;
      this.master.connect(this.ac.destination);

      // dem tieng on trang, dung lai cho gio, bui va va cham
      const len = this.ac.sampleRate * 2;
      this.noise = this.ac.createBuffer(1, len, this.ac.sampleRate);
      const ch = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;

      // tieng gio chay lien tuc, chi thay doi am luong va do trong
      const src = this.ac.createBufferSource();
      src.buffer = this.noise; src.loop = true;
      const lp = this.ac.createBiquadFilter();
      lp.type = 'bandpass'; lp.frequency.value = 620; lp.Q.value = 0.6;
      this.windGainNode = this.ac.createGain();
      this.windGainNode.gain.value = 0;
      src.connect(lp); lp.connect(this.windGainNode); this.windGainNode.connect(this.master);
      src.start();
      this.windLp = lp;
    } catch (e) { this.ac = null; }
  }

  setMuted(m) {
    this.on = !m;
    if (this.master) this.master.gain.value = m ? 0 : T.volume;
  }

  /* muc gio theo toc do, 0..1 */
  setWind(speed) {
    if (!this.ac || !this.windGainNode) return;
    const k = Math.min(1, speed / T.windMax);
    this.windGainNode.gain.value = k * k * 0.5;
    this.windLp.frequency.value = 380 + k * 1500;
  }

  _noiseBurst(dur, freq, q, gain, sweepTo) {
    if (!this.ac) return;
    const t = this.ac.currentTime;
    const src = this.ac.createBufferSource(); src.buffer = this.noise;
    const f = this.ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    const g = this.ac.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t); src.stop(t + dur);
  }

  _tone(f0, f1, dur, type, gain) {
    if (!this.ac) return;
    const t = this.ac.currentTime;
    const o = this.ac.createOscillator(); o.type = type || 'sine';
    o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = this.ac.createGain();
    g.gain.setValueAtTime(gain ?? 0.18, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur);
  }

  stretch(power) { this._tone(90 + power * 120, 120 + power * 200, 0.09, 'triangle', 0.05); }
  launch(power)  { this._tone(320 + power * 260, 70, 0.34, 'sawtooth', 0.16);
                   this._noiseBurst(0.3, 900, 0.8, 0.3, 260); }
  thud(strength) { const k = Math.min(1, strength / 26);
                   this._noiseBurst(0.1 + k * 0.2, 110 + k * 90, 1.1, 0.15 + k * 0.5, 55);
                   this._tone(70 + k * 40, 38, 0.16, 'sine', 0.06 + k * 0.16); }
  whoosh()       { this._noiseBurst(0.42, 350, 0.7, 0.42, 2400);
                   this._tone(180, 620, 0.34, 'square', 0.06); }
  pad()          { this._tone(620, 1180, 0.2, 'square', 0.11); }
  best()         { [880, 1108, 1320].forEach((f, i) => setTimeout(() => this._tone(f, f, 0.2, 'triangle', 0.11), i * 95)); }
}
