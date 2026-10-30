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
  '{"top_cm":number,"side_cm":number,"back_cm":number,"texture":"straight|wavy|curly|coily","bangs":true|false,' +
  '"style_line":"mens|womens"} where style_line is whether men\'s or women\'s haircut catalogues would suit this person\'s current look best.';

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
    line: j.style_line === 'womens' ? 'female' : j.style_line === 'mens' ? 'male' : null,
    source: 'vlm',
  });
}


// ---------------------------------------------------------------- 3DGS job queue (D1)
// Phone: POST gs/jobs, GET gs/jobs/:id, GET gs/jobs/:id/result, GET gs/status
// GPU worker (Bearer HM_WORKER_TOKEN): POST gs/worker/claim, GET gs/worker/jobs/:id/view/:i,
//   POST gs/worker/jobs/:id/progress, PUT gs/worker/jobs/:id/result?part&total&type, POST gs/worker/jobs/:id/fail
const CHUNK = 900 * 1024;
const MAX_QUEUED = 20;
const WORKER_ONLINE_MS = 45000;

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

async function putBlob(db, jobId, kind, buf) {
  const bytes = new Uint8Array(buf);
  const parts = Math.max(1, Math.ceil(bytes.length / CHUNK));
  const stmts = [db.prepare('DELETE FROM blobs WHERE job_id = ? AND kind = ?').bind(jobId, kind)];
  for (let i = 0; i < parts; i++) {
    stmts.push(
      db.prepare('INSERT INTO blobs (job_id, kind, part, data) VALUES (?, ?, ?, ?)')
        .bind(jobId, kind, i, bytes.slice(i * CHUNK, (i + 1) * CHUNK))
    );
  }
  await db.batch(stmts);
  return parts;
}

async function getBlob(db, jobId, kind) {
  const { results } = await db.prepare('SELECT data FROM blobs WHERE job_id = ? AND kind = ? ORDER BY part').bind(jobId, kind).all();
  if (!results.length) return null;
  const arrs = results.map((r) => new Uint8Array(r.data));
  const total = arrs.reduce((a, b) => a + b.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const a of arrs) { out.set(a, o); o += a.length; }
  return out;
}

async function workerOnline(db) {
  const row = await db.prepare('SELECT MAX(last_seen) AS t FROM workers').first();
  const t = (row && row.t) || 0;
  return { online: Date.now() - t < WORKER_ONLINE_MS, lastSeen: t };
}

function isWorker(request, env) {
  const auth = request.headers.get('authorization') || '';
  return !!env.HM_WORKER_TOKEN && auth === 'Bearer ' + env.HM_WORKER_TOKEN;
}

async function gsRoute(parts, request, env) {
  const db = env.DB;
  if (!db) return json({ error: 'DB binding missing' }, 503);
  const m = request.method;

  if (parts[0] === 'status' && m === 'GET') {
    const w = await workerOnline(db);
    const q = await db.prepare("SELECT COUNT(*) AS n FROM jobs WHERE status IN ('queued','running')").first();
    return json({ worker_online: w.online, last_seen: w.lastSeen, active: q.n });
  }

  if (parts[0] === 'jobs' && parts.length === 1 && m === 'POST') {
    const q = await db.prepare("SELECT COUNT(*) AS n FROM jobs WHERE status = 'queued'").first();
    if (q.n >= MAX_QUEUED) return json({ error: 'queue_full' }, 429);
    let form;
    try { form = await request.formData(); } catch { return json({ error: 'expected multipart form data' }, 400); }
    const id = newId();
    let views = 0;
    for (let i = 0; i < 5; i++) {
      const f = form.get('view' + i);
      if (!f || typeof f === 'string') break;
      if (f.size > 2 * 1024 * 1024) return json({ error: 'view too large' }, 400);
      const buf = await f.arrayBuffer();
      if (!sniffImage(buf)) return json({ error: 'view is not an image' }, 400);
      await putBlob(db, id, 'view' + i, buf);
      views++;
    }
    if (!views) return json({ error: 'at least one view is required' }, 400);
    const meta = clean(form.get('meta'), 20000) || '{}';
    try { JSON.parse(meta); } catch { return json({ error: 'meta must be JSON' }, 400); }
    await db.prepare('INSERT INTO jobs (id, created, status, stage, label, meta, views) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(id, Date.now(), 'queued', 'queued', clean(form.get('label'), 120), meta, views).run();
    return json({ id });
  }

  if (parts[0] === 'jobs' && parts[1] && m === 'GET') {
    const job = await db.prepare('SELECT id, created, status, stage, progress, label, views, started, finished, error, result_size, result_type FROM jobs WHERE id = ?').bind(parts[1]).first();
    if (!job) return json({ error: 'not found' }, 404);
    if (parts[2] === 'result') {
      if (job.status !== 'done') return json({ error: 'not ready' }, 409);
      const data = await getBlob(db, job.id, 'result');
      if (!data) return json({ error: 'result missing' }, 410);
      return new Response(data, {
        headers: { 'content-type': 'application/octet-stream', 'x-hm-type': job.result_type || 'splat', 'cache-control': 'private, max-age=86400' },
      });
    }
    let ahead = 0;
    if (job.status === 'queued') {
      const r = await db.prepare("SELECT COUNT(*) AS n FROM jobs WHERE status = 'queued' AND created < ?").bind(job.created).first();
      ahead = r.n;
    }
    const w = await workerOnline(db);
    return json({ ...job, ahead, worker_online: w.online });
  }

  // ---- worker endpoints
  if (parts[0] === 'worker') {
    if (!isWorker(request, env)) return json({ error: 'unauthorized' }, 401);
    const wid = (request.headers.get('x-hm-worker') || 'worker').slice(0, 60);
    const now = Date.now();
    if (parts[1] === 'claim' && m === 'POST') {
      let info = '';
      try { info = JSON.stringify(await request.json()).slice(0, 2000); } catch {}
      await db.batch([
        db.prepare('INSERT INTO workers (id, last_seen, info) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET last_seen = excluded.last_seen, info = excluded.info').bind(wid, now, info),
        // requeue jobs whose worker vanished; expire old data
        db.prepare("UPDATE jobs SET status = 'queued', stage = 'requeued' WHERE status = 'running' AND started < ?").bind(now - 15 * 60000),
        db.prepare('DELETE FROM blobs WHERE job_id IN (SELECT id FROM jobs WHERE created < ?)').bind(now - 7 * 86400000),
        db.prepare('DELETE FROM jobs WHERE created < ?').bind(now - 7 * 86400000),
      ]);
      const job = await db.prepare(
        "UPDATE jobs SET status = 'running', stage = 'claimed', worker = ?, started = ? WHERE id = (SELECT id FROM jobs WHERE status = 'queued' ORDER BY created LIMIT 1) RETURNING id, label, meta, views"
      ).bind(wid, now).first();
      return json({ job: job || null });
    }
    const jobId = parts[2];
    if (parts[1] === 'jobs' && jobId) {
      if (parts[3] === 'view' && m === 'GET') {
        const data = await getBlob(db, jobId, 'view' + (parseInt(parts[4], 10) || 0));
        if (!data) return json({ error: 'not found' }, 404);
        return new Response(data, { headers: { 'content-type': 'image/jpeg' } });
      }
      if (parts[3] === 'progress' && m === 'POST') {
        const b = await request.json().catch(() => ({}));
        await db.batch([
          db.prepare('UPDATE jobs SET stage = ?, progress = ? WHERE id = ?').bind(clean(b.stage, 60), Number(b.progress) || 0, jobId),
          db.prepare('UPDATE workers SET last_seen = ? WHERE id = ?').bind(now, wid),
        ]);
        return json({ ok: true });
      }
      if (parts[3] === 'result' && m === 'PUT') {
        const url = new URL(request.url);
        const part = parseInt(url.searchParams.get('part'), 10) || 0;
        const total = parseInt(url.searchParams.get('total'), 10) || 1;
        const type = (url.searchParams.get('type') || 'splat').replace(/[^a-z]/g, '').slice(0, 10);
        const buf = new Uint8Array(await request.arrayBuffer());
        if (buf.length > CHUNK) return json({ error: 'chunk too large' }, 413);
        const stmts = [];
        if (part === 0) stmts.push(db.prepare("DELETE FROM blobs WHERE job_id = ? AND kind = 'result'").bind(jobId));
        stmts.push(db.prepare("INSERT INTO blobs (job_id, kind, part, data) VALUES (?, 'result', ?, ?)").bind(jobId, part, buf));
        if (part === total - 1) {
          stmts.push(db.prepare(
            "UPDATE jobs SET status = 'done', stage = 'done', progress = 1, finished = ?, result_parts = ?, result_type = ?, result_size = (SELECT SUM(LENGTH(data)) FROM blobs WHERE job_id = ? AND kind = 'result') + 0 WHERE id = ?"
          ).bind(now, total, type, jobId, jobId));
        }
        await db.batch(stmts);
        if (part === total - 1) {
          // views are no longer needed once the model is trained
          await db.prepare("DELETE FROM blobs WHERE job_id = ? AND kind LIKE 'view%'").bind(jobId).run();
        }
        return json({ ok: true });
      }
      if (parts[3] === 'fail' && m === 'POST') {
        const b = await request.json().catch(() => ({}));
        await db.prepare("UPDATE jobs SET status = 'error', stage = 'error', error = ?, finished = ? WHERE id = ?").bind(clean(b.error, 500), now, jobId).run();
        return json({ ok: true });
      }
    }
  }
  return json({ error: 'not found' }, 404);
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const route = (params.path || []).join('/');
  const parts = params.path || [];
  if (parts[0] === 'gs') {
    if (parts[1] !== 'worker' && request.method !== 'GET' && !originOk(request)) return json({ error: 'origin not allowed' }, 403);
    try {
      return await gsRoute(parts.slice(1), request, env);
    } catch (e) {
      return json({ error: 'gs_error', detail: String((e && e.message) || e).slice(0, 300) }, 500);
    }
  }
  if (request.method === 'POST' && !originOk(request)) return json({ error: 'origin not allowed' }, 403);
  if (route === 'log' && request.method === 'POST') {
    // client error reports (boot watchdog) — small, best effort
    try {
      const b = await request.json();
      if (env.DB) {
        await env.DB.batch([
          env.DB.prepare('CREATE TABLE IF NOT EXISTS logs (t INTEGER, ua TEXT, url TEXT, msg TEXT)'),
          env.DB.prepare('INSERT INTO logs (t, ua, url, msg) VALUES (?, ?, ?, ?)').bind(Date.now(), clean(b.ua, 300), clean(b.url, 200), clean(b.msg, 1500)),
          env.DB.prepare('DELETE FROM logs WHERE t < ?').bind(Date.now() - 14 * 86400000),
        ]);
      }
    } catch {}
    return json({ ok: true });
  }
  if (route === 'health') return json({ ok: true, ai: !!env.AI, db: !!env.DB, worker_auth: !!env.HM_WORKER_TOKEN, models: Object.keys(MODELS) });
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
