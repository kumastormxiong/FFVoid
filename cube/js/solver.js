// 逻辑求解器：只用每一排的提示（数量 + 段数）做推理，判断关卡能否不靠猜解开。
// 推不下去时，自动挑出最少量的“提示方块”，补上后整关就能纯逻辑解开。

const PATS = {};
function patterns(n) {
  if (PATS[n]) return PATS[n];
  const out = [];
  for (let m = 0; m < (1 << n); m++) {
    let c = 0, s = 0, prev = 0;
    for (let i = 0; i < n; i++) { const b = (m >> i) & 1; if (b) { c++; if (!prev) s++; } prev = b; }
    out.push({ m, key: c === 0 ? '0' : c + ':' + Math.min(s, 3) });
  }
  return (PATS[n] = out);
}

// level: { w, h, d, voxels }
// 返回 { solvable, hints: [{i, target}], unknownBefore }
export function analyzeLevel(level, { maxHints = 2000 } = {}) {
  const { w, h, d } = level;
  const N = w * h * d;
  const id = (x, y, z) => x + w * (y + h * z);
  const T = new Uint8Array(N);
  for (const v of level.voxels) T[id(v[0], v[1], v[2])] = 1;
  const st = new Int8Array(N).fill(-1);
  const lines = [];
  for (let z = 0; z < d; z++) for (let y = 0; y < h; y++) { const l = []; for (let x = 0; x < w; x++) l.push(id(x, y, z)); lines.push(l); }
  for (let z = 0; z < d; z++) for (let x = 0; x < w; x++) { const l = []; for (let y = 0; y < h; y++) l.push(id(x, y, z)); lines.push(l); }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const l = []; for (let z = 0; z < d; z++) l.push(id(x, y, z)); lines.push(l); }
  // 每排只保留符合提示的候选摆法
  const cands = lines.map(l => {
    let c = 0, s = 0, p = 0;
    for (const i of l) { if (T[i]) { c++; if (!p) s++; } p = T[i]; }
    const key = c === 0 ? '0' : c + ':' + Math.min(s, 3);
    return patterns(l.length).filter(q => q.key === key).map(q => q.m);
  });
  const cellLines = Array.from({ length: N }, () => []);
  lines.forEach((l, li) => l.forEach(i => cellLines[i].push(li)));

  const dirty = new Uint8Array(lines.length).fill(1);
  const queue = lines.map((_, i) => i);
  const propagate = () => {
    while (queue.length) {
      const li = queue.pop();
      dirty[li] = 0;
      const l = lines[li], n = l.length;
      let known = 0, val = 0;
      for (let k = 0; k < n; k++) { const s = st[l[k]]; if (s >= 0) { known |= 1 << k; if (s) val |= 1 << k; } }
      let and = (1 << n) - 1, or = 0, cnt = 0;
      const keep = [];
      for (const m of cands[li]) {
        if ((m & known) !== val) continue;
        keep.push(m); and &= m; or |= m; cnt++;
      }
      cands[li] = keep;
      if (!cnt) return false;
      for (let k = 0; k < n; k++) {
        const i = l[k];
        if (st[i] >= 0) continue;
        let v = -1;
        if ((and >> k) & 1) v = 1; else if (!((or >> k) & 1)) v = 0;
        if (v < 0) continue;
        st[i] = v;
        for (const lj of cellLines[i]) if (!dirty[lj]) { dirty[lj] = 1; queue.push(lj); }
      }
    }
    return true;
  };
  const set = (i, v) => { st[i] = v; for (const lj of cellLines[i]) if (!dirty[lj]) { dirty[lj] = 1; queue.push(lj); } };

  propagate();
  const unknownBefore = st.reduce((a, s) => a + (s < 0 ? 1 : 0), 0);
  const hints = [];
  const unknownCount = () => { let u = 0; for (let i = 0; i < N; i++) if (st[i] < 0) u++; return u; };
  while (hints.length < maxHints) {
    const unk = [];
    for (let i = 0; i < N; i++) if (st[i] < 0) unk.push(i);
    if (!unk.length) break;
    // 试探若干候选，挑“揭开后能推出最多方块”的那个，让提示尽量少
    const step = Math.max(1, Math.floor(unk.length / 24));
    let best = unk[0], bestLeft = Infinity;
    for (let k = 0; k < unk.length; k += step) {
      const i = unk[k];
      const saveSt = st.slice(), saveC = cands.slice();
      set(i, T[i]);
      propagate();
      const left = unknownCount() + (T[i] ? 0 : 0.5); // 同分时优先提示要保留的方块
      st.set(saveSt);
      for (let j = 0; j < cands.length; j++) cands[j] = saveC[j];
      if (left < bestLeft) { bestLeft = left; best = i; }
    }
    hints.push({ i: best, target: !!T[best] });
    set(best, T[best]);
    propagate();
  }
  return { solvable: unknownBefore === 0, unknownBefore, hints };
}
