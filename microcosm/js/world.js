// 世界基类：一个缩放根节点 + 一套风格材质 + 天空穹顶 + 传送门气泡
import * as THREE from 'three';
import { K, R, E, worldUniforms, styleMat, hullMat, skyMats, glassMat } from './styles.js';
import { Decor, ball } from './geo.js';

export class World {
  constructor(id, ctx, { style, fog, wipe, portal, glass = '#ffffff', ink = '#2B2D42', inkW = 0.012, boil = false, light, look = {} }) {
    this.id = id; this.ctx = ctx; this.style = style;
    this.group = new THREE.Group(); this.group.userData.world = this; this.group.name = 'world' + id;
    this.uniforms = worldUniforms({ ...fog, light, ...look });
    this.sky = skyMats(id);
    this.dome = new THREE.Mesh(ball(R, 32, 16), this.sky.dome);
    this.dome.position.copy(E); this.group.add(this.dome);
    this.portal = portal.clone();
    this.wipeColor = new THREE.Color(wipe);
    this.ink = hullMat(this.uniforms, ink, inkW, boil);
    this.decor = new Decor();
    this.matCache = new Map();
    this.glassMat = glassMat(glass, 1);
    this.glass = new THREE.Mesh(ball(R / K * 1.015, 24, 16), this.glassMat);
    this.glass.position.copy(this.portal); this.glass.renderOrder = 5;
    this.group.add(this.glass);
    this.open = false;
    this.role = 'none';
    this.animators = [];
  }
  mat(key, opts) {
    if (!this.matCache.has(key)) this.matCache.set(key, styleMat(this.style, this.uniforms, opts));
    return this.matCache.get(key);
  }
  isOpen() { return this.open; }
  setRole(role) {
    this.role = role;
    this.dome.visible = role === 'child';
    this.glass.visible = role === 'current' && this.showGlass();
  }
  showGlass() { return this.open; }
  build() { this.decor.build(this.group, this.ink); }
  baseUpdate(dt, t) {
    this.uniforms.uTime.value = t;
    this.sky.uniforms.uTime.value = t;
    this.glassMat.uniforms.uTime.value = t;
    for (const a of this.animators) a(dt, t);
  }
  update(dt, t) {}
  // 本世界内一个局部点的全局坐标
  toGlobal(local, out = new THREE.Vector3()) { return out.copy(local).multiplyScalar(this.group.scale.x).add(this.group.position); }
  get scale() { return this.group.scale.x; }
}
