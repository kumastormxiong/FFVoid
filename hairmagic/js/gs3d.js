// 3D Gaussian Splatting viewer (Spark + three.js): drag to orbit, pinch / wheel to zoom.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SparkRenderer, SplatMesh } from '@sparkjsdev/spark';

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

export class SplatViewer {
  constructor(container) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
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
    this.resize = this.resize.bind(this);
    this.ro = new ResizeObserver(this.resize);
    this.ro.observe(container);
    this.resize();
    this.renderer.setAnimationLoop(() => {
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
    const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    const b = plyBounds(u8) || { center: new THREE.Vector3(), radius: 0.15 };
    this.mesh = new SplatMesh({ fileBytes: u8.slice().buffer, fileType: 'ply' });
    this.scene.add(this.mesh);
    if (this.mesh.initialized) await this.mesh.initialized;
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
