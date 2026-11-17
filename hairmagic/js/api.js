// Client for the HairMagic Pages Function.
import { t } from './i18n.js?v=202611171342';
const API = new URL('../api/', import.meta.url).href;

export class ApiError extends Error {
  constructor(code, detail) {
    super(code);
    this.code = code;
    this.detail = detail;
  }
}

async function post(path, form, timeoutMs) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  let r;
  try {
    r = await fetch(API + path, { method: 'POST', body: form, signal: ctl.signal });
  } catch (e) {
    throw new ApiError(e.name === 'AbortError' ? 'timeout' : 'network', String(e));
  } finally {
    clearTimeout(t);
  }
  if (!r.ok) {
    let j = {};
    try {
      j = await r.json();
    } catch {}
    throw new ApiError(j.error || 'http_' + r.status, j.detail);
  }
  return r;
}

/** Generate one look. Returns {blob, ms, model}. */
export async function generateLook({ image, ref, hair, color, seed, quality, width = 768, height = 1024 }) {
  const fd = new FormData();
  fd.append('image', image, 'image.jpg');
  if (ref) fd.append('ref', ref, 'ref.jpg');
  fd.append('hair', hair);
  if (color) fd.append('color', color);
  fd.append('seed', String(seed));
  fd.append('quality', quality);
  fd.append('width', String(width));
  fd.append('height', String(height));
  const r = await post('generate', fd, 90000);
  return { blob: await r.blob(), ms: +r.headers.get('x-hm-ms') || 0, model: r.headers.get('x-hm-model') };
}

/** Vision-language estimate of current hair length. Returns {top, side, back, texture} in cm. */
export async function analyzeHair(image) {
  const fd = new FormData();
  fd.append('image', image, 'image.jpg');
  const r = await post('analyze', fd, 70000);
  return r.json();
}

export async function health() {
  try {
    const r = await fetch(API + 'health', { cache: 'no-store' });
    return r.ok ? r.json() : { ok: false };
  } catch {
    return { ok: false };
  }
}

export function errorText(e) {
  const code = e && e.code;
  if (code === 'quota') {
    const reset = new Date();
    reset.setUTCHours(24, 0, 0, 0);
    const hh = String(reset.getHours()).padStart(2, '0');
    const mm = String(reset.getMinutes()).padStart(2, '0');
    return t('err.quota', { time: `${hh}:${mm}` });
  }
  if (code === 'timeout') return t('err.timeout');
  if (code === 'network') return t('err.network');
  if (code === 'origin not allowed') return t('err.origin');
  return t('err.generic', { code: code || t('err.unknown') });
}

// ---------------------------------------------------------------- 3DGS jobs
export async function createGsJob({ views, meta, label }) {
  const fd = new FormData();
  views.forEach((b, i) => fd.append('view' + i, b, `view${i}.jpg`));
  fd.append('meta', JSON.stringify(meta || {}));
  fd.append('label', label || '');
  const r = await post('gs/jobs', fd, 60000);
  return r.json();
}

export async function gsJob(id) {
  const r = await fetch(API + 'gs/jobs/' + encodeURIComponent(id), { cache: 'no-store' });
  if (!r.ok) throw new ApiError(r.status === 404 ? 'job_missing' : 'http_' + r.status);
  return r.json();
}

export async function gsResult(id) {
  const r = await fetch(API + 'gs/jobs/' + encodeURIComponent(id) + '/result');
  if (!r.ok) throw new ApiError('http_' + r.status);
  return r.blob();
}

export async function gsStatus() {
  try {
    const r = await fetch(API + 'gs/status', { cache: 'no-store' });
    return r.ok ? r.json() : { worker_online: false };
  } catch {
    return { worker_online: false };
  }
}
