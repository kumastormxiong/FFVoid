// 圆形阁楼画室：第 0 界（水粉）与第 5 界（炭笔）共用同一套布局 —— 莫比乌斯回环的“既视感”
import * as THREE from 'three';
import { M, box, cyl, cone, sph, ball, torus, lathe, rng } from './geo.js';
import { PW, PH, EYE_L } from './portrait.js';

const PAL0 = {
  floorA: { a: '#B98A5E', b: '#6A4E52', c: '#F2CC8F' },
  floorB: { a: '#A47452', b: '#5E4650', c: '#F2CC8F' },
  wall: { a: '#EAD9B6', b: '#8C7C8E', c: '#F2CC8F' },
  beam: { a: '#86593F', b: '#3D3346', c: '#D4A373' },
  brass: { a: '#D9A866', b: '#6B4E3D', c: '#FFE29A' },
  teal: { a: '#81B29A', b: '#3D5A5B', c: '#CDEBD9' },
  cloth: { a: '#E07A5F', b: '#7A3E48', c: '#F2CC8F' },
  leaf: { a: '#7FA65A', b: '#2F4D3F', c: '#D6E8A8' },
  glass: { a: '#D7E7E0', b: '#7C9AA0', c: '#FFFFFF' },
  paper: { a: '#F4E9D2', b: '#9E8D8A', c: '#FFFFFF' },
  dark: { a: '#4B3B47', b: '#241C26', c: '#81B29A' },
  roof: { a: '#B98F72', b: '#6E5560', c: '#F2CC8F' },
};
const PAL5 = { a: '#FAF3DD', b: '#1A1817', c: '#D62828' };

export const ATELIER = {
  easelZ: -1.3,
  paintCenter: new THREE.Vector3(0, 1.45, -1.25),
  portal: new THREE.Vector3(EYE_L.x, 1.45 + EYE_L.y, -1.248),
  table: new THREE.Vector3(1.0, 0.78, -0.45),
  jarsAt: new THREE.Vector3(-1.05, 0.92, -1.0),
  gramophone: new THREE.Vector3(-1.7, 0, 0.4),
  stool: new THREE.Vector3(-0.42, 0, -0.78),
};

export function buildAtelier(world, style, { gaps = 0 } = {}) {
  const D = world.decor;
  const sketch = style === 5;
  const P = (k) => world.mat(sketch ? 'paper5' : k, sketch ? { ...PAL5, pat: 1 } : { ...PAL0[k], side: THREE.DoubleSide });
  const OL = sketch; // 炭笔世界全部描边
  const r = rng(11);
  const skip = () => gaps > 0 && r() < gaps;

  // 地板：径向排列的木板
  const RAD = 4.6;
  for (let i = -15; i <= 15; i++) {
    const x = i * 0.3; const half = Math.sqrt(Math.max(0, RAD * RAD - x * x));
    if (half < 0.2) continue;
    if (sketch && skip()) continue;
    D.add(box(0.29, 0.06, half * 2), P(i % 2 ? 'floorA' : 'floorB'), M(x, -0.03, 0), false);
  }
  // 圆毯
  D.add(cyl(1.25, 1.25, 0.015, 40), P('cloth'), M(0, 0.008, -0.6), OL);
  D.add(cyl(0.95, 0.95, 0.017, 40), P('teal'), M(0, 0.009, -0.6), false);

  // 墙：28 段，西侧三段为窗
  const NW = 28;
  for (let i = 0; i < NW; i++) {
    const a = (i / NW) * Math.PI * 2;
    const x = Math.cos(a) * RAD, z = Math.sin(a) * RAD;
    const segW = (2 * Math.PI * RAD) / NW + 0.02;
    const ry = -a + Math.PI / 2;
    const isWindow = (i >= 13 && i <= 15);
    if (sketch && skip()) continue;
    if (isWindow) {
      D.add(box(segW, 0.85, 0.16), P('wall'), M(x, 0.425, z, 0, ry, 0), OL);
      D.add(box(segW, 0.32, 0.16), P('wall'), M(x, 2.24, z, 0, ry, 0), OL);
      D.add(box(segW, 0.06, 0.3), P('beam'), M(x * 0.99, 0.88, z * 0.99, 0, ry, 0), OL);
      D.add(box(0.07, 1.3, 0.1), P('beam'), M(x, 1.5, z, 0, ry, 0), OL);
    } else {
      D.add(box(segW, 2.4, 0.16), P('wall'), M(x, 1.2, z, 0, ry, 0), OL && i % 2 === 0);
    }
    // 墙柱
    if (i % 2 === 0) { const a2 = a + Math.PI / NW; D.add(box(0.16, 2.45, 0.22), P('beam'), M(Math.cos(a2) * (RAD - 0.05), 1.22, Math.sin(a2) * (RAD - 0.05), 0, -a2 + Math.PI / 2, 0), OL); }
  }
  // 墙顶圈梁
  D.add(torus(RAD - 0.05, 0.09, 6, 56), P('beam'), M(0, 2.42, 0, Math.PI / 2, 0, 0), OL);

  // 屋顶：圆锥，留出西侧天窗
  if (!sketch) {
    const roofA = new THREE.ConeGeometry(RAD + 0.25, 3.0, 28, 1, true, Math.PI * 1.5 + 0.28, Math.PI * 2 - 0.56);
    D.add(roofA, P('roof'), M(0, 3.9, 0));
  }
  // 椽子
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    if (sketch && skip()) continue;
    const len = Math.hypot(RAD, 3.0);
    const m = new THREE.Matrix4().makeTranslation(Math.cos(a) * RAD / 2, 3.9, Math.sin(a) * RAD / 2);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-Math.cos(a) * RAD, 3.0, -Math.sin(a) * RAD).normalize());
    m.multiply(new THREE.Matrix4().makeRotationFromQuaternion(q));
    D.add(box(0.12, len, 0.14), P('beam'), m, OL);
  }

  // ---------- 画架 ----------
  const ez = ATELIER.easelZ;
  D.add(box(0.05, 2.0, 0.05), P('beam'), M(-0.38, 0.98, ez + 0.06, 0.08, 0, 0.12), OL);
  D.add(box(0.05, 2.0, 0.05), P('beam'), M(0.38, 0.98, ez + 0.06, 0.08, 0, -0.12), OL);
  D.add(box(0.05, 2.0, 0.05), P('beam'), M(0, 0.95, ez - 0.45, -0.3, 0, 0), OL);
  D.add(box(1.0, 0.05, 0.12), P('beam'), M(0, 0.82, ez + 0.08), OL);           // 托盘
  D.add(box(0.36, 0.04, 0.06), P('beam'), M(0, 2.08, ez + 0.03), OL);           // 夹顶
  D.add(box(PW + 0.06, PH + 0.06, 0.03), P('beam'), M(0, 1.45, ez + 0.035), OL); // 画框背板
  // 托盘上的调色板与画笔
  D.add(cyl(0.12, 0.12, 0.012, 16), P('paper'), M(-0.25, 0.85, ez + 0.1, 0, 0, 0, 1, 1, 0.7), OL);
  for (let i = 0; i < 4; i++) D.add(cyl(0.006, 0.004, 0.24, 5), P('beam'), M(0.15 + i * 0.05, 0.86, ez + 0.1, 0, 0, Math.PI / 2 + i * 0.1), false);

  // ---------- 桌子（右侧） ----------
  const T = ATELIER.table;
  D.add(box(1.1, 0.05, 0.66), P('beam'), M(T.x, T.y - 0.025, T.z), OL);
  for (const [dx, dz] of [[-0.5, -0.28], [0.5, -0.28], [-0.5, 0.28], [0.5, 0.28]]) D.add(box(0.05, T.y - 0.05, 0.05), P('beam'), M(T.x + dx, (T.y - 0.05) / 2, T.z + dz), OL);
  // 书堆
  D.add(box(0.26, 0.05, 0.19), P('cloth'), M(T.x + 0.32, T.y + 0.025, T.z + 0.18, 0, 0.2, 0), OL);
  D.add(box(0.24, 0.04, 0.18), P('teal'), M(T.x + 0.33, T.y + 0.07, T.z + 0.18, 0, -0.1, 0), OL);
  D.add(box(0.22, 0.035, 0.17), P('paper'), M(T.x + 0.31, T.y + 0.11, T.z + 0.18, 0, 0.35, 0), OL);
  // 笔筒
  D.add(cyl(0.05, 0.045, 0.13, 10), P('teal'), M(T.x - 0.38, T.y + 0.065, T.z + 0.2), OL);
  for (let i = 0; i < 5; i++) D.add(cyl(0.005, 0.004, 0.3, 5), P('beam'), M(T.x - 0.38 + (i - 2) * 0.012, T.y + 0.2, T.z + 0.2, (i - 2) * 0.08, 0, (i - 2) * 0.06), false);
  // 茶杯
  D.add(cyl(0.035, 0.028, 0.06, 10), P('paper'), M(T.x - 0.15, T.y + 0.03, T.z + 0.22), OL);

  // ---------- 颜料柜与六只颜料罐（左侧） ----------
  const J = ATELIER.jarsAt;
  D.add(box(0.7, J.y - 0.02, 0.38), P('beam'), M(J.x, (J.y - 0.02) / 2, J.z), OL);
  D.add(box(0.6, 0.02, 0.3), P('dark'), M(J.x, J.y - 0.3, J.z + 0.181), false);
  const jars = [];
  for (let i = 0; i < 6; i++) {
    const x = J.x - 0.27 + i * 0.108;
    D.add(lathe([[0, 0], [0.04, 0], [0.042, 0.02], [0.04, 0.11], [0.03, 0.125], [0.032, 0.14], [0, 0.14]], 10), P('glass'), M(x, J.y, J.z), OL);
    jars.push(new THREE.Vector3(x, J.y, J.z));
  }

  // ---------- 留声机 ----------
  const G = ATELIER.gramophone;
  D.add(box(0.5, 0.65, 0.42), P('beam'), M(G.x, 0.325, G.z, 0, 0.6, 0), OL);
  D.add(box(0.36, 0.2, 0.36), P('dark'), M(G.x, 0.75, G.z, 0, 0.6, 0), OL);
  D.add(cyl(0.15, 0.15, 0.01, 20), P('dark'), M(G.x, 0.86, G.z), false);
  const horn = lathe([[0.012, 0], [0.02, 0.12], [0.05, 0.3], [0.13, 0.44], [0.26, 0.52]], 16);
  D.add(horn, P('brass'), M(G.x + 0.08, 0.88, G.z - 0.05, -0.9, 0.6, 0), OL);

  // ---------- 凳子 ----------
  const S = ATELIER.stool;
  D.add(cyl(0.18, 0.18, 0.05, 14), P('beam'), M(S.x, 0.5, S.z), OL);
  for (let i = 0; i < 3; i++) { const a = i * 2.09; D.add(box(0.035, 0.5, 0.035), P('beam'), M(S.x + Math.cos(a) * 0.12, 0.25, S.z + Math.sin(a) * 0.12, Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12), OL); }

  // ---------- 靠墙的画布堆、盆栽、挂着的草药 ----------
  for (let i = 0; i < 4; i++) {
    const a = 0.55 + i * 0.12;
    D.add(box(0.7 - i * 0.08, 0.9 - i * 0.1, 0.03), P(i % 2 ? 'paper' : 'teal'), M(Math.cos(a) * 4.3, 0.45 - i * 0.05, Math.sin(a) * 4.3, -0.18, -a + Math.PI / 2, 0), OL);
  }
  for (const [px, pz, s] of [[-3.6, -1.6, 1], [-3.8, 1.3, 0.8], [2.4, -3.3, 0.9]]) {
    D.add(cyl(0.2 * s, 0.15 * s, 0.32 * s, 10), P('cloth'), M(px, 0.16 * s, pz), OL);
    for (let k = 0; k < 7; k++) { const a = k * 0.9; D.add(cone(0.09 * s, 0.6 * s, 4), P('leaf'), M(px + Math.cos(a) * 0.08 * s, 0.55 * s, pz + Math.sin(a) * 0.08 * s, Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5), OL); }
  }
  for (let i = 0; i < 6; i++) {
    const a = -0.4 + i * 0.25;
    const x = Math.cos(a) * 3.2, z = Math.sin(a) * 3.2;
    D.add(cone(0.06, 0.35, 5), P('leaf'), M(x, 2.6, z, Math.PI, 0, 0), false);
  }
  D.add(cyl(0.005, 0.005, 6.5, 4), P('beam'), M(3.1, 2.75, 0.4, Math.PI / 2, 0.35, 0), false);

  return { jars };
}
