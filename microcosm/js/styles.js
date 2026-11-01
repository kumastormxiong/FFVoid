// 六界风格着色器工厂 · Six-world NPR shader factory
// 所有图案都基于物体空间坐标 + fwidth 抗锯齿：缩得极小时自动退化成平涂色块（笔触化形），放大时线条浮现。
import * as THREE from 'three';

export const K = 900;            // 相邻层级尺度比
export const R = 30;             // 每个世界穹顶半径（米）
export const E = new THREE.Vector3(0, 1.6, 0); // 每个世界的穹顶中心 / 落脚眼位

const NOISE = /* glsl */`
float hash1(float n){ return fract(sin(n)*43758.5453123); }
float hash3(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.164)))*43758.5453); }
float vnoise(vec3 p){
  vec3 i = floor(p); vec3 f = fract(p); f = f*f*(3.0-2.0*f);
  float n = dot(i, vec3(1.0,57.0,113.0));
  return mix(mix(mix(hash1(n+0.0),hash1(n+1.0),f.x), mix(hash1(n+57.0),hash1(n+58.0),f.x),f.y),
             mix(mix(hash1(n+113.0),hash1(n+114.0),f.x), mix(hash1(n+170.0),hash1(n+171.0),f.x),f.y), f.z);
}
`;
const AA = /* glsl */`
// 抗锯齿线：x 每到整数一条线，w 为半宽（0~0.5）。图案比像素还密时淡出为平均灰度。
float lineAA(float x, float w){
  float fw = fwidth(x);
  float d = abs(fract(x + 0.5) - 0.5);
  float l = 1.0 - smoothstep(w - fw, w + fw, d);
  return mix(l, 0.0, clamp(fw * 1.6 - 0.25, 0.0, 1.0));
}
float detailFade(vec3 p, float freq){ float fw = length(fwidth(p * freq)); return 1.0 - clamp(fw * 1.2 - 0.2, 0.0, 1.0); }
`;

const VERT = /* glsl */`
uniform float uTime;
uniform float uPat;
varying vec3 vObj;
varying vec3 vWN;
varying vec3 vWPos;
#ifdef FOAMATTR
attribute float aFoam;
varying float vFoam;
#endif
${NOISE}
void main(){
  vec3 p = position;
  #ifdef FOAMATTR
    vFoam = aFoam;
  #endif
  #ifdef BOIL
    float tq = floor(uTime * 8.0);
    p += normal * (hash3(floor(position * 7.0) + tq) - 0.5) * 0.018;
  #endif
  #ifdef WATER
    p.y += sin(p.x * 0.55 + uTime * 0.5) * 0.16 + sin(p.z * 0.7 - uTime * 0.4) * 0.12;
  #endif
  vObj = p * uPat;
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vWPos = wp.xyz;
  vWN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

// 统一光照模型（纪念碑谷 / 风之旅人 / 奥日的共同语言）：
//   干净的分面三色调（阴面 → 阳面 → 顶面）+ 冷暖分离 + 高度渐变（越往下越融进雾里）
//   + 接地阴影 + 逆光边缘光 + 高度雾。各界风格只在此基础上叠加一点点笔触。
const FRAG = /* glsl */`
uniform float uTime;
uniform float uWScale;
uniform vec3 uWOrigin;
uniform vec3 uFogColor;
uniform vec2 uFogRange;
uniform vec3 uFogO;
uniform float uFogAmt;
uniform vec3 uLight;
uniform vec3 uShade;
uniform vec3 uSun;
uniform vec3 uLow;
uniform vec3 uRim;
uniform vec4 uHG;
uniform vec3 uA;
uniform vec3 uB;
uniform vec3 uC;
uniform float uEmit;
uniform float uGlow;
uniform float uPat;
uniform float uFade;
uniform float uHOn;
varying vec3 vObj;
varying vec3 vWN;
varying vec3 vWPos;
#ifdef FOAMATTR
varying float vFoam;
#endif
${NOISE}
${AA}
void main(){
  vec3 V = normalize(cameraPosition - vWPos);
  vec3 N = normalize(vWN);
  #ifdef FACET
    N = normalize(cross(dFdx(vWPos), dFdy(vWPos)));
  #endif
  if (dot(N, V) < 0.0) N = -N;
  vec3 L = normalize(uLight);
  float ndl = dot(N, L);
  float fres = 1.0 - clamp(dot(N, V), 0.0, 1.0);
  float ly = (vWPos.y - uWOrigin.y) / uWScale;

  // ---- 基础三色调 ----
  float lit = smoothstep(-0.18, 0.42, ndl);
  vec3 col = mix(uB, uA, lit);
  float topF = smoothstep(0.62, 0.95, N.y);
  col = mix(col, mix(uA, vec3(1.0), 0.18), topF * 0.55 * (0.4 + 0.6 * lit));
  col *= mix(uShade, uSun, lit);

#if STYLE == 0
  // 水粉：明暗交界处轻微的笔触抖动 + 极淡的纸纹
  float df = detailFade(vObj, 5.0);
  float n = vnoise(vObj * 4.0);
  col *= 1.0 + (n - 0.5) * 0.07 * df;
  col += uC * smoothstep(0.6, 0.98, fres) * 0.12;
  col += vec3(1.0, 0.62, 0.28) * uGlow * (0.35 + 0.4 * max(ndl, 0.0));
#elif STYLE == 1
  // 清线：深阴影里才出现的细排线 + 轮廓墨线
  vec3 INK = vec3(0.169, 0.176, 0.259);
  float h1 = lineAA((vObj.x + vObj.y * 0.8 + vObj.z * 0.6) * 14.0, 0.1);
  col = mix(col, INK, h1 * (1.0 - smoothstep(-0.7, -0.35, ndl)) * 0.16);
  col = mix(col, INK, smoothstep(0.82, 0.9, fres) * 0.55);
#elif STYLE == 2
  // 和纸：背光透纸 + 很淡的纤维
  float back = max(-ndl, 0.0) * 0.5 + pow(max(dot(-V, L), 0.0), 4.0) * 0.4;
  col += uC * back * 0.35;
  col *= 0.97 + 0.05 * vnoise(vec3(vObj.x * 8.0, vObj.y * 40.0, vObj.z * 8.0)) * detailFade(vObj, 30.0);
#elif STYLE == 3
  // 浮世绘：雕刀波纹 + 金缮
  vec3 GOLD = vec3(1.0, 0.82, 0.42);
  float wob = sin(vObj.x * 1.6 + sin(vObj.z * 1.2) * 2.0) * 0.5;
  float groove = lineAA(vObj.y * 5.0 + wob, 0.07) * (1.0 - lit * 0.6);
  col = mix(col, uB * 0.8, groove * 0.4);
  #ifdef WATER
    float h = vObj.y + vnoise(vObj * 0.4) * 0.6;
    float band = lineAA(h * 3.0 + vnoise(vObj * 0.8) * 1.5, 0.06);
    col = mix(col, vec3(0.945, 0.98, 0.933), band * 0.55 + smoothstep(0.25, 0.42, h * 0.3) * 0.7);
  #endif
  #ifdef FOAMATTR
    float fe = vFoam + (vnoise(vObj * 1.5) - 0.5) * 0.25;
    float foam = smoothstep(0.5, 0.56, fe);
    float fl = lineAA(fe * 9.0, 0.08) * smoothstep(0.2, 0.5, fe);
    col = mix(col, vec3(0.95, 0.97, 0.93) * mix(0.85, 1.05, lit), max(foam, fl * 0.6));
  #endif
  float rn = abs(vnoise(vObj * 1.1) - 0.5) + abs(vnoise(vObj * 2.3 + 7.0) - 0.5) * 0.5;
  float vein = (1.0 - smoothstep(0.006, 0.016, rn)) * detailFade(vObj, 2.0);
  float shimmer = 0.9 + 0.3 * sin(uTime * 2.0 + vWPos.y * 2.0 + vWPos.x);
  col = mix(col, GOLD * shimmer, vein * uFade * 0.9);
  col = mix(col, GOLD * shimmer, smoothstep(0.78, 0.92, fres) * 0.45 * uFade);
#elif STYLE == 4
  // 丝网印刷：只在阴面出现的半调网点 + 霓虹边光
  vec3 an = abs(N);
  vec2 uv = (an.x > an.y && an.x > an.z) ? vObj.yz : ((an.y > an.z) ? vObj.xz : vObj.xy);
  vec2 g = uv * 16.0;
  float fw = length(fwidth(g));
  float r1 = (1.0 - lit) * 0.5;
  float d1 = length(fract(g) - 0.5);
  float dot1 = (1.0 - smoothstep(r1 - fw, r1 + fw, d1)) * (1.0 - clamp(fw - 0.3, 0.0, 1.0));
  col = mix(col, uB * 0.6, dot1 * 0.7);
  #ifdef GRID
    float gl = max(lineAA(vObj.x, 0.025), lineAA(vObj.z, 0.025));
    col = mix(col, uC * 1.6, gl);
  #endif
  col += uC * smoothstep(0.55, 0.98, fres) * 0.8;
#elif STYLE == 5
  // 炭笔：羊皮纸 + 每秒 8 帧跳动的排线
  float tq = floor(uTime * 8.0);
  float lam = ndl * 0.5 + 0.5;
  col = uA * (0.96 + 0.04 * vnoise(vObj * 37.0));
  float j = hash1(tq) * 0.35;
  float h1 = lineAA((vObj.x * 0.7 + vObj.y + vObj.z * 0.45) * 15.0 + j, 0.15 + 0.08 * vnoise(vObj * 2.0 + tq));
  float h2 = lineAA((vObj.x - vObj.y * 0.55 + vObj.z * 0.8) * 15.0 - j, 0.13);
  float dens = (1.0 - smoothstep(0.32, 0.58, lam)) * h1 + (1.0 - smoothstep(0.12, 0.32, lam)) * h2;
  float rim5 = smoothstep(0.78, 0.88, fres + (hash3(floor(vObj * 20.0) + tq) - 0.5) * 0.06);
  col = mix(col, uB, clamp(dens * 0.7 + rim5 * 0.85, 0.0, 1.0));
#endif

#if STYLE != 5
  // ---- 高度渐变与接地阴影 ----
  float hg = smoothstep(uHG.x, uHG.y, ly);
  col = mix(col * uLow, col, mix(1.0, hg, uHOn));
  float ao = mix(mix(0.74, 1.0, smoothstep(uHG.z, uHG.z + uHG.w, ly)), 1.0, smoothstep(0.5, 0.9, N.y));
  col *= mix(1.0, ao, uHOn);
  // ---- 逆光边缘光 ----
  float back2 = 0.35 + 0.65 * smoothstep(-0.2, 0.8, dot(-V, L));
  col += uRim * pow(fres, 3.0) * back2;
#endif

  col = mix(col, uC * 1.3, uEmit);
  float dist = length(uFogO - vWPos) / uWScale;
  float fog = smoothstep(uFogRange.x, uFogRange.y, dist);
  float hfog = (1.0 - smoothstep(uHG.x - 2.0, uHG.y, ly)) * 0.5 * uHOn;
  fog = clamp(fog + hfog * smoothstep(2.0, 14.0, dist), 0.0, 1.0) * uFogAmt;
  col = mix(col, uFogColor, fog);
  gl_FragColor = vec4(col, 1.0);
}`;


const HULL_VERT = /* glsl */`
uniform float uTime;
uniform float uWidth;
${NOISE}
void main(){
  vec3 p = position;
  float w = uWidth;
  #ifdef BOIL
    float tq = floor(uTime * 8.0);
    w *= 0.6 + 0.9 * hash3(floor(position * 5.0) + tq);
    p += (vec3(hash3(position + tq), hash3(position.yzx + tq), hash3(position.zxy + tq)) - 0.5) * 0.02;
  #endif
  p += normal * w;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;
const HULL_FRAG = /* glsl */`
uniform vec3 uInk;
void main(){ gl_FragColor = vec4(uInk, 1.0); }`;

// 每个世界一套共享 uniform：时间、世界尺度（用于雾）、雾色、光照
export function worldUniforms({ fog = '#000000', fogNear = 12, fogFar = 40, fogAmt = 1, light = [0.4, 0.8, 0.5], shade = '#c8c4dc', sun = '#fff4e6', low = '#9a90b0', rim = '#000000', hg = [-1, 3, 0, 0.4] } = {}) {
  return {
    uTime: { value: 0 },
    uWScale: { value: 1 },
    uWOrigin: { value: new THREE.Vector3() },
    uFogColor: { value: new THREE.Color(fog) },
    uFogRange: { value: new THREE.Vector2(fogNear, fogFar) },
    uFogAmtW: fogAmt,
    uLight: { value: new THREE.Vector3(...light).normalize() },
    uShade: { value: new THREE.Color(shade) },
    uSun: { value: new THREE.Color(sun) },
    uLow: { value: new THREE.Color(low) },
    uRim: { value: new THREE.Color(rim) },
    uHG: { value: new THREE.Vector4(...hg) },
    uGlow: { value: 0 },
    uFade: { value: 1 },
    uFogO: { value: new THREE.Vector3() },
  };
}

export function styleMat(style, wu, { a = '#ffffff', b = '#888888', c = '#ffffff', emit = 0, pat = 1, fog = true, facet = false, water = false, grid = false, boil = false, foam = false, height = true, side = THREE.FrontSide } = {}) {
  const defines = { STYLE: style };
  if (facet) defines.FACET = '';
  if (water) defines.WATER = '';
  if (grid) defines.GRID = '';
  if (boil) defines.BOIL = '';
  if (foam) defines.FOAMATTR = '';
  const m = new THREE.ShaderMaterial({
    defines,
    uniforms: {
      uTime: wu.uTime, uWScale: wu.uWScale, uWOrigin: wu.uWOrigin, uFogColor: wu.uFogColor, uFogRange: wu.uFogRange,
      uLight: wu.uLight, uShade: wu.uShade, uSun: wu.uSun, uLow: wu.uLow, uRim: wu.uRim, uHG: wu.uHG,
      uGlow: wu.uGlow, uFade: wu.uFade, uFogO: wu.uFogO,
      uFogAmt: { value: fog ? wu.uFogAmtW : 0 }, uHOn: { value: height ? 1 : 0 },
      uA: { value: new THREE.Color(a) }, uB: { value: new THREE.Color(b) }, uC: { value: new THREE.Color(c) },
      uEmit: { value: emit }, uPat: { value: pat },
    },
    vertexShader: VERT, fragmentShader: FRAG, side,
  });
  m.extensions = { derivatives: true };
  return m;
}

export function hullMat(wu, ink = '#2B2D42', width = 0.012, boil = false) {
  const m = new THREE.ShaderMaterial({
    defines: boil ? { BOIL: '' } : {},
    uniforms: { uTime: wu.uTime, uWidth: { value: width }, uInk: { value: new THREE.Color(ink) } },
    vertexShader: HULL_VERT, fragmentShader: HULL_FRAG, side: THREE.BackSide,
  });
  return m;
}

// ---------------- 天空穹顶 ----------------
const SKY_VERT = /* glsl */`
varying vec3 vDir;
void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const SKY_BODIES = {
  // W0 暮光：深蓝紫天顶 → 玫瑰 → 金色地平线，柔和积云与巨大的日晕
  0: `
    vec3 sunD = normalize(vec3(-0.85, 0.1, -0.3));
    float y = d.y;
    vec3 zen = vec3(0.20, 0.24, 0.40), mid = vec3(0.86, 0.56, 0.52), hor = vec3(1.0, 0.84, 0.60);
    col = mix(hor, mid, smoothstep(0.0, 0.28, y));
    col = mix(col, zen, smoothstep(0.22, 0.85, y));
    float s = max(dot(d, sunD), 0.0);
    col += vec3(1.0, 0.70, 0.40) * pow(s, 6.0) * 0.45 + vec3(1.0, 0.85, 0.6) * pow(s, 60.0) * 0.8;
    col = mix(col, vec3(1.0, 0.96, 0.85), smoothstep(0.9975, 0.999, s));
    float c = vnoise(vec3(d.x * 3.0, d.y * 9.0, d.z * 3.0) + 2.0) * 0.6 + vnoise(d * 7.0) * 0.4;
    float cm = smoothstep(0.52, 0.66, c) * smoothstep(0.04, 0.2, y) * (1.0 - smoothstep(0.45, 0.7, y));
    vec3 cc = mix(vec3(0.62, 0.48, 0.58), vec3(1.0, 0.80, 0.66), pow(s, 2.0) * 0.8 + 0.2);
    col = mix(col, cc, cm * 0.85);
    col = mix(col, vec3(0.42, 0.36, 0.44), smoothstep(0.0, -0.25, y));
  `,
  // W1 虹膜：正前方一枚巨大的瞳孔，虹膜纤维柔和放射，金色内环、天青中环、珊瑚外缘
  1: `
    vec3 P = normalize(vec3(0.0, 0.08, -1.0));
    float th = acos(clamp(dot(d, P), -1.0, 1.0));
    vec3 ax1 = normalize(cross(P, vec3(0.0, 1.0, 0.0)));
    vec3 ax2 = cross(ax1, P);
    float ph = atan(dot(d, ax2), dot(d, ax1));
    float fib = vnoise(vec3(ph * 18.0, th * 2.0, 0.0)) * 0.6 + vnoise(vec3(ph * 46.0, th * 5.0, 3.0)) * 0.4;
    vec3 gold = vec3(0.98, 0.80, 0.45), cyan = vec3(0.50, 0.92, 0.86), deep = vec3(0.22, 0.62, 0.66), coral = vec3(1.0, 0.56, 0.50), sky = vec3(0.93, 0.95, 0.92);
    float r = th + (fib - 0.5) * 0.08;
    col = mix(gold, cyan, smoothstep(0.24, 0.42, r));
    col = mix(col, deep, smoothstep(0.55, 0.8, r) * 0.6);
    col = mix(col, coral, smoothstep(0.7, 0.95, r) * (0.35 + fib * 0.5));
    col *= 0.9 + 0.2 * fib;
    col = mix(col, deep * 0.55, smoothstep(0.92, 1.0, r) * (1.0 - smoothstep(1.0, 1.1, r)));
    col = mix(col, sky, smoothstep(1.05, 1.5, r));
    col = mix(col, vec3(0.06, 0.07, 0.12), smoothstep(0.215, 0.195, th));
    col = mix(col, vec3(0.98, 0.97, 0.9), smoothstep(0.035, 0.02, length(vec2((ph - 2.3) * th, th - 0.12))) * 0.9);
    col = mix(col, vec3(0.62, 0.84, 0.86), smoothstep(-0.05, -0.5, d.y) * 0.7);
  `,
  // W2 和纸天空
  2: `
    vec3 top = vec3(0.99, 0.96, 0.88), hor = vec3(0.84, 0.93, 0.86);
    col = mix(hor, top, smoothstep(-0.05, 0.6, d.y));
    vec3 sunD = normalize(vec3(0.5, 0.3, -0.8));
    float s = max(dot(d, sunD), 0.0);
    col = mix(col, vec3(1.0, 0.86, 0.5), smoothstep(0.986, 0.988, s));
    col += vec3(1.0, 0.85, 0.5) * (pow(s, 8.0) * 0.18 + pow(s, 40.0) * 0.25);
    float c = vnoise(vec3(d.x * 2.5, d.y * 12.0, d.z * 2.5)) ;
    col = mix(col, vec3(1.0, 0.99, 0.95), smoothstep(0.6, 0.7, c) * smoothstep(0.05, 0.3, d.y) * 0.6);
    col = mix(col, vec3(0.70, 0.84, 0.76), smoothstep(0.0, -0.3, d.y));
  `,
  // W3 浮世绘夜海：普鲁士蓝、带晕的满月、细木纹云带
  3: `
    vec3 top = vec3(0.08, 0.15, 0.28), hor = vec3(0.26, 0.47, 0.60), cream = vec3(0.96, 0.95, 0.88);
    col = mix(hor, top, smoothstep(-0.02, 0.6, d.y));
    vec3 moonD = normalize(vec3(-0.35, 0.36, -0.86));
    float m = max(dot(d, moonD), 0.0);
    col += vec3(0.9, 0.85, 0.6) * (pow(m, 30.0) * 0.35 + pow(m, 300.0) * 0.4);
    col = mix(col, cream, smoothstep(0.9975, 0.9982, m));
    float cl = sin(d.y * 70.0 + sin(d.x * 6.0 + d.z * 5.0) * 2.5);
    float cb = smoothstep(0.12, 0.3, d.y) * (1.0 - smoothstep(0.3, 0.5, d.y)) * smoothstep(0.55, 0.7, vnoise(d * 3.0));
    col = mix(col, cream * 0.85, smoothstep(0.86, 0.94, cl) * cb * 0.7);
    vec2 sp = vec2(atan(d.z, d.x) * 40.0, d.y * 40.0);
    float st = smoothstep(0.1, 0.0, length(fract(sp) - 0.5)) * step(0.93, hash3(vec3(floor(sp), 3.0))) * smoothstep(0.15, 0.5, d.y);
    col += vec3(1.0, 0.95, 0.8) * st * 0.7;
    col = mix(col, vec3(0.05, 0.10, 0.19), smoothstep(0.0, -0.25, d.y));
  `,
  // W4 包豪斯虚空
  4: `
    col = mix(vec3(0.09, 0.0, 0.2), vec3(0.03, 0.0, 0.08), smoothstep(0.0, 0.8, d.y));
    col = mix(col, vec3(0.3, 0.02, 0.32), smoothstep(0.25, 0.0, abs(d.y)) * 0.5);
    vec2 sp = vec2(atan(d.z, d.x) * 30.0, d.y * 30.0);
    vec2 cell = fract(sp) - 0.5; vec2 id = floor(sp);
    float h = hash3(vec3(id, 1.0));
    float st = smoothstep(0.12, 0.04, length(cell)) * step(0.85, h);
    col = mix(col, mix(vec3(0.0, 0.96, 0.83), vec3(1.0, 0.2, 0.6), step(0.93, h)), st * 0.7);
    col += vec3(1.0, 0.0, 0.5) * smoothstep(0.02, 0.0, abs(d.y)) * 0.8;
    col += vec3(1.0, 0.1, 0.5) * smoothstep(0.12, 0.0, abs(d.y)) * 0.25;
    vec3 sunD = normalize(vec3(0.6, 0.25, -0.75));
    float s = acos(clamp(dot(d, sunD), -1.0, 1.0));
    float half_ = step(0.0, dot(d - sunD, vec3(0.0, 1.0, 0.0)));
    col += vec3(1.0, 0.3, 0.5) * smoothstep(0.6, 0.2, s) * 0.25;
    col = mix(col, mix(vec3(1.0, 0.85, 0.1), vec3(1.0, 0.1, 0.55), half_), smoothstep(0.205, 0.2, s));
    col = mix(col, vec3(0.06, 0.0, 0.16), smoothstep(0.205, 0.2, s) * lineAA(d.y * 80.0, 0.12) * half_);
  `,
  // W5 羊皮纸：纤维、透视构造线、咖啡渍
  5: `
    col = vec3(0.98, 0.953, 0.867);
    col *= 0.96 + 0.05 * vnoise(d * 90.0);
    vec3 vp = normalize(vec3(0.0, 0.05, -1.0));
    vec3 ax1 = vec3(1.0, 0.0, 0.0); vec3 ax2 = normalize(cross(ax1, vp));
    float ang = atan(dot(d, ax2), dot(d, ax1));
    float cons = lineAA(ang * 9.0, 0.01) * smoothstep(0.98, 0.3, dot(d, vp)) * 0.18;
    col = mix(col, vec3(0.1), cons);
    col = mix(col, vec3(0.1), lineAA(d.y * 6.0 - 0.3, 0.004) * 0.25 * step(abs(d.y), 0.2));
    float st = abs(length(d.xz - vec2(0.55, 0.3)) - 0.18 - vnoise(d * 12.0) * 0.02);
    col = mix(col, vec3(0.78, 0.65, 0.48), smoothstep(0.008, 0.0, st) * 0.4 * step(0.0, d.y));
    col *= 1.0 - smoothstep(-0.2, -0.9, d.y) * 0.12;
  `,
};

export function skyMats(id, extraUniforms = {}) {
  const uniforms = { uTime: { value: 0 }, uGlowS: { value: 0 }, ...extraUniforms };
  const frag = /* glsl */`
    uniform float uTime; uniform float uGlowS;
    varying vec3 vDir;
    ${NOISE}
    ${AA}
    void main(){
      vec3 d = normalize(vDir);
      vec3 col = vec3(0.0);
      ${SKY_BODIES[id]}
      col += vec3(1.0, 0.95, 0.85) * uGlowS;
      gl_FragColor = vec4(col, 1.0);
    }`;
  const mk = (depthWrite) => {
    const m = new THREE.ShaderMaterial({ uniforms, vertexShader: SKY_VERT, fragmentShader: frag, side: THREE.BackSide, depthWrite });
    m.extensions = { derivatives: true };
    return m;
  };
  return { dome: mk(true), global: mk(false), uniforms };
}

// 气泡玻璃：菲涅尔边光（加色）
export function glassMat(color = '#ffffff', strength = 1) {
  return new THREE.ShaderMaterial({
    uniforms: { uC: { value: new THREE.Color(color) }, uS: { value: strength }, uTime: { value: 0 } },
    vertexShader: /* glsl */`varying vec3 vN; varying vec3 vV;
      void main(){ vec4 wp = modelMatrix * vec4(position,1.0); vN = normalize(mat3(modelMatrix)*normal); vV = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: /* glsl */`uniform vec3 uC; uniform float uS; uniform float uTime; varying vec3 vN; varying vec3 vV;
      void main(){ float f = 1.0 - abs(dot(normalize(vN), normalize(vV)));
        float a = pow(f, 3.0) * 0.9 + smoothstep(0.985, 1.0, dot(reflect(-normalize(vV), normalize(vN)), normalize(vec3(-0.4,0.8,0.4)))) * 0.8;
        gl_FragColor = vec4(uC * a * uS, 1.0); }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });
}

// 加色发光（光束、火焰、光晕）
export function glowMat(color, opacity = 1, { soft = true } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { uC: { value: new THREE.Color(color) }, uO: { value: opacity }, uTime: { value: 0 } },
    vertexShader: /* glsl */`varying vec3 vN; varying vec3 vV; varying vec2 vUv;
      void main(){ vUv = uv; vec4 wp = modelMatrix * vec4(position,1.0); vN = normalize(mat3(modelMatrix)*normal); vV = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: /* glsl */`uniform vec3 uC; uniform float uO; varying vec3 vN; varying vec3 vV; varying vec2 vUv;
      void main(){ float f = ${soft ? 'pow(abs(dot(normalize(vN), normalize(vV))), 1.5)' : '1.0'}; gl_FragColor = vec4(uC * f * uO, 1.0); }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
}

// 漂浮微粒（尘埃 / 孢子 / 星点）
export function pointsMat(color, size = 0.03, { additive = true } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { uC: { value: new THREE.Color(color) }, uSize: { value: size }, uTime: { value: 0 }, uScale: { value: 600 } },
    vertexShader: /* glsl */`uniform float uSize; uniform float uTime; uniform float uScale; attribute float aSeed; varying float vA;
      void main(){ vec3 p = position;
        p.x += sin(uTime * 0.3 + aSeed * 6.28) * 0.15; p.y += sin(uTime * 0.21 + aSeed * 12.1) * 0.2; p.z += cos(uTime * 0.26 + aSeed * 9.3) * 0.15;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float s = length(modelMatrix[0].xyz);
        gl_PointSize = clamp(uSize * s * uScale / max(-mv.z, 0.01), 0.0, 48.0);
        vA = 0.55 + 0.45 * sin(uTime * 1.3 + aSeed * 40.0);
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */`uniform vec3 uC; varying float vA;
      void main(){ vec2 c = gl_PointCoord - 0.5; float d = length(c); float a = smoothstep(0.5, 0.1, d) * vA; if (a < 0.01) discard; gl_FragColor = vec4(uC * a, 1.0); }`,
    transparent: true, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: false,
  });
}

// 贴图平面（画作、文字），可带纸纹
export function paperTexMat(tex, { tint = '#ffffff', grain = 0.06, emit = 0 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { uMap: { value: tex }, uTint: { value: new THREE.Color(tint) }, uGrain: { value: grain }, uGlow: { value: emit } },
    vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */`uniform sampler2D uMap; uniform vec3 uTint; uniform float uGrain; uniform float uGlow; varying vec2 vUv;
      ${NOISE}
      void main(){ vec4 c = texture2D(uMap, vUv); float g = vnoise(vec3(vUv * 420.0, 1.0)); vec3 col = c.rgb * uTint * (1.0 - uGrain * 0.5 + uGrain * g); col += c.rgb * uGlow; gl_FragColor = vec4(col, 1.0); }`,
  });
}

// 体积光束：沿长度渐隐、边缘柔和、轻微流动（风之旅人式的光）
export function beamMat(color, opacity = 0.2) {
  return new THREE.ShaderMaterial({
    uniforms: { uC: { value: new THREE.Color(color) }, uO: { value: opacity }, uTime: { value: 0 } },
    vertexShader: /* glsl */`varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying vec3 vP;
      void main(){ vUv = uv; vP = position; vec4 wp = modelMatrix * vec4(position,1.0); vN = normalize(mat3(modelMatrix)*normal); vV = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: /* glsl */`uniform vec3 uC; uniform float uO; uniform float uTime; varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying vec3 vP;
      ${NOISE}
      void main(){ float edge = pow(abs(dot(normalize(vN), normalize(vV))), 2.0);
        float len = smoothstep(0.0, 0.7, vUv.y) * smoothstep(1.0, 0.9, vUv.y);
        float n = 0.75 + 0.25 * vnoise(vec3(vUv.x * 8.0, vUv.y * 3.0 - uTime * 0.15, uTime * 0.05));
        gl_FragColor = vec4(uC * edge * len * n * uO, 1.0); }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
}
