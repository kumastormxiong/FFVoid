// 第 4 界 · 珍珠包豪斯晶格（包豪斯几何 × 荧光丝网印刷）
import * as THREE from 'three';
import { World } from '../world.js';
import { M, box, cyl, cone, sph, ball, torus, oct, parametric, combine, rng, smooth, V3 } from '../geo.js';
import { glowMat, styleMat } from '../styles.js';
import { P4, RING, ringPoint, archPoints } from '../stitch.js';
import { LABELS } from '../text.js';

const PAL = {
  floor: { a: '#160033', b: '#07000f', c: '#FF007F', grid: true },
  mag: { a: '#FF2A8F', b: '#3a0030', c: '#00F5D4' },
  cyan: { a: '#22F2D6', b: '#06323a', c: '#FF007F' },
  yel: { a: '#FFD60A', b: '#4a2a00', c: '#FF007F' },
  white: { a: '#F8F7FF', b: '#2a1450', c: '#00F5D4' },
  black: { a: '#1b0b33', b: '#05000c', c: '#FFD60A' },
};

export function buildW4(ctx) {
  const w = new World(4, ctx, {
    style: 4, portal: P4, wipe: '#FAF3DD', glass: '#ffffff',
    fog: { fog: '#10002B', fogNear: 18, fogFar: 60, fogAmt: 0.5 }, light: [0.3, 0.8, 0.5],
    look: { shade: '#a184cc', sun: '#ffffff', low: '#3a0c5a', rim: '#3a0c48', hg: [-4, 0.4, -0.05, 0.25] },
  });
  w.showGlass = () => true;
  const D = w.decor; const P = (k) => w.mat(k, PAL[k]);
  const L = (k) => LABELS[k][ctx.lang()];
  const r = rng(55);

  // ---------- 平台 ----------
  D.add(cyl(3.2, 3.2, 0.2, 48), P('floor'), M(0, -0.1, 0));
  D.add(cone(3.2, 1.6, 6), P('black'), M(0, -1.0, 0, Math.PI, 0, 0));
  const edge = new THREE.Mesh(torus(3.2, 0.025, 4, 64), glowMat('#FF007F', 1, { soft: false })); edge.rotation.x = Math.PI / 2; w.group.add(edge);

  // ---------- 奇点画框 ----------
  const fr = combine([[box(0.62, 0.06, 0.06), M(0, 0.28, 0)], [box(0.62, 0.06, 0.06), M(0, -0.28, 0)], [box(0.06, 0.62, 0.06), M(-0.28, 0, 0)], [box(0.06, 0.62, 0.06), M(0.28, 0, 0)]]);
  const frame = new THREE.Mesh(fr, P('black')); frame.position.copy(P4); w.group.add(frame);
  const frameGlow = new THREE.Mesh(combine([[box(0.5, 0.012, 0.012), M(0, 0.25, 0.035)], [box(0.5, 0.012, 0.012), M(0, -0.25, 0.035)], [box(0.012, 0.5, 0.012), M(-0.25, 0, 0.035)], [box(0.012, 0.5, 0.012), M(0.25, 0, 0.035)]]), glowMat('#FFD60A', 0.5, { soft: false }));
  frameGlow.position.copy(P4); w.group.add(frameGlow);
  D.add(cyl(0.05, 0.08, P4.y - 0.31, 6), P('black'), M(0, (P4.y - 0.31) / 2, P4.z));
  const frameFill = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), glowMat('#ffffff', 0, { soft: false })); frameFill.position.copy(P4).add(V3(0, 0, -0.04)); w.group.add(frameFill);

  // ---------- 发射塔 + 棱镜 ----------
  const beamMat = (c) => glowMat(c, 0.9, { soft: true });
  const beamGeo = new THREE.CylinderGeometry(0.012, 0.012, 1, 6, 1, true); beamGeo.translate(0, 0.5, 0); beamGeo.rotateX(Math.PI / 2);
  const setBeam = (m, a, b) => { m.position.copy(a); m.lookAt(b); m.scale.set(1, 1, a.distanceTo(b)); };
  const target = P4.clone();
  const prisms = [];
  const defs = [
    { color: '#00F5D4', key: 'cyan', psi: Math.PI / 6, emit: V3(-3.4, 1.45, 1.6), start: -3 },
    { color: '#FF007F', key: 'mag', psi: Math.PI - Math.PI / 6, emit: V3(3.4, 1.45, 1.6), start: 4 },
  ];
  for (const d of defs) {
    const dir = V3(Math.cos(d.psi), 0, -Math.sin(d.psi));
    const pos = P4.clone().addScaledVector(dir, -1.9); pos.y = P4.y;
    // 发射塔
    D.add(cyl(0.08, 0.14, d.emit.y, 4), P('black'), M(d.emit.x, d.emit.y / 2, d.emit.z, 0, Math.PI / 4, 0));
    const tip = new THREE.Mesh(oct(0.12), P(d.key)); tip.position.copy(d.emit); w.group.add(tip);
    const tipG = new THREE.Mesh(ball(0.2, 10, 8), glowMat(d.color, 0.5)); tipG.position.copy(d.emit); w.group.add(tipG);
    // 棱镜底座
    D.add(cyl(0.12, 0.2, pos.y - 0.25, 6), P('white'), M(pos.x, (pos.y - 0.25) / 2, pos.z));
    const prism = new THREE.Group(); prism.position.copy(pos); w.group.add(prism);
    const pm = new THREE.Mesh(oct(0.16), P(d.key)); pm.scale.set(1.3, 1, 0.8); prism.add(pm);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(pm.geometry), new THREE.LineBasicMaterial({ color: '#ffffff' })); pm.add(edges);
    const arrow = new THREE.Mesh(cone(0.04, 0.12, 4), P('white')); arrow.rotation.z = -Math.PI / 2; arrow.position.x = 0.26; prism.add(arrow);
    const step = Math.PI / 6;
    const st = { d, prism, pos, yaw: d.psi + d.start * step, shown: d.psi + d.start * step, ok: false, dir };
    prism.rotation.y = st.shown;
    st.inBeam = new THREE.Mesh(beamGeo, beamMat(d.color)); setBeam(st.inBeam, d.emit, pos); w.group.add(st.inBeam);
    st.outBeam = new THREE.Mesh(beamGeo, beamMat(d.color)); w.group.add(st.outBeam);
    ctx.interact.addTouch({ id: 'prism_' + d.key, obj: prism, radius: 0.32, label: () => L('prism'), active: () => !st.ok,
      onTouch: () => { st.yaw += step; ctx.audio.click(); ctx.story.say('prism_hint', { once: true }); } });
    prisms.push(st);
  }

  // ---------- 缺了一段的巨型圆环 + 黄色发射器 ----------
  const ringArc = new THREE.TorusGeometry(RING.radius, 0.14, 8, 96, Math.PI * 2 - (RING.gapB - RING.gapA));
  const ringMesh = new THREE.Mesh(ringArc, P('yel')); ringMesh.position.copy(RING.center); ringMesh.rotation.z = RING.gapB; w.group.add(ringMesh);
  const ringGlow = new THREE.Mesh(new THREE.TorusGeometry(RING.radius, 0.3, 6, 96, Math.PI * 2 - (RING.gapB - RING.gapA)), glowMat('#FFD60A', 0.15)); ringGlow.position.copy(RING.center); ringGlow.rotation.z = RING.gapB; w.group.add(ringGlow);
  // 缺口两端的霓虹立柱
  const gapEnds = [ringPoint(RING.gapA), ringPoint(RING.gapB), ringPoint((RING.gapA + RING.gapB) / 2)];
  const endMarks = gapEnds.slice(0, 2).map(p => { const m = new THREE.Mesh(oct(0.3), P('mag')); m.position.copy(p); w.group.add(m); return m; });
  const endGlows = gapEnds.slice(0, 2).map(p => { const m = new THREE.Mesh(ball(0.6, 10, 8), glowMat('#FF007F', 0.4)); m.position.copy(p); w.group.add(m); return m; });
  // 缝合后补上的那段（炭笔素描风格，跨界材质）
  const sketchMat = styleMat(5, w.uniforms, { a: '#FAF3DD', b: '#1A1817', c: '#D62828', fog: false });
  const fill = new THREE.Mesh(new THREE.TorusGeometry(RING.radius, 0.16, 8, 24, RING.gapB - RING.gapA), sketchMat);
  fill.position.copy(RING.center); fill.rotation.z = RING.gapA; fill.visible = false; w.group.add(fill);
  // 黄色光：从环心射向画框
  const yBeam = new THREE.Mesh(beamGeo, beamMat('#FFD60A')); setBeam(yBeam, RING.center.clone().add(V3(0, 0, 0)), target); yBeam.visible = false; w.group.add(yBeam);
  const yCore = new THREE.Mesh(oct(0.8), P('yel')); yCore.position.copy(RING.center); w.group.add(yCore);
  // 环心发射器（缝合前黯淡）
  const yGlow = new THREE.Mesh(ball(1.4, 12, 8), glowMat('#FFD60A', 0.12)); yGlow.position.copy(RING.center); w.group.add(yGlow);

  // ---------- 包豪斯漂浮几何 ----------
  const shapes = [];
  const kinds = ['mag', 'cyan', 'yel', 'white'];
  for (let i = 0; i < 22; i++) {
    const a = r() * 6.28, d = 7 + r() * 16, y = -4 + r() * 14;
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (z < -8 && Math.abs(x) < 9 && y < 4) continue;
    const k = kinds[i % 4]; const s = 0.6 + r() * 2;
    const t = i % 5;
    const g = t === 0 ? box(s, s, s) : t === 1 ? ball(s * 0.6, 20, 14) : t === 2 ? cyl(s * 0.7, s * 0.7, s * 0.25, 3) : t === 3 ? torus(s * 0.7, s * 0.15, 8, 32) : cyl(s * 0.5, s * 0.5, s * 1.4, 24);
    const m = new THREE.Mesh(g, P(k)); m.position.set(x, y, z); m.rotation.set(r() * 3, r() * 3, r() * 3); w.group.add(m);
    if (t === 0 || t === 2) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(g), new THREE.LineBasicMaterial({ color: k === 'white' ? '#FF007F' : '#ffffff' })));
    shapes.push({ m, sp: (r() - 0.5) * 0.3 });
  }
  // 莫比乌斯环轨道
  const mob = parametric((u, v, out) => { const a = u * Math.PI * 2, t = (v - 0.5) * 1.2; out.set((4 + t * Math.cos(a / 2)) * Math.cos(a), t * Math.sin(a / 2), (4 + t * Math.cos(a / 2)) * Math.sin(a)); }, 96, 6);
  const mobM = new THREE.Mesh(mob, w.mat('mob', { ...PAL.cyan, side: THREE.DoubleSide })); mobM.position.set(11, 6, 6); mobM.rotation.x = 0.6; w.group.add(mobM);
  // 黄金螺线线框
  { const pts = []; for (let i = 0; i < 300; i++) { const a = i * 0.05; const rr = 0.2 * Math.pow(1.17, a); pts.push(V3(Math.cos(a) * rr, Math.sin(a) * rr, 0)); }
    const sp = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#FFD60A' })); sp.position.set(-12, 5, -6); sp.rotation.y = 0.9; w.group.add(sp); shapes.push({ m: sp, sp: 0.05 }); }
  // 平台上的几何雕塑
  D.add(box(0.5, 0.5, 0.5), P('mag'), M(-2.2, 0.25, 1.4, 0, 0.4, 0));
  D.add(ball(0.32, 20, 14), P('cyan'), M(-2.2, 0.82, 1.4));
  D.add(cyl(0.4, 0.4, 0.12, 3), P('yel'), M(2.3, 0.06, 1.5, 0, 0.3, 0));
  D.add(cyl(0.18, 0.18, 1.1, 24), P('white'), M(2.3, 0.6, 1.5));

  w.animators.push((dt, t) => { shapes.forEach(s => { s.m.rotation.y += s.sp * dt; s.m.rotation.x += s.sp * dt * 0.5; }); mobM.rotation.y = t * 0.08; });

  // ---------- 逻辑 ----------
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3();
  let stitched = false, stitchHold = 0, stitchAnim = -1, openT = -1, align = 0;
  const archLocal = archPoints(24);
  const archSample = [archLocal[0], archLocal[24], archLocal[12]];
  w.update = (dt, t) => {
    const S = ctx.story;
    // 棱镜
    let lit = 0;
    for (const st of prisms) {
      st.shown += (st.yaw - st.shown) * Math.min(1, dt * 8);
      st.prism.rotation.y = st.shown;
      const dyaw = Math.atan2(Math.sin(st.yaw - st.d.psi), Math.cos(st.yaw - st.d.psi));
      const ok = Math.abs(dyaw) < 0.05;
      if (ok && !st.ok) { st.ok = true; S.set('prism_' + st.d.key); ctx.audio.chime(4); }
      const dirNow = V3(Math.cos(st.shown), 0, -Math.sin(st.shown));
      if (st.ok) setBeam(st.outBeam, st.pos, target); else setBeam(st.outBeam, st.pos, st.pos.clone().addScaledVector(dirNow, 9));
      if (st.ok) lit++;
    }
    if (lit === 2 && !S.get('twoBeams')) { S.set('twoBeams'); S.say('two_beams'); S.setGoal('stitch', ['stitch_hint1', 'stitch_hint2', 'stitch_hint2']); }
    // 视错觉缝合检测：第 5 界里的拱 与 本界圆环缺口 在当前视点下是否重合
    if (!stitched && ctx.engine.cur === w && !ctx.engine.inside) {
      const w5 = ctx.worlds[5];
      const head = ctx.head;
      let maxErr = 0;
      for (let i = 0; i < 3; i++) {
        w.toGlobal(gapEnds[i], _a).sub(head).normalize();
        w5.toGlobal(archSample[i], _b).sub(head).normalize();
        maxErr = Math.max(maxErr, _a.angleTo(_b));
      }
      align = Math.max(0, 1 - maxErr / 0.3);
      const glow = 0.15 + align * align * 0.85;
      endGlows.forEach(g => g.material.uniforms.uO.value = 0.25 + align * align * 0.9);
      if (w5.arch) w5.arch.setGlow(align);
      if (maxErr < 0.06) { stitchHold += dt; if (stitchHold > 0.5) doStitch(); } else stitchHold = 0;
      ringGlow.material.uniforms.uO.value = glow * 0.4;
    }
    if (stitchAnim >= 0) {
      stitchAnim += dt;
      fill.visible = true; fill.scale.setScalar(1);
      const k = smooth(0, 1.5, stitchAnim);
      yGlow.material.uniforms.uO.value = 0.12 + k * 0.5;
      ringGlow.material.uniforms.uO.value = 0.15 + k * 0.5;
      if (stitchAnim > 1.5) yBeam.visible = true;
      if (stitchAnim > 2) stitchAnim = -1;
    }
    yCore.rotation.y = t * 0.5; yCore.rotation.x = t * 0.3;
    // 三光汇聚 → 画框开启
    if (!w.open && lit === 2 && S.get('stitched') && openT < 0) openT = 0;
    if (openT >= 0) {
      openT += dt;
      frameFill.material.uniforms.uO.value = Math.sin(Math.min(1, openT / 1.5) * Math.PI) * 1.2;
      frameGlow.material.uniforms.uO.value = 0.5 + smooth(0, 1.5, openT) * 1.0;
      if (openT > 1.5 && !w.open) { w.open = true; S.pigment(4); S.say('frame_open'); S.setGoal('enter4', []); }
      if (openT > 3) openT = -1;
    }
  };
  function doStitch() {
    stitched = true; ctx.story.set('stitched'); stitchAnim = 0;
    ctx.audio.swell(); ctx.audio.chime(5); ctx.story.say('stitched');
    endMarks.forEach(m => m.material = P('yel'));
  }

  w.restore = (f) => {
    for (const st of prisms) if (f['prism_' + st.d.key]) { st.yaw = st.shown = st.d.psi; st.ok = true; }
    if (f.stitched) { stitched = true; fill.visible = true; yBeam.visible = true; endMarks.forEach(m => m.material = P('yel')); yGlow.material.uniforms.uO.value = 0.6; }
    if (f.stitched && f.prism_cyan && f.prism_mag) { w.open = true; frameGlow.material.uniforms.uO.value = 1.5; }
  };
  w.onEnter = () => { ctx.story.say('w4_enter', { once: true }); if (!w.open) ctx.story.setGoal(ctx.story.get('twoBeams') ? 'stitch' : 'prisms', ctx.story.get('twoBeams') ? ['stitch_hint1', 'stitch_hint2'] : ['prism_hint', 'prism_hint']); };
  w.build();
  return w;
}
