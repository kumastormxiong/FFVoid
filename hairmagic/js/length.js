// Hair-length model: current length (cm) per zone, what each style needs, and growth time.
import { hairMask } from './vision.js';

export const GROWTH_CM_PER_MONTH = 1.25; // average scalp hair growth

// Minimum strand length (cm) each preset needs: top / sides / back.
// Shorter-than-current is always achievable by cutting.
export const NEEDS = {
  // men
  buzz: { top: 0.6, side: 0.3, back: 0.3 },
  crewcut: { top: 2, side: 0.6, back: 1 },
  crop: { top: 4, side: 0.5, back: 1 },
  taper: { top: 5, side: 0.3, back: 0.5 },
  undercut: { top: 9, side: 0.3, back: 0.5 },
  pompadour: { top: 11, side: 1, back: 2 },
  slickback: { top: 12, side: 1, back: 3 },
  quiff: { top: 8, side: 1, back: 2 },
  sidepart: { top: 7, side: 2, back: 3 },
  comma: { top: 11, side: 4, back: 5 },
  curtain: { top: 15, side: 9, back: 9 },
  spiky: { top: 5, side: 1.5, back: 2 },
  perm: { top: 7, side: 1, back: 2, service: '烫发' },
  foil: { top: 6, side: 1, back: 2, service: '烫发' },
  mullet: { top: 7, side: 4, back: 14 },
  wolf: { top: 10, side: 9, back: 16 },
  manbun: { top: 22, side: 0.5, back: 15 },
  longm: { top: 25, side: 25, back: 28 },
  afro: { top: 9, side: 9, back: 9, service: '烫发' },
  dreads: { top: 15, side: 15, back: 15, service: '编发/接发' },
  // women
  pixie: { top: 7, side: 2.5, back: 3 },
  shortbob: { top: 12, side: 12, back: 10 },
  bob: { top: 17, side: 18, back: 15 },
  lob: { top: 25, side: 25, back: 26 },
  shag: { top: 15, side: 22, back: 26 },
  wolff: { top: 12, side: 20, back: 30 },
  hush: { top: 15, side: 25, back: 30 },
  octopus: { top: 12, side: 28, back: 35 },
  hime: { top: 10, side: 18, back: 38 },
  airbangs: { top: 10, side: 35, back: 40 },
  curtainlong: { top: 14, side: 32, back: 38 },
  straight: { top: 38, side: 38, back: 42 },
  waves: { top: 32, side: 32, back: 38, service: '烫/卷发' },
  ripple: { top: 30, side: 32, back: 36, service: '烫发' },
  curly: { top: 18, side: 18, back: 22, service: '烫发' },
  ponytail: { top: 25, side: 25, back: 30 },
  bun: { top: 22, side: 22, back: 25 },
  halfup: { top: 28, side: 28, back: 32 },
  braids: { top: 10, side: 10, back: 12, service: '编发/接发' },
  twinbraids: { top: 30, side: 32, back: 35, service: '编发' },
};

export const LENGTH_PRESETS = [
  { zh: '寸头', top: 1, side: 0.6, back: 0.8 },
  { zh: '短发', top: 5, side: 2, back: 3 },
  { zh: '中短发', top: 10, side: 7, back: 9 },
  { zh: '及颌', top: 16, side: 17, back: 18 },
  { zh: '及肩', top: 26, side: 27, back: 30 },
  { zh: '长发', top: 40, side: 40, back: 45 },
];

export function describeLength(len) {
  if (!len) return '未知';
  const m = Math.max(len.top, len.side, len.back);
  if (m < 2) return '寸头';
  if (m < 6) return '短发';
  if (m < 13) return '中短发';
  if (m < 22) return '及颌';
  if (m < 34) return '及肩';
  return '长发';
}

/** Months of growth needed to reach `need` from `cur` (0 = can cut today). */
export function monthsNeeded(need, cur) {
  if (!need || !cur) return 0;
  const gap = Math.max(need.top - cur.top, need.side - cur.side, need.back - cur.back, 0);
  // tolerate ~1.5 cm of estimation noise
  if (gap <= 1.5) return 0;
  return Math.ceil(gap / GROWTH_CM_PER_MONTH);
}

export function gapDetail(need, cur) {
  const zones = [
    ['顶部', 'top'],
    ['两侧', 'side'],
    ['后部', 'back'],
  ];
  let worst = null;
  for (const [zh, k] of zones) {
    const g = need[k] - cur[k];
    if (!worst || g > worst.gap) worst = { zh, gap: g, need: need[k], cur: cur[k] };
  }
  return worst;
}

/** Map seed-length categories (styles.js POOLS.length index) to needs. */
export const SEED_LENGTH_NEEDS = [
  { top: 2, side: 0.6, back: 1 },
  { top: 6, side: 3, back: 4 },
  { top: 15, side: 15, back: 15 },
  { top: 25, side: 25, back: 28 },
  { top: 38, side: 38, back: 42 },
];

/**
 * Geometric estimate from a frontal photo: hair mask extent measured against the face,
 * scaled with the inter-pupil distance (~6.3 cm). Used when the vision-language estimate
 * is unavailable, and as a sanity check.
 */
export async function geometricEstimate(canvas, face) {
  const lm = face.landmarks;
  const ipdPx = Math.hypot(lm[468].x - lm[473].x, lm[468].y - lm[473].y) || face.box.w * 0.45;
  const cmPerPx = 6.3 / ipdPx;
  const mask = await hairMask(canvas);
  const W = canvas.width, H = canvas.height;
  const at = (x, y) => {
    const u = Math.min(mask.width - 1, Math.max(0, Math.round((x / W) * mask.width)));
    const v = Math.min(mask.height - 1, Math.max(0, Math.round((y / H) * mask.height)));
    return mask.data[v * mask.width + u];
  };
  const faceTop = lm[10].y;
  const chin = lm[152].y;
  const earY = (lm[234].y + lm[454].y) / 2;
  const cx = lm[168].x;
  // top thickness: scan upward along the face midline
  let topEdge = faceTop;
  for (let y = Math.round(faceTop); y > 0; y -= 2) if (at(cx, y) > 0.5) topEdge = y;
  // estimated scalp top sits ~ 0.42 face-heights above landmark 10
  const faceH = chin - faceTop;
  const scalpTop = faceTop - faceH * 0.32;
  const topThick = Math.max(0, (scalpTop - topEdge) * cmPerPx);
  // lowest hair beside the face
  const xs = [lm[234].x - face.box.w * 0.08, lm[454].x + face.box.w * 0.08, lm[234].x + face.box.w * 0.05, lm[454].x - face.box.w * 0.05];
  let bottom = earY;
  for (const x of xs) {
    for (let y = Math.round(earY); y < H; y += 2) {
      if (at(x, y) > 0.5) bottom = Math.max(bottom, y);
    }
  }
  // fringe: hair over the forehead
  let fringe = 0;
  for (let y = Math.round(faceTop); y < lm[168].y; y += 2) if (at(cx, y) > 0.5) fringe = y - faceTop;
  const belowEar = (bottom - earY) * cmPerPx;
  const back = belowEar > 1 ? 9 + belowEar * 1.05 : Math.max(0.6, topThick * 1.4);
  const side = belowEar > 1 ? Math.max(3, belowEar + 3) : Math.max(0.5, topThick * 0.8);
  // the top is rarely shorter than what hangs at the sides; a fringe adds forehead length
  const top = Math.max(0.8, topThick * 2.2, fringe > 0 ? fringe * cmPerPx + 6 : 0, belowEar > 1 ? side * 0.85 : 0);
  const r = (v) => Math.round(v * 2) / 2;
  return { top: r(Math.min(top, back + 6)), side: r(side), back: r(Math.max(back, side)), source: 'geometry' };
}
