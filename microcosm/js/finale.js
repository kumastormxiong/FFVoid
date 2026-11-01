// 终幕：六种渲染风格的生灵同时涌入暮光画室
import * as THREE from 'three';
import { styleMat, hullMat, glowMat } from './styles.js';
import { M, box, cyl, cone, sph, ball, torus, oct, gear, craneGeo, combine, rng, V3, smooth } from './geo.js';
import { ATELIER } from './atelier.js';

export function createFinale(ctx) {
  const w0 = ctx.worlds[0];
  const U = w0.uniforms;
  const g = new THREE.Group(); g.visible = false; w0.group.add(g);
  const r = rng(77);
  const mats = {
    petal: styleMat(0, U, { a: '#F6B8A8', b: '#C4677A', c: '#FFE8C2', fog: false }),
    petal2: styleMat(0, U, { a: '#F2CC8F', b: '#B07A4A', c: '#FFFFFF', fog: false }),
    gearB: styleMat(1, U, { a: '#EDB653', b: '#A26B3A', fog: false }),
    wingB: styleMat(1, U, { a: '#7FF0DE', b: '#3EA9A6', fog: false, side: THREE.DoubleSide }),
    crane: styleMat(2, U, { a: '#F6EFDD', b: '#C9BBA0', c: '#FFFFFF', facet: true, fog: false, side: THREE.DoubleSide }),
    craneR: styleMat(2, U, { a: '#EE7B5C', b: '#9E3F2E', c: '#FFD0A8', facet: true, fog: false, side: THREE.DoubleSide }),
    whale: styleMat(3, U, { a: '#C9B48E', b: '#2C3E5C', c: '#FFD166', fog: false }),
    bau1: styleMat(4, U, { a: '#FF2A8F', b: '#3a0030', c: '#00F5D4', fog: false }),
    bau2: styleMat(4, U, { a: '#22F2D6', b: '#06323a', c: '#FF007F', fog: false }),
    bau3: styleMat(4, U, { a: '#FFD60A', b: '#4a2a00', c: '#FF007F', fog: false }),
    char: styleMat(5, U, { a: '#FAF3DD', b: '#1A1817', c: '#D62828', fog: false }),
  };
  const ink = hullMat(U, '#2B2D42', 0.006);
  const inkC = hullMat(U, '#1A1817', 0.008, true);
  const beings = [];
  const add = (mesh, kind) => {
    const b = { mesh, kind, rad: 1.6 + r() * 2.2, h: 0.6 + r() * 2.6, sp: (0.25 + r() * 0.35) * (r() < 0.5 ? 1 : -1), ph: r() * 6.28, delay: r() * 6, bob: r() * 6 };
    mesh.visible = false; g.add(mesh); beings.push(b);
  };
  // 水粉花瓣
  for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(sph(1, 1), i % 2 ? mats.petal : mats.petal2); m.scale.set(0.05, 0.012, 0.08); add(m, 'petal'); }
  // 莫比斯发条鸟
  const wingGeo = (() => { const q = new THREE.BufferGeometry(); q.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0.22, 0.03, -0.05, 0, 0, -0.1], 3)); q.computeVertexNormals(); return q; })();
  for (let i = 0; i < 5; i++) {
    const bird = new THREE.Group(); const body = new THREE.Mesh(gear(0.07, 10, 0.03), mats.gearB); bird.add(body);
    const wl = new THREE.Mesh(wingGeo, mats.wingB), wr = wl.clone(); wr.scale.x = -1; bird.add(wl, wr); bird.userData.wings = [wl, wr];
    add(bird, 'bird');
  }
  // 折纸千纸鹤
  const cg = craneGeo(0.45);
  for (let i = 0; i < 8; i++) add(new THREE.Mesh(cg, i % 3 ? mats.crane : mats.craneR), 'crane');
  // 浮世绘小鲸
  for (let i = 0; i < 3; i++) {
    const wh = new THREE.Group(); const b = new THREE.Mesh(sph(1, 2), mats.whale); b.scale.set(0.12, 0.09, 0.32); wh.add(b);
    const t = new THREE.Mesh(combine([[sph(1, 1), M(-0.08, 0, 0, 0, 0, 0.3, 0.1, 0.02, 0.05)], [sph(1, 1), M(0.08, 0, 0, 0, 0, -0.3, 0.1, 0.02, 0.05)]]), mats.whale); t.position.z = -0.32; wh.add(t);
    add(wh, 'whale');
  }
  // 包豪斯几何
  for (let i = 0; i < 9; i++) { const k = i % 3; const geo = k === 0 ? box(0.12, 0.12, 0.12) : k === 1 ? cyl(0.09, 0.09, 0.04, 3) : ball(0.07, 16, 12); add(new THREE.Mesh(geo, [mats.bau1, mats.bau2, mats.bau3][i % 3]), 'bau'); }
  // 炭笔线条缎带
  for (let i = 0; i < 6; i++) {
    const pts = []; for (let k = 0; k < 6; k++) pts.push(V3(Math.sin(k * 1.1) * 0.25, k * 0.06, Math.cos(k * 0.9) * 0.15));
    const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.008, 4, false);
    const m = new THREE.Mesh(tube, mats.char); m.add(new THREE.Mesh(tube, inkC)); add(m, 'char');
  }
  const origin = ATELIER.paintCenter.clone().add(V3(0, 0.1, 0.05));
  let t0 = -1;
  return {
    start() { g.visible = true; t0 = 0; },
    get running() { return t0 >= 0; },
    update(dt, t) {
      if (t0 < 0) return;
      t0 += dt;
      for (const b of beings) {
        const k = smooth(b.delay * 0.5, b.delay * 0.5 + 3, t0);
        if (k <= 0) continue;
        b.mesh.visible = true;
        const a = b.ph + t * b.sp;
        const ring = V3(Math.cos(a) * b.rad, b.h + Math.sin(t * 0.8 + b.bob) * 0.15, Math.sin(a) * b.rad - 0.6);
        b.mesh.position.lerpVectors(origin, ring, k);
        const tangent = V3(-Math.sin(a) * Math.sign(b.sp), 0, Math.cos(a) * Math.sign(b.sp));
        b.mesh.lookAt(b.mesh.position.clone().add(tangent));
        if (b.kind === 'petal') b.mesh.rotateZ(t * 2 + b.ph);
        if (b.kind === 'bau') { b.mesh.rotateX(t + b.ph); b.mesh.rotateY(t * 0.7); }
        if (b.kind === 'bird') { const [wl, wr] = b.mesh.userData.wings; wl.rotation.z = Math.sin(t * 16 + b.ph) * 0.6; wr.rotation.z = -wl.rotation.z; }
        if (b.kind === 'crane') b.mesh.rotateZ(Math.sin(t * 3 + b.ph) * 0.2);
        b.mesh.scale.setScalar(b.kind === 'petal' ? 1 : Math.max(0.01, k));
        if (b.kind === 'petal') b.mesh.scale.set(0.05 * k, 0.012 * k, 0.08 * k);
      }
      w0.paintMat.uniforms.uGlow.value = 0.08 + Math.sin(t * 1.5) * 0.05;
    },
  };
}
