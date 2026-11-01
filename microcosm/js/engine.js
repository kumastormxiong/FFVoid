// 无限缩放引擎 · 环形尺度原点重置（Scale Origin Rebasing）
//
// 连续缩放量 z：层级 L = floor(z)，进度 f = z - L。当前世界 W[L] 以 S = K^f 绕固定点 Q 缩放，
// 子世界 W[L+1] 以 S/K 嵌在 W[L] 的传送门 p 里（穹顶中心 E 对准 p）。
//   Q = (K·p − A)/(K − 1)，A 为“抵达锚点”（缩放开始时玩家头部位置，或从上层退回时的 E）。
// f→1 时子世界恰好变为单位变换（仅平移 A−E），越界瞬间把平移交给玩家 rig，子世界成为新的“当前世界”。
// 因此 GPU 里的坐标永远在 [1/K, K] 的高精区间，6 层之后环回 W[0]（莫比乌斯闭环）。
import * as THREE from 'three';
import { K, R, E } from './styles.js';

const mod6 = (n) => ((n % 6) + 6) % 6;
export const SEALED_CAP = 0.42; // 传送门未开启时，最多只能“放大镜式”放大到 K^0.42 ≈ 17 倍
const _v = new THREE.Vector3(), _c = new THREE.Vector3(), _Q = new THREE.Vector3();

export class ZoomEngine {
  constructor(scene, rig, worlds) {
    this.scene = scene; this.rig = rig; this.worlds = worlds;
    this.z = 0; this.level = 0; this.A = E.clone();
    this.vel = 0; this.inside = false; this.canZoom = false; this.endless = false; this.maxZ = Infinity;
    this.zoomActive = false;
    this.cur = worlds[0]; this.child = worlds[1]; this.grand = null;
    this.S = 1; this.bubbleCenter = new THREE.Vector3(); this.bubbleRadius = R / K; this.camDist = 1;
    this.onLevelChange = null; // (fromLevel, toLevel)
    // 全局天空（跟随相机）
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(800, 32, 16), worlds[0].sky.global);
    this.sky.renderOrder = -10; this.sky.frustumCulled = false;
    scene.add(this.sky);
    // 穿越气泡时的水彩擦除遮罩
    this.wipeMat = new THREE.ShaderMaterial({
      uniforms: { uC: { value: new THREE.Color() }, uA: { value: 0 }, uT: { value: 0 } },
      vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 uC; uniform float uA; uniform float uT; varying vec3 vP;
        float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.164)))*43758.5453); }
        float n(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
          return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
                     mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); }
        void main(){ vec3 d = normalize(vP); float m = n(d*5.0 + uT*0.3)*0.6 + n(d*13.0)*0.4;
          float a = smoothstep(1.0 - uA * 1.25, 1.0 - uA * 1.25 + 0.12, m + d.z * -0.15);
          if (a < 0.01) discard; gl_FragColor = vec4(uC, a * min(uA * 1.6, 1.0)); }`,
      transparent: true, depthTest: false, depthWrite: false, side: THREE.BackSide,
    });
    this.wipe = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 12), this.wipeMat);
    this.wipe.renderOrder = 999; this.wipe.frustumCulled = false; this.wipe.visible = false;
    for (const w of worlds) { w.group.visible = false; scene.add(w.group); }
  }

  attachWipe(camera) { camera.add(this.wipe); }

  get f() { return this.z - Math.floor(this.z); }
  worldAt(level) { return this.worlds[mod6(level)]; }

  // 当前层级允许的缩放上下限
  bounds() {
    const L = Math.floor(this.z + 1e-7);
    const w = this.worldAt(L);
    let hi = this.canZoom ? (w.isOpen() ? L + 1 + (this.worldAt(L + 1).isOpen() ? 0.999 : SEALED_CAP) : L + SEALED_CAP) : L;
    hi = Math.min(hi, this.maxZ);
    const lo = this.endless ? -Infinity : 0;
    return [lo, hi];
  }

  // dz：本帧想要的缩放增量（层级单位）
  update(dt, head, dz, time) {
    const prevL = this.level;
    const [lo, hi] = this.bounds();
    let z = this.z + dz;
    if (z > hi) z = Math.max(this.z, hi);
    if (z < lo) z = lo;
    // 静止且非常接近整数时吸附，便于重新取锚点
    const rz = Math.round(z);
    if (Math.abs(dz) < 1e-6 && Math.abs(z - rz) < 0.004 && rz >= lo && rz <= hi + 1e-9) z = rz;
    this.vel = dt > 0 ? (z - this.z) / dt : 0;
    this.z = z;
    let L = Math.floor(z + 1e-9);

    while (L !== this.level) {
      if (L > this.level) {
        // 向内越界：子世界的平移 (A−E) 交给 rig
        this.rig.position.x -= (this.A.x - E.x);
        this.rig.position.z -= (this.A.z - E.z);
        this.level++;
        this.A.copy(E);
      } else {
        // 向外越界：当前世界已是单位变换，父世界从 f≈1 开始，锚点取 E
        this.level--;
        this.A.copy(E);
      }
    }
    // 归一化：环回 0..5
    if (this.level >= 6 || this.level < 0) {
      const sh = Math.floor(this.level / 6) * 6;
      this.level -= sh; this.z -= sh; L -= sh;
    }
    if (prevL !== this.level && this.onLevelChange) this.onLevelChange(prevL, this.level);

    const f = this.z - this.level;
    if (f === 0) this.A.set(head.x, E.y + this.rig.position.y, head.z);

    const cur = this.worldAt(this.level), child = this.worldAt(this.level + 1), grand = this.worldAt(this.level + 2);
    this.cur = cur; this.child = child;
    const S = Math.pow(K, f); this.S = S;
    const p = cur.portal;
    _Q.copy(p).multiplyScalar(K).sub(this.A).divideScalar(K - 1);
    // 当前世界
    cur.group.scale.setScalar(S);
    cur.group.position.copy(_Q).multiplyScalar(1 - S);
    // 子世界
    const cs = S / K;
    child.group.scale.setScalar(cs);
    child.group.position.copy(_Q).multiplyScalar(1 - S).addScaledVector(p, S).addScaledVector(E, -cs);
    // 气泡（子世界穹顶）在全局中的位置与半径
    this.bubbleCenter.copy(_Q).multiplyScalar(1 - S).addScaledVector(p, S);
    this.bubbleRadius = R * cs;
    this.camDist = head.distanceTo(this.bubbleCenter);
    const open = cur.isOpen();
    const inside = open && this.camDist < this.bubbleRadius * 0.995;
    this.inside = inside;

    for (const w of this.worlds) w.group.visible = false;
    child.group.visible = true;
    child.setRole('child');
    if (!inside) {
      cur.group.visible = true;
      cur.setRole('current');
      this.sky.visible = true;
      this.sky.material = cur.sky.global;
      this.grand = null;
    } else {
      this.sky.visible = false;
      // 进入气泡后父世界不再渲染，转而渲染孙世界，避免抵达时“空传送门”
      if (child.isOpen() && grand !== cur) {
        const gs = cs / K;
        grand.group.scale.setScalar(gs);
        grand.group.position.copy(child.group.position).addScaledVector(child.portal, cs).addScaledVector(E, -gs);
        grand.group.visible = true; grand.setRole('child');
        this.grand = grand;
      } else this.grand = null;
    }
    this.sky.position.copy(head);

    // 每个世界的雾原点：在气泡外时取气泡表面离相机最近的点
    const setFog = (w, center, radius) => {
      w.uniforms.uWScale.value = w.group.scale.x;
      w.uniforms.uWOrigin.value.copy(w.group.position);
      if (head.distanceTo(center) > radius) {
        _v.copy(head).sub(center).normalize().multiplyScalar(radius).add(center);
        w.uniforms.uFogO.value.copy(_v);
      } else w.uniforms.uFogO.value.copy(head);
    };
    cur.uniforms.uWScale.value = S; cur.uniforms.uFogO.value.copy(head); cur.uniforms.uWOrigin.value.copy(cur.group.position);
    setFog(child, this.bubbleCenter, this.bubbleRadius);
    if (this.grand) {
      _c.copy(this.grand.group.position).addScaledVector(E, this.grand.group.scale.x);
      setFog(this.grand, _c, R * this.grand.group.scale.x);
    }

    // 穿越气泡表面时的水彩擦除
    let wipeA = 0;
    if (open && f > 0.3) {
      const q = Math.log(this.camDist / this.bubbleRadius);
      wipeA = Math.max(0, 1 - Math.abs(q) / 0.3);
      wipeA = wipeA * wipeA * (3 - 2 * wipeA) * Math.min(1, Math.abs(this.vel) * 5);
    }
    this.wipe.visible = wipeA > 0.01;
    this.wipeMat.uniforms.uA.value = wipeA;
    this.wipeMat.uniforms.uT.value = time;
    this.wipeMat.uniforms.uC.value.copy(cur.wipeColor);
  }

  // 一个物体当前所在世界的全局尺度
  scaleOf(world) { return world.group.scale.x; }

  // 玩家此刻“身处”的世界（用于判定手中物品的语境）
  get contextWorld() { return this.inside ? this.child : this.cur; }

  jumpTo(level) {
    this.z = level; this.level = level; this.A.copy(E);
    this.rig.position.set(0, 0, 0);
  }
}
