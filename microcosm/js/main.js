// 《画境坍缩：千界之眸》主程序：渲染器、输入（电脑 / 触屏 / Quest）、主循环
import * as THREE from 'three';
import { ZoomEngine } from './engine.js';
import { UI } from './ui.js';
import { Audio } from './audio.js';
import { Story } from './story.js';
import { Interact } from './interact.js';
import { buildW0 } from './worlds/w0.js';
import { buildW1 } from './worlds/w1.js';
import { buildW2 } from './worlds/w2.js';
import { buildW3 } from './worlds/w3.js';
import { buildW4 } from './worlds/w4.js';
import { buildW5 } from './worlds/w5.js';
import { createFinale } from './finale.js';
import { Post } from './post.js';
import { E, K } from './styles.js';
import { WORLD_NAMES } from './text.js';

THREE.ColorManagement.enabled = false;
const qs = new URLSearchParams(location.search);
const DEBUG = qs.has('debug');

// ---------------- 渲染器 ----------------
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType('local-floor');
renderer.xr.setFoveation(0.6);
renderer.xr.setFramebufferScaleFactor(0.9);

const scene = new THREE.Scene();
const rig = new THREE.Group(); scene.add(rig);
const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.01, 3000);
camera.position.set(0, E.y, 0); camera.rotation.order = 'YXZ';
rig.add(camera);
let post = null;
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); if (post) post.resize(); });

// ---------------- 核心系统 ----------------
const ui = new UI();
const audio = new Audio();
const story = new Story(ui, audio);
const ctx = {
  story, ui, audio, items: {}, worlds: [], engine: null, head: new THREE.Vector3(),
  lang: () => story.lang, mode: () => mode,
};
const interact = new Interact(ctx); ctx.interact = interact;
let mode = 'pc'; // pc | touch | vr

ctx.consume = (id, hide = true) => {
  const it = ctx.items[id]; if (!it) return;
  if (it.held) { scene.attach(it.obj); it.held = null; }
  it.active = false; if (hide) it.obj.visible = false;
  for (const h of hands) if (h.held === it) h.held = null;
  if (pc.held === it) pc.held = null;
};

const worlds = [buildW0, buildW1, buildW2, buildW3, buildW4, buildW5].map(b => b(ctx));
ctx.worlds = worlds;
const engine = new ZoomEngine(scene, rig, worlds); ctx.engine = engine;
engine.attachWipe(camera);
camera.add(ui.vigMesh);
scene.add(ui.panel);
const finale = createFinale(ctx);
try { post = new Post(renderer, scene, camera); } catch (e) { console.warn('post off', e); post = null; }

// ---------------- 关卡切换 ----------------
let finaleDone = false;
story.checkpoint = 0;
engine.onLevelChange = (from, to) => {
  const w = worlds[to];
  const wrapped = from === 5 && to === 0;
  if (to > from || wrapped) {
    if (wrapped && story.get('dotted') && !finaleDone) { runFinale(); return; }
    ui.worldTitle(to);
    if (!story.saidOnce.has(['', 'w1_enter', 'w2_enter', 'w3_enter', 'w4_enter', 'w5_enter'][to])) ui.flushVoice();
    if (w.onEnter) w.onEnter();
    if (!wrapped && to > story.checkpoint) { story.checkpoint = to; story.save(); }
  } else {
    ui.worldTitle(to);
  }
};
function runFinale() {
  finaleDone = true; story.set('finale');
  ui.worldTitle(0);
  finale.start(); audio.finaleMusic();
  ui.flushVoice(); story.say('finale');
  setTimeout(() => { engine.endless = true; story.say('endless'); showEndCard(); }, 15000);
}

// ---------------- 电脑端输入 ----------------
const keys = {};
const pc = { yaw: 0, pitch: 0, held: null, zoomVel: 0, locked: false };
const holdPoint = new THREE.Object3D(); camera.add(holdPoint); holdPoint.position.set(0.16, -0.14, -0.5);
addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (!started) return;
  if (e.code === 'KeyE' || e.code === 'KeyF') pcAct();
  if (DEBUG && /^Digit[0-5]$/.test(e.code)) debugJump(+e.code.slice(5));
  if (DEBUG && e.code === 'KeyP') debugSolve();
});
addEventListener('keyup', (e) => { keys[e.code] = false; });
canvas.addEventListener('click', () => {
  if (!started || mode !== 'pc') return;
  if (!pc.locked) { canvas.requestPointerLock && canvas.requestPointerLock(); return; }
  pcAct();
});
document.addEventListener('pointerlockchange', () => {
  pc.locked = document.pointerLockElement === canvas;
  document.body.classList.toggle('locked', pc.locked);
  if (started && mode === 'pc') document.getElementById('pause').classList.toggle('on', !pc.locked && !endShown);
});
addEventListener('mousemove', (e) => {
  if (!pc.locked) return;
  pc.yaw -= e.movementX * 0.0022; pc.pitch -= e.movementY * 0.0022;
  pc.pitch = Math.max(-1.45, Math.min(1.45, pc.pitch));
});
addEventListener('wheel', (e) => {
  if (!started || mode === 'vr') return;
  const d = Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY), 120) / 120;
  pc.zoomVel = Math.max(-1.2, Math.min(1.2, pc.zoomVel - d * 0.35));
}, { passive: true });

const _o = new THREE.Vector3(), _d = new THREE.Vector3(), _q = new THREE.Quaternion();
function camRay() { camera.getWorldPosition(_o); camera.getWorldDirection(_d); return [_o, _d]; }
function pcAct() {
  if (pc.held) { interact.release(pc.held); pc.held = null; return; }
  const [o, d] = camRay();
  const hit = interact.pick(o, d, 3.6);
  if (!hit) return;
  if (hit.kind === 'item') {
    const r = hit.target.physR;
    holdPoint.position.set(0.12, -0.12, -(0.32 + Math.min(r, 0.45) * 1.7));
    if (interact.grab(hit.target, holdPoint) && hit.target.active) pc.held = hit.target;
  } else { audio.touch(); hit.target.onTouch(); story.poke(); }
}

// ---------------- 触屏输入 ----------------
const touch = { look: null, move: null, pinch: null, moveVec: new THREE.Vector2(), tapT: 0 };
const joy = document.getElementById('joy'), joyKnob = document.getElementById('joyKnob');
canvas.addEventListener('touchstart', (e) => {
  if (!started) return;
  if (mode !== 'touch') { mode = 'touch'; document.body.classList.add('touchmode'); }
  for (const t of e.changedTouches) {
    if (t.clientX < innerWidth * 0.35 && t.clientY > innerHeight * 0.45 && !touch.move) { touch.move = { id: t.identifier, x: t.clientX, y: t.clientY }; joy.style.left = t.clientX + 'px'; joy.style.top = t.clientY + 'px'; joy.classList.add('on'); }
    else if (!touch.look) touch.look = { id: t.identifier, x: t.clientX, y: t.clientY, sx: t.clientX, sy: t.clientY, t: performance.now() };
  }
  if (e.touches.length >= 2) {
    const [a, b] = e.touches; touch.pinch = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }
  e.preventDefault();
}, { passive: false });
canvas.addEventListener('touchmove', (e) => {
  if (e.touches.length >= 2 && touch.pinch && !touch.move) {
    const [a, b] = e.touches; const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    pc.zoomVel = Math.max(-1.2, Math.min(1.2, pc.zoomVel + Math.log(d / touch.pinch) * 6)); touch.pinch = d; touch.look = null;
  }
  for (const t of e.changedTouches) {
    if (touch.move && t.identifier === touch.move.id) { const dx = t.clientX - touch.move.x, dy = t.clientY - touch.move.y; const l = Math.min(1, Math.hypot(dx, dy) / 50); const a = Math.atan2(dy, dx); touch.moveVec.set(Math.cos(a) * l, Math.sin(a) * l); joyKnob.style.transform = `translate(${Math.cos(a) * l * 32}px, ${Math.sin(a) * l * 32}px)`; }
    else if (touch.look && t.identifier === touch.look.id) { pc.yaw -= (t.clientX - touch.look.x) * 0.005; pc.pitch -= (t.clientY - touch.look.y) * 0.005; pc.pitch = Math.max(-1.45, Math.min(1.45, pc.pitch)); touch.look.x = t.clientX; touch.look.y = t.clientY; }
  }
  e.preventDefault();
}, { passive: false });
canvas.addEventListener('touchend', (e) => {
  for (const t of e.changedTouches) {
    if (touch.move && t.identifier === touch.move.id) { touch.move = null; touch.moveVec.set(0, 0); joy.classList.remove('on'); joyKnob.style.transform = ''; }
    else if (touch.look && t.identifier === touch.look.id) {
      if (Math.hypot(t.clientX - touch.look.sx, t.clientY - touch.look.sy) < 12 && performance.now() - touch.look.t < 300) pcAct();
      touch.look = null;
    }
  }
  if (e.touches.length < 2) touch.pinch = null;
}, { passive: false });

const zBtn = { in: false, out: false };
for (const [id, k] of [['zIn', 'in'], ['zOut', 'out']]) {
  const b = document.getElementById(id);
  b.addEventListener('pointerdown', (e) => { zBtn[k] = true; e.preventDefault(); });
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) b.addEventListener(ev, () => { zBtn[k] = false; });
}
document.getElementById('btnAct').addEventListener('click', () => { if (started) pcAct(); });

// ---------------- VR 输入 ----------------
const hands = [];
const rayGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);
for (let i = 0; i < 2; i++) {
  const c = renderer.xr.getController(i);
  rig.add(c);
  const ray = new THREE.Line(rayGeo, new THREE.LineBasicMaterial({ color: '#ffe8c2', transparent: true, opacity: 0.5 }));
  ray.scale.z = 1.5; c.add(ray);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffe8c2' })); c.add(tip);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.003, 6, 24), new THREE.MeshBasicMaterial({ color: '#d4a373' })); ring.position.z = -0.02; c.add(ring);
  const dotM = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffffff' })); dotM.visible = false; scene.add(dotM);
  const h = { c, ray, tip, dot: dotM, held: null, grip: false, src: null, hover: null, i };
  c.addEventListener('connected', (e) => { h.src = e.data; if (e.data.handedness === 'left') c.add(ui.wrist); });
  c.addEventListener('disconnected', () => { h.src = null; });
  c.addEventListener('selectstart', () => vrSelect(h));
  c.addEventListener('selectend', () => { if (h.held) { interact.release(h.held); h.held = null; pulse(h, 0.2, 30); } });
  c.addEventListener('squeezestart', () => { h.grip = true; });
  c.addEventListener('squeezeend', () => { h.grip = false; });
  hands.push(h);
}
function pulse(h, v, ms) { try { const a = h.src && h.src.gamepad && h.src.gamepad.hapticActuators && h.src.gamepad.hapticActuators[0]; if (a) a.pulse(v, ms); } catch (e) {} }
function vrSelect(h) {
  if (h.held) return;
  h.c.getWorldPosition(_o);
  const near = interact.near(_o, 0.07);
  if (near) { if (interact.grab(near.target, h.c, { fly: false }) && near.target.active) { h.held = near.target; pulse(h, 0.5, 40); } else pulse(h, 0.8, 80); return; }
  h.c.getWorldQuaternion(_q); _d.set(0, 0, -1).applyQuaternion(_q);
  const hit = interact.pick(_o, _d, 4.5);
  if (!hit) return;
  if (hit.kind === 'item') { if (interact.grab(hit.target, h.c) && hit.target.active) { h.held = hit.target; pulse(h, 0.5, 40); } else pulse(h, 0.8, 80); }
  else { audio.touch(); hit.target.onTouch(); story.poke(); pulse(h, 0.3, 30); }
}
let gripDist = 0, snapArmed = true;
function vrInput(dt) {
  let dz = 0;
  const [a, b] = hands;
  // 双手侧握：拉开放大，合拢缩小
  if (a.grip && b.grip) {
    const d = a.c.position.distanceTo(b.c.position);
    if (gripDist > 0 && d > 0.02) dz += Math.log(d / gripDist) / Math.log(K) * 3.2;
    gripDist = d;
  } else gripDist = 0;
  for (const h of hands) {
    const gp = h.src && h.src.gamepad; if (!gp) continue;
    const ax = gp.axes.length >= 4 ? [gp.axes[2], gp.axes[3]] : [gp.axes[0], gp.axes[1]];
    const dead = (v) => Math.abs(v) < 0.18 ? 0 : v;
    if (h.src.handedness === 'left') {
      const mx = dead(ax[0]), my = dead(ax[1]);
      if (mx || my) {
        camera.getWorldQuaternion(_q); const f = new THREE.Vector3(0, 0, -1).applyQuaternion(_q); f.y = 0; f.normalize(); const rt = new THREE.Vector3(-f.z, 0, f.x);
        rig.position.addScaledVector(f, -my * 1.5 * dt).addScaledVector(rt, mx * 1.5 * dt);
      }
    } else {
      const tx = dead(ax[0]), ty = dead(ax[1]);
      if (Math.abs(tx) > 0.7 && snapArmed) { snapTurn(-Math.sign(tx) * Math.PI / 6); snapArmed = false; }
      if (Math.abs(tx) < 0.3) snapArmed = true;
      if (Math.abs(ty) > Math.abs(tx)) dz += -ty * 0.5 * dt;
    }
  }
  return dz;
}
function snapTurn(a) {
  camera.getWorldPosition(_o);
  rig.rotation.y += a;
  rig.updateMatrixWorld(true);
  const after = camera.getWorldPosition(new THREE.Vector3());
  rig.position.x += _o.x - after.x; rig.position.z += _o.z - after.z;
}

// ---------------- 主循环 ----------------
let started = false, endShown = false, time = 0, zoomTarget = null;
const clock = new THREE.Clock();
const headTmp = new THREE.Vector3();
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  time += dt;
  const xr = renderer.xr.isPresenting;
  let dz = 0;
  if (started) {
    if (xr) dz = vrInput(dt);
    else {
      camera.rotation.set(pc.pitch, pc.yaw, 0);
      const sp = (keys.ShiftLeft || keys.ShiftRight) ? 0.35 : 1;
      if (keys.KeyZ || keys.Equal || keys.NumpadAdd || zBtn.in) pc.zoomVel = Math.min(1, pc.zoomVel + dt * 2.5);
      if (keys.KeyX || keys.Minus || keys.NumpadSubtract || zBtn.out) pc.zoomVel = Math.max(-1, pc.zoomVel - dt * 2.5);
      dz = pc.zoomVel * 0.55 * dt * sp;
      pc.zoomVel *= Math.pow(0.04, dt);
      if (Math.abs(pc.zoomVel) < 0.01) pc.zoomVel = 0;
      // 行走
      let mx = 0, mz = 0;
      if (keys.KeyW || keys.ArrowUp) mz -= 1; if (keys.KeyS || keys.ArrowDown) mz += 1;
      if (keys.KeyA || keys.ArrowLeft) mx -= 1; if (keys.KeyD || keys.ArrowRight) mx += 1;
      mx += touch.moveVec.x; mz += touch.moveVec.y;
      if (mx || mz) {
        const l = Math.min(1, Math.hypot(mx, mz)); const a = Math.atan2(mx, mz) + pc.yaw;
        rig.position.x += Math.sin(a) * l * 1.6 * dt * sp; rig.position.z += Math.cos(a) * l * 1.6 * dt * sp;
      }
    }
    const rr = Math.hypot(rig.position.x, rig.position.z);
    if (rr > 12) { rig.position.x *= 12 / rr; rig.position.z *= 12 / rr; }
  } else {
    // 标题画面：在画室里缓慢环视
    camera.rotation.set(-0.06 + Math.sin(time * 0.1) * 0.03, Math.sin(time * 0.08) * 0.35, 0);
  }
  if (zoomTarget !== null) { const d = zoomTarget - engine.z; dz = Math.max(-0.7 * dt, Math.min(0.7 * dt, d)); if (Math.abs(d) < 1e-4) { dz = d; zoomTarget = null; } }
  camera.getWorldPosition(headTmp); ctx.head.copy(headTmp);
  engine.update(dt, headTmp, dz, time);
  rig.updateMatrixWorld(true);
  camera.getWorldPosition(ctx.head);

  for (const w of worlds) { if (w.group.visible) w.baseUpdate(dt, time); w.update(dt, time); }
  finale.update(dt, time);
  interact.update(dt);
  story.tick(dt);

  // 指向提示
  if (started) {
    let tip = '';
    if (xr) {
      for (const h of hands) {
        h.c.getWorldPosition(_o); h.c.getWorldQuaternion(_q); _d.set(0, 0, -1).applyQuaternion(_q);
        const hit = h.held ? null : (interact.near(_o, 0.07) || interact.pick(_o, _d, 4.5));
        h.ray.scale.z = hit ? Math.max(0.05, hit.dist) : 1.5;
        h.ray.material.color.set(hit ? (hit.kind === 'item' ? '#9ff5e8' : '#ffd59a') : '#ffe8c2');
        h.dot.visible = !!hit; if (hit) h.dot.position.copy(_o).addScaledVector(_d, hit.dist);
        if (hit && !tip) tip = label(hit);
        if (h.held) tip = (story.lang === 'zh' ? '握着：' : 'Holding: ') + h.held.label();
      }
    } else {
      if (pc.held) tip = (story.lang === 'zh' ? '握着：' : 'Holding: ') + pc.held.label() + (story.lang === 'zh' ? '　（单击松开）' : '  (click to release)');
      else { const [o, d] = camRay(); const hit = interact.pick(o, d, 3.6); if (hit) tip = label(hit); }
      document.getElementById('cross').classList.toggle('hot', !!tip && !pc.held);
    }
    ui.setTip(tip);
    updateHud();
  }
  ui.update(dt, camera, engine.vel, xr);

  // 声音：当前世界与子世界的权重
  const wts = [0, 0, 0, 0, 0, 0];
  const f = engine.f;
  if (engine.inside) wts[engine.child.id] = 1; else { wts[engine.cur.id] = 1 - smoothF(0.7, 1, f) * 0.5; wts[engine.child.id] = smoothF(0.15, 0.95, f) * 0.8; }
  audio.update(dt, started ? wts : [0.6, 0, 0, 0, 0, 0], engine.vel);

  if (post && !xr && !qs.has('nopost')) { post.update(dt, engine.contextWorld.id); post.render(); }
  else renderer.render(scene, camera);
}
const smoothF = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function label(hit) {
  const zh = story.lang === 'zh';
  if (hit.kind === 'item') return (zh ? '握住 · ' : 'Grab · ') + hit.target.label();
  return (zh ? '触碰 · ' : 'Touch · ') + hit.target.label();
}
const hudEl = document.getElementById('hud');
let hudLast = '';
function updateHud() {
  const n = WORLD_NAMES[engine.cur.id];
  const mag = engine.S;
  const s = `${story.lang === 'zh' ? n.zh : n.en}${engine.canZoom ? ` · ×${mag < 10 ? mag.toFixed(1) : Math.round(mag)}` : ''}`;
  if (s !== hudLast) { hudEl.textContent = s; hudLast = s; }
}
renderer.setAnimationLoop(frame);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (worlds[5].redrawSeal) worlds[5].redrawSeal(); ui.panelDirty = true; });

// ---------------- 菜单 ----------------
const menu = document.getElementById('menu');
const saved = story.load();
if (saved && saved.flags && Object.keys(saved.flags).length) document.getElementById('btnContinue').style.display = '';
function applyLang() {
  document.documentElement.lang = story.lang === 'zh' ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-zh]').forEach(el => { el.innerHTML = el.dataset[story.lang]; });
  ui.setLang(story.lang); ui.pigments(story.pigments);
}
document.getElementById('btnLang').addEventListener('click', () => { story.lang = story.lang === 'zh' ? 'en' : 'zh'; try { localStorage.setItem('mc-lang', story.lang); } catch (e) {} applyLang(); });
try { const l = localStorage.getItem('mc-lang'); if (l) story.lang = l; else if (!navigator.language.startsWith('zh')) story.lang = 'en'; } catch (e) {}
applyLang();

function begin(continueGame) {
  audio.start();
  menu.classList.add('off');
  document.body.classList.add('playing');
  started = true;
  if (continueGame && saved) restore(saved);
  else { story.clear(); story.say('intro'); story.setGoal('lens', ['lens_hint', 'lens_hint']); ui.worldTitle(0); }
}
function restore(s) {
  story.flags = { ...s.flags }; story.pigments = s.pigments || story.pigments; story.checkpoint = s.checkpoint || 0;
  for (const w of worlds) if (w.restore) w.restore(story.flags);
  ui.pigments(story.pigments);
  let lv = Math.min(5, story.checkpoint);
  engine.canZoom = !!story.flags.lens;
  engine.jumpTo(lv);
  ui.worldTitle(lv);
  if (worlds[lv].onEnter) worlds[lv].onEnter();
  if (story.flags.finale) { finaleDone = true; engine.endless = true; worlds[0].setFinale(); }
}
document.getElementById('btnStart').addEventListener('click', () => { mode = matchMedia('(pointer: coarse)').matches ? 'touch' : 'pc'; if (mode === 'touch') document.body.classList.add('touchmode'); begin(false); if (mode === 'pc') canvas.requestPointerLock && canvas.requestPointerLock(); });
document.getElementById('btnContinue').addEventListener('click', () => { mode = matchMedia('(pointer: coarse)').matches ? 'touch' : 'pc'; begin(true); if (mode === 'pc') canvas.requestPointerLock && canvas.requestPointerLock(); });
document.getElementById('btnResume').addEventListener('click', () => { canvas.requestPointerLock && canvas.requestPointerLock(); });
document.getElementById('btnRestart').addEventListener('click', () => { story.clear(); location.reload(); });

const btnVR = document.getElementById('btnVR');
if (navigator.xr && navigator.xr.isSessionSupported) {
  navigator.xr.isSessionSupported('immersive-vr').then((ok) => { if (ok) { btnVR.style.display = ''; if (saved && saved.flags && Object.keys(saved.flags).length) document.getElementById('btnVRc').style.display = ''; } }).catch(() => {});
}
async function enterVR(continueGame) {
  try {
    const session = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor'] });
    await renderer.xr.setSession(session);
    mode = 'vr'; document.body.classList.add('vrmode');
    camera.position.set(0, 0, 0); camera.rotation.set(0, 0, 0);
    if (!started) begin(continueGame);
    session.addEventListener('end', () => { mode = 'pc'; document.body.classList.remove('vrmode'); camera.position.set(0, E.y, 0); });
  } catch (e) { console.error(e); alert((story.lang === 'zh' ? '无法进入 VR：' : 'Could not enter VR: ') + e.message); }
}
btnVR.addEventListener('click', () => enterVR(false));
document.getElementById('btnVRc').addEventListener('click', () => enterVR(true));

function showEndCard() {
  endShown = true;
  document.getElementById('endcard').classList.add('on');
  if (document.pointerLockElement) document.exitPointerLock();
}
document.getElementById('btnRoam').addEventListener('click', () => { document.getElementById('endcard').classList.remove('on'); endShown = false; if (mode === 'pc') canvas.requestPointerLock && canvas.requestPointerLock(); });

// ---------------- 调试 ----------------
function debugJump(lv) {
  const order = ['lens', 'emberGot', 'lit', 'open0', 'watered', 'foxAwake', 'foxLit', 'thaw1', 'keyDrop', 'keyGot', 'springFree', 'keyUsed', 'whaleAwake', 'prism_cyan', 'prism_mag', 'twoBeams', 'stitched'];
  const need = [0, 4, 4, 4, 13, 17][lv];
  for (let i = 0; i < need; i++) story.flags[order[i]] = true;
  for (let i = 0; i < 6; i++) if (i < lv) story.pigments[i] = true;
  for (const w of worlds) if (w.restore) w.restore(story.flags);
  for (const h of [pc]) if (h.held) { interact.release(h.held); h.held = null; }
  engine.canZoom = true; engine.jumpTo(lv); ui.pigments(story.pigments); ui.worldTitle(lv);
  if (worlds[lv].onEnter) worlds[lv].onEnter();
}
function debugSolve() {}
window.__mc = { THREE, scene, camera, rig, renderer, engine, worlds, story, interact, ctx, pc, ui, debugJump, begin, finale, setView: (y, p) => { pc.yaw = y; pc.pitch = p; }, holdPoint, zoomTo: (z) => { zoomTarget = z; }, get zoomBusy() { return zoomTarget !== null; } };
