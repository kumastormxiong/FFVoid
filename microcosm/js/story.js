// 剧情状态机：旗标、台词队列、目标与分级提示、颜料收集、存档
import { T, PIGMENTS } from './text.js';

const SAVE_KEY = 'microcosm-canvas-v1';

export class Story {
  constructor(ui, audio) {
    this.ui = ui; this.audio = audio;
    this.flags = {};
    this.pigments = [false, false, false, false, false, false];
    this.lang = 'zh';
    this.goal = null; this.goalTime = 0; this.hintStage = 0;
    this.saidOnce = new Set();
    this.lastSay = {};
    this.listeners = [];
    this.mode = 'pc';
    this.time = 0;
  }
  on(fn) { this.listeners.push(fn); }
  emit(ev, data) { for (const l of this.listeners) l(ev, data); }

  line(key) { return (T[key] || []).map(l => ({ text: l[this.lang] || l.zh, kind: l.k || 'v' })); }
  say(key, { once = false, cooldown = 0 } = {}) {
    if (once && this.saidOnce.has(key)) return false;
    if (cooldown && this.lastSay[key] && this.time - this.lastSay[key] < cooldown) return false;
    this.saidOnce.add(key); this.lastSay[key] = this.time;
    for (const l of this.line(key)) this.ui.subtitle(l.text, l.kind);
    return true;
  }
  set(flag, v = true) {
    if (this.flags[flag] === v) return;
    this.flags[flag] = v; this.emit('flag', flag); this.save();
  }
  get(flag) { return !!this.flags[flag]; }

  // 目标：hints = [key...]，在闲置 45s / 100s 后依次给出
  setGoal(id, hints = []) {
    if (this.goal && this.goal.id === id) return;
    this.goal = { id, hints }; this.goalTime = 0; this.hintStage = 0;
  }
  poke() { this.goalTime = Math.min(this.goalTime, 20); }
  tick(dt) {
    this.time += dt;
    if (!this.goal) return;
    this.goalTime += dt;
    const thresholds = [40, 95, 160];
    if (this.hintStage < this.goal.hints.length && this.goalTime > thresholds[this.hintStage]) {
      this.say(this.goal.hints[this.hintStage]);
      this.hintStage++;
    }
  }

  pigment(i) {
    if (this.pigments[i]) return;
    this.pigments[i] = true;
    const p = PIGMENTS[i];
    this.ui.pigments(this.pigments);
    this.ui.toast((this.lang === 'zh' ? '找回颜色：' : 'Colour recovered: ') + p[this.lang], p.c);
    this.audio.chime(i);
    this.emit('pigment', i);
    this.save();
  }

  save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ flags: this.flags, pigments: this.pigments, checkpoint: this.checkpoint || 0 })); } catch (e) {}
  }
  load() {
    try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (s && s.flags) return s; } catch (e) {}
    return null;
  }
  clear() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }
}
