// HairMagic — app shell: state, studio, capture flow, archive.
import * as store from './store.js?v=202611150506';
import { STYLES, COLORS, randomSeed, styleFromSeed, suggestForFace, colorName, colorByZh } from './styles.js?v=202611150506';
import { t, tn, getLang, setLang, applyStatic, onLangChange } from './i18n.js?v=202611150506';
import {
  NEEDS, LENGTH_PRESETS, SEED_LENGTH_NEEDS, GROWTH_CM_PER_MONTH,
  monthsNeeded, gapDetail, describeLength, lengthIndex, presetName, serviceName, geometricEstimate,
} from './length.js?v=202611150506';
import { generateLook, analyzeHair, errorText, createGsJob, gsJob, gsResult, gsStatus } from './api.js?v=202611150506';
import { loadBitmap, toCanvas, canvasToBlob, identityLock } from './composite.js?v=202611150506';
import { loadVision, detectFace, faceShape, faceShapeName } from './vision.js?v=202611150506';
import {
  GuidedCapture, STEPS, angleName, ANGLE_ORDER, cropHead, compactLandmarks, planAngles, fileToCanvas,
} from './capture.js?v=202611150506';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// ---------------------------------------------------------------- state
const S = {
  view: 'studio',
  date: store.today(),
  photos: [],
  looks: [],
  sel: null, // selected photo id
  set: null, // active look set id
  mode: 'now',
  styleId: null,
  colorId: store.prefs.get('color', 'keep'),
  seed: store.prefs.get('seed', randomSeed()),
  seedGrowOk: false,
  seedColor: true,
  scope: store.prefs.get('scope', 'one'),
  quality: store.prefs.get('quality', 'fast'),
  lock: store.prefs.get('lock', true),
  len: null,
  shape: null,
  busy: false,
  compare: false,
  line: store.prefs.get('line', null) || 'm', // 'm' men's / 'f' women's catalogue
};

// ---------------------------------------------------------------- object URLs
const urls = new Map();
function urlFor(rec) {
  if (!rec || !rec.blob) return '';
  if (!urls.has(rec.id)) urls.set(rec.id, URL.createObjectURL(rec.blob));
  return urls.get(rec.id);
}
function dropUrls() {
  urls.forEach((u) => URL.revokeObjectURL(u));
  urls.clear();
}

// ---------------------------------------------------------------- utils
let toastT;
function toast(msg, ms = 2600) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastT);
  toastT = setTimeout(() => (t.hidden = true), ms);
}
function dateLabel(d) {
  if (d === store.today()) return t('date.today');
  const [y, m, dd] = d.split('-').map(Number);
  const now = new Date();
  if (getLang() === 'zh') return (y === now.getFullYear() ? '' : y + '年') + `${m}月${dd}日`;
  return `${t('mon.' + m)} ${dd}` + (y === now.getFullYear() ? '' : `, ${y}`);
}
function weekday(d) {
  const [y, m, dd] = d.split('-').map(Number);
  return t('wk.' + new Date(y, m - 1, dd).getDay());
}

// stored looks keep their Chinese label; derive the English one from the style / seed / colour
function lookLabel(l) {
  if (!l) return '';
  if (getLang() === 'zh') return l.label || '';
  if (l.labelEn) return l.labelEn;
  const col = l.color ? colorByZh(l.color) : null;
  if (l.styleId) {
    const st = STYLES.find((x) => x.id === l.styleId);
    if (st) return st.en + (col ? ' · ' + col.en : '');
  }
  if (l.kind === 'seed' && l.seed != null) return t('seed.name', { n: String(l.seed).padStart(6, '0') });
  return l.label || '';
}
const fileSafe = (x) => (x || 'look').replace(/[^\w一-龥#-]+/g, '_');
const cm = (v) => (v < 10 ? (Math.round(v * 2) / 2).toString() : Math.round(v).toString());
const orderPhotos = (arr) => [...arr].sort((a, b) => (ANGLE_ORDER[a.angle] ?? 9) - (ANGLE_ORDER[b.angle] ?? 9));

async function resizeBlob(blob, w, h, q = 0.9) {
  const bmp = await loadBitmap(blob);
  return canvasToBlob(toCanvas(bmp, w, h), 'image/jpeg', q);
}

// ---------------------------------------------------------------- hair length
function normalizeLen(l) {
  if (!l) return l;
  const out = { ...l };
  // long one-length hair: crown strands are as long as the back
  if (!out.bangs && out.back >= 20) out.top = Math.max(out.top, out.back * 0.85);
  out.side = Math.min(out.side, Math.max(out.back, out.top) + 2);
  return out;
}

async function ensureHairLength() {
  const key = 'len.' + S.date;
  const saved = store.prefs.get(key, null);
  if (saved && (saved.source === 'vlm' || saved.source === 'manual')) {
    S.len = saved;
    renderLen();
    return;
  }
  // rough or missing estimate: show what we have, then try the AI estimate again
  S.len = saved || null;
  renderLen();
  const front = S.photos.find((p) => p.angle === 'front') || S.photos[0];
  if (!front) return;
  let est = null;
  try {
    const small = await resizeBlob(front.blob, 384, 512, 0.88);
    est = normalizeLen(await analyzeHair(small));
    if (est && est.line && !store.prefs.get('line', null)) {
      S.line = est.line === 'female' ? 'f' : 'm';
      renderLine();
    }
  } catch (e) {
    console.warn('VLM hair estimate failed', e);
    if (saved) return;
    try {
      const c = toCanvas(await loadBitmap(front.blob));
      const face = await detectFace(c);
      if (face) est = await geometricEstimate(c, face);
    } catch (e2) {
      console.warn('geometric estimate failed', e2);
    }
  }
  if (!est) est = { ...LENGTH_PRESETS[2], source: 'default' };
  if (key !== 'len.' + S.date) return;
  S.len = est;
  store.prefs.set(key, est);
  renderLen();
  renderStyles();
  renderSummary();
}

function renderLen() {
  const el = $('#hairLenValue');
  if (!S.len) {
    el.textContent = S.photos.length ? t('len.estimating') : t('len.after');
    return;
  }
  const l = S.len;
  const rough = l.source === 'geometry' || l.source === 'default' ? t('len.rough') : '';
  el.innerHTML = `${describeLength(l)} <small>${t('len.detail', { t: cm(l.top), s: cm(l.side), b: cm(l.back) })}${rough}</small>`;
}

// ---------------------------------------------------------------- data loading
async function loadDate(date) {
  S.date = date;
  dropUrls();
  S.photos = orderPhotos(await store.photosByDate(date));
  S.looks = await store.looksByDate(date);
  if (!S.photos.find((p) => p.id === S.sel)) {
    S.sel = (S.photos.find((p) => p.angle === 'front') || S.photos[0] || {}).id || null;
  }
  const sets = lookSets();
  S.set = sets.length ? sets[0].setId : null;
  S.shape = null;
  const front = S.photos.find((p) => p.angle === 'front');
  if (front && front.lm) {
    const lm = [];
    for (let i = 0; i < front.lm.length; i += 2) lm.push({ x: front.lm[i] * 768, y: front.lm[i + 1] * 1024 });
    try { S.shape = faceShape(lm); } catch {}
  }
  $('#dateLabel').textContent = dateLabel(date);
  renderStudio();
  if (S.photos.length) ensureHairLength();
}

function lookSets() {
  const map = new Map();
  for (const l of S.looks) {
    if (!map.has(l.setId)) map.set(l.setId, { setId: l.setId, label: l.label, createdAt: l.createdAt, items: [] });
    map.get(l.setId).items.push(l);
  }
  return [...map.values()].sort((a, b) => b.createdAt - a.createdAt);
}

// ---------------------------------------------------------------- studio render
function renderStudio() {
  const has = S.photos.length > 0;
  $('#studioEmpty').hidden = has;
  $('#studio').hidden = !has;
  if (!has) return;
  renderAngles();
  renderStage();
  renderLooks();
  renderLen();
  renderMode();
  renderLine();
  renderColors();
  renderOptions();
  renderSummary();
}

function currentLook(photoId = S.sel) {
  return S.looks.find((l) => l.setId === S.set && l.photoId === photoId) || null;
}

function renderAngles() {
  const box = $('#angles');
  box.innerHTML = '';
  for (const p of S.photos) {
    const b = document.createElement('button');
    b.className = 'angle' + (p.id === S.sel ? ' is-on' : '');
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', p.id === S.sel);
    b.dataset.id = p.id;
    const look = currentLook(p.id);
    b.innerHTML = `<img alt="" src="${urlFor(look || p)}"><span class="angle-name">${angleName(p.angle)}</span>${look ? '<span class="angle-dot"></span>' : ''}`;
    b.onclick = () => selectPhoto(p.id);
    box.appendChild(b);
  }
  $('#btnRetake').hidden = !(S.date === store.today() && S.photos.length);
  if (S.photos.length < 5) {
    const add = document.createElement('button');
    add.className = 'angle angle-add';
    add.setAttribute('aria-label', t('angles.add'));
    add.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 6v12M6 12h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
    add.onclick = () => openCapture();
    box.appendChild(add);
  }
}

function selectPhoto(id) {
  S.sel = id;
  renderAngles();
  renderStage();
}

function renderStage() {
  const p = S.photos.find((x) => x.id === S.sel);
  if (!p) return;
  $('#stageBase').src = urlFor(p);
  const look = currentLook(p.id);
  const after = $('#stageAfter');
  const wrap = $('#stageAfterWrap');
  if (look) {
    after.src = urlFor(look);
    wrap.hidden = false;
  } else {
    wrap.hidden = true;
  }
  $('#stageAngle').textContent = angleName(p.angle);
  const info = $('#stageInfo');
  if (look) {
    info.hidden = false;
    info.textContent = lookLabel(look) + (look.seed && look.kind === 'seed' && !lookLabel(look).includes('#') ? ` · #${look.seed}` : '');
  } else info.hidden = true;
  $('#btnSave').hidden = !look;
  $('#btn3d').hidden = !(look || S.set === null); // original photos can be turned into a 3D head too
  $('#btnCompare').hidden = !look;
  if (!look && S.compare) setCompare(false);
  applyCompare();
}

let comparePos = 50;
function setCompare(on) {
  S.compare = on;
  $('#btnCompare').setAttribute('aria-pressed', on);
  $('#compareHandle').hidden = !on;
  applyCompare();
}
function applyCompare() {
  const wrap = $('#stageAfterWrap');
  wrap.style.clipPath = S.compare ? `inset(0 0 0 ${comparePos}%)` : 'inset(0 0 0 0)';
  $('#compareHandle').style.left = comparePos + '%';
}

function renderLooks() {
  const sets = lookSets();
  $('#looksRow').hidden = !sets.length;
  $('#looksCount').textContent = sets.length ? t('looks.count', { n: sets.length }) : '';
  const rail = $('#looksRail');
  rail.innerHTML = '';
  // "original" chip first
  const orig = document.createElement('button');
  orig.className = 'look' + (S.set === null ? ' is-on' : '');
  const p0 = S.photos.find((p) => p.id === S.sel) || S.photos[0];
  orig.innerHTML = `<div class="look-img"><img alt="" src="${urlFor(p0)}"></div><div class="look-name">${t('looks.original')}</div>`;
  orig.onclick = () => { S.set = null; renderLooks(); renderAngles(); renderStage(); };
  rail.appendChild(orig);
  for (const s of sets) {
    const b = document.createElement('button');
    b.className = 'look' + (s.setId === S.set ? ' is-on' : '');
    const cover = s.items.find((l) => l.photoId === S.sel) || s.items[0];
    b.innerHTML = `<div class="look-img"><img alt="" src="${urlFor(cover)}"></div>${s.items.length > 1 ? `<span class="look-count">${t('looks.angles', { n: s.items.length })}</span>` : ''}<div class="look-name">${lookLabel(s.items[0])}</div>`;
    b.onclick = () => {
      S.set = s.setId;
      if (!s.items.find((l) => l.photoId === S.sel)) S.sel = s.items[0].photoId;
      renderLooks();
      renderAngles();
      renderStage();
    };
    let pressT;
    b.addEventListener('contextmenu', (e) => e.preventDefault());
    b.addEventListener('pointerdown', () => (pressT = setTimeout(() => removeSet(s), 650)));
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => b.addEventListener(ev, () => clearTimeout(pressT)));
    rail.appendChild(b);
  }
}

async function removeSet(s) {
  if (!confirm(t('looks.delete', { name: lookLabel(s.items[0]) }))) return;
  await store.deleteLookSet(s.setId, S.date);
  S.looks = await store.looksByDate(S.date);
  if (S.set === s.setId) S.set = (lookSets()[0] || {}).setId || null;
  renderLooks();
  renderAngles();
  renderStage();
}

// ---------------------------------------------------------------- styles
function styleMonths(id) {
  return S.len ? monthsNeeded(NEEDS[id], S.len) : 0;
}

function renderLine() {
  $$('.line-btn').forEach((b) => {
    const on = b.dataset.line === S.line;
    b.classList.toggle('is-on', on);
    b.setAttribute('aria-pressed', on);
  });
  if (S.mode === 'seed') renderSeed();
  else renderStyles();
  renderSummary();
}

function renderMode() {
  $$('.seg-btn').forEach((b) => {
    const on = b.dataset.mode === S.mode;
    b.classList.toggle('is-on', on);
    b.setAttribute('aria-selected', on);
  });
  $('#modeStyles').hidden = S.mode === 'seed';
  $('#modeSeed').hidden = S.mode !== 'seed';
  $('#colorsBlock').hidden = S.mode === 'seed' && S.seedColor;
  if (S.mode === 'seed') renderSeed();
  else renderStyles();
}

function renderStyles() {
  if (S.mode === 'seed') return;
  const rec = new Set(suggestForFace(S.shape, S.line));
  let list = STYLES.filter((s) => s.g === S.line).map((s) => ({ s, months: styleMonths(s.id), rec: rec.has(s.id) }));
  const nowCount = list.filter((x) => x.months === 0).length;
  if (S.mode === 'now') list = list.filter((x) => x.months === 0);
  list.sort((a, b) => a.months - b.months || b.rec - a.rec);
  if (!S.styleId || !list.find((x) => x.s.id === S.styleId)) S.styleId = list.length ? list[0].s.id : null;

  const note = $('#stylesNote');
  const lenTxt = S.len ? describeLength(S.len) : '';
  const shapeTxt = S.shape ? t('note.shape', { shape: faceShapeName(S.shape) }) : '';
  note.textContent = S.mode === 'now'
    ? (S.len ? t('note.now', { len: lenTxt, line: t(S.line === 'f' ? 'line.f.short' : 'line.m.short'), n: nowCount, shape: shapeTxt }) : t('note.estimating'))
    : t('note.all', { g: GROWTH_CM_PER_MONTH });

  const grid = $('#styleGrid');
  grid.innerHTML = '';
  for (const { s, months, rec: r } of list) {
    const b = document.createElement('button');
    b.className = 'style' + (s.id === S.styleId ? ' is-on' : '') + (months ? ' is-grow' : '');
    b.dataset.id = s.id;
    const svc = NEEDS[s.id].service;
    const meta = months
      ? `<div class="style-meta is-grow">${t('meta.grow', { n: months })}</div>`
      : `<div class="style-meta is-ok">${svc ? t('meta.ok.svc', { svc: serviceName(svc) }) : t('meta.ok')}</div>`;
    b.innerHTML = `<div class="style-img"><img loading="lazy" alt="" src="./assets/styles/${s.id}.jpg" onerror="this.parentNode.classList.add('is-missing');this.remove()"><span class="style-ph">${s.en}</span></div>${r ? `<span class="badge-rec">${t('badge.rec')}</span>` : ''}<div class="style-body"><div class="style-name">${getLang() === 'zh' ? s.zh : s.en}</div>${meta}</div>`;
    b.onclick = () => {
      S.styleId = s.id;
      $$('.style', grid).forEach((x) => x.classList.toggle('is-on', x.dataset.id === s.id));
      renderSummary();
      if (months) {
        const g = gapDetail(NEEDS[s.id], S.len);
        toast(t('toast.grow', { name: getLang() === 'zh' ? s.zh : s.en, zone: g.zone, need: cm(g.need), cur: cm(g.cur), n: months }), 4200);
      }
    };
    grid.appendChild(b);
  }
  if (!list.length) grid.innerHTML = `<p class="mode-note">${t('note.none')}</p>`;
}

function allowedSeedLengths() {
  if (S.seedGrowOk || !S.len) return null;
  const ok = SEED_LENGTH_NEEDS.map((n, i) => (monthsNeeded(n, S.len) === 0 ? i : -1)).filter((i) => i >= 0);
  return ok.length ? ok : [0];
}

function currentSeedStyle() {
  return styleFromSeed(S.seed, { randomColor: S.seedColor, allowedLengths: allowedSeedLengths(), line: S.line });
}

const seedName = (st) => (getLang() === 'zh' ? st.zh : st.en);

function renderSeed() {
  const input = $('#seedInput');
  if (document.activeElement !== input) input.value = String(S.seed).padStart(6, '0');
  const st = currentSeedStyle();
  $('#seedDesc').textContent = seedName(st) + (st.color ? ` · ${colorName(st.color)}` : '');
  const months = S.len ? monthsNeeded(SEED_LENGTH_NEEDS[st.lengthIdx], S.len) : 0;
  const g = $('#seedGrow');
  g.classList.toggle('is-grow', months > 0);
  g.textContent = months ? t('seed.needs', { n: months }) : t('seed.ok');
  $('#colorsBlock').hidden = S.seedColor;
  renderSummary();
}

function renderColors() {
  const box = $('#colors');
  box.innerHTML = '';
  for (const c of COLORS) {
    const b = document.createElement('button');
    b.className = 'color' + (c.id === 'keep' ? ' keep' : '') + (c.id === S.colorId ? ' is-on' : '');
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', c.id === S.colorId);
    b.setAttribute('aria-label', c.id === 'keep' ? t('color.keep') : colorName(c));
    if (c.hex) b.style.background = c.hex;
    b.onclick = () => {
      S.colorId = c.id;
      store.prefs.set('color', c.id);
      renderColors();
      renderSummary();
    };
    box.appendChild(b);
  }
  { const cc = COLORS.find((c) => c.id === S.colorId); $('#colorName').textContent = cc.id === 'keep' ? t('color.keep') : colorName(cc); }
}

function renderOptions() {
  $$('.pills').forEach((g) => {
    const key = g.dataset.opt;
    $$('.pill', g).forEach((p) => p.classList.toggle('is-on', p.dataset.v === S[key]));
  });
  $('#lockFace').checked = S.lock;
}

function recipe() {
  const color = COLORS.find((c) => c.id === S.colorId);
  if (S.mode === 'seed') {
    const st = currentSeedStyle();
    const col = S.seedColor ? st.color : color.prompt ? color : null;
    return {
      kind: 'seed',
      label: `种子 #${String(S.seed).padStart(6, '0')}`,
      labelEn: `Seed #${String(S.seed).padStart(6, '0')}`,
      sub: seedName(st),
      hair: st.prompt,
      color: col ? col.prompt : '',
      colorZh: col ? col.zh : '',
      seed: S.seed,
      months: S.len ? monthsNeeded(SEED_LENGTH_NEEDS[st.lengthIdx], S.len) : 0,
    };
  }
  const s = STYLES.find((x) => x.id === S.styleId) || STYLES[0];
  return {
    kind: 'preset',
    styleId: s.id,
    label: s.zh + (color.prompt ? ' · ' + color.zh : ''),
    labelEn: s.en + (color.prompt ? ' · ' + color.en : ''),
    sub: s.en,
    hair: s.prompt,
    color: color.prompt,
    colorZh: color.prompt ? color.zh : '',
    seed: Math.floor(Math.random() * 1e6),
    months: styleMonths(s.id),
  };
}

function renderSummary() {
  if (!S.photos.length) return;
  const r = recipe();
  const n = S.scope === 'all' ? S.photos.length : 1;
  const tail = r.months ? `<span class="grow">${t('meta.grow', { n: r.months })}</span>` : t('meta.ok');
  const nm = r.kind === 'seed' ? r.sub : getLang() === 'zh' ? r.label : r.labelEn;
  $('#genSummary').innerHTML = `<b>${nm}</b>${tail} · ${tn('gen.photos', n)} · ${t(S.quality === 'hd' ? 'opt.quality.hd' : 'opt.quality.fast')}`;
  const btn = $('#btnGenerate');
  btn.disabled = S.busy;
  btn.textContent = S.busy ? t('gen.busy') : t('gen.btn');
}

// ---------------------------------------------------------------- generation
let scanRAF = 0;
function startScan(photo) {
  const c = $('#stageScan');
  const g = c.getContext('2d');
  const dpr = Math.min(2, devicePixelRatio || 1);
  const t0 = performance.now();
  const draw = (t) => {
    const w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    const k = ((t - t0) / 1600) % 1;
    const y = k * h * 1.2 - h * 0.1;
    const grad = g.createLinearGradient(0, y - 70, 0, y + 6);
    grad.addColorStop(0, 'rgba(143,124,247,0)');
    grad.addColorStop(0.8, 'rgba(143,124,247,.20)');
    grad.addColorStop(1, 'rgba(73,214,232,.85)');
    g.fillStyle = grad;
    g.fillRect(0, y - 70, w, 76);
    const p = S.photos.find((x) => x.id === S.sel);
    if (p && p.lm) {
      for (let i = 0; i < p.lm.length; i += 6) {
        const px = p.lm[i] * w, py = p.lm[i + 1] * h;
        const d = Math.abs(py - y);
        const a = d < 60 ? 0.9 - d / 70 : 0.18;
        g.fillStyle = `hsla(${190 + (py / h) * 140},90%,${d < 60 ? 75 : 92}%,${a})`;
        g.fillRect(px - 1, py - 1, 2, 2);
      }
    }
    scanRAF = requestAnimationFrame(draw);
  };
  cancelAnimationFrame(scanRAF);
  scanRAF = requestAnimationFrame(draw);
}
function stopScan() {
  cancelAnimationFrame(scanRAF);
  const c = $('#stageScan');
  c.getContext('2d').clearRect(0, 0, c.width, c.height);
}

async function generate() {
  if (S.busy || !S.photos.length) return;
  const r = recipe();
  const sel = S.photos.find((p) => p.id === S.sel) || S.photos[0];
  let targets = S.scope === 'all' ? [...S.photos] : [sel];
  // front first: its result becomes the reference that keeps every angle consistent
  targets.sort((a, b) => (a.angle === 'front' ? -1 : b.angle === 'front' ? 1 : 0));
  S.busy = true;
  renderSummary();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  const setId = store.uid();
  const prog = $('#stageProgress');
  const progText = $('#stageProgressText');
  prog.hidden = false;
  let refBlob = null;
  let made = 0;
  const t0 = Date.now();
  let quality = S.quality;
  try {
    for (const [i, p] of targets.entries()) {
      S.sel = p.id;
      renderAngles();
      renderStage();
      startScan(p);
      $$('.angle').forEach((a) => a.classList.toggle('is-busy', a.dataset.id === p.id));
      progText.textContent = targets.length > 1 ? t('gen.progress.multi', { i: i + 1, n: targets.length, angle: angleName(p.angle) }) : t('gen.progress.one');
      const input = quality === 'hd' ? p.blob : await resizeBlob(p.blob, 384, 512, 0.9);
      let out;
      try {
        out = await generateLook({ image: input, ref: refBlob, hair: r.hair, color: r.color, seed: r.seed, quality });
      } catch (e) {
        if (quality === 'hd' && e.code === 'quota') {
          quality = 'fast';
          toast(t('gen.hdquota'));
          out = await generateLook({ image: await resizeBlob(p.blob, 384, 512), ref: refBlob, hair: r.hair, color: r.color, seed: r.seed, quality });
        } else throw e;
      }
      let blob = out.blob;
      if (S.lock) {
        progText.textContent = t('gen.lock');
        try {
          const res = await identityLock(p.blob, blob);
          blob = res.blob;
        } catch (e) {
          console.warn('identity lock failed', e);
        }
      }
      if (i === 0 && targets.length > 1) refBlob = await resizeBlob(blob, 384, 512, 0.9);
      await store.addLook({
        date: S.date, photoId: p.id, setId, kind: r.kind, styleId: r.styleId || null, label: r.label,
        sub: r.sub, labelEn: r.labelEn, color: r.colorZh, seed: r.seed, quality, months: r.months, blob,
      });
      made++;
      S.looks = await store.looksByDate(S.date);
      S.set = setId;
      renderLooks();
      renderAngles();
      renderStage();
    }
    const secs = Math.round((Date.now() - t0) / 1000);
    toast(t('gen.done', { n: made, s: secs }) + (r.months ? t('gen.done.grow', { m: r.months }) : ''));
  } catch (e) {
    console.error(e);
    toast(errorText(e), 4200);
  } finally {
    S.busy = false;
    stopScan();
    prog.hidden = true;
    $$('.angle').forEach((a) => a.classList.remove('is-busy'));
    if (targets[0]) S.sel = targets.find((t) => t.id === sel.id) ? sel.id : targets[0].id;
    renderAngles();
    renderStage();
    renderSummary();
  }
}

async function saveCurrent() {
  const look = currentLook();
  if (!look) return;
  const name = `hairmagic-${look.date}-${fileSafe(lookLabel(look))}.jpg`;
  const file = new File([look.blob], name, { type: 'image/jpeg' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'HairMagic' });
      return;
    } catch (e) {
      if (e.name === 'AbortError') return;
    }
  }
  const a = document.createElement('a');
  a.href = urlFor(look);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// ---------------------------------------------------------------- stage gestures
function bindStage() {
  const stage = $('#stage');
  let sx = 0, sy = 0, tracking = false, dragging = false;
  stage.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    sx = e.clientX; sy = e.clientY; tracking = true;
    dragging = S.compare && Math.abs(e.clientX - (stage.getBoundingClientRect().left + stage.clientWidth * comparePos / 100)) < 40;
    if (dragging) stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', (e) => {
    if (!tracking) return;
    if (dragging) {
      const r = stage.getBoundingClientRect();
      comparePos = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
      applyCompare();
    }
  });
  const end = (e) => {
    if (!tracking) return;
    tracking = false;
    if (dragging) { dragging = false; return; }
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      // swipe = turn the head: move through the ordered angles
      const i = S.photos.findIndex((p) => p.id === S.sel);
      const j = Math.max(0, Math.min(S.photos.length - 1, i + (dx < 0 ? 1 : -1)));
      if (j !== i) selectPhoto(S.photos[j].id);
    }
  };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', () => (tracking = dragging = false));
  $('#btnCompare').onclick = () => setCompare(!S.compare);
  $('#btnSave').onclick = saveCurrent;
}

// ---------------------------------------------------------------- capture overlay
let cap = null;
let lastSt = null;
let capFailed = null;
async function openCapture(retake = false) {
  const ov = $('#capture');
  ov.hidden = false;
  document.body.style.overflow = 'hidden';
  lastSt = null;
  $('#capTip').textContent = t('cap.starting');
  $('#capSub').textContent = t('cap.loading');
  const existing = new Set((await store.photosByDate(store.today())).map((p) => p.angle));
  if (S.date !== store.today()) await loadDate(store.today());
  cap = new GuidedCapture({
    video: $('#camVideo'),
    hud: $('#camHud'),
    onStatus: (st) => updateCapTip(st),
    onError: (m) => toast(m),
    onShot: async (shot, angle) => {
      const fl = $('#capFlash');
      fl.classList.remove('go');
      void fl.offsetWidth;
      fl.classList.add('go');
      if (navigator.vibrate) navigator.vibrate(30);
      await savePhoto(shot, angle);
      renderCapSteps();
      if (cap && STEPS.every((s) => cap.done.has(s.key))) setTimeout(closeCapture, 700);
    },
  });
  cap.retake = retake; // retake: nothing counts as done, every angle is shot again and replaces the old photo
  if (!retake) {
    existing.forEach((a) => cap.done.add(a));
    const front = S.photos.find((p) => p.angle === 'front');
    if (front && typeof front.pitch === 'number') cap.baseline = Math.max(-12, Math.min(12, front.pitch));
  }
  setupMirrorButton();
  renderCapSteps();
  try {
    await cap.start();
  } catch (e) {
    console.error(e);
    capFailed = e.name === 'NotAllowedError' ? 'cap.fail.denied' : 'cap.fail.other';
    $('#capTip').textContent = t('cap.fail');
    $('#capSub').textContent = t(capFailed);
  }
}

async function savePhoto(shot, angle) {
  const old = S.photos.filter((p) => p.angle === angle && p.date === store.today());
  for (const o of old) await store.deletePhoto(o.id);
  await store.addPhoto({
    angle, order: ANGLE_ORDER[angle] ?? 9, blob: shot.blob, w: 768, h: 1024,
    lm: compactLandmarks(shot.face), yawG: shot.pose.yawG, pitchR: shot.pose.pitchR,
    yaw: shot.pose.yaw, pitch: shot.pose.pitch, // degrees from the 3D face fit
  });
  if (angle === 'front') store.prefs.set('len.' + store.today(), null);
  S.photos = orderPhotos(await store.photosByDate(store.today()));
}

function updateCapTip(st) {
  lastSt = st;
  capFailed = null;
  const step = cap && cap.current;
  const tip = $('#capTip'), sub = $('#capSub');
  if (!step) {
    tip.textContent = t('cap.alldone');
    sub.textContent = t('cap.alldone.sub');
    return;
  }
  tip.textContent = step.tip;
  if (!st.face) sub.textContent = t('cap.noface');
  else if (st.fit === 'near') sub.textContent = t('cap.near');
  else if (st.fit === 'far') sub.textContent = t('cap.far');
  else if (st.fit === 'edge') sub.textContent = t('cap.edge');
  else if (st.fit === 'top') sub.textContent = t('cap.top');
  else if (st.score >= 0.98) sub.textContent = t('hint.hold');
  else sub.textContent = st.hint || '';
}

function renderCapSteps() {
  const ol = $('#capSteps');
  ol.innerHTML = '';
  const cur = cap && cap.current;
  for (const s of STEPS) {
    let p = S.photos.find((x) => x.angle === s.key && x.date === store.today());
    if (p && cap && cap.retake && !cap.done.has(s.key)) p = null; // old photo, not retaken yet
    const li = document.createElement('li');
    li.className = 'cap-step' + (p ? ' is-done' : '') + (cur && cur.key === s.key ? ' is-current' : '');
    li.innerHTML = `<div class="thumb">${p ? `<img alt="" src="${urlFor(p)}">` : ''}</div>${angleName(s.key)}${s.key === 'up' || s.key === 'down' ? `<span class="opt-tag">${t('cap.optional')}</span>` : ''}`;
    ol.appendChild(li);
  }
  const n = cap && cap.retake ? cap.done.size : S.photos.filter((p) => p.date === store.today()).length;
  const need = cap && cap.retake ? 1 : 3;
  $('#capDone').disabled = n < need;
  $('#capDone').textContent = n < need ? `${n}/${need}` : t('cap.done');
}

function setupMirrorButton() {
  let b = $('#capMirror');
  if (!b) {
    b = document.createElement('button');
    b.id = 'capMirror';
    b.type = 'button';
    b.className = 'cap-mirror';
    $('.cap-top').appendChild(b);
  }
  const sync = () => {
    b.textContent = cap && cap.mirror ? t('cap.mirror.on') : t('cap.mirror.off');
    b.setAttribute('aria-pressed', cap && cap.mirror ? 'true' : 'false');
  };
  b.onclick = () => {
    if (!cap) return;
    cap.setMirror(!cap.mirror);
    sync();
  };
  sync();
}

function retakeToday() {
  if (!confirm(t('retake.confirm'))) return;
  openCapture(true);
}

function closeCapture() {
  if (cap) cap.stop();
  cap = null;
  $('#capture').hidden = true;
  document.body.style.overflow = '';
  go('studio');
  loadDate(store.today());
}

async function importFiles(files, fromCapture) {
  if (!files || !files.length) return;
  const list = [...files].slice(0, 5);
  toast(t('imp.detect'), 8000);
  await loadVision();
  const used = new Set();
  let ok = 0;
  const shots = [];
  for (const f of list) {
    try {
      const c = await fileToCanvas(f);
      const shot = await cropHead(c, c.width, c.height);
      if (shot) shots.push(shot);
    } catch (e) {
      console.warn(e);
    }
  }
  // label every photo from its real 3D head pose; one photo per angle (best fit wins)
  const plan = planAngles(shots);
  for (const { shot, angle } of plan) {
    used.add(angle);
    await savePhoto(shot, angle);
    ok++;
  }
  const noFace = list.length - shots.length;
  const dup = shots.length - plan.length;
  toast(ok
    ? t('imp.ok', { n: ok }) + (dup ? t('imp.dup', { n: dup }) : '') + (noFace ? t('imp.noface', { n: noFace }) : '')
    : t('imp.none'));
  if (fromCapture && cap) {
    used.forEach((a) => cap.done.add(a));
    renderCapSteps();
  } else {
    await loadDate(store.today());
  }
}

// ---------------------------------------------------------------- sheets
function openSheet(id) {
  $('#sheetScrim').hidden = false;
  $(id).hidden = false;
}
function closeSheets() {
  $('#sheetScrim').hidden = true;
  $$('.sheet').forEach((s) => (s.hidden = true));
}

function openLenSheet() {
  const l = S.len || { ...LENGTH_PRESETS[2] };
  const set = (k, v) => {
    $('#len' + k).value = v;
    $('#len' + k + 'V').textContent = cm(+v) + ' cm';
  };
  set('Top', l.top);
  set('Side', l.side);
  set('Back', l.back);
  $('#lenSource').textContent =
    l.source === 'vlm' ? t('len.src.vlm')
      : l.source === 'manual' ? t('len.src.manual')
      : t('len.src.geo');
  const pres = $('#lenPresets');
  pres.innerHTML = '';
  LENGTH_PRESETS.forEach((p) => {
    const b = document.createElement('button');
    b.textContent = presetName(p);
    b.className = lengthIndex(l) === p.id ? 'is-on' : '';
    b.onclick = () => {
      set('Top', p.top);
      set('Side', p.side);
      set('Back', p.back);
      applyLenFromSliders();
      $$('button', pres).forEach((x) => x.classList.toggle('is-on', x === b));
    };
    pres.appendChild(b);
  });
  openSheet('#sheetLen');
}

function applyLenFromSliders() {
  S.len = { top: +$('#lenTop').value, side: +$('#lenSide').value, back: +$('#lenBack').value, source: 'manual' };
  store.prefs.set('len.' + S.date, S.len);
  renderLen();
  renderMode();
  renderSummary();
}

async function openDateSheet() {
  const dates = await store.listDates();
  if (!dates.find((d) => d.date === store.today())) dates.unshift({ date: store.today(), photos: [], looks: [] });
  const box = $('#dateList');
  box.innerHTML = '';
  for (const d of dates) {
    const b = document.createElement('button');
    b.className = 'date-row' + (d.date === S.date ? ' is-on' : '');
    b.innerHTML = `<b>${dateLabel(d.date)} <small>${weekday(d.date)}</small></b><span>${t('dates.stats', { p: d.photos.length, s: new Set(d.looks.map((l) => l.setId)).size })}</span>`;
    b.onclick = () => {
      closeSheets();
      go('studio');
      loadDate(d.date);
    };
    box.appendChild(b);
  }
  openSheet('#sheetDates');
}

// ---------------------------------------------------------------- archive
async function renderArchive() {
  const box = $('#archiveList');
  const dates = await store.listDates();
  box.innerHTML = '';
  if (!dates.length) {
    box.innerHTML = `<div class="archive-empty">${t('archive.empty')}</div>`;
    return;
  }
  for (const d of dates) {
    const sets = new Map();
    d.looks.forEach((l) => { if (!sets.has(l.setId)) sets.set(l.setId, l); });
    const card = document.createElement('article');
    card.className = 'day';
    const [y, m, dd] = d.date.split('-');
    card.innerHTML = `
      <div class="day-head"><div class="day-date">${y}.${m}.${dd}<small>${weekday(d.date)}${d.date === store.today() ? ' · ' + t('date.today') : ''}</small></div>
      <div class="day-stats">${t('archive.stats', { p: d.photos.length, s: sets.size })}</div></div>
      <div class="day-strip">${orderPhotos(d.photos).map((p) => `<img alt="" src="${urlForArchive(p)}">`).join('')}${sets.size ? '<span class="sep"></span>' : ''}${[...sets.values()].slice(0, 12).map((l) => `<img alt="" src="${urlForArchive(l)}">`).join('')}</div>
      <div class="day-actions"><button class="btn btn-ink" data-a="open">${t('archive.open')}</button><button class="btn btn-ghost" data-a="del">${t('archive.del')}</button></div>`;
    card.querySelector('[data-a=open]').onclick = () => { go('studio'); loadDate(d.date); };
    card.querySelector('[data-a=del]').onclick = async () => {
      if (!confirm(t('archive.del.confirm', { date: d.date }))) return;
      await store.deleteDate(d.date);
      store.prefs.set('len.' + d.date, null);
      if (d.date === S.date) await loadDate(store.today());
      renderArchive();
    };
    box.appendChild(card);
  }
}
const archiveUrls = new Map();
function urlForArchive(rec) {
  if (!archiveUrls.has(rec.id)) archiveUrls.set(rec.id, URL.createObjectURL(rec.blob));
  return archiveUrls.get(rec.id);
}


// ---------------------------------------------------------------- 3D Gaussian Splatting
let viewer = null;
let pollT = 0;
let v3Holder = null;

const setItems = () => S.looks.filter((l) => l.setId === S.set);
const photoOf = (id) => S.photos.find((p) => p.id === id);
const ANGLE_RANK = { front: 0, left: 1, right: 2, up: 3, down: 4, other: 5 };

// "Original" chip selected (S.set === null): train from the captured photos themselves,
// otherwise from the generated looks of the active set. Front photo always goes first.
const isOrig = () => S.set === null;
const rankOf = (angle) => ANGLE_RANK[angle || 'other'] ?? 9;

function gsSource() {
  if (isOrig()) {
    return [...S.photos]
      .sort((a, b) => rankOf(a.angle) - rankOf(b.angle))
      .map((p) => ({ blob: p.blob, angle: p.angle || 'other', yawG: p.yawG ?? null }));
  }
  return setItems()
    .map((l) => {
      const p = photoOf(l.photoId) || {};
      return { blob: l.blob, angle: p.angle || 'other', yawG: p.yawG ?? null };
    })
    .sort((a, b) => rankOf(a.angle) - rankOf(b.angle));
}

function gsHolder() {
  if (isOrig()) {
    return (
      S.photos.find((p) => p.gsBlob || p.gsJob) ||
      S.photos.find((p) => p.angle === 'front') ||
      S.photos[0] || null
    );
  }
  const items = setItems();
  return (
    items.find((l) => l.gsBlob || l.gsJob) ||
    items.find((l) => (photoOf(l.photoId) || {}).angle === 'front') ||
    items[0] || null
  );
}

// a holder is either a look (has setId) or an original photo record
const saveHolder = (h) => (h.setId ? store.updateLook(h) : store.updatePhoto(h));
const holderLabel = (h) => (!h ? '' : h.setId ? lookLabel(h) : t('v3.title.orig'));

function v3State(state, text = '', sub = '') {
  const ov = $('#viewer3d');
  ov.dataset.state = state;
  $('#v3Train').textContent = t(state === 'error' ? 'v3.retrain' : 'v3.train');
  $('#v3Status').textContent = text;
  $('#v3Sub').textContent = sub;
}

async function open3D() {
  const h = gsHolder();
  if (!h) return;
  v3Holder = h;
  $('#viewer3d').hidden = false;
  document.body.style.overflow = 'hidden';
  $('#v3Title').textContent = holderLabel(h) || t('v3.title');
  if (h.gsBlob) return showSplat(h.gsBlob);
  if (h.gsJob) return pollJob();
  return open3DIntro();
}

async function open3DIntro() {
  const n = Math.min(5, gsSource().length);
  const st = await gsStatus();
  v3State(
    'intro',
    n > 1 ? t('v3.intro.n', { n }) : t('v3.intro.1'),
    t(n > 1 ? 'v3.intro.sub.n' : 'v3.intro.sub.1') + t(st.worker_online ? 'v3.worker.on' : 'v3.worker.off')
  );
}

function close3D() {
  clearTimeout(pollT);
  if (viewer) {
    viewer.dispose();
    viewer = null;
  }
  $('#viewer3d').hidden = true;
  document.body.style.overflow = '';
}

async function start3DJob() {
  const items = gsSource().slice(0, 5);
  if (!items.length) return;
  const label = isOrig() ? t('looks.original') : (setItems()[0] || {}).label || '';
  v3State('training', t('v3.uploading'), '');
  try {
    const views = await Promise.all(items.map((it) => resizeBlob(it.blob, 768, 1024, 0.9)));
    const meta = {
      angles: items.map((it) => it.angle),
      yaw: items.map((it) => it.yawG),
      label,
      source: isOrig() ? 'original' : 'look',
      date: S.date,
    };
    const { id } = await createGsJob({ views, meta, label });
    const h = gsHolder();
    h.gsJob = id;
    await saveHolder(h);
    v3Holder = h;
    pollJob();
  } catch (e) {
    console.error(e);
    v3State('error', e.code === 'queue_full' ? t('v3.queuefull') : t('v3.uploadfail'), errorText(e));
  }
}

const STAGE_ZH = (st) => {
  if (!st) return '';
  return st;
};

async function pollJob() {
  clearTimeout(pollT);
  const h = v3Holder;
  if (!h || !h.gsJob || $('#viewer3d').hidden) return;
  let j;
  try {
    j = await gsJob(h.gsJob);
  } catch (e) {
    if (e.code === 'job_missing') {
      delete h.gsJob;
      await saveHolder(h);
      v3State('error', t('v3.expired'), t('v3.expired.sub'));
      return;
    }
    pollT = setTimeout(pollJob, 5000);
    return;
  }
  if (j.status === 'done') {
    v3State('training', t('v3.downloading'), '');
    try {
      const blob = await gsResult(h.gsJob);
      h.gsBlob = blob;
      h.gsAt = Date.now();
      delete h.gsJob;
      await saveHolder(h);
      if (h.setId) S.looks = await store.looksByDate(S.date);
      return showSplat(blob);
    } catch (e) {
      pollT = setTimeout(pollJob, 4000);
      return;
    }
  }
  if (j.status === 'error') {
    delete h.gsJob;
    await saveHolder(h);
    v3State('error', t('v3.failed'), j.error || t('v3.retry'));
    return;
  }
  const pct = Math.round((j.progress || 0) * 100);
  if (j.status === 'queued') {
    v3State(
      'training',
      j.worker_online ? (j.ahead ? t('v3.queue.ahead', { n: j.ahead }) : t('v3.queue.soon')) : t('v3.queue.wait'),
      j.worker_online ? '' : t('v3.queue.sub')
    );
  } else {
    v3State('training', STAGE_ZH(j.stage) || t('v3.training'), `${pct}%`);
  }
  $('#v3Bar').style.width = pct + '%';
  pollT = setTimeout(pollJob, 2500);
}

async function showSplat(blob) {
  v3State('loading', t('v3.loading'), '');
  try {
    const { SplatViewer } = await import('./gs3d.js?v=202611150506');
    if (!viewer) viewer = new SplatViewer($('#v3Canvas'));
    const info = await viewer.load(await blob.arrayBuffer());
    v3State('view', '', t('v3.points', { n: (info.count / 1000).toFixed(1) }));
  } catch (e) {
    console.error(e);
    v3State('error', t('v3.loadfail'), t('v3.loadfail.sub'));
  }
}

function save3D() {
  const h = v3Holder;
  if (!h || !h.gsBlob) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(h.gsBlob);
  a.download = `hairmagic-${h.date}-${fileSafe(holderLabel(h))}.ply`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

// ---------------------------------------------------------------- navigation
function go(view) {
  if (view === 'scan') {
    openCapture();
    return;
  }
  S.view = view;
  $('#view-studio').hidden = view !== 'studio';
  $('#view-archive').hidden = view !== 'archive';
  $$('.tab[data-go]').forEach((t) => t.classList.toggle('is-on', t.dataset.go === view));
  if (view === 'archive') renderArchive();
  window.scrollTo(0, 0);
}

// ---------------------------------------------------------------- bind
function bind() {
  $$('.tab[data-go]').forEach((t) => (t.onclick = () => go(t.dataset.go)));
  $('#startScan').onclick = () => openCapture();
  $('#btnRetake').onclick = retakeToday;
  $('#pickFiles').onchange = (e) => importFiles(e.target.files, false).finally(() => (e.target.value = ''));
  $('#capFiles').onchange = (e) => importFiles(e.target.files, true).finally(() => (e.target.value = ''));
  $('#capClose').onclick = closeCapture;
  $('#capDone').onclick = closeCapture;
  $('#capShutter').onclick = () => cap && cap.running && cap.shoot(cap.current ? cap.current.key : 'front', true);
  $('#dateChip').onclick = openDateSheet;
  $('#langChip').onclick = () => setLang(getLang() === 'zh' ? 'en' : 'zh');
  onLangChange(refreshLang);
  $('#sheetScrim').onclick = closeSheets;
  $('#hairLen').onclick = openLenSheet;
  ['Top', 'Side', 'Back'].forEach((k) =>
    $('#len' + k).addEventListener('input', (e) => {
      $('#len' + k + 'V').textContent = cm(+e.target.value) + ' cm';
      applyLenFromSliders();
      $$('#lenPresets button').forEach((b) => b.classList.toggle('is-on', b.textContent === describeLength(S.len)));
    })
  );
  $('#lenDone').onclick = closeSheets;
  $('#lenReanalyze').onclick = async () => {
    closeSheets();
    store.prefs.set('len.' + S.date, null);
    await ensureHairLength();
    toast(t('len.reanalyzed'));
  };
  $$('.seg-btn').forEach((b) => (b.onclick = () => { S.mode = b.dataset.mode; renderMode(); renderSummary(); }));
  $$('.line-btn').forEach((b) => (b.onclick = () => {
    S.line = b.dataset.line;
    store.prefs.set('line', S.line);
    S.styleId = null;
    renderLine();
  }));
  $('#btn3d').onclick = open3D;
  $('#v3Close').onclick = close3D;
  $('#v3Reset').onclick = () => viewer && viewer.reset();
  $('#v3Spin').onclick = () => {
    const on = $('#v3Spin').getAttribute('aria-pressed') !== 'true';
    $('#v3Spin').setAttribute('aria-pressed', on);
    viewer && viewer.setAutoRotate(on);
  };
  $('#v3Save').onclick = save3D;
  $('#v3Train').onclick = () => start3DJob(true);
  $$('.pills').forEach((g) =>
    $$('.pill', g).forEach((p) => (p.onclick = () => {
      S[g.dataset.opt] = p.dataset.v;
      store.prefs.set(g.dataset.opt, p.dataset.v);
      renderOptions();
      renderSummary();
    }))
  );
  $('#lockFace').onchange = (e) => { S.lock = e.target.checked; store.prefs.set('lock', S.lock); };
  $('#seedDice').onclick = () => {
    S.seed = randomSeed();
    store.prefs.set('seed', S.seed);
    const d = $('#seedDice');
    d.classList.toggle('spin');
    renderSeed();
  };
  $('#seedInput').addEventListener('input', (e) => {
    const v = parseInt(e.target.value.replace(/\D/g, ''), 10);
    if (!isNaN(v)) { S.seed = v; store.prefs.set('seed', v); renderSeed(); }
  });
  $('#seedInput').addEventListener('blur', () => renderSeed());
  $('#seedGrowOk').onchange = (e) => { S.seedGrowOk = e.target.checked; renderSeed(); };
  $('#seedColor').onchange = (e) => { S.seedColor = e.target.checked; renderSeed(); };
  $('#btnGenerate').onclick = generate;
  bindStage();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && cap) cap.stop();
    else if (!document.hidden && cap && !cap.running && !$('#capture').hidden) cap.start().catch(() => {});
  });
}

function refreshLang() {
  $('#dateLabel').textContent = dateLabel(S.date);
  if (S.photos.length) renderStudio();
  if (S.view === 'archive') renderArchive();
  if (cap) {
    renderCapSteps();
    setupMirrorButton();
    if (lastSt) updateCapTip(lastSt);
    else if (capFailed) { $('#capTip').textContent = t('cap.fail'); $('#capSub').textContent = t(capFailed); }
    else { $('#capTip').textContent = t('cap.starting'); $('#capSub').textContent = t('cap.loading'); }
  }
  if (!$('#sheetLen').hidden) openLenSheet();
  if (!$('#sheetDates').hidden) openDateSheet();
  if (!$('#viewer3d').hidden && v3Holder) $('#v3Title').textContent = holderLabel(v3Holder) || t('v3.title');
  const vs = $('#viewer3d');
  if (vs.dataset.state === 'intro') open3DIntro();
  else $('#v3Train').textContent = t(vs.dataset.state === 'error' ? 'v3.retrain' : 'v3.train');
}

async function init() {
  window.__hmBooted = true;
  applyStatic();
  bind();
  store.persist();
  await loadDate(store.today());
  if (!S.photos.length) {
    // show the most recent day that has photos, if today is empty
    const dates = await store.listDates();
    const last = dates.find((d) => d.photos.length);
    if (last && last.date !== S.date) {
      await loadDate(last.date);
    }
  }
  // warm up the face model in the background
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 1200));
  idle(() => loadVision().catch((e) => console.warn('vision preload failed', e)));
}

init().catch((e) => {
  console.error(e);
  if (window.__hmReport) window.__hmReport('init: ' + (e && (e.stack || e.message)));
  if (window.__hmShow) window.__hmShow(t('err.boot', { m: e && e.message }));
});
