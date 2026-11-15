// 3D Gaussian Splatting viewer (Spark + three.js): drag to orbit, pinch / wheel to zoom.
// Reads plain 3DGS .ply and HairMagic .hmg (SPZ splats + hair mask + expression / blink offsets):
// with .hmg the hair can be recoloured live and the face can smile, frown and blink.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SparkRenderer, SplatMesh, toHalf, fromHalf, unpackSplat } from '@sparkjsdev/spark';

/** Read centre / radius of a 3DGS .ply (binary little-endian) for framing the camera. */
export function plyBounds(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const headEnd = (() => {
    const pat = 'end_header\n';
    const max = Math.min(u8.length, 8192);
    let txt = '';
    for (let i = 0; i < max; i++) txt += String.fromCharCode(u8[i]);
    const k = txt.indexOf(pat);
    return k < 0 ? -1 : k + pat.length;
  })();
  if (headEnd < 0) return null;
  let header = '';
  for (let i = 0; i < headEnd; i++) header += String.fromCharCode(u8[i]);
  const n = +(header.match(/element vertex (\d+)/) || [])[1];
  const props = [...header.matchAll(/property (\w+) (\w+)/g)].map((m) => ({ type: m[1], name: m[2] }));
  const size = { float: 4, float32: 4, double: 8, uchar: 1, uint8: 1, int: 4, uint: 4, short: 2, ushort: 2 };
  let stride = 0;
  const off = {};
  for (const p of props) { off[p.name] = stride; stride += size[p.type] || 4; }
  if (!n || off.x == null) return null;
  const dv = new DataView(u8.buffer, u8.byteOffset + headEnd);
  const xs = new Float32Array(n), ys = new Float32Array(n), zs = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const b = i * stride;
    xs[i] = dv.getFloat32(b + off.x, true);
    ys[i] = dv.getFloat32(b + off.y, true);
    zs[i] = dv.getFloat32(b + off.z, true);
  }
  // robust bounds: 2nd–98th percentile
  const pct = (a) => { const s = Float32Array.from(a).sort(); return [s[Math.floor(n * 0.02)], s[Math.floor(n * 0.98)]]; };
  const [x0, x1] = pct(xs), [y0, y1] = pct(ys), [z0, z1] = pct(zs);
  const center = new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  const radius = Math.max(x1 - x0, y1 - y0, z1 - z0) / 2;
  return { center, radius, count: n };
}

const isHmg = (u8) => u8.length > 8 && u8[0] === 0x48 && u8[1] === 0x4d && u8[2] === 0x47 && u8[3] === 0x31; // 'HMG1'

async function gunzip(u8) {
  const s = new Blob([u8]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Uint8Array(await new Response(s).arrayBuffer());
}

/** Split a .hmg file into its header and sections (section bytes are views, not copies). */
export function parseHmg(u8) {
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  const hl = dv.getUint32(4, true);
  const head = JSON.parse(new TextDecoder().decode(u8.subarray(8, 8 + hl)));
  const base = 8 + hl;
  const sec = (k) => {
    const s = head.sections[k];
    return s ? u8.subarray(base + s[0], base + s[0] + s[1]) : null;
  };
  return { head, sec };
}

const bitsToIndices = (bits, n) => {
  let c = 0;
  for (let i = 0; i < n; i++) if ((bits[i >> 3] >> (i & 7)) & 1) c++;
  const out = new Uint32Array(c);
  for (let i = 0, k = 0; i < n; i++) if ((bits[i >> 3] >> (i & 7)) & 1) out[k++] = i;
  return out;
};

// how much of the blink target to use on top of each expression (squinting expressions already half-close the lids)
const BLINK_GAIN = { base: 1, smile: 0.8, annoyed: 0.85, angry: 0.75, surprise: 1.1 };
const EASE = 0.22;                                   // seconds for an expression change

export class SplatViewer {
  constructor(container) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.setClearColor(0x000000, 0);
    container.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
    this.spark = new SparkRenderer({ renderer: this.renderer });
    this.scene.add(this.spark);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.rotateSpeed = 0.7;
    this.controls.zoomSpeed = 0.9;
    this.controls.enablePan = true;
    this.controls.autoRotateSpeed = 1.6;
    this.mesh = null;
    this.home = null;
    this.features = { hair: false, expressions: [], blink: false };
    this.hair = null;
    this.anim = null;
    this.resize = this.resize.bind(this);
    this.ro = new ResizeObserver(this.resize);
    this.ro.observe(container);
    this.resize();
    this.clock = new THREE.Clock();
    this.renderer.setAnimationLoop(() => {
      const dt = Math.min(0.1, this.clock.getDelta());
      this.tick(dt);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    });
  }

  resize() {
    const w = this.container.clientWidth || 1, h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  async load(bytes) {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.dispose && this.mesh.dispose();
    }
    this.hair = null;
    this.anim = null;
    this.features = { hair: false, expressions: [], blink: false };
    const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    let b, hmg = null;
    if (isHmg(u8)) {
      hmg = parseHmg(u8);
      const h = hmg.head;
      b = { center: new THREE.Vector3(...h.center), radius: h.radius, count: h.n };
      this.mesh = new SplatMesh({ fileBytes: hmg.sec('spz').slice().buffer, fileType: 'spz' });
    } else {
      b = plyBounds(u8) || { center: new THREE.Vector3(), radius: 0.15, count: 0 };
      this.mesh = new SplatMesh({ fileBytes: u8.slice().buffer, fileType: 'ply' });
    }
    this.scene.add(this.mesh);
    if (this.mesh.initialized) await this.mesh.initialized;
    if (hmg) {
      try {
        await this.initHmg(hmg);
      } catch (e) {
        console.warn('hmg extras unavailable', e);       // the head still shows; only dye / expressions are off
      }
    }
    // fit the head in the narrower of the two field-of-view directions
    const vf = THREE.MathUtils.degToRad(this.camera.fov) / 2;
    const hf = Math.atan(Math.tan(vf) * this.camera.aspect);
    const d = (b.radius * 1.35) / Math.tan(Math.min(vf, hf));
    this.home = { target: b.center.clone(), pos: b.center.clone().add(new THREE.Vector3(0, b.radius * 0.15, d)) };
    this.controls.minDistance = b.radius * 0.9;
    this.controls.maxDistance = b.radius * 9;
    this.reset();
    return b;
  }

  async initHmg({ head, sec }) {
    const ps = this.mesh.packedSplats;
    if (!ps || !ps.packedArray || ps.numSplats !== head.n) throw new Error('splat count mismatch');
    const arr = ps.packedArray;
    if (head.sections.hair && typeof DecompressionStream !== 'undefined') {
      const idx = bitsToIndices(await gunzip(sec('hair')), head.n);
      if (idx.length > 50) {
        const orig = new Uint8Array(idx.length * 3);
        const lum = new Float32Array(idx.length);
        let sum = 0;
        for (let k = 0; k < idx.length; k++) {
          const w = arr[idx[k] * 4];
          const r = w & 255, g = (w >>> 8) & 255, bl = (w >>> 16) & 255;
          orig[k * 3] = r; orig[k * 3 + 1] = g; orig[k * 3 + 2] = bl;
          lum[k] = (0.299 * r + 0.587 * g + 0.114 * bl) / 255;
          sum += lum[k];
        }
        this.hair = { idx, orig, lum, mean: Math.max(1e-3, sum / idx.length), dye: null };
        this.features.hair = true;
      }
    }
    if (head.sections.amask && head.targets && head.targets.length && typeof DecompressionStream !== 'undefined') {
      const idx = bitsToIndices(await gunzip(sec('amask')), head.n);
      const M = idx.length;
      const base = new Float32Array(M * 3);
      for (let k = 0; k < M; k++) {
        const i4 = idx[k] * 4;
        base[k * 3] = fromHalf(arr[i4 + 1] & 0xffff);
        base[k * 3 + 1] = fromHalf(arr[i4 + 1] >>> 16);
        base[k * 3 + 2] = fromHalf(arr[i4 + 2] & 0xffff);
      }
      const targets = {};
      for (const t of head.targets) {
        const q = new Int8Array((await gunzip(sec('t:' + t.name))).buffer);
        if (q.length === M * 3) targets[t.name] = { q, s: t.scale };
      }
      const names = Object.keys(targets);
      this.anim = {
        idx, base, targets, names,
        w: Object.fromEntries(names.map((n) => [n, 0])),
        expr: 'base', from: {}, t: 1,
        blinkOn: false, blinkT: -1, nextBlink: 1.2, dirty: false,
      };
      this.features.expressions = names.filter((n) => n !== 'blink');
      this.features.blink = names.includes('blink');
    }
  }

  // ---- expressions ---------------------------------------------------------
  setExpression(name) {
    const a = this.anim;
    if (!a) return;
    a.from = { ...a.w };
    a.expr = name in a.targets ? name : 'base';
    a.t = 0;
  }

  setBlink(on) {
    const a = this.anim;
    if (!a || !a.targets.blink) return;
    a.blinkOn = on;
    a.nextBlink = on ? 0.35 : Infinity;
    if (!on) a.blinkT = -1;
    a.dirty = true;
  }

  tick(dt) {
    const a = this.anim;
    if (!a) return;
    let changed = a.dirty;
    a.dirty = false;
    if (a.t < 1) {
      a.t = Math.min(1, a.t + dt / EASE);
      const e = a.t * a.t * (3 - 2 * a.t);
      for (const n of a.names) {
        if (n === 'blink') continue;
        const goal = n === a.expr ? 1 : 0;
        a.w[n] = (a.from[n] || 0) * (1 - e) + goal * e;
      }
      changed = true;
    }
    // blink: ~0.2 s close-open every 2.5–5.5 s, sometimes twice
    let bw = 0;
    if (a.blinkOn && a.targets.blink) {
      if (a.blinkT < 0) {
        a.nextBlink -= dt;
        if (a.nextBlink <= 0) a.blinkT = 0;
      }
      if (a.blinkT >= 0) {
        a.blinkT += dt;
        const t = a.blinkT;
        bw = t < 0.07 ? t / 0.07 : t < 0.1 ? 1 : t < 0.21 ? 1 - (t - 0.1) / 0.11 : 0;
        bw = bw * bw * (3 - 2 * bw);
        if (t >= 0.21) {
          a.blinkT = -1;
          a.nextBlink = Math.random() < 0.15 ? 0.18 : 2.5 + Math.random() * 3;
        }
        changed = true;
      }
    }
    const gain = BLINK_GAIN[a.expr] ?? 1;
    if (a.w.blink !== bw * gain) {
      a.w.blink = bw * gain;
      changed = true;
    }
    if (changed) this.writeCenters();
  }

  writeCenters() {
    const a = this.anim;
    const ps = this.mesh.packedSplats;
    const arr = ps.packedArray;
    const act = a.names.filter((n) => a.w[n] > 1e-4).map((n) => ({ q: a.targets[n].q, k: a.targets[n].s * a.w[n] }));
    const { idx, base } = a;
    const M = idx.length;
    for (let k = 0; k < M; k++) {
      const j = k * 3;
      let x = base[j], y = base[j + 1], z = base[j + 2];
      for (let t = 0; t < act.length; t++) {
        const q = act[t].q, s = act[t].k;
        x += q[j] * s; y += q[j + 1] * s; z += q[j + 2] * s;
      }
      const i4 = idx[k] * 4;
      arr[i4 + 1] = toHalf(x) | (toHalf(y) << 16);
      arr[i4 + 2] = toHalf(z) | (arr[i4 + 2] & 0xffff0000);
    }
    ps.needsUpdate = true;
    this.mesh.updateVersion();
  }

  // ---- hair dye ------------------------------------------------------------
  /** rgb: [r,g,b] 0..1 = average colour the hair should get (null = original); light: -1..1 darker / lighter */
  setDye(rgb, light = 0) {
    const h = this.hair;
    if (!h) return;
    const ps = this.mesh.packedSplats;
    const arr = ps.packedArray;
    const enc = ps.splatEncoding || {};
    const lo = enc.rgbMin ?? 0, range = (enc.rgbMax ?? 1) - lo;
    const toU8 = (v) => Math.max(0, Math.min(255, Math.round(((v - lo) / range) * 255)));
    const lift = Math.pow(2, light);
    // lighter target colours get less strand contrast (dark hair has strong relative highlights)
    const tl = rgb ? (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) * lift : 0;
    const c = Math.min(0.9, Math.max(0.35, 0.95 - 0.7 * tl));
    const N = h.idx.length;
    for (let k = 0; k < N; k++) {
      const i4 = h.idx[k] * 4;
      let r, g, b;
      if (!rgb) {
        r = h.orig[k * 3]; g = h.orig[k * 3 + 1]; b = h.orig[k * 3 + 2];
      } else {
        // keep each strand's brightness relative to the hair average, so highlights and shading survive
        const rel = (1 + (Math.pow(Math.min(2.5, h.lum[k] / h.mean), 0.85) - 1) * c) * lift;
        r = toU8(rgb[0] * rel); g = toU8(rgb[1] * rel); b = toU8(rgb[2] * rel);
      }
      arr[i4] = (r | (g << 8) | (b << 16) | (arr[i4] & 0xff000000)) >>> 0;
    }
    h.dye = rgb ? { rgb, light } : null;
    ps.needsUpdate = true;
    this.mesh.updateVersion();
  }

  /** Current splats (with dye and expression) as a standard 3DGS .ply Blob. */
  exportPly() {
    const ps = this.mesh && this.mesh.packedSplats;
    if (!ps || !ps.packedArray) return null;
    const n = ps.numSplats;
    const names = ['x', 'y', 'z', 'nx', 'ny', 'nz', 'f_dc_0', 'f_dc_1', 'f_dc_2', 'opacity', 'scale_0', 'scale_1', 'scale_2', 'rot_0', 'rot_1', 'rot_2', 'rot_3'];
    const head = `ply\nformat binary_little_endian 1.0\nelement vertex ${n}\n${names.map((k) => `property float ${k}\n`).join('')}end_header\n`;
    const out = new Float32Array(n * 17);
    const C0 = 0.28209479177387814;
    for (let i = 0; i < n; i++) {
      const s = unpackSplat(ps.packedArray, i, ps.splatEncoding);
      const o = i * 17;
      out[o] = s.center.x; out[o + 1] = s.center.y; out[o + 2] = s.center.z;
      out[o + 6] = (s.color.r - 0.5) / C0; out[o + 7] = (s.color.g - 0.5) / C0; out[o + 8] = (s.color.b - 0.5) / C0;
      const op = Math.min(0.9999, Math.max(1e-4, s.opacity));
      out[o + 9] = Math.log(op / (1 - op));
      out[o + 10] = Math.log(Math.max(1e-8, s.scales.x)); out[o + 11] = Math.log(Math.max(1e-8, s.scales.y)); out[o + 12] = Math.log(Math.max(1e-8, s.scales.z));
      out[o + 13] = s.quaternion.w; out[o + 14] = s.quaternion.x; out[o + 15] = s.quaternion.y; out[o + 16] = s.quaternion.z;
    }
    return new Blob([head, out.buffer], { type: 'application/octet-stream' });
  }

  reset() {
    if (!this.home) return;
    this.controls.target.copy(this.home.target);
    this.camera.position.copy(this.home.pos);
    this.camera.near = Math.max(0.001, this.home.pos.distanceTo(this.home.target) / 100);
    this.camera.updateProjectionMatrix();
    this.controls.update();
  }

  setAutoRotate(on) {
    this.controls.autoRotate = on;
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    this.ro.disconnect();
    this.controls.dispose();
    if (this.mesh) this.mesh.dispose && this.mesh.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
