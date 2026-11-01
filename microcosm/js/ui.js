// 界面：电脑端 DOM 字幕 / VR 端跟随头部的画布面板、腕部调色盘、防眩晕水彩遮罩
import * as THREE from 'three';
import { PIGMENTS, WORLD_NAMES } from './text.js';

const FONT_V = '"Ma Shan Zheng", "Noto Serif SC", serif';
const FONT_H = '"Noto Serif SC", serif';

export class UI {
  constructor() {
    this.queue = []; this.current = null; this.curT = 0;
    this.tip = ''; this.vr = false; this.lang = 'zh';
    this.el = {
      subs: document.getElementById('subs'),
      tip: document.getElementById('tip'),
      toast: document.getElementById('toast'),
      pig: document.getElementById('pigments'),
      title: document.getElementById('worldTitle'),
      vig: document.getElementById('vignette'),
      cross: document.getElementById('cross'),
    };
    // VR 面板
    this.cv = document.createElement('canvas'); this.cv.width = 1024; this.cv.height = 320;
    this.g = this.cv.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.cv);
    this.panel = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.36), new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, depthTest: false, depthWrite: false }));
    this.panel.renderOrder = 1000; this.panel.visible = false;
    this.panelDirty = true; this.panelPos = new THREE.Vector3(); this.panelInit = false;
    this.titleText = null; this.titleT = 0;
    this.toastText = null; this.toastT = 0; this.toastColor = '#fff';
    // 防眩晕遮罩（贴在相机前）
    const vc = document.createElement('canvas'); vc.width = vc.height = 256;
    const vg = vc.getContext('2d');
    const grd = vg.createRadialGradient(128, 128, 40, 128, 128, 128);
    grd.addColorStop(0, 'rgba(20,16,24,0)'); grd.addColorStop(0.55, 'rgba(20,16,24,0.0)'); grd.addColorStop(0.8, 'rgba(26,22,30,0.85)'); grd.addColorStop(1, 'rgba(26,22,30,1)');
    vg.fillStyle = grd; vg.fillRect(0, 0, 256, 256);
    // 水彩毛边
    for (let i = 0; i < 900; i++) { const a = Math.random() * Math.PI * 2, r = 70 + Math.random() * 60; vg.fillStyle = `rgba(26,22,30,${Math.random() * 0.12})`; vg.beginPath(); vg.arc(128 + Math.cos(a) * r, 128 + Math.sin(a) * r, 3 + Math.random() * 10, 0, 7); vg.fill(); }
    const vt = new THREE.CanvasTexture(vc);
    this.vigMat = new THREE.MeshBasicMaterial({ map: vt, transparent: true, opacity: 0, depthTest: false, depthWrite: false });
    this.vigMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), this.vigMat);
    this.vigMesh.position.set(0, 0, -0.12); this.vigMesh.renderOrder = 998;
    this.vig = 0;
    // 腕部调色盘
    this.wrist = new THREE.Group();
    this.wristDots = PIGMENTS.map((p, i) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.0075, 10, 8), new THREE.MeshBasicMaterial({ color: '#3a3540' }));
      const a = -0.9 + i * 0.36; m.position.set(Math.cos(a) * 0.035, 0.012, Math.sin(a) * 0.035 + 0.05);
      this.wrist.add(m); return m;
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.002, 6, 32, Math.PI * 0.75), new THREE.MeshBasicMaterial({ color: '#d4a373' }));
    ring.rotation.x = Math.PI / 2; ring.rotation.z = -0.9 - 0.12; ring.position.set(0, 0.012, 0.05);
    this.wrist.add(ring);
  }

  setLang(l) { this.lang = l; this.panelDirty = true; }

  subtitle(text, kind = 'v') {
    // 提示类台词不要堆积
    if (kind !== 'v') this.queue = this.queue.filter(q => q.kind === 'v');
    if (this.current && this.current.text === text) return;
    this.queue.push({ text, kind });
    while (this.queue.length > 5) this.queue.shift();
  }
  // 进入新世界时，丢掉上一界还没播完的台词
  flushVoice() { this.queue = []; if (this.current) this.curT = Math.min(this.curT, 0.6); }
  clearSubs() { this.queue = []; this.current = null; this.render(); }
  duration(l) { const n = l.text.length; return this.lang === 'zh' ? Math.max(2.8, n * 0.2 + 1.2) : Math.max(2.8, n * 0.065 + 1.2); }

  setTip(t) { if (t !== this.tip) { this.tip = t; this.el.tip.textContent = t; this.el.tip.style.opacity = t ? 1 : 0; this.panelDirty = true; } }

  toast(text, color = '#fff') {
    this.toastText = text; this.toastT = 4; this.toastColor = color;
    const e = this.el.toast; e.innerHTML = `<span class="dot" style="background:${color}"></span>${text}`; e.classList.add('on');
    clearTimeout(this._tt); this._tt = setTimeout(() => e.classList.remove('on'), 3800);
    this.panelDirty = true;
  }

  worldTitle(id) {
    const n = WORLD_NAMES[id];
    const main = this.lang === 'zh' ? n.zh : n.en, sub = this.lang === 'zh' ? `${n.en} · ${n.style.zh}` : n.style.en;
    this.el.title.innerHTML = `<div class="t1">${main}</div><div class="t2">${sub}</div>`;
    this.el.title.classList.remove('on'); void this.el.title.offsetWidth; this.el.title.classList.add('on');
    this.titleText = [main, sub]; this.titleT = 4.5; this.panelDirty = true;
  }

  pigments(arr) {
    this.el.pig.innerHTML = PIGMENTS.map((p, i) => `<span class="pg ${arr[i] ? 'on' : ''}" style="--c:${p.c}" title="${p[this.lang]}"></span>`).join('');
    arr.forEach((on, i) => this.wristDots[i].material.color.set(on ? PIGMENTS[i].c : '#3a3540'));
  }

  render() {
    const c = this.current;
    const e = this.el.subs;
    if (!c) { e.classList.remove('on'); }
    else { e.classList.remove('v', 'h', 's'); e.classList.add('on', c.kind); e.textContent = c.text; }
    this.panelDirty = true;
  }

  update(dt, camera, zoomVel, xr) {
    // 字幕队列
    if (this.current) { this.curT -= dt; if (this.curT <= 0) { this.current = null; this.render(); } }
    if (!this.current && this.queue.length) { this.current = this.queue.shift(); this.curT = this.duration(this.current); this.render(); }
    if (this.titleT > 0) { this.titleT -= dt; if (this.titleT <= 0) { this.titleText = null; this.panelDirty = true; } }
    if (this.toastT > 0) { this.toastT -= dt; if (this.toastT <= 0) { this.toastText = null; this.panelDirty = true; } }
    // 防眩晕
    const target = Math.min(1, Math.max(0, (Math.abs(zoomVel) - 0.08) * 1.6));
    this.vig += (target - this.vig) * Math.min(1, dt * 4);
    this.vigMat.opacity = xr ? this.vig * 0.9 : 0;
    this.el.vig.style.opacity = (this.vig * 0.55).toFixed(3);
    // VR 面板
    this.panel.visible = xr;
    if (xr) {
      if (this.panelDirty) { this.drawPanel(); this.panelDirty = false; }
      const head = camera.getWorldPosition(new THREE.Vector3());
      const q = camera.getWorldQuaternion(new THREE.Quaternion());
      const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(q); fwd.y = Math.min(fwd.y, 0.2);
      fwd.normalize();
      const want = head.clone().addScaledVector(fwd, 1.4); want.y = head.y - 0.42 + fwd.y * 0.6;
      if (!this.panelInit) { this.panelPos.copy(want); this.panelInit = true; }
      this.panelPos.lerp(want, Math.min(1, dt * 1.6));
      this.panel.position.copy(this.panelPos);
      this.panel.lookAt(head);
    }
  }

  drawPanel() {
    const g = this.g, W = 1024, H = 320;
    g.clearRect(0, 0, W, H);
    const lines = [];
    const has = this.current || this.tip || this.titleText || this.toastText;
    if (!has) { this.tex.needsUpdate = true; return; }
    if (this.titleText) {
      g.textAlign = 'center';
      g.fillStyle = 'rgba(250,243,221,0.95)'; g.font = `64px ${FONT_V}`; g.fillText(this.titleText[0], W / 2, 90);
      g.fillStyle = 'rgba(250,243,221,0.6)'; g.font = `26px ${FONT_H}`; g.fillText(this.titleText[1], W / 2, 130);
    }
    if (this.current) {
      const v = this.current.kind === 'v';
      g.font = v ? `44px ${FONT_V}` : `32px ${FONT_H}`;
      const wrapped = this.wrap(this.current.text, 900);
      const y0 = 205 - (wrapped.length - 1) * 26;
      const bh = wrapped.length * 52 + 26;
      g.fillStyle = 'rgba(18,14,20,0.55)'; this.round(g, 40, y0 - 44, W - 80, bh, 22); g.fill();
      g.fillStyle = v ? '#ffe8c2' : '#e8e6f0'; g.textAlign = 'center';
      wrapped.forEach((l, i) => g.fillText(l, W / 2, y0 + i * 52));
    }
    if (this.toastText && !this.current) {
      g.font = `34px ${FONT_H}`; g.textAlign = 'center'; g.fillStyle = this.toastColor; g.fillText('● ' + this.toastText, W / 2, 210);
    }
    if (this.tip) { g.font = `28px ${FONT_H}`; g.textAlign = 'center'; g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillText(this.tip, W / 2, 300); }
    this.tex.needsUpdate = true;
  }
  wrap(text, maxW) {
    const g = this.g; const out = []; let line = '';
    const tokens = this.lang === 'zh' ? [...text] : text.split(/(\s+)/);
    for (const t of tokens) { const test = line + t; if (g.measureText(test).width > maxW && line) { out.push(line.trim()); line = t; } else line = test; }
    if (line.trim()) out.push(line.trim());
    return out.slice(0, 3);
  }
  round(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
}
