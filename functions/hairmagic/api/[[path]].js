// HairMagic API — Cloudflare Pages Function
// Routes:  GET  /hairmagic/api/health
//          POST /hairmagic/api/generate   (multipart: image, [ref], hair, [color], seed, quality)
// Uses the Workers AI binding `AI` (FLUX.2 [klein] multi-reference image editing).

const MODELS = {
  fast: '@cf/black-forest-labs/flux-2-klein-4b',
  hd: '@cf/black-forest-labs/flux-2-klein-9b',
};
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const ALLOWED_HOSTS = /(^|\.)ffvoid\.com$|\.pages\.dev$|^localhost$|^127\.0\.0\.1$/;

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

function clean(text, max) {
  return String(text || '')
    .replace(/[\u0000-\u001f<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function buildPrompt(hair, color, hasRef) {
  const colorLine = color ? ` Hair color: ${color}.` : ' Keep the original natural hair color.';
  if (hasRef) {
    return (
      'Edit image 0 only. Image 0 shows the person from a different angle (turned to the side, or ' +
      'tilted up or down); keep this exact head pose, head rotation and camera angle unchanged - do ' +
      'NOT turn the face toward the camera. Replace only the hair in image 0 with the same haircut, ' +
      `length, parting, fringe, texture and hair color the person in image 1 has (${hair}` +
      `${color ? `, ${color} hair` : ''}), as it would naturally look from this angle. Keep identical ` +
      'face, facial features, skin, expression, ears, clothing, background, lighting and framing of ' +
      'image 0. Photorealistic hair with a natural hairline, fine strands and soft shadows.'
    );
  }
  return (
    `Edit image 0: change ONLY the hairstyle to ${hair}.${colorLine} ` +
    'Keep the exact same person: identical face, eyes, eyebrows, nose, mouth, skin texture, ' +
    'expression, head pose, ears, clothing, background, lighting and camera framing. ' +
    'Photorealistic hair with a natural hairline, fine individual strands and soft realistic shadows.'
  );
}

function sniffImage(buf) {
  const b = new Uint8Array(buf.slice(0, 4));
  if (b[0] === 0xff && b[1] === 0xd8) return 'image/jpeg';
  if (b[0] === 0x89 && b[1] === 0x50) return 'image/png';
  if (b[0] === 0x52 && b[1] === 0x49) return 'image/webp';
  return null;
}

async function readImage(form, name) {
  const f = form.get(name);
  if (!f || typeof f === 'string') return null;
  if (f.size > MAX_IMAGE_BYTES) throw new Error(`${name} too large`);
  const buf = await f.arrayBuffer();
  const type = sniffImage(buf);
  if (!type) throw new Error(`${name} is not an image`);
  return new Blob([buf], { type });
}

function originOk(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return ALLOWED_HOSTS.test(new URL(origin).hostname);
  } catch {
    return false;
  }
}

async function generate(request, env) {
  if (!env.AI) return json({ error: 'AI binding missing on this deployment' }, 503);

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'expected multipart form data' }, 400);
  }

  let image, ref;
  try {
    image = await readImage(form, 'image');
    ref = await readImage(form, 'ref');
  } catch (e) {
    return json({ error: e.message }, 400);
  }
  if (!image) return json({ error: 'image is required' }, 400);

  const hair = clean(form.get('hair'), 420);
  if (!hair) return json({ error: 'hair description is required' }, 400);
  const color = clean(form.get('color'), 120);
  const quality = form.get('quality') === 'hd' ? 'hd' : 'fast';
  const seed = Math.abs(parseInt(form.get('seed'), 10) || 0) % 2147483647;
  const width = Math.min(1024, Math.max(384, parseInt(form.get('width'), 10) || 768));
  const height = Math.min(1365, Math.max(512, parseInt(form.get('height'), 10) || 1024));

  const fd = new FormData();
  fd.append('prompt', buildPrompt(hair, color, !!ref));
  fd.append('width', String(width - (width % 16)));
  fd.append('height', String(height - (height % 16)));
  fd.append('seed', String(seed));
  fd.append('input_image_0', image, 'image0');
  if (ref) fd.append('input_image_1', ref, 'image1');

  const packed = new Response(fd);
  const t0 = Date.now();
  let out;
  try {
    out = await env.AI.run(MODELS[quality], {
      multipart: { body: packed.body, contentType: packed.headers.get('content-type') },
    });
  } catch (e) {
    const msg = String((e && e.message) || e);
    const quota = /neuron|quota|limit|429|exceed/i.test(msg);
    return json({ error: quota ? 'quota' : 'model_error', detail: msg.slice(0, 300) }, quota ? 429 : 502);
  }
  if (!out || !out.image) return json({ error: 'empty result' }, 502);

  const bin = Uint8Array.from(atob(out.image), (c) => c.charCodeAt(0));
  return new Response(bin, {
    headers: {
      'content-type': sniffImage(bin.buffer) || 'image/jpeg',
      'cache-control': 'no-store',
      'x-hm-model': quality,
      'x-hm-ms': String(Date.now() - t0),
      'x-hm-seed': String(seed),
    },
  });
}

const VLM = '@cf/google/gemma-4-26b-a4b-it';
const HAIR_PROMPT =
  'You are a professional hairdresser. Look only at the hair in this photo and estimate the ' +
  "person's CURRENT hair strand length in centimeters, measured from the scalp to the tip: " +
  'top = strands growing from the top of the head and crown (for long one-length hair this equals ' +
  'the overall length), side = strands growing above the ears, back = the longest strands at the ' +
  'back/nape. Use face size for scale (hairline to chin is about 18 cm). Also judge texture. ' +
  'Reply with ONLY one line of JSON, no markdown: ' +
  '{"top_cm":number,"side_cm":number,"back_cm":number,"texture":"straight|wavy|curly|coily","bangs":true|false}';

async function analyze(request, env) {
  if (!env.AI) return json({ error: 'AI binding missing on this deployment' }, 503);
  let form, image;
  try {
    form = await request.formData();
    image = await readImage(form, 'image');
  } catch (e) {
    return json({ error: e.message || 'bad form' }, 400);
  }
  if (!image) return json({ error: 'image is required' }, 400);
  const bytes = new Uint8Array(await image.arrayBuffer());
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  const url = `data:${image.type};base64,${btoa(bin)}`;
  let out;
  try {
    out = await env.AI.run(VLM, {
      messages: [
        { role: 'user', content: [{ type: 'text', text: HAIR_PROMPT }, { type: 'image_url', image_url: { url } }] },
      ],
      max_tokens: 200,
      temperature: 0.1,
      chat_template_kwargs: { enable_thinking: false },
      reasoning_effort: 'none',
    });
  } catch (e) {
    return json({ error: 'model_error', detail: String((e && e.message) || e).slice(0, 300) }, 502);
  }
  const text =
    (out && out.choices && out.choices[0] && out.choices[0].message && out.choices[0].message.content) ||
    (out && out.response) || '';
  const m = String(text).match(/\{[\s\S]*\}/);
  if (!m) return json({ error: 'unparsable', detail: String(text).slice(0, 200) }, 502);
  let j;
  try {
    j = JSON.parse(m[0]);
  } catch {
    return json({ error: 'unparsable', detail: m[0].slice(0, 200) }, 502);
  }
  const num = (v) => Math.min(80, Math.max(0.3, Number(v) || 0.3));
  return json({
    top: num(j.top_cm),
    side: num(j.side_cm),
    back: num(j.back_cm),
    texture: ['straight', 'wavy', 'curly', 'coily'].includes(j.texture) ? j.texture : 'straight',
    bangs: !!j.bangs,
    source: 'vlm',
  });
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const route = (params.path || []).join('/');
  if (request.method === 'POST' && !originOk(request)) return json({ error: 'origin not allowed' }, 403);
  if (route === 'health') return json({ ok: true, ai: !!env.AI, models: Object.keys(MODELS) });
  if (route === 'analyze') {
    if (request.method !== 'POST') return json({ error: 'POST only' }, 405);
    return analyze(request, env);
  }
  if (route === 'generate') {
    if (request.method !== 'POST') return json({ error: 'POST only' }, 405);
    return generate(request, env);
  }
  return json({ error: 'not found' }, 404);
}
