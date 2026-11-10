// Guided head scan: live face mesh, pose targets with auto-shutter, and gallery import.
import { getVideoLandmarker, detectFace, packFace, headCrop, loadVision, switchToCpu, visionDelegate, FACE_OVAL as OVAL } from './vision.js?v=202611101949';
import { canvasOf, canvasToBlob } from './composite.js?v=202611101949';

const DEBUG = /[?&]debug=1/.test(location.search);

// Preview mirroring. Browsers disagree: some mirror the front camera themselves, some do not, and
// the pixels MediaPipe sees can differ from what a <video> shows. So the preview is drawn on a canvas
// from the very same frame that is analysed and saved; this switch only decides whether that frame
// is flipped (selfie-mirror) or kept as the camera delivers it.
const MIRROR_KEY = 'hm.mirror';
function readMirror() {
  try {
    const v = localStorage.getItem(MIRROR_KEY);
    if (v != null) return v === '1';
  } catch {}
  return !/MicroMessenger/i.test(navigator.userAgent); // best guess; the on-screen switch overrides it
}

export const OUT_W = 768;
export const OUT_H = 1024;

export const STEPS = [
  { key: 'front', zh: '正面', tip: '正对镜头，保持不动' },
  { key: 'left', zh: '左侧', tip: '脸慢慢转向画面左边' },
  { key: 'right', zh: '右侧', tip: '脸慢慢转向画面右边' },
  { key: 'up', zh: '抬头', tip: '下巴微微抬起' },
  { key: 'down', zh: '低头', tip: '下巴微微收低' },
];
export const ANGLE_ZH = { front: '正面', left: '左侧', right: '右侧', up: '抬头', down: '低头', other: '其他' };
export const ANGLE_ORDER = { left: 0, up: 1, front: 2, down: 3, right: 4, other: 5 };

/** Legacy 2D ratios (kept in stored photos for old data); the real pose is headPose(). */
export function geoPose(lm) {
  const L = lm[234], R = lm[454], nose = lm[1];
  const half = Math.abs(R.x - L.x) / 2 || 1;
  const yawG = (nose.x - (L.x + R.x) / 2) / half;
  const eyeY = (lm[33].y + lm[263].y) / 2;
  const pitchR = (nose.y - eyeY) / (lm[152].y - eyeY || 1);
  const roll = (Math.atan2(lm[263].y - lm[33].y, lm[263].x - lm[33].x) * 180) / Math.PI;
  return { yawG, pitchR, roll };
}

/**
 * Head pose in degrees from MediaPipe's 3D face fit (vision.poseFromMatrix).
 * Everything in the app (live preview, thumbnails, studio, imports) shows the same un-mirrored
 * frame, and "left"/"right" mean what you see there: the face points to the left / right of the photo.
 *   yaw  < 0 : face points to the LEFT of the photo   (angle "left")
 *   yaw  > 0 : face points to the RIGHT of the photo  (angle "right")
 *   pitch: + = head down, - = chin up (relative to the person's own straight-on photo via `base`)
 */
export function headPose(face) {
  return { ...geoPose(face.landmarks), ...face.pose };
}

const YAW_SIDE = 22; // beyond this a photo counts as a side view
const PITCH_STEP = 12; // beyond this (vs. the front photo) it counts as looking up / down
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const ramp = (v, from, to) => clamp01((v - from) / (to - from));
const pitchUp = (p, base = 0) => -(p.pitch - base); // + = chin up

/** 0..1 progress toward a step's pose target. */
export function stepScore(key, p, base = 0) {
  if (Math.abs(p.roll) > 18) return 0;
  const up = pitchUp(p, base);
  switch (key) {
    case 'front':
      return Math.min(1 - ramp(Math.abs(p.yaw), 6, 14), 1 - ramp(Math.abs(up), 6, 14));
    case 'left':
    case 'right': {
      const v = key === 'left' ? -p.yaw : p.yaw;
      const s = v > 48 ? 1 - ramp(v, 48, 58) : ramp(v, 6, 24);
      return s * (1 - ramp(Math.abs(up), 12, 22));
    }
    case 'up':
    case 'down': {
      const v = key === 'up' ? up : -up;
      const s = v > 35 ? 1 - ramp(v, 35, 45) : ramp(v, 4, 12);
      return s * (1 - ramp(Math.abs(p.yaw), 12, 22));
    }
  }
  return 0;
}

/** Short on-screen advice for the current step. */
export function poseHint(key, p, base = 0) {
  const up = pitchUp(p, base);
  if (key === 'front') {
    if (Math.abs(p.yaw) > 6) return '头摆正，正对镜头';
    if (Math.abs(up) > 6) return '下巴放平，别抬也别低';
    return '头摆正，眼睛看镜头';
  }
  if (key === 'left' || key === 'right') {
    const v = key === 'left' ? -p.yaw : p.yaw;
    if (v > 48) return '转过头了，回来一点';
    if (Math.abs(up) > 12) return '下巴放平，只转头';
    if (v < 24) return '再多转一点（约 30°）';
    return '保持住…';
  }
  const v = key === 'up' ? up : -up;
  if (v > 35) return '幅度小一点就好';
  if (Math.abs(p.yaw) > 12) return key === 'up' ? '脸朝前，只抬头' : '脸朝前，只低头';
  if (v < 12) return key === 'up' ? '下巴再抬高一点' : '下巴再收低一点';
  return '保持住…';
}

/**
 * Is the whole head comfortably inside what the person can see (not too close, not cut off)?
 * `vis` is the part of the video frame visible on screen ({x0,y0,x1,y1} in video px); the preview
 * fills the screen, so on tall phones the sides of the frame are not shown.
 */
export function frameFit(face, vw, vh, vis = { x0: 0, y0: 0, x1: vw, y1: vh }) {
  const b = face.box;
  const hr = b.h / (vis.y1 - vis.y0);
  if (hr > 0.5) return 'near';
  if (hr < 0.12) return 'far';
  const mx = (vis.x1 - vis.x0) * 0.02, my = (vis.y1 - vis.y0) * 0.02;
  if (b.x < vis.x0 + mx || b.x + b.w > vis.x1 - mx || b.y + b.h > vis.y1 - my) return 'edge';
  if (b.y < vis.y0 + b.h * 0.25) return 'top'; // keep a little room above the forehead for the hair
  return 'ok';
}

/** Crop a portrait around the head from any source, return {blob, face(in crop px), pose}. */
export async function cropHead(source, sw, sh, faceInSource) {
  const face = faceInSource || (await detectFace(source));
  if (!face) return null;
  const r = headCrop(face, sw, sh);
  const c = canvasOf(OUT_W, OUT_H);
  const g = c.getContext('2d');
  g.imageSmoothingQuality = 'high';
  g.drawImage(source, r.x, r.y, r.w, r.h, 0, 0, OUT_W, OUT_H);
  const f2 = await detectFace(c);
  const blob = await canvasToBlob(c, 'image/jpeg', 0.92);
  return { blob, canvas: c, face: f2 || face, pose: headPose(f2 || face) };
}

export function compactLandmarks(face) {
  // normalised x,y pairs, rounded, for the scan animation and face-shape hints
  const out = new Array(face.landmarks.length * 2);
  face.landmarks.forEach((p, i) => {
    out[i * 2] = Math.round((p.x / face.width) * 1e4) / 1e4;
    out[i * 2 + 1] = Math.round((p.y / face.height) * 1e4) / 1e4;
  });
  return out;
}

export function classifyAngle(p, base = 0) {
  const up = pitchUp(p, base);
  const ay = Math.abs(p.yaw) / YAW_SIDE;
  const ap = Math.abs(up) / PITCH_STEP;
  if (ay < 1 && ap < 1) return 'front';
  if (ay >= ap) return p.yaw < 0 ? 'left' : 'right';
  return up > 0 ? 'up' : 'down';
}

/**
 * Label imported photos from their real head pose. The most straight-on photo sets the neutral
 * pitch. One photo per angle: if two land on the same angle the better fit wins, the other is dropped.
 * Returns [{shot, angle}].
 */
export function planAngles(shots) {
  if (!shots.length) return [];
  const frontal = shots.reduce((a, b) => (Math.hypot(b.pose.yaw, b.pose.pitch) < Math.hypot(a.pose.yaw, a.pose.pitch) ? b : a));
  const base = Math.abs(frontal.pose.yaw) < 12 ? Math.max(-12, Math.min(12, frontal.pose.pitch)) : 0;
  const best = new Map();
  for (const shot of shots) {
    const angle = classifyAngle(shot.pose, base);
    const fit = stepScore(angle, shot.pose, base);
    const cur = best.get(angle);
    if (!cur || fit > cur.fit) best.set(angle, { shot, angle, fit });
  }
  return [...best.values()].sort((a, b) => ANGLE_ORDER[a.angle] - ANGLE_ORDER[b.angle]).map(({ shot, angle }) => ({ shot, angle }));
}

/** Load a File/Blob into a canvas honouring EXIF orientation, capped in size. */
export async function fileToCanvas(file, max = 2048) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = canvasOf(Math.round(img.naturalWidth * s), Math.round(img.naturalHeight * s));
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Live guided capture controller.
 * ui: {video, hud, tipEl, subEl, steps(el list by key), shutter, onShot(result, stepKey)}
 */
export class GuidedCapture {
  constructor(ui) {
    this.ui = ui;
    this.stream = null;
    this.running = false;
    this.done = new Set();
    this.baseline = 0; // neutral pitch (deg) from the person's own front shot
    this.hold = 0;
    this.lastT = 0;
    this.lastFace = null;
    this.busy = false;
    this.mirror = readMirror();
    this.frame = document.createElement('canvas'); // the analysed frame (mirrored like the preview)
    this.view = null;
  }

  setMirror(on) {
    this.mirror = !!on;
    this.hold = 0;
    try { localStorage.setItem(MIRROR_KEY, this.mirror ? '1' : '0'); } catch {}
  }

  get current() {
    return STEPS.find((s) => !this.done.has(s.key)) || null;
  }

  async start() {
    await loadVision();
    const tries = [
      { audio: false, video: { facingMode: 'user', width: { ideal: 1440 }, height: { ideal: 1920 }, aspectRatio: { ideal: 3 / 4 } } },
      { audio: false, video: { facingMode: 'user' } },
    ];
    let err = null;
    for (const c of tries) {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia(c);
        break;
      } catch (e) {
        err = e;
        if (e.name === 'NotAllowedError' || e.name === 'NotFoundError' || e.name === 'SecurityError') throw e;
      }
    }
    if (!this.stream) throw err;
    await this.widestView();
    const v = this.ui.video;
    v.srcObject = this.stream;
    v.setAttribute('playsinline', '');
    v.muted = true;
    await v.play();
    if (!this.view) {
      this.view = document.createElement('canvas');
      this.view.id = 'camView';
      v.insertAdjacentElement('afterend', this.view);
    }
    this.lm = await getVideoLandmarker();
    this.startedAt = performance.now();
    this.seenFace = false;
    this.errs = 0;
    this.running = true;
    this.loop();
  }

  /** Use the camera's widest field of view when the browser exposes zoom (some phones start zoomed in). */
  async widestView() {
    const track = this.stream && this.stream.getVideoTracks()[0];
    if (!track || !track.getCapabilities) return;
    try {
      const caps = track.getCapabilities();
      const cur = track.getSettings && track.getSettings().zoom;
      if (caps.zoom && typeof cur === 'number' && cur > 1) await track.applyConstraints({ advanced: [{ zoom: Math.max(1, caps.zoom.min || 1) }] });
    } catch (e) {
      console.warn('zoom-out failed', e);
    }
  }

  stop() {
    this.running = false;
    if (this.view) { this.view.remove(); this.view = null; }
    if (this.stream) this.stream.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }

  loop = () => {
    if (!this.running) return;
    requestAnimationFrame(this.loop);
    const v = this.ui.video;
    if (v.readyState < 2 || !v.videoWidth) return;
    this.drawView();
    if (this.swapping) return;
    const now = performance.now();
    if (now - this.lastT < 66) return; // ~15 fps analysis
    const dt = Math.min(200, now - this.lastT);
    this.lastT = now;
    let res;
    const fr = this.grabFrame();
    try {
      res = this.lm.detectForVideo(fr, now);
    } catch {
      this.errs++;
      this.maybeCpu(now);
      return;
    }
    const face = res.faceLandmarks && res.faceLandmarks.length ? packFace(res, fr.width, fr.height) : null;
    this.lastFace = face;
    if (face) this.seenFace = true;
    else this.maybeCpu(now);
    const step = this.current;
    let score = 0;
    if (face && step) {
      const p = headPose(face);
      score = stepScore(step.key, p, this.baseline);
      const fit = frameFit(face, fr.width, fr.height, this.visibleRect());
      if (fit !== 'ok') score = Math.min(score, 0.5);
      this.dbg = { fit, yaw: p.yaw, pitch: p.pitch, score };
      this.ui.onStatus && this.ui.onStatus({ face: true, fit, score, step, pose: p, hint: poseHint(step.key, p, this.baseline) });
      if (score >= 0.98 && !this.busy) {
        this.hold += dt;
        if (this.hold > 650) this.shoot(step.key);
      } else this.hold = Math.max(0, this.hold - dt * 2);
    } else {
      this.hold = 0;
      this.ui.onStatus && this.ui.onStatus({ face: !!face, step, score: 0 });
    }
    this.drawHud(face, score, this.hold / 650);
  };

  /** Paint the live preview (full-screen cover fit) from the video, flipped if mirroring is on. */
  drawView() {
    const v = this.ui.video, c = this.view;
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cw = Math.round(c.clientWidth * dpr), ch = Math.round(c.clientHeight * dpr);
    if (!cw || !ch) return;
    if (c.width !== cw || c.height !== ch) { c.width = cw; c.height = ch; }
    const g = c.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    const sc = Math.max(cw / v.videoWidth, ch / v.videoHeight);
    const dw = v.videoWidth * sc, dh = v.videoHeight * sc;
    if (this.mirror) { g.translate(cw, 0); g.scale(-1, 1); }
    g.drawImage(v, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }

  /** Downscaled copy of the current frame for face analysis (same flip as the preview). */
  grabFrame() {
    const v = this.ui.video, f = this.frame;
    const k = Math.min(1, 960 / Math.max(v.videoWidth, v.videoHeight));
    const w = Math.round(v.videoWidth * k), h = Math.round(v.videoHeight * k);
    if (f.width !== w || f.height !== h) { f.width = w; f.height = h; }
    const g = f.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (this.mirror) { g.translate(w, 0); g.scale(-1, 1); }
    g.drawImage(v, 0, 0, w, h);
    return f;
  }

  /** Part of the analysed frame that is visible on screen (preview uses a cover fit), in frame px. */
  visibleRect() {
    const f = this.frame, c = this.ui.hud;
    const cw = c.clientWidth || 1, ch = c.clientHeight || 1;
    const sc = Math.max(cw / f.width, ch / f.height);
    const gx = (f.width - cw / sc) / 2, gy = (f.height - ch / sc) / 2;
    return { x0: gx, y0: gy, x1: f.width - gx, y1: f.height - gy };
  }

  /** No face for 3 s (or detector errors) on the GPU delegate: some phones need the CPU one. */
  maybeCpu(now) {
    if (this.swapping || this.seenFace && !this.errs) return;
    if (this.cpuTried || now - this.startedAt < 3000) return;
    this.cpuTried = true;
    this.swapping = true;
    (async () => {
      try {
        if (await switchToCpu()) this.lm = await getVideoLandmarker();
      } catch (e) {
        console.warn('cpu fallback failed', e);
      } finally {
        this.startedAt = performance.now();
        this.errs = 0;
        this.swapping = false;
      }
    })();
  }

  /** Small status line for field debugging: open the page with ?debug=1. */
  drawDebug(g, cw, ch, face) {
    const v = this.ui.video;
    const d = this.dbg || {};
    const t = `${v.videoWidth}x${v.videoHeight} ${this.mirror ? 'mir' : 'raw'} ${visionDelegate()}${this.cpuTried ? '*' : ''} face:${face ? 1 : 0} errs:${this.errs || 0}` +
      (face ? ` fit:${d.fit} yaw:${(d.yaw || 0).toFixed(0)} pit:${(d.pitch || 0).toFixed(0)} sc:${(d.score || 0).toFixed(2)}` : '');
    g.font = '11px monospace';
    g.fillStyle = 'rgba(0,0,0,.55)';
    g.fillRect(6, ch * 0.5 - 12, g.measureText(t).width + 8, 16);
    g.fillStyle = '#7CFC9A';
    g.fillText(t, 10, ch * 0.5);
  }

  drawHud(face, score, hold) {
    const c = this.ui.hud;
    const v = this.ui.video;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cw = c.clientWidth, ch = c.clientHeight;
    if (c.width !== Math.round(cw * dpr) || c.height !== Math.round(ch * dpr)) {
      c.width = Math.round(cw * dpr);
      c.height = Math.round(ch * dpr);
    }
    const g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, cw, ch);
    const t = performance.now() / 1000;
    const step = this.current;
    // direction chevrons: the preview shows exactly the analysed/saved frame, so "left" = toward the screen's left
    if (step && step.key !== 'front') {
      const dir = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[step.key];
      g.save();
      g.lineWidth = 3;
      g.lineCap = 'round';
      g.lineJoin = 'round';
      for (let k = 0; k < 3; k++) {
        const ph = (t * 1.4 + k / 3) % 1;
        g.strokeStyle = `rgba(255,255,255,${0.15 + 0.6 * Math.sin(ph * Math.PI)})`;
        const off = 26 + k * 18;
        const bx = dir[0] ? (dir[0] < 0 ? off : cw - off) : cw / 2;
        const by = dir[1] ? (dir[1] < 0 ? ch * 0.2 + 30 - k * 18 : ch * 0.68 + k * 18) : ch * 0.45;
        g.beginPath();
        if (dir[0]) {
          g.moveTo(bx - dir[0] * -8, by - 14);
          g.lineTo(bx + dir[0] * 4, by);
          g.lineTo(bx - dir[0] * -8, by + 14);
        } else {
          g.moveTo(bx - 14, by - dir[1] * -8);
          g.lineTo(bx, by + dir[1] * 4);
          g.lineTo(bx + 14, by - dir[1] * -8);
        }
        g.stroke();
      }
      g.restore();
    }
    if (DEBUG) this.drawDebug(g, cw, ch, face);
    if (!face) return;
    const fw = this.frame.width, fh = this.frame.height;
    const s = Math.max(cw / fw, ch / fh); // full-screen cover fit, same as drawView()
    const ox = (cw - fw * s) / 2, oy = (ch - fh * s) / 2;
    const X = (p) => ox + p.x * s; // same raw frame as the saved photo
    const Y = (p) => oy + p.y * s;
    const lm = face.landmarks;
    const grad = g.createLinearGradient(0, Y({ y: face.box.y }), 0, Y({ y: face.box.y + face.box.h }));
    grad.addColorStop(0, '#49d6e8');
    grad.addColorStop(0.55, '#8f7cf7');
    grad.addColorStop(1, '#f39bc0');
    // mesh dots
    g.fillStyle = grad;
    g.globalAlpha = 0.55 + 0.4 * score;
    for (let i = 0; i < 468; i += 2) {
      const p = lm[i];
      g.fillRect(X(p) - 1.3, Y(p) - 1.3, 2.6, 2.6);
    }
    // face contour
    g.globalAlpha = 0.9;
    g.strokeStyle = grad;
    g.lineWidth = 1.6;
    g.beginPath();
    OVAL.forEach((i, k) => (k ? g.lineTo(X(lm[i]), Y(lm[i])) : g.moveTo(X(lm[i]), Y(lm[i]))));
    g.closePath();
    g.stroke();
    g.globalAlpha = 1;
    // progress ring around the head, kept on screen
    const cx = X({ x: face.box.x + face.box.w / 2 }), cy = Y({ y: face.box.y + face.box.h * 0.42 });
    const rx = Math.min(face.box.w * s * 0.8, cw * 0.46), ry = Math.min(face.box.h * s * 0.78, ch * 0.4);
    g.lineWidth = 2;
    g.strokeStyle = 'rgba(255,255,255,0.28)';
    g.beginPath();
    g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    g.stroke();
    const rg = g.createLinearGradient(cx - rx, cy - ry, cx + rx, cy + ry);
    rg.addColorStop(0, '#49d6e8');
    rg.addColorStop(0.5, '#8f7cf7');
    rg.addColorStop(1, '#f39bc0');
    g.strokeStyle = rg;
    g.lineWidth = 5;
    g.lineCap = 'round';
    const prog = score >= 0.98 ? 0.6 + 0.4 * Math.min(1, hold) : score * 0.6;
    if (prog > 0.01) {
      g.beginPath();
      g.ellipse(cx, cy, rx, ry, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * prog);
      g.stroke();
    }
  }

  async shoot(key, manual = false) {
    if (this.busy) return;
    this.busy = true;
    this.hold = 0;
    try {
      const v = this.ui.video;
      const frame = canvasOf(v.videoWidth, v.videoHeight);
      const fg = frame.getContext('2d');
      if (this.mirror) { fg.translate(frame.width, 0); fg.scale(-1, 1); }
      fg.drawImage(v, 0, 0);
      const shot = await cropHead(frame, frame.width, frame.height);
      if (!shot) {
        this.ui.onError && this.ui.onError('没有检测到人脸，请把脸放进取景框');
        return;
      }
      let angle = key;
      if (manual) angle = classifyAngle(shot.pose, this.baseline);
      if (angle === 'front' && !this.done.has('front')) this.baseline = Math.max(-12, Math.min(12, shot.pose.pitch));
      this.done.add(angle);
      await this.ui.onShot(shot, angle);
    } finally {
      setTimeout(() => (this.busy = false), 500);
    }
  }
}
