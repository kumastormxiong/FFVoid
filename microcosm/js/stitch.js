// 跨层级视错觉缝合：第 4 界巨型圆环缺了一段，第 5 界里那道炭笔拱正是它“透视下”的缺口。
// 拱的形状由逆投影直接算出：在缩放 S* 下，从落脚眼位 E 看过去，拱与缺口完全重合。
import * as THREE from 'three';
import { K, E } from './styles.js';

export const P4 = new THREE.Vector3(0, 1.45, -1.25);   // 第 4 界奇点画框（传送门）
export const F_STAR = 0.36;                            // 设计中的缝合缩放进度
export const RING = { center: new THREE.Vector3(0, -6.0, -15), radius: 5.9, gapA: Math.PI / 2 - 0.33, gapB: Math.PI / 2 + 0.33 };

export function ringPoint(a, out = new THREE.Vector3()) {
  return out.set(RING.center.x + Math.cos(a) * RING.radius, RING.center.y + Math.sin(a) * RING.radius, RING.center.z);
}

// 第 4 界局部点 G → 第 5 界局部点 B（使两者在 S* 下从 E 看去重合）
export function inverseProject(G, f = F_STAR, eye = E) {
  const S = Math.pow(K, f);
  const Q = P4.clone().multiplyScalar(K).sub(eye).divideScalar(K - 1);
  const Gg = Q.clone().multiplyScalar(1 - S).addScaledVector(G, S);
  const bc = Q.clone().multiplyScalar(1 - S).addScaledVector(P4, S);
  const cs = S / K;
  const posC = bc.clone().addScaledVector(E, -cs);
  // 在视线上取与气泡中心同深度的点
  const dir = Gg.clone().sub(eye); const lenG = dir.length(); dir.normalize();
  const depth = bc.clone().sub(eye).dot(dir) + 0.18;
  const g = eye.clone().addScaledVector(dir, Math.min(depth, lenG));
  return g.sub(posC).divideScalar(cs);
}

export function archPoints(n = 24) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const a = RING.gapA + (RING.gapB - RING.gapA) * (i / n); pts.push(inverseProject(ringPoint(a))); }
  return pts;
}
