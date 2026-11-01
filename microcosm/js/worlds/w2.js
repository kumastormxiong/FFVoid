// 第 2 界 · 花粉折纸森国（和纸立体剪纸）
import * as THREE from 'three';
import { World } from '../world.js';
import { M, box, cyl, cone, sph, ball, torus, oct, tet, craneGeo, foxParts, ridgeRing, combine, rng, smooth, V3 } from '../geo.js';
import { glowMat, pointsMat, beamMat } from '../styles.js';
import { LABELS } from '../text.js';

const PAL = {
  ground: { a: '#B8D8A8', b: '#6E9C83', c: '#F6E7B0', facet: true },
  jade: { a: '#3FB3A1', b: '#1E5F5A', c: '#CFF5D8', facet: true },
  jade2: { a: '#71C2A4', b: '#2D7768', c: '#E8F7C8', facet: true },
  gold: { a: '#F0CD72', b: '#B08938', c: '#FFF2C4', facet: true },
  verm: { a: '#EE7B5C', b: '#9E3F2E', c: '#FFD0A8', facet: true },
  paper: { a: '#F6EFDD', b: '#C9BBA0', c: '#FFFFFF', facet: true },
  dry: { a: '#D4C6A8', b: '#8F7F66', c: '#F2E7CF', facet: true },
  hill1: { a: '#8FC3A8', b: '#5F9580', c: '#E8F4DC', facet: true },
  hill2: { a: '#B3D6C0', b: '#86AE9A', c: '#F0F7E6', facet: true },
  hill3: { a: '#D3E6D6', b: '#AFC8B8', c: '#F6FAF0', facet: true },
};

export function buildW2(ctx) {
  const portal = V3(0.16, 1.4, -0.95);
  const w = new World(2, ctx, {
    style: 2, portal, wipe: '#1D3557', glass: '#9ec5ff',
    fog: { fog: '#EAF2E3', fogNear: 6, fogFar: 30, fogAmt: 0.8 }, light: [0.45, 0.6, -0.65],
    look: { shade: '#c9dbd2', sun: '#fffbe8', low: '#b8d2c0', rim: '#3a3418', hg: [-0.6, 2.2, 0.0, 0.45] },
  });
  w.open = true;
  const D = w.decor; const P = (k) => w.mat(k, { ...PAL[k], side: THREE.DoubleSide });
  const L = (k) => LABELS[k][ctx.lang()];
  const r = rng(33);

  // ---------- 折纸地形 ----------
  const gg = new THREE.PlaneGeometry(64, 64, 26, 26); gg.rotateX(-Math.PI / 2);
  const pa = gg.attributes.position;
  for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), z = pa.getZ(i); const d = Math.hypot(x, z); const h = d < 3.5 ? 0 : (Math.sin(x * 0.35) * Math.cos(z * 0.3) * 0.6 + (r() - 0.5) * 0.5) * smooth(3.5, 9, d); pa.setY(i, h); }
  gg.computeVertexNormals();
  D.add(gg, P('ground'), null);
  // 剪纸山峦三层
  D.add(ridgeRing(15, -1, (a) => 2.2 + Math.abs(Math.sin(a * 5)) * 2.5 + Math.sin(a * 13) * 0.6), P('hill1'));
  D.add(ridgeRing(21, -1, (a) => 4 + Math.abs(Math.sin(a * 3 + 1)) * 4 + Math.sin(a * 11) * 0.8), P('hill2'));
  D.add(ridgeRing(28, -1, (a) => 7 + Math.abs(Math.sin(a * 2 + 2)) * 6 + Math.sin(a * 7) * 1.2), P('hill3'));

  // ---------- 折纸树林 ----------
  for (let i = 0; i < 70; i++) {
    const a = r() * 6.28, d = 4 + Math.pow(r(), 0.8) * 10;
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (z < -1 && Math.abs(x) < 2.5 && d < 6) continue;
    const s = 0.7 + r() * 1.1, tiers = 2 + Math.floor(r() * 2);
    const key = r() < 0.72 ? (r() < 0.5 ? 'jade' : 'jade2') : 'gold';
    D.add(box(0.08 * s, 0.8 * s, 0.08 * s), P('dry'), M(x, 0.4 * s, z));
    for (let k = 0; k < tiers; k++) D.add(cone((0.75 - k * 0.18) * s, (1.0 - k * 0.12) * s, 4), P(key), M(x, (0.9 + k * 0.55) * s, z, 0, r() * 1.5, 0));
  }
  // 地面小折纸：花、草
  for (let i = 0; i < 50; i++) {
    const a = r() * 6.28, d = 1.4 + r() * 8;
    D.add(tet(0.06 + r() * 0.08), P(r() < 0.5 ? 'gold' : 'verm'), M(Math.cos(a) * d, 0.05, Math.sin(a) * d, r() * 3, r() * 3, r() * 3));
  }

  // ---------- 千纸鹤古树 ----------
  const T0 = V3(-0.62, 0, -1.75);
  const dryMat = P('dry'), liveMat = P('jade');
  const treeParts = [];
  const trunkG = new THREE.CylinderGeometry(0.1, 0.22, 2.6, 5, 6);
  { const p = trunkG.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); const a = (y + 1.3) * 0.6; const x = p.getX(i), z = p.getZ(i); p.setX(i, x * Math.cos(a) - z * Math.sin(a)); p.setZ(i, x * Math.sin(a) + z * Math.cos(a)); } trunkG.computeVertexNormals(); }
  const trunk = new THREE.Mesh(trunkG, dryMat); trunk.position.set(T0.x, 1.3, T0.z); w.group.add(trunk); treeParts.push(trunk);
  const branchDefs = [
    [V3(T0.x, 1.9, T0.z), V3(portal.x, 1.6, portal.z)],
    [V3(T0.x, 2.2, T0.z), V3(-1.6, 2.7, -1.2)],
    [V3(T0.x, 2.0, T0.z), V3(-1.3, 2.3, -2.6)],
    [V3(T0.x, 2.4, T0.z), V3(0.2, 3.0, -2.3)],
    [V3(T0.x, 2.55, T0.z), V3(-0.5, 3.4, -1.4)],
    [V3(T0.x, 1.6, T0.z), V3(-1.8, 1.9, -2.0)],
  ];
  const tips = [];
  for (const [a, b] of branchDefs) {
    const len = a.distanceTo(b);
    const g = new THREE.CylinderGeometry(0.025, 0.06, len, 4); g.translate(0, len / 2, 0);
    const m = new THREE.Mesh(g, dryMat); m.position.copy(a);
    m.quaternion.setFromUnitVectors(V3(0, 1, 0), b.clone().sub(a).normalize());
    w.group.add(m); treeParts.push(m); tips.push(b);
  }
  // 露珠细线 + 露珠外壳
  D.add(cyl(0.003, 0.003, 0.2, 3), P('paper'), M(portal.x, 1.5, portal.z));
  const dewShell = new THREE.Mesh(ball(0.036, 16, 12), glowMat('#3b6fb0', 0.25)); dewShell.position.copy(portal); dewShell.scale.set(1, 1.15, 1); w.group.add(dewShell);
  // 挂着的千纸鹤
  const craneG = craneGeo(0.5);
  const hangCranes = [];
  for (let i = 0; i < 9; i++) {
    const tip = tips[1 + (i % 5)];
    const c = new THREE.Mesh(craneG, P(i % 3 === 0 ? 'verm' : 'paper'));
    const base = tip.clone().add(V3((r() - 0.5) * 0.5, -0.35 - r() * 0.4, (r() - 0.5) * 0.5));
    c.position.copy(base); c.rotation.set(0.6, r() * 6, 0.3);
    w.group.add(c); hangCranes.push({ m: c, base, phase: r() * 6, orbitR: 1.2 + r() * 2.2, orbitH: 1.5 + r() * 2.2, speed: 0.3 + r() * 0.3 });
  }
  // 开花：金色折纸花，初始缩为 0
  const flowers = [];
  for (let i = 0; i < 26; i++) {
    const tip = tips[i % tips.length];
    const f = new THREE.Mesh(oct(0.09 + r() * 0.07), P(i % 4 ? 'gold' : 'verm'));
    f.position.copy(tip).add(V3((r() - 0.5) * 0.7, (r() - 0.3) * 0.5, (r() - 0.5) * 0.7));
    f.rotation.set(r() * 3, r() * 3, r() * 3); f.scale.setScalar(0.001); w.group.add(f);
    flowers.push({ m: f, delay: r() * 0.6 });
  }
  // 雨
  const rainN = 400; const rainPos = new Float32Array(rainN * 3); const rainSeed = new Float32Array(rainN);
  for (let i = 0; i < rainN; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * 2.2; rainPos[i * 3] = T0.x + Math.cos(a) * d; rainPos[i * 3 + 1] = r() * 4; rainPos[i * 3 + 2] = T0.z + Math.sin(a) * d; rainSeed[i] = r(); }
  const rainG = new THREE.BufferGeometry(); rainG.setAttribute('position', new THREE.BufferAttribute(rainPos, 3)); rainG.setAttribute('aSeed', new THREE.BufferAttribute(rainSeed, 1));
  const rainM = pointsMat('#6fb7ff', 0.03); const rain = new THREE.Points(rainG, rainM); rain.visible = false; w.group.add(rain);

  // ---------- 朱砂折纸火狐 ----------
  const fp = foxParts(1);
  const fox = new THREE.Group(); fox.position.set(0.62, 0, -1.55); fox.rotation.y = -0.9; w.group.add(fox);
  const vm = P('verm'), pm = P('paper');
  const body = new THREE.Mesh(fp.body, vm); body.position.y = 0.2; fox.add(body);
  const head = new THREE.Group(); head.position.set(0.4, 0.22, 0.05); fox.add(head);
  const headM = new THREE.Mesh(fp.head, vm); head.add(headM);
  const snout = new THREE.Mesh(tet(0.05), pm); snout.position.set(0.17, -0.03, 0); head.add(snout);
  const e1 = new THREE.Mesh(fp.ear, vm); e1.position.set(-0.02, 0.13, 0.06); head.add(e1);
  const e2 = e1.clone(); e2.position.z = -0.06; head.add(e2);
  const tailPivot = new THREE.Group(); tailPivot.position.set(-0.4, 0.18, 0); fox.add(tailPivot);
  const tail = new THREE.Mesh(fp.tail, vm); tail.position.x = -0.28; tailPivot.add(tail);
  const tailTip = new THREE.Mesh(cone(0.08, 0.16, 4), pm); tailTip.rotation.z = Math.PI / 2; tailTip.position.x = -0.62; tailPivot.add(tailTip);
  const legs = [];
  for (const [x, z] of [[0.25, 0.12], [0.25, -0.12], [-0.25, 0.12], [-0.25, -0.12]]) { const l = new THREE.Mesh(fp.leg, vm); l.position.set(x, 0.12, z); l.scale.y = 0.2; fox.add(l); legs.push(l); }
  // 睡姿：身体压低、头埋、尾巴绕到前面
  const pose = (k) => {
    body.position.y = THREE.MathUtils.lerp(0.13, 0.32, k); body.scale.y = THREE.MathUtils.lerp(0.75, 1, k);
    head.position.set(THREE.MathUtils.lerp(0.32, 0.45, k), THREE.MathUtils.lerp(0.12, 0.5, k), THREE.MathUtils.lerp(0.18, 0.0, k));
    head.rotation.z = THREE.MathUtils.lerp(-0.4, 0.25, k); head.rotation.y = THREE.MathUtils.lerp(0.8, 0, k);
    tailPivot.rotation.y = THREE.MathUtils.lerp(-2.3, 0, k); tailPivot.rotation.z = THREE.MathUtils.lerp(0, 0.6, k); tailPivot.position.y = THREE.MathUtils.lerp(0.1, 0.32, k);
    legs.forEach(l => { l.scale.y = THREE.MathUtils.lerp(0.25, 1.2, k); l.position.y = THREE.MathUtils.lerp(0.04, 0.14, k); });
  };
  pose(0);
  const fire = new THREE.Mesh(cone(0.07, 0.45, 8), glowMat('#ffb347', 0.9, { soft: false })); fire.rotation.z = -Math.PI / 2; fire.position.set(0.42, 0, 0); fire.visible = false; head.add(fire);

  // ---------- 红纸灯笼（挂在尾巴尖） ----------
  const plantern = new THREE.Group();
  const plG = combine([[cyl(0.07, 0.07, 0.14, 8), M(0, 0, 0)], [cyl(0.075, 0.06, 0.02, 8), M(0, 0.08, 0)], [cyl(0.06, 0.075, 0.02, 8), M(0, -0.08, 0)], [torus(0.025, 0.004, 4, 10), M(0, 0.11, 0)]]);
  const vmI = w.mat('vermItem', { ...PAL.verm, side: THREE.DoubleSide, fog: false, height: false });
  plantern.add(new THREE.Mesh(plG, vmI));
  const plRibs = new THREE.Mesh(combine([0, 1, 2, 3].map(i => [box(0.004, 0.15, 0.148), M(0, 0, 0, 0, i * Math.PI / 4, 0)])), w.mat('goldItem', { ...PAL.gold, fog: false, height: false })); plantern.add(plRibs);
  const plGlow = new THREE.Mesh(ball(0.16, 12, 8), glowMat('#ff7a3d', 0.55)); plGlow.visible = false; plantern.add(plGlow);
  const plCore = new THREE.Mesh(ball(0.05, 10, 8), glowMat('#ffd08a', 1.3, { soft: false })); plCore.visible = false; plantern.add(plCore);
  tailTip.add(plantern); plantern.position.set(-0.02, -0.12, 0); plantern.rotation.z = -Math.PI / 2;
  const plItem = ctx.interact.addItem({ id: 'plantern', obj: plantern, radius: 0.1, label: () => L('plantern'),
    grabbable: () => ctx.story.get('foxLit'), deny: () => ctx.story.say('fox_sleep', { cooldown: 5 }),
    onGrab: () => { plantern.rotation.set(0, 0, 0); if (!ctx.story.get('thaw1')) { ctx.story.say('lantern_hint', { once: true }); ctx.story.setGoal('thaw', ['lantern_hint']); } } });
  w.animators.push((dt, t) => { if (plGlow.visible) { plGlow.scale.setScalar(1 + Math.sin(t * 7) * 0.06); plGlow.material.uniforms.uO.value = ctx.story.get('thaw1') ? 0.9 : 0.55; } });

  // 孢子
  { const n = 220, pos = new Float32Array(n * 3), seed = new Float32Array(n);
    for (let i = 0; i < n; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * 9; pos[i * 3] = Math.cos(a) * d; pos[i * 3 + 1] = 0.2 + r() * 4; pos[i * 3 + 2] = Math.sin(a) * d; seed[i] = r(); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    const sm = pointsMat('#ffe9a8', 0.025); w.group.add(new THREE.Points(g, sm)); w.animators.push((dt, t) => { sm.uniforms.uTime.value = t; rainM.uniforms.uTime.value = t; }); }

  // 穿过林间的阳光
  { const bm = beamMat('#fff1c2', 0.22); w.animators.push((dt, t) => { bm.uniforms.uTime.value = t; });
    for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 1.0, 12, 14, 1, true), bm); const a = -0.6 + i * 0.35; m.position.set(Math.cos(a) * 6 + 1, 4.5, -Math.abs(Math.sin(a)) * 6 - 3); m.rotation.set(-0.35, 0, 0.42); w.group.add(m); } }

  // ---------- 可触碰 ----------
  const tt = new THREE.Object3D(); tt.position.set(T0.x, 1.2, T0.z); w.group.add(tt);
  ctx.interact.addTouch({ id: 'tree', obj: tt, radius: 0.6, label: () => L('tree'), onTouch: () => { if (!ctx.story.get('watered')) ctx.story.say('tree_dry', { cooldown: 4 }); } });
  const ft = new THREE.Object3D(); ft.position.set(0, 0.25, 0); fox.add(ft);
  ctx.interact.addTouch({ id: 'fox', obj: ft, radius: 0.45, label: () => L('fox'), active: () => !ctx.story.get('foxLit'), onTouch: () => ctx.story.say('fox_sleep', { cooldown: 4 }) });

  // ---------- 逻辑 ----------
  const _a = new THREE.Vector3();
  let bloomT = -1, rainT = 0;
  const treeCenter = V3(T0.x + 0.2, 1.7, T0.z + 0.2);
  w.update = (dt, t) => {
    const S = ctx.story;
    // 呼吸
    if (!S.get('foxAwake')) { body.scale.x = 1 + Math.sin(t * 1.4) * 0.03; }
    // 水球带到古树 → 下雨开花
    const orb = ctx.items.orb;
    if (!S.get('watered') && orb && orb.active && ctx.interact.contextOf(orb) === w) {
      orb.centerWorld(_a); const local = _a.sub(w.group.position).divideScalar(w.group.scale.x);
      if (local.distanceTo(treeCenter) < 1.5 || local.distanceTo(portal) < 0.6) { ctx.consume('orb'); S.set('watered'); bloomT = 0; rain.visible = true; ctx.audio.swell(); S.say('bloom'); }
    }
    if (bloomT >= 0) {
      bloomT += dt;
      rainT = bloomT;
      if (rain.visible) { const p = rainG.attributes.position; for (let i = 0; i < rainN; i++) { let y = p.getY(i) - dt * (3 + rainSeed[i] * 2); if (y < 0) y += 4; p.setY(i, y); } p.needsUpdate = true; if (bloomT > 5) rain.visible = false; }
      const k = smooth(1, 4, bloomT);
      if (k > 0.5 && trunk.material !== liveMat) treeParts.forEach(m => m.material = liveMat);
      flowers.forEach(f => f.m.scale.setScalar(Math.max(0.001, smooth(1 + f.delay * 3, 2.5 + f.delay * 3, bloomT))));
      const fk = smooth(4.5, 6.5, bloomT);
      if (fk > 0 && !S.get('foxAwake')) { S.set('foxAwake'); }
      pose(fk);
      if (bloomT > 7 && bloomT < 8.6) { fire.visible = true; fire.scale.setScalar(0.6 + Math.sin(t * 30) * 0.2); head.rotation.y = -0.9; }
      else fire.visible = false;
      if (bloomT > 8 && !S.get('foxLit')) { S.set('foxLit'); plGlow.visible = true; plCore.visible = true; S.pigment(2); S.say('fox_wake'); S.setGoal('lantern', ['lantern_hint']); }
      if (bloomT > 9) bloomT = -1;
    }
    // 醒来后的纸鹤绕树飞
    if (S.get('watered')) {
      hangCranes.forEach((c, i) => { const a = t * c.speed + c.phase; const target = V3(T0.x + Math.cos(a) * c.orbitR, c.orbitH + Math.sin(a * 2) * 0.3, T0.z + Math.sin(a) * c.orbitR); c.m.position.lerp(target, Math.min(1, dt * 0.8)); c.m.rotation.set(0, -a, Math.sin(t * 6 + i) * 0.2); });
    } else hangCranes.forEach((c, i) => { c.m.position.y = c.base.y + Math.sin(t * 0.8 + c.phase) * 0.02; c.m.rotation.y += dt * 0.1; });
    if (S.get('foxAwake') && bloomT < 0) { head.rotation.y = Math.sin(t * 0.6) * 0.4; tailPivot.rotation.y = Math.sin(t * 2) * 0.3; }
  };

  w.restore = (f) => {
    if (f.watered) { treeParts.forEach(m => m.material = liveMat); flowers.forEach(fl => fl.m.scale.setScalar(1)); }
    if (f.foxLit) { pose(1); plGlow.visible = true; plCore.visible = true; if (f.thaw1) { plantern.visible = false; plItem.active = false; } }
  };
  w.onEnter = () => { ctx.story.say('w2_enter', { once: true }); if (!ctx.story.get('watered')) ctx.story.setGoal('w2', ['tree_dry', 'dew_hint']); };
  w.build();
  return w;
}
