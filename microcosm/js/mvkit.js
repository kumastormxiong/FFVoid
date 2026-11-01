// 纪念碑谷式建筑套件：圆角体块、拱窗、檐口、穹顶 / 尖塔 / 洋葱顶、阶梯、层叠基座
import * as THREE from 'three';
import { RoundedBoxGeometry } from '../vendor/jsm/geometries/RoundedBoxGeometry.js';
import { M, box, cyl, cone, ball, lathe, extrudeShape } from './geo.js';

const rbCache = new Map();
export function rbox(w, h, d, r = 0.03) {
  const k = [w, h, d, r].map(v => v.toFixed(3)).join(',');
  if (!rbCache.has(k)) rbCache.set(k, new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2.2, h / 2.2, d / 2.2)));
  return rbCache.get(k);
}

// 拱形（矩形 + 半圆顶），薄片
const archCache = new Map();
export function archGeo(w, h, t = 0.02) {
  const k = `${w.toFixed(3)},${h.toFixed(3)},${t}`;
  if (archCache.has(k)) return archCache.get(k);
  const s = new THREE.Shape(); const r = w / 2;
  s.moveTo(-r, 0); s.lineTo(r, 0); s.lineTo(r, h - r); s.absarc(0, h - r, r, 0, Math.PI, false); s.lineTo(-r, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 10 }); g.translate(0, 0, -t / 2);
  archCache.set(k, g); return g;
}

const dome = (r) => lathe(Array.from({ length: 9 }, (_, i) => { const a = (i / 8) * Math.PI / 2; return [Math.cos(a) * r, Math.sin(a) * r]; }), 18);
const onion = (r) => lathe([[r * 0.8, 0], [r * 1.05, r * 0.35], [r * 0.95, r * 0.8], [r * 0.5, r * 1.2], [r * 0.12, r * 1.55], [0.001, r * 1.75]], 18);

// 在一个立面上开拱窗：face 0..3 = +z, +x, -z, -x
function windows(D, m, cx, cy, cz, w, d, n, aw, ah, y0) {
  for (let f = 0; f < 4; f++) {
    const half = (f % 2 === 0) ? d / 2 : w / 2; const span = (f % 2 === 0) ? w : d;
    const ry = [0, Math.PI / 2, Math.PI, -Math.PI / 2][f];
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n - 0.5;
      const lx = u * span * 0.8, lz = half + 0.006;
      const x = cx + Math.cos(ry) * lx + Math.sin(ry) * lz, z = cz - Math.sin(ry) * lx + Math.cos(ry) * lz;
      D.add(archGeo(aw, ah), m, M(x, cy + y0, z, 0, ry, 0));
    }
  }
}

// 塔：{x,y,z,w,h,body,trim,roof,roofMat,win,winN,outline}
export function tower(D, o) {
  const { x, y, z, w, h, body, trim, roof = 'dome', roofMat = trim, win, winN = 1, outline = false } = o;
  D.add(rbox(w * 1.18, 0.14, w * 1.18, 0.02), trim, M(x, y + 0.07, z), outline);
  D.add(rbox(w, h, w, 0.035), body, M(x, y + h / 2 + 0.1, z), outline);
  D.add(rbox(w * 1.14, 0.09, w * 1.14, 0.02), trim, M(x, y + h + 0.12, z), outline);
  if (win) {
    const aw = w / (winN + 1) * 0.9, ah = Math.min(h * 0.32, aw * 2.2);
    windows(D, win, x, y + 0.1, z, w, w, winN, aw, ah, h * 0.55);
    if (h > w * 2.5) windows(D, win, x, y + 0.1, z, w, w, winN, aw * 0.8, ah * 0.7, h * 0.2);
  }
  const top = y + h + 0.165;
  if (roof === 'dome') { D.add(cyl(w * 0.42, w * 0.42, 0.08, 18), trim, M(x, top + 0.04, z), outline); D.add(dome(w * 0.42), roofMat, M(x, top + 0.08, z), outline); D.add(ball(w * 0.07, 10, 8), trim, M(x, top + 0.08 + w * 0.46, z)); }
  else if (roof === 'spire') { D.add(cone(w * 0.62, w * 1.3, 4), roofMat, M(x, top + w * 0.65, z, 0, Math.PI / 4, 0), outline); D.add(ball(w * 0.06, 8, 6), trim, M(x, top + w * 1.32, z)); }
  else if (roof === 'onion') { D.add(onion(w * 0.4), roofMat, M(x, top, z), outline); }
  else if (roof === 'crown') { for (let i = 0; i < 4; i++) for (let k = -1; k <= 1; k += 2) { const a = i * Math.PI / 2; const ex = Math.cos(a) * w * 0.5, ez = Math.sin(a) * w * 0.5; const tx = -Math.sin(a) * k * w * 0.32, tz = Math.cos(a) * k * w * 0.32; D.add(box(w * 0.16, w * 0.18, w * 0.16), trim, M(x + ex + tx, top + w * 0.09, z + ez + tz)); } }
  return top;
}

// 层叠基座：顶面在 y，向下逐层收窄（下方会被高度渐变融进雾里）
export function plinth(D, o) {
  const { x, y, z, w, d, tiers = 3, body, trim, win, outline = false } = o;
  let cy = y, cw = w, cd = d;
  D.add(rbox(cw, 0.32, cd, 0.04), trim, M(x, cy - 0.16, z), outline);
  cy -= 0.32;
  for (let i = 0; i < tiers; i++) {
    const h = 0.9 + i * 0.5; cw *= 0.84; cd *= 0.84;
    D.add(rbox(cw, h, cd, 0.04), body, M(x, cy - h / 2, z), outline);
    if (win && i < 2) windows(D, win, x, cy - h, z, cw, cd, Math.max(1, Math.round(cw / 1.1)), 0.32, Math.min(h * 0.6, 0.7), h * 0.18);
    cy -= h;
  }
  return cy;
}

export function stairs(D, m, x, y, z, ry, n = 6, sw = 0.9, rise = 0.16, run = 0.28, outline = false) {
  for (let i = 0; i < n; i++) {
    const lz = (i + 0.5) * run, ly = -(i + 1) * rise;
    const px = x + Math.sin(ry) * lz, pz = z + Math.cos(ry) * lz;
    D.add(box(sw, rise, run * 1.02), m, M(px, y + ly + rise / 2, pz, 0, ry, 0), outline);
  }
}

// 柔软的云团
export function cloud(D, m, x, y, z, s = 1, seed = 0) {
  const n = 6;
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2 + seed; const rr = (0.55 + ((i * 37 + seed * 11) % 7) / 14) * s;
    D.add(ball(rr, 16, 12), m, M(x + Math.cos(a) * s * 0.9, y + Math.sin(i * 1.7 + seed) * 0.15 * s, z + Math.sin(a) * s * 0.45, 0, 0, 0, 1, 0.72, 1));
  }
  D.add(ball(s * 1.0, 18, 12), m, M(x, y + 0.2 * s, z, 0, 0, 0, 1.2, 0.8, 1));
}
