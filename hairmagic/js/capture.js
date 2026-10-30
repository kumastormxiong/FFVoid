// Guided head scan: live face mesh, pose targets with auto-shutter, and gallery import.
import { getVideoLandmarker, detectFace, packFace, headCrop, loadVision, FACE_OVAL as OVAL } from './vision.js';
import { canvasOf, canvasToBlob } from './composite.js';

export const OUT_W = 768;
export const OUT_H = 1024;

export const STEPS = [
  { key: 'front', zh: '正面', tip: '正对镜头，保持不动' },
  { key: 'left', zh: '左侧', tip: '慢慢向左转头' },
  { key: 'right', zh: '右侧', tip: '慢慢向右转头' },
  { key: 'up', zh: '抬头', tip: '下巴微微抬起' },
  { key: 'down', zh: '低头', tip: '下巴微微收低' },
];
export const ANGLE_ZH = { front: '正面', left: '左侧', right: '右侧', up: '抬头', down: '低头', other: '其他' };
export const ANGLE_ORDER = { left: 0, up: 1, front: 2, down: 3, right: 4, other: 5 };

/** Geometric head pose from landmarks in an un-mirrored frame. */
export function geoPose(lm) {
  const L = lm[234], R = lm[454], nose = lm[1];
  const half = Math.abs(R.x - L.x) / 2 || 1;
  const yawG = (nose.x - (L.x + R.x) / 2) / half; // + = subject turned to their left
  const eyeY = (lm[33].y + lm[263].y) / 2;
  const pitchR = (nose.y - eyeY) / (lm[152].y - eyeY || 1);
  const roll = (Math.atan2(lm[263].y - lm[33].y, lm[263].x - lm[33].x) * 180) / Math.PI;
  return { yawG, pitchR, roll };
}

/** 0..1 progress toward a step's pose target. */
function stepScore(key, p, base) {
  const steady = Math.abs(p.roll) < 12;
  switch (key) {
    case 'front':
      return steady ? clamp01(1 - Math.abs(p.yawG) / 0.12) * clamp01(1 - (Math.abs(p.roll) - 6) / 6) : 0;
    case 'left':
      return p.yawG > 0.9 ? 0.6 : clamp01(p.yawG / 0.4);
    case 'right':
      return p.yawG < -0.9 ? 0.6 : clamp01(-p.yawG / 0.4);
    case 'up':
      return Math.abs(p.yawG) < 0.2 ? clamp01((base - p.pitchR) / 0.07) : 0;
    case 'down':
      return Math.abs(p.yawG) < 0.2 ? clamp01((p.pitchR - base) / 0.07) : 0;
  }
  return 0;
}
const clamp01 = (v) => Math.max(0, Math.min(1, v));

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
  return { blob, canvas: c, face: f2 || face, pose: geoPose((f2 || face).landmarks) };
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

export function classifyAngle(p, baseline = 0.42) {
  if (p.yawG > 0.3) return 'left';
  if (p.yawG < -0.3) return 'right';
  if (p.pitchR < baseline - 0.06) return 'up';
  if (p.pitchR > baseline + 0.06) return 'down';
  return 'front';
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
    this.baseline = 0.42;
    this.hold = 0;
    this.lastT = 0;
    this.lastFace = null;
    this.busy = false;
  }

  get current() {
    return STEPS.find((s) => !this.done.has(s.key)) || null;
  }

  async start() {
    await loadVision();
    const constraints = {
      audio: false,
      video: { facingMode: 'user', width: { ideal: 1440 }, height: { ideal: 1920 }, aspectRatio: { ideal: 3 / 4 } },
    };
    this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    const v = this.ui.video;
    v.srcObject = this.stream;
    v.setAttribute('playsinline', '');
    v.muted = true;
    await v.play();
    this.lm = await getVideoLandmarker();
    this.running = true;
    this.loop();
  }

  stop() {
    this.running = false;
    if (this.stream) this.stream.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }

  loop = () => {
    if (!this.running) return;
    requestAnimationFrame(this.loop);
    const v = this.ui.video;
    if (v.readyState < 2) return;
    const now = performance.now();
    if (now - this.lastT < 66) return; // ~15 fps analysis
    const dt = Math.min(200, now - this.lastT);
    this.lastT = now;
    let res;
    try {
      res = this.lm.detectForVideo(v, now);
    } catch {
      return;
    }
    const face = res.faceLandmarks && res.faceLandmarks.length ? packFace(res, v.videoWidth, v.videoHeight) : null;
    this.lastFace = face;
    const step = this.current;
    let score = 0;
    if (face && step) {
      const p = geoPose(face.landmarks);
      score = stepScore(step.key, p, this.baseline);
      const sizeOk = face.box.h > v.videoHeight * 0.22;
      if (!sizeOk) score = Math.min(score, 0.5);
      this.ui.onStatus && this.ui.onStatus({ face: true, sizeOk, score, step, pose: p });
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
    // direction chevrons (selfie preview is mirrored: subject's left = screen left)
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
    if (!face) return;
    const s = Math.max(cw / v.videoWidth, ch / v.videoHeight);
    const ox = (cw - v.videoWidth * s) / 2, oy = (ch - v.videoHeight * s) / 2;
    const X = (p) => cw - (ox + p.x * s); // mirrored to match the selfie preview
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
      frame.getContext('2d').drawImage(v, 0, 0);
      const shot = await cropHead(frame, frame.width, frame.height);
      if (!shot) {
        this.ui.onError && this.ui.onError('没有检测到人脸，请把脸放进取景框');
        return;
      }
      let angle = key;
      if (manual) angle = classifyAngle(shot.pose, this.baseline);
      if (angle === 'front' && !this.done.has('front')) this.baseline = shot.pose.pitchR;
      this.done.add(angle);
      await this.ui.onShot(shot, angle);
    } finally {
      setTimeout(() => (this.busy = false), 500);
    }
  }
}
