// Client for the HairMagic Pages Function.
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
    return `今天的免费 AI 额度已用完，将在 ${hh}:${mm} 重置`;
  }
  if (code === 'timeout') return '生成超时，网络较慢时请重试';
  if (code === 'network') return '网络连接失败，请检查网络后重试';
  if (code === 'origin not allowed') return '请通过 ffvoid.com/hairmagic 访问';
  return 'AI 生成失败（' + (code || '未知错误') + '），请重试';
}
