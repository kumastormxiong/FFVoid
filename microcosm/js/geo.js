// 程序化几何工具：静态装饰按材质合并（每个世界只有少量 draw call，保证 Quest 2 帧率）
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from '../vendor/BufferGeometryUtils.js';

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();

export function M(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  _e.set(rx, ry, rz, 'YXZ'); _q.setFromEuler(_e); _p.set(x, y, z); _s.set(sx, sy, sz);
  return new THREE.Matrix4().compose(_p, _q, _s);
}

// 只保留 position + normal，转为非索引，便于合并
export function prep(geo, matrix) {
  let g = geo.index ? geo.toNonIndexed() : geo.clone();
  for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'aFoam') g.deleteAttribute(k);
  if (!g.attributes.normal) g.computeVertexNormals();
  if (matrix) g.applyMatrix4(matrix);
  return g;
}

// 内描边壳：焊接顶点后求平滑法线，沿法线外扩
export function hullGeo(geo, matrix) {
  let g = geo.clone();
  for (const k of Object.keys(g.attributes)) if (k !== 'position') g.deleteAttribute(k);
  g = mergeVertices(g, 1e-3);
  g.computeVertexNormals();
  if (matrix) g.applyMatrix4(matrix);
  if (!g.index) { const n = g.attributes.position.count; const idx = []; for (let i = 0; i < n; i++) idx.push(i); g.setIndex(idx); }
  return g;
}

export class Decor {
  constructor() { this.buckets = new Map(); this.hulls = []; }
  add(geo, mat, matrix, outline = false) {
    if (!this.buckets.has(mat)) this.buckets.set(mat, []);
    this.buckets.get(mat).push(prep(geo, matrix));
    if (outline) this.hulls.push(hullGeo(geo, matrix));
    return this;
  }
  build(parent, hullMaterial) {
    const meshes = [];
    for (const [mat, list] of this.buckets) {
      const merged = mergeGeometries(list, false);
      const mesh = new THREE.Mesh(merged, mat);
      mesh.matrixAutoUpdate = false; mesh.updateMatrix();
      parent.add(mesh); meshes.push(mesh);
    }
    if (this.hulls.length && hullMaterial) {
      const merged = mergeGeometries(this.hulls, false);
      const mesh = new THREE.Mesh(merged, hullMaterial);
      mesh.matrixAutoUpdate = false; mesh.updateMatrix();
      parent.add(mesh); meshes.push(mesh);
    }
    this.buckets.clear(); this.hulls = [];
    return meshes;
  }
}

// 单个可动物体：可选描边壳作为子物体
export function mesh(geo, mat, hullMaterial = null) {
  const m = new THREE.Mesh(geo, mat);
  if (hullMaterial) { const h = new THREE.Mesh(hullGeo(geo), hullMaterial); m.add(h); m.userData.hull = h; }
  return m;
}

// 多个几何体合成一个（同材质）
export function combine(parts) { return mergeGeometries(parts.map(([g, m]) => prep(g, m)), false); }

// ---------------- 常用形体 ----------------
export const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
export const cyl = (rt, rb, h, seg = 12, open = false) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open);
export const cone = (r, h, seg = 12) => new THREE.ConeGeometry(r, h, seg);
export const sph = (r, detail = 1) => new THREE.IcosahedronGeometry(r, detail);
export const ball = (r, w = 16, h = 12) => new THREE.SphereGeometry(r, w, h);
export const torus = (r, t, rs = 8, ts = 32, arc = Math.PI * 2) => new THREE.TorusGeometry(r, t, rs, ts, arc);
export const oct = (r) => new THREE.OctahedronGeometry(r, 0);
export const tet = (r) => new THREE.TetrahedronGeometry(r, 0);

export function lathe(points, seg = 16) { return new THREE.LatheGeometry(points.map(([x, y]) => new THREE.Vector2(x, y)), seg); }

// 齿轮
export function gear(r, teeth = 12, depth = 0.06, toothH = 0.18, hole = 0.3) {
  const s = new THREE.Shape();
  const n = teeth * 4;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = i % 4; const rr = (k === 1 || k === 2) ? r : r * (1 - toothH);
    const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
    if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
  }
  if (hole > 0) { const h = new THREE.Path(); h.absarc(0, 0, r * hole, 0, Math.PI * 2, true); s.holes.push(h); }
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 6 });
  g.translate(0, 0, -depth / 2);
  return g;
}

// 带轮廓的折线挤出（用于钥匙、印章等）
export function extrudeShape(pts, depth) {
  const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
  g.translate(0, 0, -depth / 2);
  return g;
}

// 参数曲面
export function parametric(fn, us, vs) {
  const pos = [], idx = [];
  const v3 = new THREE.Vector3();
  for (let j = 0; j <= vs; j++) for (let i = 0; i <= us; i++) { fn(i / us, j / vs, v3); pos.push(v3.x, v3.y, v3.z); }
  for (let j = 0; j < vs; j++) for (let i = 0; i < us; i++) {
    const a = j * (us + 1) + i, b = a + 1, c = a + us + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// 三角面直接构造（折纸）
export function tris(list) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(list.flat(), 3));
  g.computeVertexNormals();
  return g;
}

// 千纸鹤：几片折面拼成
export function craneGeo(s = 1) {
  const P = (x, y, z) => [x * s, y * s, z * s];
  const t = [];
  const add = (a, b, c) => { t.push(a, b, c); t.push(a, c, b); };
  // 身体（菱形）
  add(P(0, 0.05, 0.25), P(0.06, 0, 0), P(0, -0.06, 0));
  add(P(0, 0.05, 0.25), P(-0.06, 0, 0), P(0, -0.06, 0));
  add(P(0, 0.05, -0.2), P(0.06, 0, 0), P(0, -0.06, 0));
  add(P(0, 0.05, -0.2), P(-0.06, 0, 0), P(0, -0.06, 0));
  // 翅膀
  add(P(0.04, 0.02, 0.08), P(0.04, 0.02, -0.1), P(0.42, 0.16, -0.02));
  add(P(-0.04, 0.02, 0.08), P(-0.04, 0.02, -0.1), P(-0.42, 0.16, -0.02));
  // 颈与头
  add(P(0, 0.0, 0.18), P(0.015, 0.0, 0.12), P(0, 0.22, 0.36));
  add(P(0, 0.22, 0.36), P(0.01, 0.2, 0.36), P(0, 0.18, 0.46));
  // 尾
  add(P(0, 0.0, -0.14), P(0.015, 0.0, -0.1), P(0, 0.2, -0.36));
  return tris(t);
}

// 折纸狐狸（蜷睡/站立两种姿态由外部动画组合）
export function foxParts(s = 1) {
  const body = new THREE.OctahedronGeometry(0.3 * s, 0); body.scale(1.5, 0.75, 0.8);
  const head = new THREE.ConeGeometry(0.16 * s, 0.34 * s, 4); head.rotateZ(-Math.PI / 2); head.rotateX(Math.PI / 4);
  const ear = new THREE.ConeGeometry(0.06 * s, 0.14 * s, 3);
  const tail = new THREE.ConeGeometry(0.13 * s, 0.6 * s, 4); tail.rotateZ(Math.PI / 2);
  const leg = new THREE.ConeGeometry(0.05 * s, 0.24 * s, 3); leg.rotateX(Math.PI);
  return { body, head, ear, tail, leg };
}

// 带锯齿顶边的环（剪纸山峦）
export function ridgeRing(radius, base, heightFn, seg = 96) {
  const pos = [];
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
    const h0 = heightFn(a0), h1 = heightFn(a1);
    const x0 = Math.cos(a0) * radius, z0 = Math.sin(a0) * radius, x1 = Math.cos(a1) * radius, z1 = Math.sin(a1) * radius;
    pos.push(x0, base, z0, x1, base, z1, x1, h1, z1);
    pos.push(x0, base, z0, x1, h1, z1, x0, h0, z0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
