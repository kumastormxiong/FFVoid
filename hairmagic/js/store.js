// IndexedDB storage: photos and generated looks, grouped by local date (YYYY-MM-DD).

const DB_NAME = 'hairmagic';
const DB_VER = 1;
let dbp = null;

function open() {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('photos')) {
        const s = db.createObjectStore('photos', { keyPath: 'id' });
        s.createIndex('date', 'date');
      }
      if (!db.objectStoreNames.contains('looks')) {
        const s = db.createObjectStore('looks', { keyPath: 'id' });
        s.createIndex('date', 'date');
        s.createIndex('photoId', 'photoId');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbp;
}

function tx(store, mode, fn) {
  return open().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(store, mode);
        const s = t.objectStore(store);
        let out;
        Promise.resolve(fn(s)).then((v) => (out = v));
        t.oncomplete = () => resolve(out);
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error);
      })
  );
}

const reqP = (r) => new Promise((res, rej) => ((r.onsuccess = () => res(r.result)), (r.onerror = () => rej(r.error))));

export function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export async function addPhoto(photo) {
  const rec = { id: uid(), date: today(), createdAt: Date.now(), ...photo };
  await tx('photos', 'readwrite', (s) => s.put(rec));
  return rec;
}

export async function updatePhoto(rec) {
  await tx('photos', 'readwrite', (s) => s.put(rec));
}

export async function photosByDate(date) {
  const rows = await tx('photos', 'readonly', (s) => reqP(s.index('date').getAll(date)));
  return rows.sort((a, b) => (a.order ?? 9) - (b.order ?? 9) || a.createdAt - b.createdAt);
}

export async function deletePhoto(id) {
  const looks = await tx('looks', 'readonly', (s) => reqP(s.index('photoId').getAllKeys(id)));
  await tx('looks', 'readwrite', (s) => looks.forEach((k) => s.delete(k)));
  await tx('photos', 'readwrite', (s) => s.delete(id));
}

export async function addLook(look) {
  const rec = { id: uid(), createdAt: Date.now(), ...look };
  await tx('looks', 'readwrite', (s) => s.put(rec));
  return rec;
}

export async function looksByDate(date) {
  const rows = await tx('looks', 'readonly', (s) => reqP(s.index('date').getAll(date)));
  return rows.sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteLook(id) {
  await tx('looks', 'readwrite', (s) => s.delete(id));
}

export async function deleteLookSet(setId, date) {
  const rows = await looksByDate(date);
  await tx('looks', 'readwrite', (s) => rows.filter((r) => r.setId === setId).forEach((r) => s.delete(r.id)));
}

/** Summary of every date that has photos or looks, newest first. */
export async function listDates() {
  const [photos, looks] = await Promise.all([
    tx('photos', 'readonly', (s) => reqP(s.getAll())),
    tx('looks', 'readonly', (s) => reqP(s.getAll())),
  ]);
  const map = new Map();
  const get = (d) => {
    if (!map.has(d)) map.set(d, { date: d, photos: [], looks: [] });
    return map.get(d);
  };
  photos.forEach((p) => get(p.date).photos.push(p));
  looks.forEach((l) => get(l.date).looks.push(l));
  for (const v of map.values()) {
    v.photos.sort((a, b) => (a.order ?? 9) - (b.order ?? 9));
    v.looks.sort((a, b) => b.createdAt - a.createdAt);
  }
  return [...map.values()].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function deleteDate(date) {
  const [p, l] = await Promise.all([
    tx('photos', 'readonly', (s) => reqP(s.index('date').getAllKeys(date))),
    tx('looks', 'readonly', (s) => reqP(s.index('date').getAllKeys(date))),
  ]);
  await tx('looks', 'readwrite', (s) => l.forEach((k) => s.delete(k)));
  await tx('photos', 'readwrite', (s) => p.forEach((k) => s.delete(k)));
}

export async function persist() {
  try {
    if (navigator.storage && navigator.storage.persist) await navigator.storage.persist();
  } catch {}
}

// tiny key/value for settings
export const prefs = {
  get(k, d) {
    try {
      const v = localStorage.getItem('hm.' + k);
      return v == null ? d : JSON.parse(v);
    } catch {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem('hm.' + k, JSON.stringify(v));
    } catch {}
  },
};

export async function updateLook(rec) {
  await tx('looks', 'readwrite', (s) => s.put(rec));
}
