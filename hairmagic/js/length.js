// Hair-length model: current length (cm) per zone, what each style needs, and growth time.
import { hairMask } from './vision.js?v=202611150858';
import { t } from './i18n.js?v=202611150858';

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
  perm: { top: 7, side: 1, back: 2, service: 'perm' },
  foil: { top: 6, side: 1, back: 2, service: 'perm' },
  mullet: { top: 7, side: 4, back: 14 },
  wolf: { top: 10, side: 9, back: 16 },
  manbun: { top: 22, side: 0.5, back: 15 },
  longm: { top: 25, side: 25, back: 28 },
  afro: { top: 9, side: 9, back: 9, service: 'perm' },
  dreads: { top: 15, side: 15, back: 15, service: 'braidext' },
  ivy: { top: 5, side: 1, back: 1.5 },
  caesar: { top: 3, side: 0.5, back: 0.5 },
  bowl: { top: 6, side: 5, back: 5 },
  ducktail: { top: 9, side: 1.5, back: 4 },
  fauxhawk: { top: 8, side: 1, back: 1.5 },
  mohawk: { top: 10, side: 0.8, back: 1 },
  fade: { top: 2, side: 0.3, back: 0.3 },
  twoblock: { top: 6, side: 0.8, back: 1.2 },
  flow: { top: 14, side: 10, back: 12 },
  manbob: { top: 9, side: 8, back: 8 },
  shagm: { top: 10, side: 8, back: 10 },
  emo: { top: 10, side: 7, back: 8 },
  bangsm: { top: 8, side: 6, back: 6 },
  highfade: { top: 5, side: 0.4, back: 0.4 },
  pompfade: { top: 10, side: 1, back: 2 },
  sideswept: { top: 8, side: 2, back: 3 },
  rocker: { top: 18, side: 16, back: 20 },
  surfer: { top: 18, side: 14, back: 16 },
  curlym: { top: 12, side: 10, back: 12, service: 'perm' },
  bunm: { top: 20, side: 14, back: 20 },
  pompundercut: { top: 11, side: 0.5, back: 0.5 },
  hitop: { top: 9, side: 0.5, back: 0.5 },
  tousle: { top: 7, side: 4, back: 5 },
  wavyshort: { top: 7, side: 3, back: 4, service: 'perm' },
  crewfade: { top: 3, side: 0.3, back: 0.3 },
  pompside: { top: 10, side: 3, back: 4 },
  cropfade: { top: 4, side: 0.5, back: 0.8 },
  midfade: { top: 6, side: 0.5, back: 0.8 },
  spikyfade: { top: 4, side: 0.5, back: 0.8 },
  brushed: { top: 9, side: 2, back: 3 },
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
  waves: { top: 32, side: 32, back: 38, service: 'permcurl' },
  ripple: { top: 30, side: 32, back: 36, service: 'perm' },
  curly: { top: 18, side: 18, back: 22, service: 'perm' },
  ponytail: { top: 25, side: 25, back: 30 },
  bun: { top: 22, side: 22, back: 25 },
  halfup: { top: 28, side: 28, back: 32 },
  braids: { top: 10, side: 10, back: 12, service: 'braidext' },
  twinbraids: { top: 30, side: 32, back: 35, service: 'braid' },
  bowlw: { top: 8, side: 6, back: 8 },
  butterfly: { top: 14, side: 16, back: 18 },
  jellyfish: { top: 14, side: 20, back: 22 },
  mullet_f: { top: 9, side: 5, back: 16 },
  shortpixie: { top: 4, side: 1.5, back: 2 },
  buzzf: { top: 1, side: 0.5, back: 0.5 },
  sidebang_long: { top: 12, side: 18, back: 22 },
  bangs_full: { top: 8, side: 25, back: 32 },
  curly_bob: { top: 12, side: 12, back: 14, service: 'perm' },
  wavy_bob: { top: 14, side: 14, back: 16, service: 'perm' },
  longbob: { top: 22, side: 22, back: 25 },
  mermaid: { top: 30, side: 30, back: 36, service: 'perm' },
  space_bun: { top: 22, side: 20, back: 25 },
  twist_updo: { top: 25, side: 25, back: 28 },
  frenchbraid: { top: 26, side: 25, back: 30, service: 'braid' },
  cornrows: { top: 14, side: 12, back: 22, service: 'braidext' },
  bantu: { top: 12, side: 12, back: 12, service: 'braid' },
  fishtail: { top: 28, side: 28, back: 32, service: 'braid' },
  sidepart_long: { top: 35, side: 35, back: 40 },
  curtain_bob: { top: 12, side: 14, back: 16, service: 'perm' },
  pompadour_f: { top: 12, side: 3, back: 4 },
  pixie_curl: { top: 6, side: 3, back: 4, service: 'perm' },
  bun_low: { top: 20, side: 20, back: 24 },
  hair_wrap: { top: 22, side: 22, back: 26 },
  crown_braid: { top: 25, side: 25, back: 30, service: 'braid' },
  shag_long: { top: 20, side: 28, back: 34 },
  soft_waves: { top: 10, side: 10, back: 12, service: 'perm' },
  sleek_bob: { top: 17, side: 17, back: 19 },
  mini_bob: { top: 6, side: 5, back: 6 },
  bedhead: { top: 12, side: 12, back: 14, service: 'perm' },
};

export const LENGTH_PRESETS = [
  { id: 0, top: 1, side: 0.6, back: 0.8 },
  { id: 1, top: 5, side: 2, back: 3 },
  { id: 2, top: 10, side: 7, back: 9 },
  { id: 3, top: 16, side: 17, back: 18 },
  { id: 4, top: 26, side: 27, back: 30 },
  { id: 5, top: 40, side: 40, back: 45 },
];

export function lengthIndex(len) {
  if (!len) return -1;
  const m = Math.max(len.top, len.side, len.back);
  if (m < 2) return 0;
  if (m < 6) return 1;
  if (m < 13) return 2;
  if (m < 22) return 3;
  if (m < 34) return 4;
  return 5;
}

export function describeLength(len) {
  const i = lengthIndex(len);
  return i < 0 ? t('len.unknown') : t('len.n' + i);
}

export const presetName = (p) => t('len.n' + p.id);
export const serviceName = (svc) => (svc ? t('svc.' + svc) : '');

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
    'top',
    'side',
    'back',
  ];
  let worst = null;
  for (const k of zones) {
    const g = need[k] - cur[k];
    if (!worst || g > worst.gap) worst = { zone: t('zone.' + k), gap: g, need: need[k], cur: cur[k] };
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
