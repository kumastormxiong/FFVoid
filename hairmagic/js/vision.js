// On-device vision: MediaPipe face landmarks (478 pts + head pose) and hair segmentation.
import { FaceLandmarker, ImageSegmenter } from '../vendor/mediapipe/vision_bundle.mjs';

const BASE = new URL('../', import.meta.url).href;
const FILESET = {
  wasmLoaderPath: BASE + 'vendor/mediapipe/vision_wasm_internal.js',
  wasmBinaryPath: BASE + 'vendor/mediapipe/vision_wasm_internal.wasm',
};

let videoLM = null;
let imageLM = null;
let hairSeg = null;
let loading = null;

async function makeLandmarker(mode, delegate) {
  return FaceLandmarker.createFromOptions(FILESET, {
    baseOptions: { modelAssetPath: BASE + 'models/face_landmarker.task', delegate },
    runningMode: mode,
    numFaces: 1,
    outputFacialTransformationMatrixes: true,
    outputFaceBlendshapes: false,
  });
}

async function withFallback(make) {
  try {
    return await make('GPU');
  } catch (e) {
    console.warn('GPU delegate failed, using CPU', e);
    return make('CPU');
  }
}

/** Load the landmark models once. */
export function loadVision() {
  if (!loading) {
    loading = (async () => {
      imageLM = await withFallback((d) => makeLandmarker('IMAGE', d));
      return true;
    })();
  }
  return loading;
}

export async function getVideoLandmarker() {
  await loadVision();
  if (!videoLM) videoLM = await withFallback((d) => makeLandmarker('VIDEO', d));
  return videoLM;
}

export function getHairSegmenter() {
  if (!hairSeg) {
    hairSeg = withFallback((d) =>
      ImageSegmenter.createFromOptions(FILESET, {
        baseOptions: { modelAssetPath: BASE + 'models/hair_segmenter.tflite', delegate: d },
        runningMode: 'IMAGE',
        outputConfidenceMasks: true,
        outputCategoryMask: false,
      })
    );
  }
  return hairSeg;
}

/** Euler angles (degrees) from MediaPipe's facial transformation matrix (column-major). */
export function poseFromMatrix(m) {
  const d = m.data || m;
  const R = (r, c) => d[c * 4 + r];
  const pitch = (Math.atan2(R(2, 1), R(2, 2)) * 180) / Math.PI;
  const yaw = (Math.asin(Math.max(-1, Math.min(1, -R(2, 0)))) * 180) / Math.PI;
  const roll = (Math.atan2(R(1, 0), R(0, 0)) * 180) / Math.PI;
  return { yaw, pitch, roll };
}

/** Detect one face on an image/canvas. Returns {landmarks(px), pose, box} or null. */
export async function detectFace(source) {
  await loadVision();
  const w = source.naturalWidth || source.videoWidth || source.width;
  const h = source.naturalHeight || source.videoHeight || source.height;
  const res = imageLM.detect(source);
  if (!res.faceLandmarks || !res.faceLandmarks.length) return null;
  return packFace(res, w, h);
}

export function packFace(res, w, h) {
  const lm = res.faceLandmarks[0].map((p) => ({ x: p.x * w, y: p.y * h, z: p.z * w }));
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of lm) {
    if (p.x < x0) x0 = p.x;
    if (p.y < y0) y0 = p.y;
    if (p.x > x1) x1 = p.x;
    if (p.y > y1) y1 = p.y;
  }
  const pose = res.facialTransformationMatrixes && res.facialTransformationMatrixes[0]
    ? poseFromMatrix(res.facialTransformationMatrixes[0])
    : { yaw: 0, pitch: 0, roll: 0 };
  return { landmarks: lm, pose, box: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, width: w, height: h };
}

/** Hair confidence mask as Float32Array(w*h) at the source's size. */
export async function hairMask(source) {
  const seg = await getHairSegmenter();
  const res = seg.segment(source);
  const masks = res.confidenceMasks;
  const m = masks[masks.length > 1 ? 1 : 0];
  const out = { data: m.getAsFloat32Array().slice(), width: m.width, height: m.height };
  masks.forEach((k) => k.close());
  return out;
}

// Landmark index sets ---------------------------------------------------------------
export const FACE_OVAL = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152,
  148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
];
// Stable inner-face points for alignment (eyes, nose, mouth, jaw)
export const ALIGN_PTS = [33, 133, 263, 362, 1, 4, 6, 168, 61, 291, 0, 17, 152, 234, 454, 70, 300, 105, 334, 199];

/** Rough face-shape classification from landmarks. */
export function faceShape(lm) {
  const dist = (a, b) => Math.hypot(lm[a].x - lm[b].x, lm[a].y - lm[b].y);
  const length = dist(10, 152);
  const cheek = dist(234, 454);
  const jaw = dist(172, 397);
  const forehead = dist(54, 284);
  const ratio = length / cheek;
  if (ratio > 1.42) return 'long';
  if (jaw / cheek > 0.86 && ratio < 1.3) return 'square';
  if (forehead / jaw > 1.18) return 'heart';
  if (ratio < 1.22) return 'round';
  return 'oval';
}

export const FACE_SHAPE_ZH = { round: '圆脸', long: '长脸', square: '方脸', heart: '心形脸', oval: '鹅蛋脸' };

/** Portrait crop rectangle (3:4) around the head with room for hair. */
export function headCrop(face, w, h) {
  const b = face.box;
  let ch = b.h * 2.35;
  let cw = (ch * 3) / 4;
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h * 0.4;
  if (cw > w) { cw = w; ch = (cw * 4) / 3; }
  if (ch > h) { ch = h; cw = (ch * 3) / 4; }
  let x = cx - cw / 2;
  let y = cy - ch / 2;
  x = Math.max(0, Math.min(w - cw, x));
  y = Math.max(0, Math.min(h - ch, y));
  return { x, y, w: cw, h: ch };
}
