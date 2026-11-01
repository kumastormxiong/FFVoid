// 第 5 界 · 记忆炭笔原点（动态炭笔素描）—— 与第 0 界布局完全一致的未完成手稿
import * as THREE from 'three';
import { World } from '../world.js';
import { buildAtelier, ATELIER } from '../atelier.js';
import { drawPortrait, portraitMat, PW, PH } from '../portrait.js';
import { M, box, cyl, cone, sph, ball, torus, combine, rng, smooth, V3 } from '../geo.js';
import { glowMat, styleMat, hullMat } from '../styles.js';
import { archPoints } from '../stitch.js';
import { LABELS, PIGMENTS } from '../text.js';

export function buildW5(ctx) {
  const w = new World(5, ctx, {
    style: 5, portal: ATELIER.portal, wipe: '#F2CC8F', glass: '#ffc98a', ink: '#1A1817', inkW: 0.011, boil: true,
    fog: { fog: '#FAF3DD', fogNear: 10, fogFar: 32, fogAmt: 0.85 }, light: [-0.5, 0.7, 0.4],
  });
  const D = w.decor;
  const L = (k) => LABELS[k][ctx.lang()];
  const r = rng(66);
  buildAtelier(w, 5, { gaps: 0.28 });
  const paper = w.mat('paper5');

  // 素描版画作
  w.paintMat = portraitMat(drawPortrait('charcoal'));
  const painting = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), w.paintMat);
  painting.position.copy(ATELIER.paintCenter); w.group.add(painting);
  // 桌上的提灯与透镜（只是素描）
  D.add(combine([[cyl(0.075, 0.085, 0.03, 12), M(0, 0.015, 0)], [cyl(0.06, 0.075, 0.025, 12), M(0, 0.205, 0)], [cone(0.06, 0.07, 12), M(0, 0.25, 0)], [cyl(0.05, 0.05, 0.16, 10), M(0, 0.11, 0)]]), paper, M(ATELIER.table.x + 0.18, ATELIER.table.y, ATELIER.table.z - 0.12), true);
  D.add(torus(0.032, 0.005, 6, 24), paper, M(ATELIER.table.x - 0.24, ATELIER.table.y + 0.006, ATELIER.table.z - 0.05, Math.PI / 2, 0, 0), true);
  D.add(torus(0.032, 0.005, 6, 24), paper, M(ATELIER.table.x - 0.16, ATELIER.table.y + 0.006, ATELIER.table.z - 0.05, Math.PI / 2, 0, 0), true);

  // 凳子上搭着的外套 —— 画师不在，只剩下他的姿势
  const St = ATELIER.stool;
  const coat = new THREE.Mesh(sph(1, 2), paper); coat.scale.set(0.24, 0.05, 0.3); coat.position.set(St.x, 0.56, St.z); coat.rotation.z = 0.2; w.group.add(coat);
  coat.add(new THREE.Mesh(coat.geometry, w.ink));
  const sleeve = new THREE.Mesh(cyl(0.05, 0.07, 0.45, 8), paper); sleeve.position.set(St.x + 0.2, 0.35, St.z + 0.05); sleeve.rotation.z = 0.25; w.group.add(sleeve);
  sleeve.add(new THREE.Mesh(sleeve.geometry, w.ink));

  // ---------- 千界画笔 ----------
  const brush = new THREE.Group();
  const handle = new THREE.Mesh(cyl(0.008, 0.011, 0.26, 8), paper); handle.position.y = 0.06; brush.add(handle);
  handle.add(new THREE.Mesh(handle.geometry, w.ink));
  const ferrule = new THREE.Mesh(cyl(0.012, 0.01, 0.04, 8), styleMat(5, w.uniforms, { a: '#d9a866', b: '#1A1817', c: '#d9a866' })); ferrule.position.y = -0.09; brush.add(ferrule);
  const tipMat = styleMat(5, w.uniforms, { a: '#ffffff', b: '#1A1817', c: '#ff5fa2', emit: 0.85 });
  const tip = new THREE.Mesh(cone(0.012, 0.06, 10), tipMat); tip.rotation.x = Math.PI; tip.position.y = -0.14; brush.add(tip);
  const tipGlow = new THREE.Mesh(ball(0.035, 10, 8), glowMat('#ffffff', 0.6)); tipGlow.position.y = -0.15; brush.add(tipGlow);
  brush.position.set(St.x + 0.1, 1.28, St.z - 0.18); brush.rotation.z = -0.5;
  w.group.add(brush);
  const brushTipLocal = V3(0, -0.17, 0);
  const cols = PIGMENTS.map(p => new THREE.Color(p.c));
  w.animators.push((dt, t) => {
    const k = (t * 0.6) % 6; const i = Math.floor(k), f = k - i;
    const c = cols[i].clone().lerp(cols[(i + 1) % 6], f);
    tipMat.uniforms.uC.value.copy(c); tipGlow.material.uniforms.uC.value.copy(c);
    if (brush.parent === w.group && !ctx.story.get('brushGot')) { brush.position.y = 1.28 + Math.sin(t * 1.2) * 0.02; brush.rotation.y = Math.sin(t * 0.5) * 0.3; }
  });
  const brushItem = ctx.interact.addItem({ id: 'brush', obj: brush, radius: 0.15, label: () => L('brush'),
    onGrab: () => { if (!ctx.story.get('brushGot')) { ctx.story.set('brushGot'); ctx.story.say('brush_got'); ctx.story.setGoal('dot', ['brush_got']); } } });

  // ---------- 虚空里的炭笔拱（第 4 界缝合用） ----------
  const pts = archPoints(24);
  const curve = new THREE.CatmullRomCurve3(pts);
  const archMat = styleMat(5, w.uniforms, { a: '#FAF3DD', b: '#1A1817', c: '#FFD60A', emit: 0, fog: false });
  const tube = new THREE.TubeGeometry(curve, 48, 0.35, 8, false);
  const arch = new THREE.Mesh(tube, archMat); w.group.add(arch);
  arch.add(new THREE.Mesh(tube, hullMat(w.uniforms, '#1A1817', 0.08, true)));
  // 拱下的桥墩草稿线
  for (const i of [0, 8, 16, 24]) { const p = pts[i]; D.add(box(0.12, 6, 0.12), paper, M(p.x, p.y - 3, p.z), true); }
  w.arch = { setGlow: (a) => { archMat.uniforms.uEmit.value = a * a * 0.7; } };

  // ---------- 透视构造线、随手的草稿线 ----------
  const lineMat = w.mat('ink5', { a: '#1A1817', b: '#1A1817', c: '#1A1817', fog: true });
  const vp = V3(0, 1.6, -26);
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    const far = V3(Math.cos(a) * 22, 1.6 + Math.sin(a) * 14, 14);
    const len = vp.distanceTo(far); const mid = vp.clone().lerp(far, 0.5);
    const m = new THREE.Matrix4().lookAt(vp, far, V3(0, 1, 0)); m.setPosition(mid);
    D.add(box(0.02, 0.02, len), lineMat, m);
  }
  for (let i = 0; i < 26; i++) {
    const c = V3((r() - 0.5) * 30, r() * 10 - 1, (r() - 0.5) * 30); if (c.length() < 7) c.setLength(7 + r() * 5);
    const ps = []; for (let k = 0; k < 5; k++) ps.push(c.clone().add(V3((r() - 0.5) * 4, (r() - 0.5) * 2, (r() - 0.5) * 4)));
    D.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ps), 20, 0.015 + r() * 0.02, 3, false), lineMat, null);
  }
  // 朱红印章（漂浮）
  const sc = document.createElement('canvas'); sc.width = sc.height = 256; const g = sc.getContext('2d');
  const drawSeal = () => {
    g.fillStyle = '#D62828'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#FAF3DD'; g.fillRect(14, 14, 228, 228); g.fillStyle = '#D62828'; g.fillRect(24, 24, 208, 208);
    g.fillStyle = '#FAF3DD'; g.font = '96px "Ma Shan Zheng", serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('千界', 128, 82); g.fillText('之眸', 128, 180);
  };
  drawSeal();
  const sealTex = new THREE.CanvasTexture(sc);
  w.redrawSeal = () => { drawSeal(); sealTex.needsUpdate = true; };
  const seal = new THREE.Mesh(box(0.42, 0.42, 0.42), [0, 1, 2, 3, 4, 5].map(i => i === 4 ? new THREE.MeshBasicMaterial({ map: sealTex }) : new THREE.MeshBasicMaterial({ color: '#B71F1F' })));
  seal.position.set(1.6, 2.2, -2.2); seal.rotation.y = -0.5; w.group.add(seal);
  w.seal = seal; w.sealTex = sealTex;
  w.animators.push((dt, t) => { seal.rotation.y = -0.5 + Math.sin(t * 0.3) * 0.2; seal.position.y = 2.2 + Math.sin(t * 0.7) * 0.05; });

  // ---------- 可触碰 ----------
  const stT = new THREE.Object3D(); stT.position.set(St.x, 0.55, St.z); w.group.add(stT);
  ctx.interact.addTouch({ id: 'stool', obj: stT, radius: 0.3, label: () => L('stool'), onTouch: () => ctx.story.say('stool', { cooldown: 4 }) });
  ctx.interact.addTouch({ id: 'sketch', obj: painting, radius: 0.45, label: () => L('sketch'), active: () => !w.open, onTouch: () => { if (!ctx.story.get('brushGot')) ctx.story.say('stool', { cooldown: 4 }); else ctx.story.say('brush_got', { cooldown: 6 }); } });

  // ---------- 逻辑：用画笔点睛 ----------
  const _a = new THREE.Vector3(), _b = new THREE.Vector3();
  let dotT = -1;
  w.update = (dt, t) => {
    const S = ctx.story;
    if (!w.open && dotT < 0 && brushItem.held && ctx.interact.contextOf(brushItem) === w) {
      brush.localToWorld(_a.copy(brushTipLocal)); w.toGlobal(ATELIER.portal, _b);
      if (_a.distanceTo(_b) < 0.07 * Math.max(1, w.group.scale.x)) { dotT = 0; ctx.audio.swell(); }
    }
    if (dotT >= 0) {
      dotT += dt;
      if (dotT > 0.6 && !w.open) {
        w.paintMat.uniforms.uMap.value = drawPortrait('charcoal_open');
        ctx.worlds[0].setFinale();
        w.open = true; S.set('dotted'); S.pigment(5); S.say('dotted'); S.setGoal('enter5', []);
        ctx.engine.maxZ = Infinity;
      }
      if (dotT > 2) dotT = -1;
    }
  };
  w.onEnter = () => { archMat.uniforms.uEmit.value = 0; ctx.story.say('w5_enter', { once: true }); if (!w.open) ctx.story.setGoal('w5', ['stool', 'brush_got']); };
  w.restore = (f) => { if (f.dotted) { w.open = true; w.paintMat.uniforms.uMap.value = drawPortrait('charcoal_open'); ctx.worlds[0].setFinale(); brush.visible = false; brushItem.active = false; } };
  w.build();
  return w;
}
