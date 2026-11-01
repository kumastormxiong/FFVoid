// 第 0 界 · 暮光画室（吉卜力厚涂水粉）
import * as THREE from 'three';
import { World } from '../world.js';
import { buildAtelier, ATELIER } from '../atelier.js';
import { drawPortrait, portraitMat, PW, PH } from '../portrait.js';
import { M, box, cyl, cone, sph, ball, torus, lathe, combine, rng, smooth } from '../geo.js';
import { glowMat, pointsMat, beamMat } from '../styles.js';
import { LABELS, PIGMENTS } from '../text.js';

export function buildW0(ctx) {
  const w = new World(0, ctx, {
    style: 0, portal: ATELIER.portal, wipe: '#72EFDD', glass: '#9ff5e8',
    fog: { fog: '#e9c39c', fogNear: 9, fogFar: 40, fogAmt: 0.3 }, light: [-0.75, 0.45, -0.35],
    look: { shade: '#b4a2c8', sun: '#fff1dc', low: '#9a8496', rim: '#5a3418', hg: [-0.2, 1.4, 0.0, 0.22] },
  });
  const { jars } = buildAtelier(w, 0);
  const L = (k) => LABELS[k][ctx.lang()];

  // 夕阳光束（从西窗斜射进来）
  const shaftMat = beamMat('#ffd49a', 0.2);
  w.animators.push((dt, t) => { shaftMat.uniforms.uTime.value = t; });
  for (let i = 0; i < 4; i++) {
    const g = new THREE.CylinderGeometry(0.35 + i * 0.05, 0.8, 7, 16, 1, true);
    const m = new THREE.Mesh(g, shaftMat);
    m.position.set(-1.6 + i * 0.1, 1.35 - i * 0.05, -0.2 + (i - 1.5) * 0.85);
    m.rotation.z = Math.PI / 2 + 0.3; m.rotation.y = 0.1 * (i - 1.5);
    w.group.add(m);
  }
  // 屋顶天窗落下的一束
  { const g = new THREE.CylinderGeometry(0.4, 0.9, 5, 16, 1, true); const m = new THREE.Mesh(g, shaftMat); m.position.set(-1.4, 2.6, 0.3); m.rotation.z = 0.55; w.group.add(m); }
  // 悬挂的纸灯（暖光）
  { const lamp = new THREE.Group(); lamp.position.set(0.6, 2.9, 0.4);
    lamp.add(new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 1.6, 4), w.mat('beam', { a: '#86593F', b: '#3D3346' })));
    lamp.children[0].position.y = 0.8;
    const shade = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 14), w.mat('lampshade', { a: '#FFE3B0', b: '#F2B36E', c: '#FFD08A', emit: 0.75, fog: false })); shade.scale.y = 0.85; lamp.add(shade);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), glowMat('#ffb468', 0.35)); lamp.add(halo);
    w.group.add(lamp); w.animators.push((dt, t) => { lamp.rotation.z = Math.sin(t * 0.6) * 0.03; }); }
  // 漂浮的金色尘埃
  {
    const n = 420, pos = new Float32Array(n * 3), seed = new Float32Array(n); const r = rng(3);
    for (let i = 0; i < n; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 3.8; pos[i * 3] = Math.cos(a) * d; pos[i * 3 + 1] = 0.3 + r() * 3; pos[i * 3 + 2] = Math.sin(a) * d; seed[i] = r(); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    const pm = pointsMat('#ffe2b0', 0.03); w.dust = new THREE.Points(g, pm); w.group.add(w.dust);
    w.animators.push((dt, t) => { pm.uniforms.uTime.value = t; });
  }

  // 墙上的四幅小画：预示后面的四个世界
  {
    const draws = [
      (g) => { const r = g.createRadialGradient(128, 128, 10, 128, 128, 128); r.addColorStop(0, '#f5c66b'); r.addColorStop(0.35, '#7fe9d9'); r.addColorStop(0.7, '#3f9fa6'); r.addColorStop(1, '#ff8a76'); g.fillStyle = r; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 160; i++) { const a = Math.random() * 6.28; g.strokeStyle = `rgba(255,255,255,${Math.random() * 0.25})`; g.beginPath(); g.moveTo(128 + Math.cos(a) * 34, 128 + Math.sin(a) * 34); g.lineTo(128 + Math.cos(a) * 125, 128 + Math.sin(a) * 125); g.stroke(); } g.fillStyle = '#141826'; g.beginPath(); g.arc(128, 128, 30, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(118, 118, 6, 0, 7); g.fill(); },
      (g) => { const l = g.createLinearGradient(0, 0, 0, 256); l.addColorStop(0, '#fbf3dc'); l.addColorStop(1, '#bfdcc4'); g.fillStyle = l; g.fillRect(0, 0, 256, 256); g.fillStyle = '#f0cd72'; g.beginPath(); g.arc(180, 70, 30, 0, 7); g.fill(); for (let i = 0; i < 6; i++) { g.fillStyle = ['#3fb3a1', '#71c2a4', '#2d7768'][i % 3]; const x = 20 + i * 42, h = 70 + (i % 3) * 30; g.beginPath(); g.moveTo(x, 256); g.lineTo(x + 22, 256 - h); g.lineTo(x + 44, 256); g.fill(); } g.fillStyle = '#ee7b5c'; g.beginPath(); g.moveTo(90, 110); g.lineTo(150, 95); g.lineTo(120, 125); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(100, 112); g.lineTo(130, 70); g.lineTo(125, 112); g.fill(); },
      (g) => { g.fillStyle = '#1d3557'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#f1faee'; g.beginPath(); g.arc(196, 56, 22, 0, 7); g.fill(); g.strokeStyle = '#f1faee'; g.lineWidth = 6; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(110 + k * 10, 200, 90 - k * 18, Math.PI * 1.05, Math.PI * 1.85); g.stroke(); } g.fillStyle = '#3c78ae'; g.fillRect(0, 205, 256, 51); g.strokeStyle = '#ffd166'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 205); for (let x = 0; x <= 256; x += 16) g.lineTo(x, 205 + Math.sin(x * 0.1) * 4); g.stroke(); },
      (g) => { g.fillStyle = '#10002b'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#ff2a8f'; g.beginPath(); g.arc(100, 110, 60, 0, 7); g.fill(); g.fillStyle = '#ffd60a'; g.beginPath(); g.arc(100, 110, 60, 0, Math.PI); g.fill(); g.fillStyle = '#22f2d6'; g.beginPath(); g.moveTo(150, 220); g.lineTo(230, 220); g.lineTo(190, 150); g.fill(); g.fillStyle = '#f8f7ff'; g.fillRect(30, 200, 90, 10); },
    ];
    const angles = [-0.9, -0.45, 0.45, 0.9].map(a => a - Math.PI / 2 + Math.PI);
    draws.forEach((fn, i) => {
      const cv = document.createElement('canvas'); cv.width = cv.height = 256; fn(cv.getContext('2d'));
      const tex = new THREE.CanvasTexture(cv);
      const a = [0.95, 1.35, 1.75, 2.15][i] + Math.PI;
      const x = Math.cos(a) * 4.395, z = Math.sin(a) * 4.395;
      const pic = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshBasicMaterial({ map: tex }));
      pic.position.set(x, 1.62, z); pic.lookAt(0, 1.62, 0); w.group.add(pic);
      w.decor.add(box(0.72, 0.72, 0.04), w.mat('beam'), new THREE.Matrix4().compose(new THREE.Vector3(Math.cos(a) * 4.44, 1.62, Math.sin(a) * 4.44), pic.quaternion.clone(), new THREE.Vector3(1, 1, 1)));
    });
  }

  // 画作
  const texG = drawPortrait('gouache');
  w.paintMat = portraitMat(texG);
  const painting = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), w.paintMat);
  painting.position.copy(ATELIER.paintCenter); w.group.add(painting);
  w.painting = painting;

  // 树脂封印
  const resinMat = w.mat('resin', { a: '#3a3036', b: '#151015', c: '#8a7a6a' });
  const resin = new THREE.Mesh(sph(0.045, 2), resinMat);
  resin.scale.set(1, 0.85, 0.45); resin.position.copy(ATELIER.portal).add(new THREE.Vector3(0, 0, 0.004));
  w.group.add(resin);
  const drips = [];
  for (let i = 0; i < 4; i++) { const d = new THREE.Mesh(cone(0.007, 0.03, 5), resinMat); d.rotation.x = Math.PI; d.position.set(ATELIER.portal.x - 0.03 + i * 0.02, ATELIER.portal.y - 0.04 - (i % 2) * 0.01, ATELIER.portal.z + 0.008); w.group.add(d); drips.push(d); }
  let melt = 0, melting = false;

  // 颜料罐里的颜色
  const fills = jars.map((p, i) => {
    const m = new THREE.Mesh(cyl(0.034, 0.034, 0.1, 10), w.mat('pig' + i, { a: PIGMENTS[i].c, b: PIGMENTS[i].c, c: PIGMENTS[i].c, emit: 0.35 }));
    m.position.set(p.x, p.y + 0.012, p.z); m.scale.y = 0.001; m.visible = false; w.group.add(m); return m;
  });
  w.animators.push((dt) => { ctx.story.pigments.forEach((on, i) => { if (on) { fills[i].visible = true; fills[i].scale.y = Math.min(1, fills[i].scale.y + dt * 0.8); fills[i].position.y = jars[i].y + 0.012 + fills[i].scale.y * 0.05; } }); });

  // ---------- 透镜 ----------
  const lensG = new THREE.Group();
  const brass = w.mat('brass');
  const lensRing = combine([[torus(0.032, 0.005, 6, 24), M(-0.04, 0, 0)], [torus(0.032, 0.005, 6, 24), M(0.04, 0, 0)], [box(0.02, 0.006, 0.006), M(0, 0.008, 0)]]);
  const lensMesh = new THREE.Mesh(lensRing, brass); lensG.add(lensMesh);
  const lensGlow = new THREE.Mesh(new THREE.CircleGeometry(0.03, 20), glowMat('#9ff5e8', 0.5, { soft: false }));
  const lensGlow2 = lensGlow.clone(); lensGlow.position.x = -0.04; lensGlow2.position.x = 0.04; lensG.add(lensGlow, lensGlow2);
  lensG.position.set(ATELIER.table.x - 0.2, ATELIER.table.y + 0.035, ATELIER.table.z - 0.05); lensG.rotation.x = -1.2;
  w.group.add(lensG);
  w.animators.push((dt, t) => { if (lensG.parent === w.group) lensG.position.y = ATELIER.table.y + 0.04 + Math.sin(t * 2) * 0.008; });
  ctx.interact.addItem({
    id: 'lens', obj: lensG, radius: 0.075, label: () => L('lens'),
    onGrab: () => { ctx.consume('lens'); equipLens(); },
  });
  function equipLens() {
    ctx.story.set('lens');
    ctx.engine.canZoom = true;
    ctx.audio.unlock();
    ctx.story.say(ctx.mode() === 'vr' ? 'lens_vr' : ctx.mode() === 'touch' ? 'lens_touch' : 'lens_pc');
    ctx.story.setGoal('ember', ['painting_sealed', 'ember_hint', 'too_small']);
    ctx.ui.toast(L('lens'), '#9ff5e8');
  }

  // ---------- 黄铜提灯 ----------
  const lantern = new THREE.Group();
  const lanternGeo = combine([
    [cyl(0.075, 0.085, 0.03, 12), M(0, 0.015, 0)],
    [cyl(0.06, 0.075, 0.025, 12), M(0, 0.205, 0)],
    [cone(0.06, 0.07, 12), M(0, 0.25, 0)],
    [torus(0.035, 0.006, 6, 16, Math.PI), M(0, 0.3, 0)],
    ...[0, 1, 2, 3].map(i => [box(0.008, 0.17, 0.008), M(Math.cos(i * Math.PI / 2 + 0.78) * 0.065, 0.115, Math.sin(i * Math.PI / 2 + 0.78) * 0.065)]),
    [cyl(0.008, 0.008, 0.04, 6), M(0, 0.05, 0)],
  ]);
  lantern.add(new THREE.Mesh(lanternGeo, brass));
  const glassCore = new THREE.Mesh(ball(0.055, 14, 10), glowMat('#ffd59a', 0.12));
  glassCore.position.y = 0.11; lantern.add(glassCore);
  const flame = new THREE.Mesh(cone(0.018, 0.06, 8), glowMat('#ffb347', 1.1, { soft: false }));
  flame.position.y = 0.1; flame.visible = false; lantern.add(flame);
  const halo = new THREE.Mesh(ball(0.12, 14, 10), glowMat('#ff9e40', 0.35));
  halo.position.y = 0.11; halo.visible = false; lantern.add(halo);
  lantern.position.set(ATELIER.table.x + 0.18, ATELIER.table.y, ATELIER.table.z - 0.12);
  w.group.add(lantern);
  const lanternItem = ctx.interact.addItem({ id: 'lantern', obj: lantern, radius: 0.13, center: new THREE.Vector3(0, 0.12, 0), label: () => L('lantern') + (ctx.story.get('lit') ? '' : (ctx.lang() === 'zh' ? '（未点亮）' : ' (unlit)')) });
  function lightLantern() {
    ctx.story.set('lit'); flame.visible = true; halo.visible = true; glassCore.material.uniforms.uO.value = 0.5;
    ctx.audio.chime(0); ctx.story.say('lantern_lit');
    ctx.story.setGoal('melt', ['lantern_lit', 'painting_sealed']);
  }
  w.animators.push((dt, t) => {
    if (flame.visible) { const k = 1 + Math.sin(t * 17) * 0.08 + Math.sin(t * 29) * 0.06; flame.scale.set(1, k, 1); halo.scale.setScalar(0.95 + Math.sin(t * 11) * 0.05); }
    w.uniforms.uGlow.value += ((ctx.story.get('lit') ? 0.22 : 0) - w.uniforms.uGlow.value) * Math.min(1, dt * 2);
  });

  // ---------- 眼角的余温 ----------
  const ember = new THREE.Group();
  const emCore = new THREE.Mesh(ball(1, 10, 8), glowMat('#ffcf6a', 1.2, { soft: false }));
  const emHalo = new THREE.Mesh(ball(2.4, 10, 8), glowMat('#ff8a3d', 0.45));
  ember.add(emCore, emHalo); ember.scale.setScalar(0.004);
  ember.position.set(ATELIER.portal.x + 0.052, ATELIER.portal.y - 0.006, ATELIER.portal.z + 0.006);
  w.group.add(ember);
  w.animators.push((dt, t) => { emHalo.scale.setScalar(2.2 + Math.sin(t * 3) * 0.4); });
  const emberItem = ctx.interact.addItem({
    id: 'ember', obj: ember, radius: 1.0, minR: 0.011, label: () => L('ember'),
    onGrab: () => { if (!ctx.story.get('emberGot')) { ctx.story.set('emberGot'); ctx.story.say('ember_got'); ctx.story.setGoal('light', ['ember_to_lantern']); } },
  });
  // 用 radius=1 配合 obj.scale 表示真实半径（physR 会乘上世界尺度与物体缩放）

  // ---------- 可触碰 ----------
  ctx.interact.addTouch({ id: 'painting', obj: painting, radius: 0.45, label: () => ctx.story.get('dotted') ? (ctx.lang() === 'zh' ? '《凝视》' : '"Gaze"') : L('painting'), onTouch: () => {
    if (!w.open) { ctx.story.say('painting_sealed', { cooldown: 4 }); setTimeout(() => ctx.story.say('ember_hint', { once: true }), 400); }
    else ctx.story.say('enter_hint', { cooldown: 4 });
  } });
  const gram = new THREE.Object3D(); gram.position.set(ATELIER.gramophone.x, 0.8, ATELIER.gramophone.z); w.group.add(gram);
  ctx.interact.addTouch({ id: 'gramophone', obj: gram, radius: 0.4, label: () => L('gramophone'), onTouch: () => { ctx.ui.clearSubs(); ctx.story.say('intro'); } });
  const jarT = new THREE.Object3D(); jarT.position.copy(ATELIER.jarsAt).add(new THREE.Vector3(0, 0.08, 0)); w.group.add(jarT);
  ctx.interact.addTouch({ id: 'jars', obj: jarT, radius: 0.35, label: () => L('jars'), onTouch: () => ctx.story.say('jars', { cooldown: 4 }) });

  const _a = new THREE.Vector3(), _b = new THREE.Vector3();
  w.update = (dt, t) => {
    const S = ctx.story;
    // 余温靠近提灯 → 点亮
    if (!S.get('lit') && emberItem.active && emberItem.held) {
      emberItem.centerWorld(_a); lanternItem.centerWorld(_b);
      if (_a.distanceTo(_b) < 0.09 + emberItem.physR + lanternItem.physR * 0.5) { ctx.consume('ember'); lightLantern(); }
    }
    // 点亮的提灯靠近封印 → 融化
    if (S.get('lit') && !w.open && !melting && resin.visible) {
      lanternItem.centerWorld(_a); resin.getWorldPosition(_b);
      const sc = w.group.scale.x;
      if (ctx.interact.contextOf(lanternItem) === w && _a.distanceTo(_b) < 0.2 * Math.max(1, sc) + lanternItem.physR) { melting = true; ctx.audio.swell(); }
    }
    if (melting) {
      melt = Math.min(1, melt + dt * 0.45);
      const k = 1 - smooth(0, 1, melt);
      resin.scale.set(k, 0.85 * k, 0.45 * k);
      drips.forEach((d, i) => { d.position.y -= dt * 0.02 * (1 + i * 0.3); d.scale.setScalar(Math.max(0.01, k)); });
      if (melt >= 1) { melting = false; resin.visible = false; drips.forEach(d => d.visible = false); openPortal(); }
    }
  };
  function openPortal() {
    w.open = true; S_set('open0');
    ctx.story.pigment(0);
    ctx.story.say('seal_melt');
    ctx.story.setGoal('enter0', ['enter_hint']);
  }
  const S_set = (f) => ctx.story.set(f);

  w.restore = (f) => {
    if (f.lens) { lensG.visible = false; ctx.interact.items.find(i => i.id === 'lens').active = false; ctx.engine.canZoom = true; }
    if (f.emberGot || f.lit) { ember.visible = false; emberItem.active = false; }
    if (f.lit) { flame.visible = true; halo.visible = true; glassCore.material.uniforms.uO.value = 0.5; }
    if (f.open0) { w.open = true; resin.visible = false; drips.forEach(d => d.visible = false); }
  };
  w.setFinale = () => {
    w.paintMat.uniforms.uMap.value = drawPortrait('final');
    w.open = true; resin.visible = false; drips.forEach(d => d.visible = false);
  };
  w.build();
  return w;
}
