// 第 3 界 · 露珠浮世绘深海（浮世绘木版 × 金缮）
import * as THREE from 'three';
import { World } from '../world.js';
import { M, box, cyl, cone, sph, ball, torus, oct, parametric, combine, rng, smooth, V3, clamp } from '../geo.js';
import { glowMat } from '../styles.js';
import { LABELS } from '../text.js';

const PAL = {
  sea: { a: '#3E6F9E', b: '#1D3557', c: '#F1FAEE' },
  wave: { a: '#3C78AE', b: '#1D3557', c: '#FFD166' },
  wood: { a: '#E9D8B4', b: '#7A5A44', c: '#FFD166' },
  whale: { a: '#B79A72', b: '#2C3E5C', c: '#FFD166' },
  stone: { a: '#DCE3E0', b: '#3A4F6B', c: '#FFD166' },
  foam: { a: '#F1FAEE', b: '#A8C3D8', c: '#FFD166' },
  gold: { a: '#FFD166', b: '#9C6F1E', c: '#FFF3C4' },
  verm: { a: '#E4572E', b: '#7C2A1C', c: '#FFD166' },
  orb: { a: '#BFE3F7', b: '#2E6DA4', c: '#F1FAEE' },
};

export function buildW3(ctx) {
  const portal = V3(0, 1.12, -2.3);
  const w = new World(3, ctx, {
    style: 3, portal, wipe: '#10002B', glass: '#ff7ad1',
    fog: { fog: '#24476b', fogNear: 10, fogFar: 36, fogAmt: 0.55 }, light: [0.85, 0.45, 0.1],
    look: { shade: '#93a6cc', sun: '#fff2d8', low: '#26446c', rim: '#6a5430', hg: [-1.6, 1.8, -0.1, 0.35] },
  });
  const D = w.decor; const P = (k, extra = {}) => w.mat(k + (extra.water ? 'W' : ''), { ...PAL[k], side: THREE.DoubleSide, ...extra });
  const L = (k) => LABELS[k][ctx.lang()];
  const r = rng(44);

  // ---------- 海面（顶点缓慢起伏） ----------
  const sea = new THREE.PlaneGeometry(64, 64, 64, 64); sea.rotateX(-Math.PI / 2);
  const seaM = new THREE.Mesh(sea, P('sea', { water: true })); seaM.position.y = -0.7; w.group.add(seaM);

  // ---------- 木栈台 ----------
  for (let i = 0; i < 11; i++) D.add(box(0.27, 0.07, 3.6), P('wood'), M(-1.35 + i * 0.27, -0.035, 0.3, 0, (r() - 0.5) * 0.02, 0));
  D.add(box(3.1, 0.1, 0.16), P('wood'), M(0, -0.09, -1.45));
  D.add(box(3.1, 0.1, 0.16), P('wood'), M(0, -0.09, 2.05));
  for (const [x, z] of [[-1.45, -1.45], [1.45, -1.45], [-1.45, 2.05], [1.45, 2.05], [-1.45, 0.3], [1.45, 0.3]]) D.add(cyl(0.08, 0.1, 1.6, 6), P('wood'), M(x, -0.6, z));
  // 栏杆柱上的石灯笼
  for (const [x, z] of [[-1.45, 2.05], [1.45, 2.05]]) {
    D.add(cyl(0.06, 0.08, 0.7, 6), P('stone'), M(x, 0.35, z));
    D.add(box(0.26, 0.2, 0.26), P('stone'), M(x, 0.8, z));
    D.add(cone(0.24, 0.16, 4), P('stone'), M(x, 0.98, z, 0, Math.PI / 4, 0));
    const gl = new THREE.Mesh(box(0.14, 0.12, 0.27), glowMat('#ffd166', 0.6, { soft: false })); gl.position.set(x, 0.8, z); w.group.add(gl);
  }

  // ---------- 神奈川式巨浪 ----------
  const waveSurf = (H, curl) => {
    const US = 48, VS = 28;
    const g = parametric((u, v, out) => {
      const env = Math.pow(Math.sin(Math.PI * u), 0.8);
      const h = H * env;
      const th = v * curl;
      const rho = h * (1 - 0.62 * v);
      out.set((u - 0.5) * 18, rho * Math.sin(th), -rho * Math.cos(th));
      out.z += h * 0.3;
    }, US, VS);
    const f = new Float32Array((US + 1) * (VS + 1));
    for (let j = 0; j <= VS; j++) for (let i = 0; i <= US; i++) { const v = j / VS, u = i / US; f[j * (US + 1) + i] = Math.min(1, Math.max(0, (v - 0.32) * 2.2)) * (0.6 + 0.4 * Math.sin(Math.PI * u)); }
    g.setAttribute('aFoam', new THREE.BufferAttribute(f, 1));
    return g;
  };
  const bigWave = waveSurf(7, Math.PI * 1.55);
  D.add(bigWave, P('wave', { foam: true }), M(-4, -0.7, -12, 0, 0.35, 0));
  const w2g = waveSurf(4, Math.PI * 1.4);
  D.add(w2g, P('wave', { foam: true }), M(9, -0.7, -9, 0, -0.6, 0, 0.6, 1, 1));
  D.add(w2g, P('wave', { foam: true }), M(-10, -0.7, 4, 0, 1.9, 0, 0.7, 1, 1));
  D.add(w2g, P('wave', { foam: true }), M(7, -0.7, 9, 0, 3.6, 0, 0.5, 0.8, 0.8));
  // 浪尖的“爪”
  const claw = cone(0.12, 0.45, 4);
  for (let i = 0; i < 46; i++) {
    const u = 0.15 + (i / 46) * 0.7; const env = Math.pow(Math.sin(Math.PI * u), 0.8); const h = 7 * env;
    const v = 0.52 + r() * 0.12; const th = v * Math.PI * 1.55; const rho = h * (1 - 0.62 * v);
    const local = V3((u - 0.5) * 18, rho * Math.sin(th), -rho * Math.cos(th) + h * 0.3);
    const m = M(-4, -0.7, -12, 0, 0.35, 0).multiply(new THREE.Matrix4().makeTranslation(local.x, local.y, local.z)).multiply(M(0, 0, 0, Math.PI * 0.6 + r() * 0.5, 0, (r() - 0.5) * 0.6, 1 + r(), 1 + r(), 1));
    D.add(claw, P('foam'), m);
  }
  // 远处的富士山（雪顶）
  D.add(cone(6, 4.5, 12), P('stone'), M(-2, 1.2, -27, 0, 0.2, 0));
  D.add(cone(2.2, 1.7, 12), P('foam'), M(-2, 2.65, -27, 0, 0.2, 0));

  // ---------- 木雕巨鲸神庙 ----------
  const whale = new THREE.Group(); w.group.add(whale);
  const wm = P('whale');
  // 鲸身：头部饱满、向尾部收窄、腹部略平
  const whaleGeo = (flatBottom) => { const g = new THREE.SphereGeometry(1, 56, 36); g.rotateX(Math.PI / 2); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const z = p.getZ(i); const t = z < 0.2 ? 0.38 + 0.62 * Math.pow((z + 1) / 1.2, 0.8) : 1 - (z - 0.2) * 0.12; let y = p.getY(i) * t; if (flatBottom && y < 0) y *= 0.7; p.setXYZ(i, p.getX(i) * t, y, z); } g.computeVertexNormals(); return g; };
  const upper = new THREE.Mesh(whaleGeo(false), wm); upper.scale.set(2.0, 1.15, 5.6); upper.position.set(0, 2.0, -6.85); whale.add(upper);
  const jawPivot = new THREE.Group(); jawPivot.position.set(0, 0.95, -9.5); jawPivot.rotation.x = -0.06; whale.add(jawPivot);
  const jaw = new THREE.Mesh(whaleGeo(true), wm); jaw.scale.set(1.75, 0.48, 5.2); jaw.position.set(0, -0.3, 3.0); jawPivot.add(jaw);
  // 木雕肋环（金缮包边）
  const gm = P('gold');
  for (let i = 0; i < 6; i++) {
    const zz = -2.6 - i * 1.25; const dz = (zz + 6.85) / 5.6; const k = Math.sqrt(Math.max(0, 1 - dz * dz));
    const ring = new THREE.Mesh(torus(1, 0.035, 5, 40, Math.PI), gm); ring.scale.set(2.0 * k * 1.01, 1.15 * k * 1.01, 1); ring.position.set(0, 2.0, zz); whale.add(ring);
  }
  // 牙齿（金）
  const teeth = combine(Array.from({ length: 14 }, (_, i) => { const a = (i / 13) * Math.PI - Math.PI / 2; return [cone(0.06, 0.18, 4), M(Math.sin(a) * 1.15, 0.12, Math.cos(a) * 1.1 + 6.6 - 4.2, 0, 0, 0)]; }));
  const teethM = new THREE.Mesh(teeth, P('gold')); teethM.position.set(0, -0.08, -2.1); jawPivot.add(teethM);
  // 眼、鳍、尾
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(cyl(0.22, 0.22, 0.06, 16), P('gold')); eye.rotation.z = Math.PI / 2; eye.position.set(s * 1.72, 1.85, -3.4); eye.rotation.y = s * 0.25; whale.add(eye);
    const pupil = new THREE.Mesh(cyl(0.13, 0.13, 0.07, 16), P('sea')); pupil.rotation.z = Math.PI / 2; pupil.position.set(s * 1.74, 1.85, -3.4); whale.add(pupil);
    const fin = new THREE.Mesh(sph(1, 1), wm); fin.scale.set(1.4, 0.12, 0.6); fin.position.set(s * 2.2, 0.9, -5.4); fin.rotation.z = s * -0.5; whale.add(fin);
  }
  const tailF = new THREE.Mesh(combine([[sph(1, 1), M(-1.1, 0, 0, 0, 0, 0.3, 1.5, 0.12, 0.6)], [sph(1, 1), M(1.1, 0, 0, 0, 0, -0.3, 1.5, 0.12, 0.6)]]), wm);
  tailF.position.set(0, 2.6, -12.8); tailF.rotation.x = -0.4; whale.add(tailF);
  // 背上的小神社
  const shrine = combine([
    [box(0.1, 1.1, 0.1), M(-0.45, 0.55, 0)], [box(0.1, 1.1, 0.1), M(0.45, 0.55, 0)],
    [box(1.3, 0.1, 0.16), M(0, 1.12, 0)], [box(1.05, 0.07, 0.12), M(0, 0.92, 0)],
  ]);
  const torii = new THREE.Mesh(shrine, P('verm')); torii.position.set(0, 3.08, -5.2); whale.add(torii);
  const hut = new THREE.Mesh(combine([[box(0.7, 0.5, 0.6), M(0, 0.25, 0)], [cone(0.62, 0.45, 4), M(0, 0.72, 0, 0, Math.PI / 4, 0)]]), P('wood'));
  hut.position.set(0, 3.1, -6.6); whale.add(hut);
  // 锁住神庙的锚链
  for (let i = 0; i < 18; i++) { const t = i / 17; const x = 1.4 + t * 3.2, y = 1.2 - Math.sin(t * Math.PI) * 0.6 - t * 1.4, z = -4 + t * 1.6; D.add(torus(0.13, 0.035, 5, 10), P('stone'), M(x, y, z, 0, i % 2 ? Math.PI / 2 : 0, 0.5)); }
  D.add(combine([[box(0.12, 1.4, 0.12), M(0, 0.6, 0)], [torus(0.5, 0.08, 6, 16, Math.PI), M(0, -0.1, 0, 0, 0, Math.PI)], [box(0.8, 0.1, 0.1), M(0, 1.1, 0)]]), P('stone'), M(4.8, -1.0, -2.4, 0, 0.4, 0.2));
  // 珍珠（传送门）光晕
  const pearlGlow = new THREE.Mesh(ball(0.07, 14, 10), glowMat('#ff9ad8', 0.35)); pearlGlow.position.copy(portal); w.group.add(pearlGlow);
  w.animators.push((dt, t) => { pearlGlow.scale.setScalar(1 + Math.sin(t * 1.7) * 0.15); });

  // 额头的锁孔
  const socketPos = V3(0, 2.6, -2.1);
  const socket = new THREE.Group(); socket.position.copy(socketPos); socket.rotation.x = -0.75; whale.add(socket);
  socket.add(new THREE.Mesh(cyl(0.5, 0.55, 0.08, 20), P('gold')));
  const slot = new THREE.Mesh(box(0.1, 0.1, 0.42), P('sea')); slot.position.y = 0.04; socket.add(slot);
  const socketGlow = new THREE.Mesh(torus(0.55, 0.03, 6, 32), glowMat('#ffd166', 0.6, { soft: false })); socketGlow.rotation.x = Math.PI / 2; socketGlow.position.y = 0.05; socket.add(socketGlow);
  const SOCKET_R = 0.42; // 钥匙在本世界中的理想半径

  // ---------- 泉眼与镇海巨石 ----------
  const basinPos = V3(1.0, 0, -0.55);
  D.add(cyl(0.38, 0.45, 0.5, 10), P('stone'), M(basinPos.x, 0.25, basinPos.z));
  D.add(torus(0.36, 0.05, 6, 20), P('gold'), M(basinPos.x, 0.5, basinPos.z, Math.PI / 2, 0, 0));
  const boulder = new THREE.Group();
  const bm = new THREE.Mesh(sph(0.55, 2), w.mat('stoneItem', { ...PAL.stone, fog: false, height: false })); bm.scale.set(1, 0.85, 1); boulder.add(bm);
  boulder.position.set(basinPos.x, 0.95, basinPos.z); w.group.add(boulder);
  const boulderItem = ctx.interact.addItem({ id: 'boulder', obj: boulder, radius: 0.55, label: () => L('boulder'),
    onGrab: () => { ctx.story.poke(); } });
  boulderItem.denyHeavy = 'too_heavy';
  // 水球
  const orb = new THREE.Group();
  const om = new THREE.Mesh(ball(0.17, 20, 14), P('orb', { pat: 6, fog: false, height: false })); orb.add(om);
  const og = new THREE.Mesh(ball(0.24, 14, 10), glowMat('#8fd0ff', 0.4)); orb.add(og);
  orb.position.set(basinPos.x, 0.3, basinPos.z); orb.visible = false; w.group.add(orb);
  const orbItem = ctx.interact.addItem({ id: 'orb', obj: orb, radius: 0.19, label: () => L('orb'), grabbable: () => orb.visible,
    onGrab: () => { if (!ctx.story.get('watered')) ctx.story.setGoal('orb', ['orb_hint']); } });
  orbItem.active = false;
  let orbRise = -1;
  w.animators.push((dt, t) => { om.rotation.y = t * 0.6; og.scale.setScalar(1 + Math.sin(t * 2.2) * 0.08); });
  // 泉水喷涌
  const jet = new THREE.Mesh(cyl(0.05, 0.16, 0.9, 10, true), glowMat('#bfe6ff', 0.5)); jet.position.set(basinPos.x, 0.9, basinPos.z); jet.visible = false; w.group.add(jet);

  // ---------- 可触碰 ----------
  const wt = new THREE.Object3D(); wt.position.set(0, 1.9, -1.8); w.group.add(wt);
  ctx.interact.addTouch({ id: 'whale', obj: wt, radius: 0.9, label: () => L('whale'), onTouch: () => {
    if (ctx.story.get('whaleAwake')) ctx.story.say('pearl_hint', { cooldown: 4 });
    else ctx.story.say('whale_lock', { cooldown: 4 });
  } });

  // ---------- 逻辑 ----------
  const _a = new THREE.Vector3(), _b = new THREE.Vector3();
  let keyIn = -1, jawOpen = 0, lastSizeMsg = 0;
  w.update = (dt, t) => {
    const S = ctx.story;
    // 巨石离开泉眼
    if (!S.get('springFree')) {
      let free = false;
      if (boulderItem.worldObj !== w) free = true;
      else if (!boulderItem.held) { if (boulder.position.distanceTo(V3(basinPos.x, 0.95, basinPos.z)) > 0.9) free = true; }
      if (free) { S.set('springFree'); orb.visible = true; orbItem.active = true; orbRise = 0; jet.visible = true; ctx.audio.chime(3); S.say('spring_free'); S.setGoal('orb', ['orb_hint']); }
    }
    if (orbRise >= 0) { orbRise += dt; if (!orbItem.held && orb.parent === w.group) orb.position.y = 0.3 + smooth(0, 2, orbRise) * 1.0 + Math.sin(t * 1.5) * 0.03; if (orbRise > 3) { jet.visible = false; orbRise = -1; } }
    if (orb.visible && !orbItem.held && orb.parent === w.group && orbRise < 0) orb.position.y = 1.3 + Math.sin(t * 1.5) * 0.03;
    // 钥匙插入
    const key = ctx.items.key;
    if (keyIn < 0 && !S.get('whaleAwake') && key && key.held && ctx.interact.contextOf(key) === w) {
      key.centerWorld(_a); socket.getWorldPosition(_b);
      const rel = key.physR / w.group.scale.x;
      const gSock = SOCKET_R * w.group.scale.x;
      const d = _a.distanceTo(_b);
      if (d < Math.max(0.35, gSock * 1.6)) {
        const ratio = rel / SOCKET_R;
        socketGlow.material.uniforms.uO.value = 0.6 + Math.sin(t * 10) * 0.3;
        if (ratio < 0.6) { if (t - lastSizeMsg > 6) { S.say('key_small'); lastSizeMsg = t; } }
        else if (ratio > 1.7) { if (t - lastSizeMsg > 6) { S.say('key_big'); lastSizeMsg = t; } }
        else if (d < Math.max(0.22, gSock * 1.1)) { insertKey(key); }
      }
    }
    if (keyIn >= 0) {
      keyIn += dt;
      const k = ctx.items.key.obj;
      k.position.lerp(V3(0, 0.25, 0), Math.min(1, dt * 4));
      k.rotation.set(-Math.PI / 2, 0, keyIn * 4);
      if (keyIn > 2.2) { keyIn = -1; S.set('whaleAwake'); S.set('keyUsed'); ctx.audio.swell(); S.say('whale_wake'); }
    }
    if (S.get('whaleAwake') && jawOpen < 1) {
      jawOpen = Math.min(1, jawOpen + dt * 0.3);
      jawPivot.rotation.x = -0.06 + smooth(0, 1, jawOpen) * 0.2;
      if (jawOpen >= 1 && !w.open) { w.open = true; S.pigment(3); S.setGoal('pearl', ['pearl_hint']); }
    }
    whale.position.y = Math.sin(t * 0.35) * 0.012;
  };
  function insertKey(key) {
    ctx.consume('key', false);
    const k = key.obj; socket.attach(k);
    keyIn = 0; ctx.audio.unlock(); ctx.story.say('key_fit');
    // 统一到插槽尺寸
    const s = k.scale.x; const want = SOCKET_R / key.radius; k.userData.s0 = s;
    k.scale.setScalar(want * 0.9);
  }

  w.restore = (f) => {
    if (f.springFree) { boulder.position.set(basinPos.x - 2.2, 0.9, basinPos.z + 1.6); if (!f.watered) { orb.visible = true; orbItem.active = true; orb.position.y = 1.3; } }
    if (f.whaleAwake) { jawOpen = 1; jawPivot.rotation.x = 0.14; w.open = true; }
  };
  w.onEnter = () => {
    ctx.story.say('w3_enter', { once: true });
    if (!ctx.story.get('springFree')) ctx.story.setGoal('boulder', ['boulder_hint', 'boulder_hint']);
    else if (ctx.story.get('watered') && !ctx.story.get('whaleAwake')) ctx.story.setGoal('whale', ['whale_lock', 'key_small']);
  };
  w.build();
  return w;
}
