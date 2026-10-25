// 界面语言：默认英文，首页可切换中文 / English
// 词典以中文原文为键：没有英文译文的文字会原样显示中文，所以可以逐步补全。
// 切换语言会刷新页面，保证所有文字（包括 VR 面板、画布上的字）一起变。
import { ES } from './i18n-en.js';
import { CONFIG } from './config.js';

const KEY = 'wakeupcubes.lang';

function readLang() {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'zh' || v === 'en') return v;
  } catch (e) { /* 读不到就用默认 */ }
  return 'en';
}

export const i18n = { lang: readLang() };

export function setLang(lang) {
  try { localStorage.setItem(KEY, lang); } catch (e) { /* 忽略 */ }
  location.reload();
}

// tr('中文原文', { 变量 })：英文模式返回译文，中文模式原样返回
export function tr(zh, vars) {
  let s = i18n.lang === 'en' && ES[zh] !== undefined ? ES[zh] : zh;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
  return s;
}

// 游戏名：英文模式用英文名
export const gameName = () => (i18n.lang === 'en' ? CONFIG.GAME_NAME_EN : CONFIG.GAME_NAME);

// 关卡名：官方关卡的名字存的是中文，显示时再翻译；玩家自建的名字原样显示
export function lvName(L) {
  return L && L.official ? tr(L.name) : (L ? L.name : '');
}

// 页面里写死的中文（HTML 文字 / 属性）：英文模式下替换成译文
// 复杂的段落用 data-en 属性直接给出英文 HTML
const ATTRS = ['title', 'aria-label', 'placeholder'];
export function applyDom(root = document.body) {
  document.documentElement.lang = i18n.lang === 'en' ? 'en' : 'zh-CN';
  if (i18n.lang !== 'en') return;
  root.querySelectorAll('[data-en]').forEach((el) => { el.innerHTML = el.dataset.en; });
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const n of nodes) {
    const p = n.parentNode;
    if (!p || /^(SCRIPT|STYLE|TEXTAREA|CODE)$/.test(p.nodeName)) continue;
    if (p.closest && p.closest('.logo')) continue;   // 品牌 logo 保持原样
    const key = n.nodeValue.trim();
    if (key && ES[key] !== undefined) n.nodeValue = n.nodeValue.replace(key, ES[key]);
  }
  root.querySelectorAll('*').forEach((el) => {
    for (const a of ATTRS) {
      const v = el.getAttribute(a);
      if (v && ES[v] !== undefined) el.setAttribute(a, ES[v]);
    }
  });
}
