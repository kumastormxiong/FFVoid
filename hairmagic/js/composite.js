// Identity lock: align the original photo to the AI result with face landmarks and blend the
// original face (eyes, nose, mouth, skin) back in, so only the hair changes.
import { detectFace, hairMask, FACE_OVAL, ALIGN_PTS } from './vision.js';

export function canvasOf(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export async function loadBitmap(blob) {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(blob);
    } catch {}
  }
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.src = url;
  await img.decode();
  return img;
}

export function toCanvas(src, w, h) {
  const c = canvasOf(w || src.width, h || src.height);
  const g = c.getContext('2d');
  g.imageSmoothingQuality = 'high';
  g.drawImage(src, 0, 0, c.width, c.height);
  return c;
}

export const canvasToBlob = (c, type = 'image/jpeg', q = 0.9) =>
  new Promise((res) => c.toBlob(res, type, q));

/** Least-squares similarity transform (Umeyama, 2-D) mapping src points to dst points. */
function similarity(src, dst) {
  const n = src.length;
  let sx = 0, sy = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) { sx += src[i].x; sy += src[i].y; dx += dst[i].x; dy += dst[i].y; }
  sx /= n; sy /= n; dx /= n; dy /= n;
  let a = 0, b = 0, ss = 0;
  for (let i = 0; i < n; i++) {
    const px = src[i].x - sx, py = src[i].y - sy;
    const qx = dst[i].x - dx, qy = dst[i].y - dy;
    a += px * qx + py * qy;
    b += px * qy - py * qx;
    ss += px * px + py * py;
  }
  const s = Math.hypot(a, b) / ss;
  const th = Math.atan2(b, a);
  const c = s * Math.cos(th), d = s * Math.sin(th);
  // x' = c*x - d*y + tx ; y' = d*x + c*y + ty
  const tx = dx - (c * sx - d * sy);
  const ty = dy - (d * sx + c * sy);
  let err = 0;
  for (let i = 0; i < n; i++) {
    const X = c * src[i].x - d * src[i].y + tx, Y = d * src[i].x + c * src[i].y + ty;
    err += Math.hypot(X - dst[i].x, Y - dst[i].y);
  }
  return { c, d, tx, ty, err: err / n };
}

/** Sample a mask (Float32 w×h) at normalised coords. */
function sampler(mask) {
  return (u, v) => {
    const x = Math.min(mask.width - 1, Math.max(0, Math.round(u * mask.width)));
    const y = Math.min(mask.height - 1, Math.max(0, Math.round(v * mask.height)));
    return mask.data[y * mask.width + x];
  };
}

/** Separable box blur on a Float32 mask, repeated `passes` times (≈ gaussian). */
function boxBlur(src, w, h, r, passes = 1) {
  let a = Float32Array.from(src);
  let b = new Float32Array(a.length);
  const norm = 1 / (2 * r + 1);
  for (let p = 0; p < passes; p++) {
    for (let y = 0; y < h; y++) {
      let acc = 0;
      const row = y * w;
      for (let x = -r; x <= r; x++) acc += a[row + Math.min(w - 1, Math.max(0, x))];
      for (let x = 0; x < w; x++) {
        b[row + x] = acc * norm;
        acc += a[row + Math.min(w - 1, x + r + 1)] - a[row + Math.max(0, x - r)];
      }
    }
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let y = -r; y <= r; y++) acc += b[Math.min(h - 1, Math.max(0, y)) * w + x];
      for (let y = 0; y < h; y++) {
        a[y * w + x] = acc * norm;
        acc += b[Math.min(h - 1, y + r + 1) * w + x] - b[Math.max(0, y - r) * w + x];
      }
    }
  }
  return a;
}

/**
 * @param {Blob} originalBlob   the captured photo (same framing as the result)
 * @param {Blob} resultBlob     the AI output
 * @returns {Promise<{blob: Blob, locked: boolean, reason?: string}>}
 */
export async function identityLock(originalBlob, resultBlob, strength = 1) {
  const [oImg, rImg] = await Promise.all([loadBitmap(originalBlob), loadBitmap(resultBlob)]);
  const W = rImg.width, H = rImg.height;
  const R = toCanvas(rImg, W, H);
  const O = toCanvas(oImg, W, H); // same framing → resize to result size

  const [fO, fR] = await Promise.all([detectFace(O), detectFace(R)]);
  if (!fO || !fR) return { blob: resultBlob, locked: false, reason: 'no-face' };

  const T = similarity(ALIGN_PTS.map((i) => fO.landmarks[i]), ALIGN_PTS.map((i) => fR.landmarks[i]));
  const faceSize = fR.box.h;
  if (T.err > faceSize * 0.035) return { blob: resultBlob, locked: false, reason: 'pose-changed' };

  // Original warped into result space
  const Ow = canvasOf(W, H);
  const gw = Ow.getContext('2d');
  gw.setTransform(T.c, T.d, -T.d, T.c, T.tx, T.ty);
  gw.drawImage(O, 0, 0);
  gw.setTransform(1, 0, 0, 1, 0, 0);

  // Hair masks: of the result, and of the warped original
  const [hR, hO] = await Promise.all([hairMask(R), hairMask(Ow)]);
  const sR = sampler(hR), sO = sampler(hO);

  // Inner-face mask (eyes, nose, mouth, cheeks) at 1/4 resolution. The jaw line, ears, forehead
  // and anything near hair stay AI-generated so the seam never touches the new hairstyle.
  const S = 4;
  const mw = Math.round(W / S), mh = Math.round(H / S);
  const M = canvasOf(mw, mh);
  const gm = M.getContext('2d');
  const lm = fR.landmarks;
  const cx = (lm[6].x + lm[1].x) / 2, cy = (lm[6].y + lm[1].y) / 2;
  gm.fillStyle = '#fff';
  gm.beginPath();
  FACE_OVAL.forEach((i, k) => {
    const p = lm[i];
    const x = (cx + (p.x - cx) * 0.84) / S, y = (cy + (p.y - cy) * 0.86) / S;
    k ? gm.lineTo(x, y) : gm.moveTo(x, y);
  });
  gm.closePath();
  gm.fill();
  // nothing above the eyebrows (fringe territory)
  const browTop = Math.min(lm[105].y, lm[334].y, lm[66].y, lm[296].y) - faceSize * 0.025;
  gm.clearRect(0, 0, mw, Math.max(0, browTop / S));

  const md = gm.getImageData(0, 0, mw, mh).data;
  let m = new Float32Array(mw * mh);
  for (let i = 0; i < m.length; i++) m[i] = md[i * 4] / 255;
  // hair in either image, dilated, is excluded
  const hair = new Float32Array(mw * mh);
  for (let y = 0; y < mh; y++) {
    for (let x = 0; x < mw; x++) {
      const u = (x + 0.5) / mw, v = (y + 0.5) / mh;
      hair[y * mw + x] = Math.max(sR(u, v), sO(u, v)) > 0.2 ? 1 : 0;
    }
  }
  const dil = Math.max(2, Math.round(mw * 0.02));
  const hairD = boxBlur(hair, mw, mh, dil, 1).map((v) => (v > 0.02 ? 1 : 0));
  for (let i = 0; i < m.length; i++) m[i] *= 1 - hairD[i];
  // erode then feather
  const feather = Math.max(2, Math.round(faceSize / S * 0.06));
  m = boxBlur(m, mw, mh, feather, 1).map((v) => Math.max(0, (v - 0.5) * 2));
  m = boxBlur(m, mw, mh, feather, 3);
  const mc = canvasOf(mw, mh);
  const mg = mc.getContext('2d');
  const mid = mg.createImageData(mw, mh);
  for (let i = 0; i < m.length; i++) {
    const a = Math.round(Math.min(1, m[i]) * 255);
    mid.data[i * 4] = mid.data[i * 4 + 1] = mid.data[i * 4 + 2] = a;
    mid.data[i * 4 + 3] = 255;
  }
  mg.putImageData(mid, 0, 0);
  const mask = toCanvas(mc, W, H).getContext('2d').getImageData(0, 0, W, H).data;

  const rd = R.getContext('2d').getImageData(0, 0, W, H);
  const od = gw.getImageData(0, 0, W, H).data;
  const r = rd.data;

  // Colour harmonisation: shift original toward result's mean colour inside the core mask
  let n = 0, mr = [0, 0, 0], mo = [0, 0, 0];
  for (let i = 0; i < r.length; i += 16) {
    if (mask[i] > 220) {
      n++;
      for (let c = 0; c < 3; c++) { mr[c] += r[i + c]; mo[c] += od[i + c]; }
    }
  }
  if (n < 50) return { blob: resultBlob, locked: false, reason: 'small-mask' };
  const shift = [0, 1, 2].map((c) => ((mr[c] - mo[c]) / n) * 0.55);

  for (let i = 0; i < r.length; i += 4) {
    const a = (mask[i] / 255) * strength;
    if (a <= 0.003) continue;
    for (let c = 0; c < 3; c++) {
      const o = od[i + c] + shift[c];
      r[i + c] = r[i + c] * (1 - a) + o * a;
    }
  }
  R.getContext('2d').putImageData(rd, 0, 0);
  return { blob: await canvasToBlob(R, 'image/jpeg', 0.92), locked: true };
}
