// 程序化声音：六界各自的音色 + 一条贯穿全剧的“她的主题”动机
const MOTIF = [0, 3, 7, 10, 12, 10, 7, 5, 3, 0];
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

export class Audio {
  constructor() { this.ctx = null; this.weights = [0, 0, 0, 0, 0, 0]; this.next = [0, 0, 0, 0, 0, 0]; this.step = [0, 0, 0, 0, 0, 0]; this.enabled = true; this.finale = 0; }

  start() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const c = this.ctx = new AC();
    this.master = c.createGain(); this.master.gain.value = 0.8;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3;
    this.master.connect(comp); comp.connect(c.destination);
    // 混响
    this.verb = c.createConvolver(); this.verb.buffer = this.impulse(3.2, 2.4);
    this.verbIn = c.createGain(); this.verbIn.gain.value = 0.6; this.verbIn.connect(this.verb); this.verb.connect(this.master);
    this.dry = c.createGain(); this.dry.connect(this.master); this.dry.connect(this.verbIn);
    this.noiseBuf = this.noise(2);
    this.buses = []; for (let i = 0; i < 6; i++) { const g = c.createGain(); g.gain.value = 0; g.connect(this.dry); this.buses.push(g); }
    this.sfx = c.createGain(); this.sfx.gain.value = 0.7; this.sfx.connect(this.dry);
    this.makeBeds();
    // 缩放风声
    this.wh = c.createBufferSource(); this.wh.buffer = this.noiseBuf; this.wh.loop = true;
    this.whF = c.createBiquadFilter(); this.whF.type = 'bandpass'; this.whF.Q.value = 0.8; this.whF.frequency.value = 400;
    this.whG = c.createGain(); this.whG.gain.value = 0;
    this.wh.connect(this.whF); this.whF.connect(this.whG); this.whG.connect(this.dry); this.wh.start();
    for (let i = 0; i < 6; i++) this.next[i] = c.currentTime + 0.5 + i * 0.13;
  }
  impulse(sec, decay) {
    const c = this.ctx, n = c.sampleRate * sec, b = c.createBuffer(2, n, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay); }
    return b;
  }
  noise(sec) {
    const c = this.ctx, n = c.sampleRate * sec, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return b;
  }
  osc(type, f, dest, gain = 0.1) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f; g.gain.value = gain; o.connect(g); g.connect(dest); o.start(); return { o, g };
  }
  noiseLoop(dest, type, freq, q, gain) {
    const c = this.ctx, s = c.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true; s.playbackRate.value = 0.7 + Math.random() * 0.3;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); g.gain.value = gain; s.connect(f); f.connect(g); g.connect(dest); s.start(); return { s, f, g };
  }
  lfo(param, rate, depth) { const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.frequency.value = rate; g.gain.value = depth; o.connect(g); g.connect(param); o.start(); }

  // 每个世界的底层氛围
  makeBeds() {
    const c = this.ctx, B = this.buses;
    const lp = (bus, f) => { const x = c.createBiquadFilter(); x.type = 'lowpass'; x.frequency.value = f; x.connect(bus); return x; };
    // W0 暖色琴弦嗡鸣 + 壁炉噼啪
    { const f = lp(B[0], 900); this.osc('triangle', mtof(41), f, 0.05); this.osc('triangle', mtof(48) * 1.003, f, 0.035); this.osc('sine', mtof(53), f, 0.02); const n = this.noiseLoop(B[0], 'highpass', 3000, 0.5, 0.004); this.lfo(n.g.gain, 7.3, 0.004); }
    // W1 明亮玻璃垫音
    { const f = lp(B[1], 1800); this.osc('sawtooth', mtof(45), f, 0.012); this.osc('sawtooth', mtof(52) * 1.004, f, 0.01); this.osc('sine', mtof(64), f, 0.02); this.lfo(f.frequency, 0.08, 500); }
    // W2 风声
    { const n = this.noiseLoop(B[2], 'bandpass', 700, 0.6, 0.05); this.lfo(n.f.frequency, 0.07, 400); this.lfo(n.g.gain, 0.11, 0.02); this.osc('sine', mtof(50), lp(B[2], 600), 0.02); }
    // W3 海浪 + 低频
    { const n = this.noiseLoop(B[3], 'lowpass', 500, 0.4, 0.09); this.lfo(n.g.gain, 0.09, 0.07); this.lfo(n.f.frequency, 0.09, 300); this.osc('sine', mtof(26), B[3], 0.08); this.osc('sine', mtof(38) * 1.002, B[3], 0.03); }
    // W4 合成器低音脉冲
    { const f = lp(B[4], 400); this.osc('sawtooth', mtof(36), f, 0.03); this.osc('square', mtof(43) * 0.998, f, 0.012); this.lfo(f.frequency, 1.83, 300); }
    // W5 纸面沙沙
    { const n = this.noiseLoop(B[5], 'bandpass', 2400, 1.2, 0.012); this.lfo(n.g.gain, 0.5, 0.01); this.osc('sine', mtof(48), lp(B[5], 500), 0.015); }
  }

  // 音符音色
  note(world, m, t, vel = 1, dest = null) {
    const c = this.ctx; const out = dest || this.buses[world];
    const g = c.createGain(); g.connect(out);
    const f = mtof(m);
    const env = (a, d, peak) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak * vel, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); };
    const o = (type, fr, gg = 1) => { const x = c.createOscillator(); x.type = type; x.frequency.value = fr; const y = c.createGain(); y.gain.value = gg; x.connect(y); y.connect(g); x.start(t); x.stop(t + 4.5); return x; };
    switch (world) {
      case 0: env(0.005, 2.2, 0.09); o('sine', f); o('sine', f * 4.01, 0.25); o('triangle', f * 2, 0.2); break;            // 八音盒
      case 1: env(0.002, 1.6, 0.06); o('sine', f); o('sine', f * 3.5, 0.4); o('sine', f * 6.27, 0.15); break;             // 玻璃钟
      case 2: { env(0.002, 1.1, 0.1); const x = o('triangle', f * 1.02); x.frequency.exponentialRampToValueAtTime(f, t + 0.08); o('sine', f * 2, 0.3); break; } // 琴
      case 3: env(0.08, 3.5, 0.07); o('sine', f); o('sine', f * 2.76, 0.3); o('sine', f * 5.4, 0.1); break;               // 深海钟
      case 4: { env(0.003, 0.35, 0.05); const x = o('square', f); const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 2200; x.disconnect(); x.connect(fl); fl.connect(g); break; } // 方波琶音
      case 5: env(0.004, 2.6, 0.08); o('triangle', f); o('sine', f * 2, 0.35); o('sine', f * 3, 0.12); break;             // 钢琴
      default: env(0.01, 1.5, 0.06); o('sine', f);
    }
  }

  // 每帧调用：w = 六界音量权重
  update(dt, weights, zoomVel) {
    if (!this.ctx) return;
    const c = this.ctx, now = c.currentTime;
    for (let i = 0; i < 6; i++) {
      const w = Math.max(weights[i], this.finale * 0.6);
      this.weights[i] += (w - this.weights[i]) * Math.min(1, dt * 1.5);
      this.buses[i].gain.setTargetAtTime(this.weights[i], now, 0.1);
      if (this.weights[i] > 0.02 && now + 0.12 > this.next[i]) this.schedule(i, Math.max(this.next[i], now + 0.02));
    }
    const z = Math.min(1, Math.abs(zoomVel) * 1.4);
    this.whG.gain.setTargetAtTime(z * 0.12, now, 0.08);
    this.whF.frequency.setTargetAtTime(300 + z * 2200 + (zoomVel > 0 ? 400 : 0), now, 0.1);
  }

  schedule(i, t) {
    const s = this.step[i]++;
    const base = [65, 69, 62, 50, 60, 60][i];
    let m, dt;
    const motif = MOTIF[s % MOTIF.length];
    switch (i) {
      case 0: m = base + [0, 2, 4, 7, 9, 12, 9, 7][Math.floor(Math.random() * 8)]; if (s % 16 < 8) m = base + motif; dt = 0.9 + Math.random() * 0.6; break;
      case 1: m = base + [0, 2, 4, 6, 7, 11, 12][Math.floor(Math.random() * 7)] + (Math.random() < 0.3 ? 12 : 0); dt = 0.5 * (1 + Math.floor(Math.random() * 3)); this.tick(t); break;
      case 2: m = base + [0, 2, 3, 7, 8, 12, 14][Math.floor(Math.random() * 7)]; dt = 1.2 + Math.random() * 1.6; break;
      case 3: m = base + [0, 3, 7, 10, 12, 15][Math.floor(Math.random() * 6)]; dt = 3 + Math.random() * 3; if (Math.random() < 0.18) this.whale(t); break;
      case 4: m = base + [0, 3, 7, 10, 12, 15, 19, 22][s % 8] - (Math.floor(s / 32) % 2) * 2; dt = 60 / 110 / 4; break;
      case 5: m = base + motif; dt = 1.6 + Math.random() * 1.2; if (Math.random() < 0.35) this.scratch(t + 0.3); break;
    }
    this.note(i, m, t, 0.8 + Math.random() * 0.3);
    this.next[i] = t + dt;
  }
  tick(t) { const c = this.ctx, s = c.createBufferSource(); s.buffer = this.noiseBuf; const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 5000; const g = c.createGain(); g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03); s.connect(f); f.connect(g); g.connect(this.buses[1]); s.start(t, Math.random()); s.stop(t + 0.05); }
  scratch(t) { const c = this.ctx, s = c.createBufferSource(); s.buffer = this.noiseBuf; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800 + Math.random() * 1500; f.Q.value = 2; const g = c.createGain(); const d = 0.2 + Math.random() * 0.4; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 0.05); g.gain.linearRampToValueAtTime(0, t + d); s.connect(f); f.connect(g); g.connect(this.buses[5]); s.start(t, Math.random()); s.stop(t + d + 0.05); }
  whale(t) { const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(140, t + 2.5); o.frequency.exponentialRampToValueAtTime(180, t + 4); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.06, t + 0.8); g.gain.linearRampToValueAtTime(0, t + 4); o.connect(g); g.connect(this.buses[3]); this.lfoOn(o.frequency, 5, 4, t); o.start(t); o.stop(t + 4.2); }
  lfoOn(param, rate, depth, t) { const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.frequency.value = rate; g.gain.value = depth; o.connect(g); g.connect(param); o.start(t); o.stop(t + 4.5); }

  // ---------- 音效 ----------
  blip(f0, f1, dur, type = 'sine', vol = 0.12) {
    if (!this.ctx) return; const c = this.ctx, t = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(this.sfx); o.start(t); o.stop(t + dur + 0.05);
  }
  grab() { this.blip(500, 900, 0.12); }
  release() { this.blip(700, 380, 0.15); }
  deny(heavy) { heavy ? this.blip(90, 55, 0.4, 'triangle', 0.3) : this.blip(1200, 1500, 0.06, 'sine', 0.06); }
  touch() { this.blip(880, 660, 0.18, 'sine', 0.05); }
  click() { this.blip(1400, 900, 0.05, 'square', 0.03); }
  chime(i = 0) {
    if (!this.ctx) return; const t = this.ctx.currentTime;
    [0, 4, 7, 12, 16].forEach((d, k) => this.note(i, 72 + d, t + k * 0.11, 1.4, this.sfx));
  }
  unlock() { if (!this.ctx) return; const t = this.ctx.currentTime; [0, 7, 12, 19, 24].forEach((d, k) => this.note(1, 60 + d, t + k * 0.08, 1.2, this.sfx)); }
  swell() {
    if (!this.ctx) return; const c = this.ctx, t = c.currentTime;
    [48, 55, 60, 64, 67, 71].forEach((m) => { const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = mtof(m); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.04, t + 2.5); g.gain.linearRampToValueAtTime(0, t + 9); o.connect(g); g.connect(this.sfx); o.start(t); o.stop(t + 9.5); });
  }
  finaleMusic() {
    if (!this.ctx) return; this.finale = 1; this.swell();
    const t0 = this.ctx.currentTime + 0.5;
    const chords = [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 67], [60, 64, 67, 72]];
    chords.forEach((ch, k) => ch.forEach((m, j) => this.note(k % 6, m, t0 + k * 2.4 + j * 0.06, 1.2, this.sfx)));
    MOTIF.forEach((d, k) => this.note(5, 72 + d, t0 + 1.2 + k * 0.6, 1.1, this.sfx));
  }
}
