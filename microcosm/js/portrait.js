// 《凝视》—— 程序化绘制的肖像：水粉版（未点睛）、炭笔素描版、终幕点睛版
// 画布 768×1024 对应 0.9m×1.2m；左眼（观者右侧）为传送门开孔
import * as THREE from 'three';
import { rng } from './geo.js';

export const PW = 0.9, PH = 1.2;
const CW = 768, CH = 1024, PX = CW / PW;
export const EYE_L = { x: 0.085, y: 0.10 }; // 相对画面中心（米）
export const EYE_R = { x: -0.085, y: 0.10 };
export const HOLE_R = 0.034;
const toPx = (mx, my) => [CW / 2 + mx * PX, CH / 2 - my * PX];

function strokes(g, r, n, fn) { for (let i = 0; i < n; i++) fn(i, r); }
function dab(g, x, y, w, h, ang, col, a) { g.save(); g.translate(x, y); g.rotate(ang); g.globalAlpha = a; g.fillStyle = col; g.beginPath(); g.ellipse(0, 0, w, h, 0, 0, Math.PI * 2); g.fill(); g.restore(); }
function line(g, pts, w, col, a = 1) { g.globalAlpha = a; g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); g.globalAlpha = 1; }

// 脸、头发、颈肩的几何（米 → 像素）
const FACE = { cx: 0.0, cy: 0.06, rx: 0.17, ry: 0.255 };
function faceOval(g) { const [x, y] = toPx(FACE.cx, FACE.cy); g.beginPath(); g.ellipse(x, y, FACE.rx * PX, FACE.ry * PX, 0, 0, Math.PI * 2); }
function almond(g, e, w = 0.062, h = 0.024) {
  const [x, y] = toPx(e.x, e.y); const W = w * PX, H = h * PX;
  g.beginPath(); g.moveTo(x - W, y); g.quadraticCurveTo(x, y - H * 2.1, x + W, y); g.quadraticCurveTo(x, y + H * 1.7, x - W, y); g.closePath();
}

export function drawPortrait(mode = 'gouache') {
  const SS = 1.5;
  const cv = document.createElement('canvas'); cv.width = CW * SS; cv.height = CH * SS;
  const g = cv.getContext('2d'); g.scale(SS, SS);
  const r = rng(7);
  const charcoal = mode.startsWith('charcoal');
  const final = mode === 'final';
  const hole = mode !== 'charcoal';

  if (!charcoal) {
    // ---------- 水粉 ----------
    const bg = g.createLinearGradient(0, 0, CW, CH);
    bg.addColorStop(0, final ? '#e9b77a' : '#c99a62'); bg.addColorStop(0.55, final ? '#b9765a' : '#9a6a52'); bg.addColorStop(1, final ? '#4f6f73' : '#3e4f58');
    g.fillStyle = bg; g.fillRect(0, 0, CW, CH);
    strokes(g, r, 900, () => dab(g, r() * CW, r() * CH, 10 + r() * 40, 4 + r() * 10, r() * 3, ['#d4a373', '#81b29a', '#e07a5f', '#3d405b', '#f2cc8f'][Math.floor(r() * 5)], 0.06 + r() * 0.08));
    // 肩与裙
    g.fillStyle = final ? '#3f8f86' : '#4a7c78';
    g.beginPath(); const [sx, sy] = toPx(-0.42, -0.6); g.moveTo(sx, CH); g.bezierCurveTo(...toPx(-0.36, -0.36), ...toPx(-0.12, -0.3), ...toPx(0, -0.32)); g.bezierCurveTo(...toPx(0.14, -0.3), ...toPx(0.38, -0.36), ...toPx(0.45, -0.6)); g.lineTo(CW, CH); g.closePath(); g.fill();
    strokes(g, r, 120, () => { const x = CW * 0.15 + r() * CW * 0.7, y = CH * 0.82 + r() * CH * 0.18; dab(g, x, y, 18 + r() * 30, 5, -0.4 + r() * 0.8, r() < 0.5 ? '#2f5f5c' : '#81b29a', 0.15); });
    // 颈
    g.fillStyle = '#e8b896'; const [nx, ny] = toPx(-0.055, -0.12); g.fillRect(nx, ny, 0.11 * PX, 0.22 * PX);
    dab(g, ...toPx(0.02, -0.2), 0.05 * PX, 0.1 * PX, 0, '#b97f65', 0.35);
    // 头发（背后的一大片）
    g.fillStyle = '#26304a';
    g.beginPath(); g.moveTo(...toPx(-0.2, 0.2)); g.bezierCurveTo(...toPx(-0.26, 0.46), ...toPx(0.2, 0.47), ...toPx(0.23, 0.18)); g.bezierCurveTo(...toPx(0.3, -0.05), ...toPx(0.33, -0.3), ...toPx(0.3, -0.42)); g.bezierCurveTo(...toPx(0.2, -0.3), ...toPx(0.16, -0.1), ...toPx(0.13, -0.05)); g.lineTo(...toPx(-0.17, -0.05)); g.closePath(); g.fill();
    // 脸
    g.save(); faceOval(g); g.clip();
    const fg = g.createRadialGradient(...toPx(-0.04, 0.12), 20, ...toPx(0, 0.05), 0.3 * PX);
    fg.addColorStop(0, final ? '#fbe0c4' : '#f3d2b3'); fg.addColorStop(1, '#d59c7e');
    g.fillStyle = fg; g.fillRect(0, 0, CW, CH);
    strokes(g, r, 160, () => dab(g, ...toPx(-0.17 + r() * 0.34, -0.2 + r() * 0.5), 6 + r() * 16, 3 + r() * 6, r() * 3, r() < 0.5 ? '#f7dcc0' : '#c98d74', 0.1));
    dab(g, ...toPx(-0.095, -0.01), 0.04 * PX, 0.022 * PX, 0, '#e07a5f', final ? 0.3 : 0.18);
    dab(g, ...toPx(0.095, -0.01), 0.04 * PX, 0.022 * PX, 0, '#e07a5f', final ? 0.3 : 0.18);
    g.restore();
    // 刘海
    g.fillStyle = '#26304a';
    g.beginPath(); g.moveTo(...toPx(-0.19, 0.12)); g.bezierCurveTo(...toPx(-0.16, 0.36), ...toPx(0.12, 0.38), ...toPx(0.2, 0.2)); g.bezierCurveTo(...toPx(0.1, 0.27), ...toPx(-0.04, 0.24), ...toPx(-0.19, 0.12)); g.fill();
    strokes(g, r, 70, () => { const a = r(); line(g, [toPx(-0.18 + a * 0.38, 0.33 - r() * 0.03), toPx(-0.2 + a * 0.4 + 0.02, 0.18 + r() * 0.04)], 2 + r() * 3, '#3d4a6b', 0.5); });
    strokes(g, r, 90, () => { const a = r(); line(g, [toPx(0.2 + a * 0.08, 0.15 - r() * 0.1), toPx(0.22 + a * 0.08, -0.35 + r() * 0.1)], 2 + r() * 4, '#3d4a6b', 0.35); });
    // 鼻、唇
    line(g, [toPx(-0.006, 0.07), toPx(-0.012, -0.03), toPx(0.008, -0.045)], 3, '#a86b55', 0.7);
    g.fillStyle = final ? '#c95b4f' : '#b8695a'; g.beginPath(); g.ellipse(...toPx(0, -0.11), 0.03 * PX, 0.011 * PX, 0, 0, Math.PI * 2); g.fill();
    line(g, [toPx(-0.03, -0.11), toPx(0.03, -0.11)], 2, '#7a3d36', 0.6);
    // 眉
    line(g, [toPx(-0.14, 0.15), toPx(-0.085, 0.17), toPx(-0.035, 0.155)], 4, '#3a3040', 0.75);
    line(g, [toPx(0.035, 0.155), toPx(0.085, 0.17), toPx(0.14, 0.15)], 4, '#3a3040', 0.75);
    // 眼睛：杏仁形的空白（莫迪利亚尼式），终幕时画上虹膜
    for (const e of [EYE_L, EYE_R]) {
      almond(g, e); g.fillStyle = final ? '#f6efe4' : '#efe6d8'; g.fill();
      g.lineWidth = 3; g.strokeStyle = '#4a3a3a'; g.globalAlpha = 0.85; g.stroke(); g.globalAlpha = 1;
      line(g, [toPx(e.x - 0.06, e.y + 0.028), toPx(e.x, e.y + 0.045), toPx(e.x + 0.06, e.y + 0.028)], 2, '#4a3a3a', 0.4);
    }
    if (final) {
      const [x, y] = toPx(EYE_R.x, EYE_R.y);
      const ig = g.createRadialGradient(x, y, 2, x, y, HOLE_R * PX);
      ig.addColorStop(0, '#163040'); ig.addColorStop(0.35, '#1e5c66'); ig.addColorStop(0.7, '#3fb8a8'); ig.addColorStop(1, '#2a6f73');
      g.save(); almond(g, EYE_R); g.clip();
      g.fillStyle = ig; g.beginPath(); g.arc(x, y, HOLE_R * PX, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#10161f'; g.beginPath(); g.arc(x, y, HOLE_R * PX * 0.38, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff'; g.globalAlpha = 0.9; g.beginPath(); g.arc(x - 8, y - 8, 5, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
      g.restore();
    }
    // 落款：朱红小印
    g.fillStyle = '#d62828'; g.globalAlpha = 0.85; g.fillRect(CW - 80, CH - 110, 40, 40); g.globalAlpha = 1;
    g.fillStyle = '#f6e7d0'; g.font = 'bold 22px serif'; g.textAlign = 'center'; g.fillText('眸', CW - 60, CH - 82);
  } else {
    // ---------- 炭笔素描 ----------
    g.fillStyle = '#faf3dd'; g.fillRect(0, 0, CW, CH);
    strokes(g, r, 2000, () => { g.fillStyle = `rgba(120,100,70,${r() * 0.04})`; g.fillRect(r() * CW, r() * CH, 1 + r() * 2, 1 + r() * 2); });
    const ink = '#1a1817';
    // 构造线
    line(g, [toPx(0, 0.4), toPx(0, -0.45)], 1, ink, 0.25);
    line(g, [toPx(-0.3, EYE_L.y), toPx(0.3, EYE_L.y)], 1, ink, 0.25);
    // 脸部轮廓：重复的松散线条
    for (let k = 0; k < 4; k++) {
      const pts = []; for (let i = 0; i <= 40; i++) { const a = (i / 40) * Math.PI * 2; const jr = 1 + (r() - 0.5) * 0.03; pts.push(toPx(FACE.cx + Math.cos(a) * FACE.rx * jr, FACE.cy + Math.sin(a) * FACE.ry * jr)); }
      line(g, pts, 1.5 + r() * 1.5, ink, 0.35 + r() * 0.3);
    }
    // 头发排线
    strokes(g, r, 160, () => { const a = r(); const x0 = -0.22 + a * 0.5; line(g, [toPx(x0, 0.42 - r() * 0.05), toPx(x0 + 0.05 + r() * 0.05, 0.12 - r() * 0.5 * (a > 0.7 ? 1 : 0.2))], 1 + r() * 1.5, ink, 0.25 + r() * 0.3); });
    // 颈肩
    line(g, [toPx(-0.055, -0.15), toPx(-0.06, -0.32), toPx(-0.36, -0.4), toPx(-0.44, -0.6)], 2, ink, 0.6);
    line(g, [toPx(0.055, -0.15), toPx(0.06, -0.32), toPx(0.36, -0.4), toPx(0.44, -0.6)], 2, ink, 0.6);
    strokes(g, r, 80, () => { const x = -0.4 + r() * 0.8; line(g, [toPx(x, -0.45 - r() * 0.05), toPx(x + 0.06, -0.58)], 1, ink, 0.25); });
    line(g, [toPx(-0.006, 0.07), toPx(-0.012, -0.03), toPx(0.008, -0.045)], 2, ink, 0.7);
    line(g, [toPx(-0.03, -0.11), toPx(0, -0.115), toPx(0.03, -0.11)], 2, ink, 0.7);
    line(g, [toPx(-0.14, 0.15), toPx(-0.085, 0.17), toPx(-0.035, 0.155)], 3, ink, 0.7);
    line(g, [toPx(0.035, 0.155), toPx(0.085, 0.17), toPx(0.14, 0.15)], 3, ink, 0.7);
    for (const e of [EYE_L, EYE_R]) { almond(g, e); g.lineWidth = 2.5; g.strokeStyle = ink; g.globalAlpha = 0.8; g.stroke(); g.globalAlpha = 1; }
    // 朱红印章
    g.fillStyle = '#d62828'; g.fillRect(CW - 80, CH - 110, 40, 40);
    g.fillStyle = '#faf3dd'; g.font = 'bold 22px serif'; g.textAlign = 'center'; g.fillText('眸', CW - 60, CH - 82);
  }
  // 传送门开孔（透明）
  if (hole) {
    const [x, y] = toPx(EYE_L.x, EYE_L.y);
    g.save(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(x, y, HOLE_R * PX * 0.97, 0, Math.PI * 2); g.fill(); g.restore();
    // 开孔边缘一圈深色（像虹膜外缘）
    g.strokeStyle = charcoal ? '#1a1817' : '#2a2430'; g.lineWidth = 3; g.globalAlpha = 0.8; g.beginPath(); g.arc(x, y, HOLE_R * PX * 0.98, 0, Math.PI * 2); g.stroke(); g.globalAlpha = 1;
  }
  const tex = new THREE.CanvasTexture(cv); tex.anisotropy = 4;
  return tex;
}

export function portraitMat(tex) {
  return new THREE.ShaderMaterial({
    uniforms: { uMap: { value: tex }, uGlow: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform sampler2D uMap; uniform float uGlow; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      void main(){ vec4 c = texture2D(uMap, vUv); if (c.a < 0.5) discard; vec3 col = c.rgb * (1.0 + uGlow); gl_FragColor = vec4(col, 1.0); }`,
    side: THREE.DoubleSide,
  });
}
