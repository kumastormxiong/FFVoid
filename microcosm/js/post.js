// 电脑端后期：辉光 + 调色 + 暗角（VR 不用，保 Quest 2 帧率）
import * as THREE from 'three';
import { EffectComposer } from '../vendor/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../vendor/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../vendor/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from '../vendor/jsm/postprocessing/ShaderPass.js';

const GradeShader = {
  uniforms: { tDiffuse: { value: null }, uTint: { value: new THREE.Color(1, 1, 1) }, uLift: { value: new THREE.Color(0, 0, 0) }, uSat: { value: 1.08 }, uVig: { value: 0.35 }, uAspect: { value: 1 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform vec3 uTint; uniform vec3 uLift; uniform float uSat; uniform float uVig; uniform float uAspect; varying vec2 vUv;
    void main(){
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      c = c / (1.0 + max(c - 1.0, 0.0) * 0.6);            // 柔和压高光
      float l = dot(c, vec3(0.299, 0.587, 0.114));
      c = mix(vec3(l), c, uSat);
      c = c * uTint + uLift * (1.0 - c);
      c = mix(c, c * c * (3.0 - 2.0 * c), 0.18);            // 轻微 S 曲线
      vec2 q = (vUv - 0.5) * vec2(uAspect, 1.0);
      c *= 1.0 - uVig * smoothstep(0.35, 1.0, length(q));
      gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
    }`,
};

// 每个世界的调色
const GRADES = [
  { tint: [1.04, 0.99, 0.93], lift: [0.04, 0.02, 0.05], sat: 1.06, vig: 0.42 },
  { tint: [1.0, 1.0, 1.0], lift: [0.02, 0.03, 0.05], sat: 1.04, vig: 0.28 },
  { tint: [1.0, 1.01, 0.98], lift: [0.03, 0.04, 0.03], sat: 1.02, vig: 0.25 },
  { tint: [0.98, 1.0, 1.04], lift: [0.0, 0.02, 0.05], sat: 1.08, vig: 0.45 },
  { tint: [1.0, 0.98, 1.04], lift: [0.03, 0.0, 0.05], sat: 1.12, vig: 0.4 },
  { tint: [1.0, 0.99, 0.97], lift: [0.02, 0.02, 0.01], sat: 1.0, vig: 0.3 },
];

export class Post {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.composer = new EffectComposer(renderer);
    this.composer.addPass(new RenderPass(scene, camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.5, 0.45, 0.97);
    this.composer.addPass(this.bloom);
    this.grade = new ShaderPass(GradeShader);
    this.composer.addPass(this.grade);
    this.cur = { tint: new THREE.Color(1, 1, 1), lift: new THREE.Color(0, 0, 0), sat: 1, vig: 0.3 };
    this.resize();
  }
  resize() {
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
    this.composer.setSize(innerWidth, innerHeight);
    this.grade.uniforms.uAspect.value = innerWidth / innerHeight;
  }
  // 根据当前所处世界平滑过渡调色
  update(dt, worldId) {
    const g = GRADES[worldId] || GRADES[0]; const k = Math.min(1, dt * 2);
    this.cur.tint.lerp(new THREE.Color(...g.tint), k); this.cur.lift.lerp(new THREE.Color(...g.lift), k);
    this.cur.sat += (g.sat - this.cur.sat) * k; this.cur.vig += (g.vig - this.cur.vig) * k;
    const u = this.grade.uniforms; u.uTint.value.copy(this.cur.tint); u.uLift.value.copy(this.cur.lift); u.uSat.value = this.cur.sat; u.uVig.value = this.cur.vig;
    this.bloom.strength = worldId === 4 ? 0.8 : worldId === 5 ? 0.2 : 0.5;
  }
  render() { this.composer.render(); }
}
