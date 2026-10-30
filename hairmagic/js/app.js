// HairMagic — app shell: state, studio, capture flow, archive.
import * as store from './store.js';
import { STYLES, COLORS, randomSeed, styleFromSeed, suggestForFace } from './styles.js';
import {
  NEEDS, LENGTH_PRESETS, SEED_LENGTH_NEEDS, GROWTH_CM_PER_MONTH,
  monthsNeeded, gapDetail, describeLength, geometricEstimate,
} from './length.js';
import { generateLook, analyzeHair, errorText, createGsJob, gsJob, gsResult, gsStatus } from './api.js';
import { loadBitmap, toCanvas, canvasToBlob, identityLock } from './composite.js';
import { loadVision, detectFace, faceShape, FACE_SHAPE_ZH } from './vision.js';
import {
  GuidedCapture, STEPS, ANGLE_ZH, ANGLE_ORDER, cropHead, compactLandmarks, classifyAngle, fileToCanvas,
} from './capture.js';

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
const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
function dateLabel(d) {
  if (d === store.today()) return '今天';
  const [y, m, dd] = d.split('-').map(Number);
  const now = new Date();
  return (y === now.getFullYear() ? '' : y + '年') + `${m}月${dd}日`;
}
function weekday(d) {
  const [y, m, dd] = d.split('-').map(Number);
  return WEEK[new Date(y, m - 1, dd).getDay()];
}
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
    el.innerHTML = S.photos.length ? '正在估算…' : '拍照后自动估算';
    return;
  }
  const l = S.len;
  const rough = l.source === 'geometry' || l.source === 'default' ? ' · 粗估，点右侧校准' : '';
  el.innerHTML = `${describeLength(l)} <small>顶 ${cm(l.top)} · 侧 ${cm(l.side)} · 后 ${cm(l.back)} cm${rough}</small>`;
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
    b.innerHTML = `<img alt="" src="${urlFor(look || p)}"><span class="angle-name">${ANGLE_ZH[p.angle] || '其他'}</span>${look ? '<span class="angle-dot"></span>' : ''}`;
    b.onclick = () => selectPhoto(p.id);
    box.appendChild(b);
  }
  if (S.photos.length < 5) {
    const add = document.createElement('button');
    add.className = 'angle angle-add';
    add.setAttribute('aria-label', '补拍角度');
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
  $('#stageAngle').textContent = ANGLE_ZH[p.angle] || '其他';
  const info = $('#stageInfo');
  if (look) {
    info.hidden = false;
    info.textContent = look.label + (look.seed && look.kind === 'seed' ? ` · #${look.seed}` : '');
  } else info.hidden = true;
  $('#btnSave').hidden = !look;
  $('#btn3d').hidden = !look;
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
  $('#looksCount').textContent = sets.length ? `${sets.length} 组` : '';
  const rail = $('#looksRail');
  rail.innerHTML = '';
  // "original" chip first
  const orig = document.createElement('button');
  orig.className = 'look' + (S.set === null ? ' is-on' : '');
  const p0 = S.photos.find((p) => p.id === S.sel) || S.photos[0];
  orig.innerHTML = `<div class="look-img"><img alt="" src="${urlFor(p0)}"></div><div class="look-name">原图</div>`;
  orig.onclick = () => { S.set = null; renderLooks(); renderAngles(); renderStage(); };
  rail.appendChild(orig);
  for (const s of sets) {
    const b = document.createElement('button');
    b.className = 'look' + (s.setId === S.set ? ' is-on' : '');
    const cover = s.items.find((l) => l.photoId === S.sel) || s.items[0];
    b.innerHTML = `<div class="look-img"><img alt="" src="${urlFor(cover)}"></div>${s.items.length > 1 ? `<span class="look-count">${s.items.length} 角度</span>` : ''}<div class="look-name">${s.label}</div>`;
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
  if (!confirm(`删除造型「${s.label}」？`)) return;
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
  const shapeTxt = S.shape ? `，${FACE_SHAPE_ZH[S.shape]}推荐款标 ★` : '';
  note.textContent = S.mode === 'now'
    ? (S.len ? `按你现在的发长（${lenTxt}），${S.line === 'f' ? '女士' : '男士'}发型里这 ${nowCount} 款现在就能剪${shapeTxt}。` : '正在估算你的发长…')
    : `需要留长的发型会标出大约要留几个月（按每月 ${GROWTH_CM_PER_MONTH} cm）。`;

  const grid = $('#styleGrid');
  grid.innerHTML = '';
  for (const { s, months, rec: r } of list) {
    const b = document.createElement('button');
    b.className = 'style' + (s.id === S.styleId ? ' is-on' : '') + (months ? ' is-grow' : '');
    b.dataset.id = s.id;
    const svc = NEEDS[s.id].service;
    const meta = months
      ? `<div class="style-meta is-grow">需留发约 ${months} 个月</div>`
      : `<div class="style-meta is-ok">${svc ? '现在可做 · 需' + svc : '现在可剪'}</div>`;
    b.innerHTML = `<div class="style-img"><img loading="lazy" alt="" src="./assets/styles/${s.id}.jpg" onerror="this.parentNode.classList.add('is-missing');this.remove()"><span class="style-ph">${s.en}</span></div>${r ? '<span class="badge-rec">★ 推荐</span>' : ''}<div class="style-body"><div class="style-name">${s.zh}</div>${meta}</div>`;
    b.onclick = () => {
      S.styleId = s.id;
      $$('.style', grid).forEach((x) => x.classList.toggle('is-on', x.dataset.id === s.id));
      renderSummary();
      if (months) {
        const g = gapDetail(NEEDS[s.id], S.len);
        toast(`${s.zh}：${g.zh}需要约 ${cm(g.need)} cm，你现在约 ${cm(g.cur)} cm，预计留发 ${months} 个月`, 4200);
      }
    };
    grid.appendChild(b);
  }
  if (!list.length) grid.innerHTML = '<p class="mode-note">没有匹配的发型，试试“全部 20 款”。</p>';
}

function allowedSeedLengths() {
  if (S.seedGrowOk || !S.len) return null;
  const ok = SEED_LENGTH_NEEDS.map((n, i) => (monthsNeeded(n, S.len) === 0 ? i : -1)).filter((i) => i >= 0);
  return ok.length ? ok : [0];
}

function currentSeedStyle() {
  return styleFromSeed(S.seed, { randomColor: S.seedColor, allowedLengths: allowedSeedLengths(), line: S.line });
}

function renderSeed() {
  const input = $('#seedInput');
  if (document.activeElement !== input) input.value = String(S.seed).padStart(6, '0');
  const st = currentSeedStyle();
  $('#seedDesc').textContent = st.zh + (st.color ? ` · ${st.color.zh}` : '');
  const months = S.len ? monthsNeeded(SEED_LENGTH_NEEDS[st.lengthIdx], S.len) : 0;
  const g = $('#seedGrow');
  g.classList.toggle('is-grow', months > 0);
  g.textContent = months ? `这个长度需要留发约 ${months} 个月` : '现在就能剪出这个长度';
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
    b.setAttribute('aria-label', c.zh);
    if (c.hex) b.style.background = c.hex;
    b.onclick = () => {
      S.colorId = c.id;
      store.prefs.set('color', c.id);
      renderColors();
      renderSummary();
    };
    box.appendChild(b);
  }
  $('#colorName').textContent = COLORS.find((c) => c.id === S.colorId).zh;
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
      sub: st.zh,
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
  const tail = r.months ? `<span class="grow">需留发约 ${r.months} 个月</span>` : '现在可剪';
  $('#genSummary').innerHTML = `<b>${r.kind === 'seed' ? r.sub : r.label}</b>${tail} · ${n} 张 · ${S.quality === 'hd' ? '高清' : '极速'}`;
  const btn = $('#btnGenerate');
  btn.disabled = S.busy;
  btn.textContent = S.busy ? '生成中…' : '生成造型';
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
      progText.textContent = targets.length > 1 ? `正在生成 ${i + 1}/${targets.length} · ${ANGLE_ZH[p.angle]}` : '正在生成新发型…';
      const input = quality === 'hd' ? p.blob : await resizeBlob(p.blob, 384, 512, 0.9);
      let out;
      try {
        out = await generateLook({ image: input, ref: refBlob, hair: r.hair, color: r.color, seed: r.seed, quality });
      } catch (e) {
        if (quality === 'hd' && e.code === 'quota') {
          quality = 'fast';
          toast('高清额度用完了，自动改用极速模式');
          out = await generateLook({ image: await resizeBlob(p.blob, 384, 512), ref: refBlob, hair: r.hair, color: r.color, seed: r.seed, quality });
        } else throw e;
      }
      let blob = out.blob;
      if (S.lock) {
        progText.textContent = '原貌锁定：对齐五官…';
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
        sub: r.sub, color: r.colorZh, seed: r.seed, quality, months: r.months, blob,
      });
      made++;
      S.looks = await store.looksByDate(S.date);
      S.set = setId;
      renderLooks();
      renderAngles();
      renderStage();
    }
    const secs = Math.round((Date.now() - t0) / 1000);
    toast(`已生成 ${made} 张 · ${secs} 秒${r.months ? ` · 这个发型需留发约 ${r.months} 个月` : ''}`);
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
  const name = `hairmagic-${look.date}-${(look.label || 'look').replace(/[^\w一-龥#-]+/g, '_')}.jpg`;
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
async function openCapture() {
  const ov = $('#capture');
  ov.hidden = false;
  document.body.style.overflow = 'hidden';
  $('#capTip').textContent = '正在启动摄像头…';
  $('#capSub').textContent = '首次使用需要加载人脸模型';
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
  existing.forEach((a) => cap.done.add(a));
  const front = S.photos.find((p) => p.angle === 'front');
  if (front && front.pitchR) cap.baseline = front.pitchR;
  renderCapSteps();
  try {
    await cap.start();
  } catch (e) {
    console.error(e);
    $('#capTip').textContent = '无法打开摄像头';
    $('#capSub').textContent = e.name === 'NotAllowedError' ? '请在浏览器设置里允许使用相机，或用左下角从相册导入' : '可以用左下角从相册导入照片';
  }
}

async function savePhoto(shot, angle) {
  const old = S.photos.filter((p) => p.angle === angle && p.date === store.today());
  for (const o of old) await store.deletePhoto(o.id);
  await store.addPhoto({
    angle, order: ANGLE_ORDER[angle] ?? 9, blob: shot.blob, w: 768, h: 1024,
    lm: compactLandmarks(shot.face), yawG: shot.pose.yawG, pitchR: shot.pose.pitchR,
  });
  if (angle === 'front') store.prefs.set('len.' + store.today(), null);
  S.photos = orderPhotos(await store.photosByDate(store.today()));
}

function updateCapTip(st) {
  const step = cap && cap.current;
  const tip = $('#capTip'), sub = $('#capSub');
  if (!step) {
    tip.textContent = '全部角度已拍好';
    sub.textContent = '点“完成”开始换发型';
    return;
  }
  tip.textContent = step.tip;
  if (!st.face) sub.textContent = '把整张脸放进画面中间';
  else if (st.sizeOk === false) sub.textContent = '靠近一点';
  else if (st.score >= 0.98) sub.textContent = '保持住…';
  else sub.textContent = step.key === 'front' ? '头摆正，眼睛看镜头' : step.key === 'left' || step.key === 'right' ? '转到约 30°，脸不要出画' : '幅度小一点就好';
}

function renderCapSteps() {
  const ol = $('#capSteps');
  ol.innerHTML = '';
  const cur = cap && cap.current;
  for (const s of STEPS) {
    const p = S.photos.find((x) => x.angle === s.key && x.date === store.today());
    const li = document.createElement('li');
    li.className = 'cap-step' + (p ? ' is-done' : '') + (cur && cur.key === s.key ? ' is-current' : '');
    li.innerHTML = `<div class="thumb">${p ? `<img alt="" src="${urlFor(p)}">` : ''}</div>${s.zh}${s.key === 'up' || s.key === 'down' ? '<span class="opt-tag">可选</span>' : ''}`;
    ol.appendChild(li);
  }
  const n = S.photos.filter((p) => p.date === store.today()).length;
  $('#capDone').disabled = n < 3;
  $('#capDone').textContent = n < 3 ? `${n}/3` : '完成';
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
  toast('正在识别人脸…', 8000);
  await loadVision();
  const used = new Set();
  let ok = 0;
  let base = 0.42;
  const shots = [];
  for (const f of list) {
    try {
      const c = await fileToCanvas(f);
      const shot = await cropHead(c, c.width, c.height);
      if (!shot) continue;
      shots.push(shot);
    } catch (e) {
      console.warn(e);
    }
  }
  // frontmost photo sets the pitch baseline
  shots.sort((a, b) => Math.abs(a.pose.yawG) - Math.abs(b.pose.yawG));
  if (shots[0]) base = shots[0].pose.pitchR;
  for (const [i, shot] of shots.entries()) {
    let angle = i === 0 ? 'front' : classifyAngle(shot.pose, base);
    if (used.has(angle)) angle = ['left', 'right', 'up', 'down'].find((a) => !used.has(a)) || 'other';
    used.add(angle);
    await savePhoto(shot, angle);
    ok++;
  }
  toast(ok ? `已导入 ${ok} 张` : '没有在照片里找到清晰的人脸');
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
    l.source === 'vlm' ? 'AI 根据正面照估算的发长，可以手动修正，发型推荐会跟着变。'
      : l.source === 'manual' ? '这是你手动设置的发长。'
      : '根据照片几何估算，误差可能较大，建议手动修正。';
  const pres = $('#lenPresets');
  pres.innerHTML = '';
  LENGTH_PRESETS.forEach((p) => {
    const b = document.createElement('button');
    b.textContent = p.zh;
    b.className = describeLength(l) === p.zh ? 'is-on' : '';
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
    b.innerHTML = `<b>${dateLabel(d.date)} <small>${weekday(d.date)}</small></b><span>${d.photos.length} 张头像 · ${new Set(d.looks.map((l) => l.setId)).size} 组造型</span>`;
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
    box.innerHTML = '<div class="archive-empty">还没有记录。点下方“扫描”拍下今天的头像。</div>';
    return;
  }
  for (const d of dates) {
    const sets = new Map();
    d.looks.forEach((l) => { if (!sets.has(l.setId)) sets.set(l.setId, l); });
    const card = document.createElement('article');
    card.className = 'day';
    const [y, m, dd] = d.date.split('-');
    card.innerHTML = `
      <div class="day-head"><div class="day-date">${y}.${m}.${dd}<small>${weekday(d.date)}${d.date === store.today() ? ' · 今天' : ''}</small></div>
      <div class="day-stats">${d.photos.length} 张头像 · ${sets.size} 组造型</div></div>
      <div class="day-strip">${orderPhotos(d.photos).map((p) => `<img alt="" src="${urlForArchive(p)}">`).join('')}${sets.size ? '<span class="sep"></span>' : ''}${[...sets.values()].slice(0, 12).map((l) => `<img alt="" src="${urlForArchive(l)}">`).join('')}</div>
      <div class="day-actions"><button class="btn btn-ink" data-a="open">打开</button><button class="btn btn-ghost" data-a="del">删除这天</button></div>`;
    card.querySelector('[data-a=open]').onclick = () => { go('studio'); loadDate(d.date); };
    card.querySelector('[data-a=del]').onclick = async () => {
      if (!confirm(`删除 ${d.date} 的全部头像和造型？此操作不可撤销。`)) return;
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

function gsHolder() {
  const items = setItems();
  return (
    items.find((l) => l.gsBlob || l.gsJob) ||
    items.find((l) => (photoOf(l.photoId) || {}).angle === 'front') ||
    items[0] || null
  );
}

function v3State(state, text = '', sub = '') {
  const ov = $('#viewer3d');
  ov.dataset.state = state;
  $('#v3Train').textContent = state === 'error' ? '重新训练' : '开始训练 3D 头像';
  $('#v3Status').textContent = text;
  $('#v3Sub').textContent = sub;
}

async function open3D() {
  const h = gsHolder();
  if (!h) return;
  v3Holder = h;
  $('#viewer3d').hidden = false;
  document.body.style.overflow = 'hidden';
  $('#v3Title').textContent = h.label || '3D 发型';
  if (h.gsBlob) return showSplat(h.gsBlob);
  if (h.gsJob) return pollJob();
  const n = setItems().length;
  const st = await gsStatus();
  v3State(
    'intro',
    n > 1 ? `用这组 ${n} 个角度训练 3D 头像` : '用这 1 张照片生成 3D 头像',
    (n > 1
      ? '先用人头先验（LAM）把正面照变成 3D 高斯点，再用其他角度做多视角训练。'
      : '只有一个角度时主要依赖人头先验，后脑勺是推测的。先用「全部角度」生成能训练得更准。') +
      (st.worker_online ? ' 训练节点在线，约 1–3 分钟。' : ' 训练节点目前离线：任务会排队，等你的电脑开机运行训练节点后自动开始。')
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
  const items = setItems().sort(
    (a, b) => (ANGLE_RANK[(photoOf(a.photoId) || {}).angle] ?? 9) - (ANGLE_RANK[(photoOf(b.photoId) || {}).angle] ?? 9)
  );
  if (!items.length) return;
  v3State('training', '正在上传照片…', '');
  try {
    const views = await Promise.all(items.slice(0, 5).map((l) => resizeBlob(l.blob, 768, 1024, 0.9)));
    const meta = {
      angles: items.slice(0, 5).map((l) => (photoOf(l.photoId) || {}).angle || 'other'),
      yaw: items.slice(0, 5).map((l) => (photoOf(l.photoId) || {}).yawG ?? null),
      label: items[0].label,
      date: S.date,
    };
    const { id } = await createGsJob({ views, meta, label: items[0].label });
    const h = gsHolder();
    h.gsJob = id;
    await store.updateLook(h);
    v3Holder = h;
    pollJob();
  } catch (e) {
    console.error(e);
    v3State('error', e.code === 'queue_full' ? '训练队列已满，请稍后再试' : '上传失败', errorText(e));
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
      await store.updateLook(h);
      v3State('error', '训练任务已过期', '重新开始训练即可');
      return;
    }
    pollT = setTimeout(pollJob, 5000);
    return;
  }
  if (j.status === 'done') {
    v3State('training', '训练完成，正在下载 3D 模型…', '');
    try {
      const blob = await gsResult(h.gsJob);
      h.gsBlob = blob;
      h.gsAt = Date.now();
      delete h.gsJob;
      await store.updateLook(h);
      S.looks = await store.looksByDate(S.date);
      return showSplat(blob);
    } catch (e) {
      pollT = setTimeout(pollJob, 4000);
      return;
    }
  }
  if (j.status === 'error') {
    delete h.gsJob;
    await store.updateLook(h);
    v3State('error', '3D 训练失败', j.error || '请重试');
    return;
  }
  const pct = Math.round((j.progress || 0) * 100);
  if (j.status === 'queued') {
    v3State(
      'training',
      j.worker_online ? (j.ahead ? `排队中，前面还有 ${j.ahead} 个任务` : '训练节点即将开始…') : '已排队，等待训练节点上线',
      j.worker_online ? '' : '训练节点是你电脑上的 GPU 程序，开机并运行后会自动接单。可以先关闭这个页面，稍后回来查看。'
    );
  } else {
    v3State('training', STAGE_ZH(j.stage) || '训练中…', `${pct}%`);
  }
  $('#v3Bar').style.width = pct + '%';
  pollT = setTimeout(pollJob, 2500);
}

async function showSplat(blob) {
  v3State('loading', '正在载入 3D 模型…', '');
  try {
    const { SplatViewer } = await import('./gs3d.js');
    if (!viewer) viewer = new SplatViewer($('#v3Canvas'));
    const info = await viewer.load(await blob.arrayBuffer());
    v3State('view', '', `${(info.count / 1000).toFixed(1)}k 个高斯点`);
  } catch (e) {
    console.error(e);
    v3State('error', '3D 模型载入失败', '这台设备可能不支持 WebGL2');
  }
}

function save3D() {
  const h = v3Holder;
  if (!h || !h.gsBlob) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(h.gsBlob);
  a.download = `hairmagic-${h.date}-${(h.label || 'look').replace(/[^\w一-龥#-]+/g, '_')}.ply`;
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
  $('#pickFiles').onchange = (e) => importFiles(e.target.files, false).finally(() => (e.target.value = ''));
  $('#capFiles').onchange = (e) => importFiles(e.target.files, true).finally(() => (e.target.value = ''));
  $('#capClose').onclick = closeCapture;
  $('#capDone').onclick = closeCapture;
  $('#capShutter').onclick = () => cap && cap.running && cap.shoot(cap.current ? cap.current.key : 'front', true);
  $('#dateChip').onclick = openDateSheet;
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
    toast('已重新估算发长');
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

async function init() {
  window.__hmBooted = true;
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
  if (window.__hmShow) window.__hmShow('启动出错：' + (e && e.message));
});
