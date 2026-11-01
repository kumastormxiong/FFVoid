// 第 1 界 · 虹膜发条群岛（莫比斯清线钢笔淡彩）
import * as THREE from 'three';
import { World } from '../world.js';
import { M, box, cyl, cone, sph, ball, torus, oct, lathe, gear, combine, extrudeShape, rng, smooth, V3 } from '../geo.js';
import { glowMat } from '../styles.js';
import { tower, plinth, stairs, cloud, rbox } from '../mvkit.js';
import { LABELS } from '../text.js';

const PAL = {
  sand: { a: '#F7E3C6', b: '#D7A794' },
  rock: { a: '#EBC1A8', b: '#9F7486' },
  rose: { a: '#F4B7A6', b: '#B8738A' },
  peach: { a: '#FAD9BF', b: '#C99A9A' },
  brass: { a: '#F0BE5E', b: '#A8703F' },
  coral: { a: '#FF8676', b: '#B9506A' },
  cyan: { a: '#8DEFE0', b: '#4AA7B0' },
  teal: { a: '#73C6C0', b: '#3F7F95' },
  white: { a: '#FFF8EA', b: '#B9C2D8' },
  frost: { a: '#EEFCFF', b: '#A6CFE0' },
  lilac: { a: '#CDBDF4', b: '#7F72B4' },
  win: { a: '#4B3E64', b: '#3A2F52' },
  cloud: { a: '#FFFFFF', b: '#D9E4F0', height: false },
};

export function buildW1(ctx) {
  const portal = V3(0, 1.36, -1.0);
  const w = new World(1, ctx, {
    style: 1, portal, wipe: '#2A9D8F', glass: '#d8f7a8', ink: '#3A3550', inkW: 0.008,
    fog: { fog: '#cdeee9', fogNear: 12, fogFar: 40, fogAmt: 0.6 }, light: [0.55, 0.72, 0.42],
    look: { shade: '#c3cbe8', sun: '#fff6ea', low: '#86aeb9', rim: '#3a2a20', hg: [-4.5, 0.2, -0.05, 0.35] },
  });
  w.open = true;
  const D = w.decor; const P = (k) => w.mat(k, PAL[k]);
  const L = (k) => LABELS[k][ctx.lang()];
  const r = rng(21);

  // ---------- 主岛：纪念碑谷式层叠基座 ----------
  plinth(D, { x: 0, y: 0, z: 0, w: 6.6, d: 6.6, tiers: 3, body: P('rose'), trim: P('peach'), win: P('win'), outline: true });
  // 顶面描边：黄铜线脚 + 中心圆形铺地
  for (const [x, z, ww, dd] of [[0, 3.28, 6.6, 0.06], [0, -3.28, 6.6, 0.06], [3.28, 0, 0.06, 6.6], [-3.28, 0, 0.06, 6.6]]) D.add(box(ww, 0.05, dd), P('brass'), M(x, 0.02, z));
  D.add(cyl(1.6, 1.6, 0.03, 40), P('white'), M(0, 0.012, -0.6), true);
  D.add(cyl(1.25, 1.25, 0.035, 40), P('teal'), M(0, 0.015, -0.6));
  D.add(cyl(1.05, 1.05, 0.04, 40), P('sand'), M(0, 0.018, -0.6));
  // 三个角上的小塔
  tower(D, { x: 2.75, y: 0, z: -2.75, w: 0.75, h: 1.9, body: P('peach'), trim: P('white'), roof: 'dome', roofMat: P('teal'), win: P('win'), outline: true });
  tower(D, { x: 2.75, y: 0, z: 2.75, w: 0.6, h: 1.2, body: P('sand'), trim: P('white'), roof: 'spire', roofMat: P('coral'), win: P('win'), outline: true });
  tower(D, { x: -2.75, y: 0, z: 2.75, w: 0.65, h: 1.5, body: P('lilac'), trim: P('white'), roof: 'onion', roofMat: P('brass'), win: P('win'), outline: true });
  stairs(D, P('peach'), 0, 0, 3.3, 0, 7, 1.4, 0.18, 0.3, true);
  // 柱廊
  for (let i = 0; i < 4; i++) { const x = 1.2 + i * 0.5; D.add(cyl(0.06, 0.07, 1.1, 10), P('white'), M(x, 0.55, 2.9), true); }
  D.add(box(1.9, 0.1, 0.3), P('peach'), M(1.95, 1.15, 2.9), true);

  // 基座侧面嵌着的大齿轮（会转）
  const gears = [];
  for (const [x, z, ry, rr] of [[3.36, -1.2, Math.PI / 2, 0.9], [3.36, 0.9, Math.PI / 2, 0.6], [-3.36, -0.4, Math.PI / 2, 1.0], [-3.36, 1.5, Math.PI / 2, 0.55]]) {
    const gm = new THREE.Mesh(gear(rr, 12 + Math.round(rr * 10), 0.1), P('brass'));
    gm.position.set(x, -0.55, z); gm.rotation.y = ry;
    w.group.add(gm); gears.push(gm);
  }

  // ---------- 机械睡莲 ----------
  const lotusBase = V3(0, 0.82, -1.0);
  D.add(cyl(0.16, 0.24, 0.1, 12), P('brass'), M(0, 0.05, -1.0), true);
  D.add(cyl(0.07, 0.1, 0.72, 10), P('brass'), M(0, 0.45, -1.0), true);
  D.add(torus(0.1, 0.02, 6, 16), P('coral'), M(0, 0.3, -1.0, Math.PI / 2, 0, 0), true);
  D.add(cyl(0.2, 0.08, 0.08, 12), P('brass'), M(0, 0.8, -1.0), true);
  D.add(box(0.22, 0.03, 0.16), P('brass'), M(0.25, 0.72, -0.86, 0, -0.5, 0), true); // 侧托（钥匙会落在这里）
  const lotus = new THREE.Group(); lotus.position.copy(lotusBase); w.group.add(lotus);
  const petalGeo = (() => { const g = new THREE.SphereGeometry(1, 10, 8); g.scale(0.07, 0.016, 0.17); g.translate(0, 0, 0.15); return g; })();
  const petals = [];
  for (let ring = 0; ring < 2; ring++) {
    const n = ring ? 6 : 9;
    for (let i = 0; i < n; i++) {
      const pivot = new THREE.Group(); pivot.rotation.y = (i / n) * Math.PI * 2 + ring * 0.3;
      const pm = new THREE.Mesh(petalGeo, ring ? P('coral') : P('brass'));
      const hull = new THREE.Mesh(petalGeo, w.ink); hull.scale.setScalar(1.06); pm.add(hull);
      pm.scale.setScalar(ring ? 0.8 : 1);
      pivot.add(pm); lotus.add(pivot);
      petals.push({ pm, ring, open: ring ? -0.35 : -0.15, closed: ring ? -1.35 : -1.15 });
      pm.rotation.x = petals[petals.length - 1].closed;
    }
  }
  // 雄蕊 + 花粉（传送门）
  D.add(cyl(0.006, 0.01, 0.52, 6), P('brass'), M(0, 1.08, -1.0), false);
  const spikes = combine(Array.from({ length: 14 }, (_, i) => { const u = (i * 0.618) % 1, v = (i / 14) * 2 - 1; const th = u * 6.28, ph = Math.acos(v); const d = V3(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)); const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), d); const m = new THREE.Matrix4().compose(d.clone().multiplyScalar(0.04), q, V3(1, 1, 1)); return [cone(0.004, 0.018, 4), m]; }));
  const pollenSpikes = new THREE.Mesh(spikes, P('cyan')); pollenSpikes.position.copy(portal); w.group.add(pollenSpikes);
  const pollenGlow = new THREE.Mesh(ball(0.05, 12, 8), glowMat('#d8f7a8', 0.4)); pollenGlow.position.copy(portal); w.group.add(pollenGlow);
  w.animators.push((dt, t) => { pollenSpikes.rotation.y = t * 0.3; pollenGlow.scale.setScalar(1 + Math.sin(t * 2.4) * 0.12); });
  // 冰霜
  const frost = new THREE.Group(); frost.position.copy(lotusBase); w.group.add(frost);
  for (let i = 0; i < 16; i++) { const a = r() * 6.28, d = 0.05 + r() * 0.12; const c = new THREE.Mesh(oct(0.025 + r() * 0.03), P('frost')); c.position.set(Math.cos(a) * d, 0.02 + r() * 0.12, Math.sin(a) * d); c.rotation.set(r() * 3, r() * 3, r() * 3); c.scale.y = 1.8; frost.add(c); }
  const frostShell = new THREE.Mesh(sph(0.2, 1), P('frost')); frostShell.scale.set(1, 0.7, 1); frostShell.position.y = 0.07; frost.add(frostShell);
  let thaw = 0, thawing = false;

  // ---------- 三环星盘桥 ----------
  const from = V3(-1.6, 0.0, -3.3), to = V3(-6.4, 0.0, -9.4);
  const dir = to.clone().sub(from).normalize();
  const yaw = Math.atan2(dir.x, dir.z);
  const rings = [];
  for (let i = 0; i < 3; i++) {
    const p = from.clone().lerp(to, 0.25 + i * 0.25); p.y = 1.0;
    const g = new THREE.Group(); g.position.copy(p); w.group.add(g);
    const tor = new THREE.Mesh(torus(1.2 - i * 0.12, 0.06, 6, 40), P(i === 1 ? 'coral' : 'brass'));
    const th = new THREE.Mesh(tor.geometry, w.ink); th.scale.setScalar(1.025); tor.add(th);
    g.add(tor);
    for (let k = 0; k < 12; k++) { const tick = new THREE.Mesh(box(0.03, 0.18, 0.03), P('white')); const a = k / 12 * 6.28; tick.position.set(Math.cos(a) * (1.2 - i * 0.12), Math.sin(a) * (1.2 - i * 0.12), 0); tick.rotation.z = a; tor.add(tick); }
    const target = new THREE.Euler(0, yaw, 0, 'YXZ');
    const start = new THREE.Euler(0.9 + i * 0.7, yaw + 1.2 - i * 0.9, 0.6 * i, 'YXZ');
    g.rotation.copy(start);
    rings.push({ g, start, target });
  }
  // 桥面：两端完整，中段缺失
  const deckLen = from.distanceTo(to);
  const planks = [];
  const nPl = 26;
  for (let i = 0; i < nPl; i++) {
    const t = i / (nPl - 1); const p = from.clone().lerp(to, t); p.y = -0.04;
    const pl = new THREE.Mesh(box(1.1, 0.07, deckLen / nPl * 0.8), P(i % 3 ? 'sand' : 'white'));
    pl.position.copy(p); pl.rotation.y = yaw; w.group.add(pl);
    const broken = t > 0.18 && t < 0.86;
    pl.userData.broken = broken; if (broken) { pl.scale.set(0.001, 0.001, 0.001); pl.position.y -= 0.6; pl.userData.y0 = p.y; }
    planks.push(pl);
  }
  // 远岛与钟塔
  plinth(D, { x: to.x - 1.2, y: 0, z: to.z - 1.4, w: 4.2, d: 4.2, tiers: 3, body: P('lilac'), trim: P('peach'), win: P('win'), outline: true });
  const tw = V3(to.x - 1.6, 0, to.z - 1.8);
  tower(D, { x: tw.x, y: 0, z: tw.z, w: 1.3, h: 4.4, body: P('white'), trim: P('peach'), roof: 'dome', roofMat: P('cyan'), win: P('win'), winN: 2, outline: true });
  tower(D, { x: tw.x + 1.3, y: 0, z: tw.z - 0.4, w: 0.7, h: 2.2, body: P('rose'), trim: P('white'), roof: 'spire', roofMat: P('coral'), win: P('win'), outline: true });
  const face = new THREE.Mesh(cyl(0.46, 0.46, 0.05, 32), P('white')); face.position.set(tw.x, 3.6, tw.z + 0.68); face.rotation.x = Math.PI / 2; w.group.add(face);
  D.add(torus(0.47, 0.035, 6, 32), P('brass'), M(tw.x, 3.6, tw.z + 0.7));
  const hand1 = new THREE.Mesh(box(0.03, 0.36, 0.02), P('coral')); hand1.geometry.translate(0, 0.17, 0); const hand2 = new THREE.Mesh(box(0.04, 0.26, 0.02), P('brass')); hand2.geometry.translate(0, 0.12, 0);
  const clock = new THREE.Group(); clock.position.copy(face.position); clock.add(hand1, hand2); hand1.position.z = hand2.position.z = 0.05; w.group.add(clock);
  w.animators.push((dt, t) => { const sp = ctx.story.get('thaw1') ? 1 : 0.02; hand1.rotation.z = -t * 0.5 * sp; hand2.rotation.z = -t * 0.04 * sp; });

  // ---------- 发条鸟 ----------
  const bird = new THREE.Group();
  const bBody = new THREE.Mesh(gear(0.12, 10, 0.05), P('brass')); bBody.add(new THREE.Mesh(bBody.geometry, w.ink)); bBody.children[0].scale.setScalar(1.08);
  bird.add(bBody);
  const wingGeo = (() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0.4, 0.05, -0.08, 0, 0, -0.16], 3)); g.computeVertexNormals(); return g; })();
  const wl = new THREE.Mesh(wingGeo, w.mat('wing', { ...PAL.cyan, side: THREE.DoubleSide })), wr = wl.clone(); wr.scale.x = -1;
  wl.position.z = wr.position.z = 0.06; bird.add(wl, wr);
  const beak = new THREE.Mesh(cone(0.03, 0.1, 4), P('coral')); beak.rotation.x = Math.PI / 2; beak.position.set(0, 0, 0.16); bird.add(beak);
  const perch = V3(tw.x + 0.3, 4.75, tw.z + 0.75);
  bird.position.copy(perch); bird.lookAt(0, 4.5, 0); w.group.add(bird);
  let birdT = -1;

  // ---------- 浮空群岛（纪念碑谷式小城）与云 ----------
  const bodies = ['rose', 'peach', 'sand', 'lilac', 'white'], roofs = ['dome', 'spire', 'onion', 'crown'], roofC = ['teal', 'coral', 'brass', 'cyan'];
  const toA = Math.atan2(to.z, to.x);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * 6.28 + 0.35, d = 11 + r() * 9, y = -2.5 + r() * 5;
    if (Math.abs(Math.atan2(Math.sin(a - toA), Math.cos(a - toA))) < 0.45) continue;
    const x = Math.cos(a) * d, z = Math.sin(a) * d, s = 0.7 + r() * 0.9;
    plinth(D, { x, y, z, w: 2.6 * s, d: 2.6 * s, tiers: 2, body: P(bodies[i % 5]), trim: P('peach'), win: P('win') });
    const nb = 1 + Math.floor(r() * 3);
    for (let k = 0; k < nb; k++) {
      const ox = (k - (nb - 1) / 2) * 0.85 * s, oz = (r() - 0.5) * 0.8 * s;
      tower(D, { x: x + ox, y, z: z + oz, w: (0.45 + r() * 0.3) * s, h: (0.8 + r() * 2.2) * s, body: P(bodies[(i + k + 1) % 5]), trim: P('white'), roof: roofs[(i + k) % 4], roofMat: P(roofC[(i + k) % 4]), win: P('win') });
    }
    if (r() < 0.6) stairs(D, P('peach'), x + 1.1 * s, y, z, Math.PI / 2, 4, 0.5 * s, 0.14 * s, 0.24 * s);
  }
  for (let i = 0; i < 12; i++) {
    const a = r() * 6.28, d = 9 + r() * 16, y = -1 + r() * 9;
    cloud(D, P('cloud'), Math.cos(a) * d, y, Math.sin(a) * d, 0.6 + r() * 1.1, i);
  }
  // 天上的巨型齿轮环
  const bigGear = new THREE.Mesh(gear(9, 48, 0.4, 0.06, 0.9), P('brass'));
  bigGear.position.set(0, 7, -22); w.group.add(bigGear);
  w.animators.push((dt, t) => { bigGear.rotation.z = t * 0.02; gears.forEach((g, i) => g.rotateZ(dt * (i % 2 ? 0.4 : -0.3) * (ctx.story.get('thaw1') ? 2.5 : 0.25))); });

  // ---------- 发条钥匙（解冻后出现） ----------
  const key = new THREE.Group();
  const keyGeo = combine([
    [torus(0.04, 0.012, 6, 16), M(0, 0.07, 0)],
    [box(0.014, 0.12, 0.014), M(0, 0.0, 0)],
    [box(0.04, 0.014, 0.014), M(0.018, -0.045, 0)],
    [box(0.03, 0.014, 0.014), M(0.014, -0.02, 0)],
  ]);
  const goldMat = w.mat('gold', { a: '#FFD166', b: '#B07B2C', c: '#FFF1B8', fog: false, height: false });
  const keyMesh = new THREE.Mesh(keyGeo, goldMat); keyMesh.add(new THREE.Mesh(keyGeo, w.ink)); keyMesh.children[0].scale.setScalar(1.04);
  key.add(keyMesh);
  const keyGlow = new THREE.Mesh(ball(0.07, 10, 8), glowMat('#FFD166', 0.35)); key.add(keyGlow);
  key.scale.setScalar(1.2);
  key.position.set(0.25, 0.8, -0.86); key.visible = false; w.group.add(key);
  const keyItem = ctx.interact.addItem({ id: 'key', obj: key, radius: 0.085, label: () => L('key'), grabbable: () => key.visible,
    onGrab: () => { if (!ctx.story.get('keyGot')) { ctx.story.set('keyGot'); ctx.story.say('key_got'); ctx.story.setGoal('whale', ['whale_lock', 'key_small']); } } });
  keyItem.active = false;
  w.animators.push((dt, t) => { if (key.visible && !keyItem.held && key.parent === w.group) key.rotation.y = t; keyGlow.scale.setScalar(1 + Math.sin(t * 3) * 0.15); });

  // ---------- 可触碰 ----------
  const lt = new THREE.Object3D(); lt.position.copy(lotusBase).add(V3(0, 0.08, 0)); w.group.add(lt);
  ctx.interact.addTouch({ id: 'lotus', obj: lt, radius: 0.25, label: () => L('lotus'), onTouch: () => { if (!ctx.story.get('thaw1')) ctx.story.say('lotus_frozen', { cooldown: 4 }); } });
  const at = new THREE.Object3D(); at.position.copy(rings[0].g.position); w.group.add(at);
  ctx.interact.addTouch({ id: 'astrolabe', obj: at, radius: 1.2, label: () => L('astrolabe'), onTouch: () => { if (!ctx.story.get('thaw1')) ctx.story.say('astrolabe', { cooldown: 4 }); } });

  // ---------- 解冻逻辑 ----------
  const _a = new THREE.Vector3();
  let sun = null, align = 0, aligning = false;
  w.update = (dt, t) => {
    const S = ctx.story;
    const pl = ctx.items.plantern;
    if (!S.get('thaw1') && !thawing && pl && S.get('foxLit') && pl.active && ctx.interact.contextOf(pl) === w) {
      pl.centerWorld(_a);
      const local = _a.sub(w.group.position).divideScalar(w.group.scale.x);
      if (local.distanceTo(lotusBase) < 0.75) startThaw(pl);
    }
    if (thawing) {
      thaw = Math.min(1, thaw + dt * 0.35);
      const k = smooth(0, 1, thaw);
      frost.scale.setScalar(Math.max(0.001, 1 - k)); frost.position.y = lotusBase.y - k * 0.05;
      petals.forEach(p => p.pm.rotation.x = THREE.MathUtils.lerp(p.closed, p.open, smooth(0.1, 1, thaw)));
      if (sun) { sun.position.lerp(V3(0, 2.1, -1.0), Math.min(1, dt * 1.5)); }
      if (thaw >= 1) { thawing = false; S.set('thaw1'); S.pigment(1); S.say('lotus_thaw'); aligning = true; }
    }
    if (aligning) {
      align = Math.min(1, align + dt * 0.25);
      const k = smooth(0, 1, align);
      rings.forEach((rg, i) => { const kk = smooth(i * 0.15, 0.7 + i * 0.15, align); rg.g.rotation.set(THREE.MathUtils.lerp(rg.start.x, rg.target.x, kk), THREE.MathUtils.lerp(rg.start.y, rg.target.y, kk), THREE.MathUtils.lerp(rg.start.z, rg.target.z, kk)); });
      planks.forEach((p, i) => { if (p.userData.broken) { const kk = smooth(0.3 + (i / nPl) * 0.5, 0.5 + (i / nPl) * 0.5, align); p.scale.setScalar(Math.max(0.001, kk)); p.position.y = p.userData.y0 - (1 - kk) * 0.6; } });
      if (align >= 1) { aligning = false; S.say('bridge'); birdT = 0; }
    }
    if (birdT >= 0) {
      birdT += dt / 6;
      const b = Math.min(1, birdT);
      const p0 = perch, p2 = V3(0.25, 0.95, -0.86), p1 = V3(-3.5, 4.5, -4.5);
      const q = (1 - b) * (1 - b), m = 2 * (1 - b) * b, n = b * b;
      bird.position.set(p0.x * q + p1.x * m + p2.x * n, p0.y * q + p1.y * m + p2.y * n + Math.sin(b * 12) * 0.1, p0.z * q + p1.z * m + p2.z * n);
      const ahead = V3(p0.x * 0 + (p1.x - p0.x) * (1 - b) + (p2.x - p1.x) * b, 0, (p1.z - p0.z) * (1 - b) + (p2.z - p1.z) * b);
      bird.lookAt(bird.position.clone().add(ahead));
      wl.rotation.z = Math.sin(t * 18) * 0.6; wr.rotation.z = -Math.sin(t * 18) * 0.6;
      if (b > 0.97 && !key.visible) { key.visible = true; keyItem.active = true; S.set('keyDrop'); ctx.audio.chime(3); S.setGoal('takekey', ['key_got']); }
      if (birdT > 1.6) { birdT = -1; bird.position.copy(perch); bird.lookAt(0, 4.5, 0); }
      else if (b >= 1) { bird.position.lerp(V3(-3, 6, -5), dt * 0.4); }
    }
  };
  function startThaw(pl) {
    thawing = true;
    ctx.consume('plantern', false);
    sun = pl.obj; w.group.attach(sun);
    ctx.audio.swell();
  }

  w.restore = (f) => {
    if (f.thaw1) {
      thaw = 1; frost.visible = false; petals.forEach(p => p.pm.rotation.x = p.open);
      rings.forEach(rg => rg.g.rotation.copy(rg.target)); planks.forEach(p => { p.scale.setScalar(1); if (p.userData.broken) p.position.y = p.userData.y0; });
      if (!f.keyUsed) { key.visible = true; keyItem.active = true; }
    }
  };
  w.onEnter = () => { ctx.story.say('w1_enter', { once: true }); if (!ctx.story.get('thaw1')) ctx.story.setGoal('w1', ['lotus_frozen', 'pollen_hint']); };
  w.build();
  return w;
}
