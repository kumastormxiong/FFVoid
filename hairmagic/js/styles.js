// Hairstyle library, hair colours and the seeded random-style generator.

export const STYLES = [
  { id: 'buzz', zh: '寸头', en: 'Buzz cut', group: 'short',
    prompt: 'a clean, even buzz cut about 6 mm long all over, with a sharp natural hairline' },
  { id: 'crop', zh: '法式短碎', en: 'French crop', group: 'short',
    prompt: 'a short textured French crop: messy choppy top, short blunt fringe, skin-faded sides' },
  { id: 'undercut', zh: '两侧推', en: 'Undercut', group: 'short',
    prompt: 'a disconnected undercut: very short shaved sides and back, longer textured top swept back' },
  { id: 'pompadour', zh: '复古油头', en: 'Pompadour', group: 'short',
    prompt: 'a glossy vintage pompadour with high volume at the front, combed back, tapered sides' },
  { id: 'sidepart', zh: '绅士侧分', en: 'Side part', group: 'short',
    prompt: 'a neat classic gentleman side part with a clean combed line and tapered short sides' },
  { id: 'curtain', zh: '中分刘海', en: 'Curtain bangs', group: 'mid',
    prompt: 'a soft 90s middle-parted curtain hairstyle, ear-length layers framing the face' },
  { id: 'spiky', zh: '刺猬头', en: 'Spiky', group: 'short',
    prompt: 'short spiky hair styled upward with matte texture and defined tips, short sides' },
  { id: 'perm', zh: '纹理烫', en: 'Textured perm', group: 'mid',
    prompt: 'a textured curly perm on top with loose defined curls and a low taper fade on the sides' },
  { id: 'mullet', zh: '鲻鱼头', en: 'Modern mullet', group: 'mid',
    prompt: 'a modern mullet: short choppy front and sides, longer flowing layers at the back of the neck' },
  { id: 'wolf', zh: '狼尾', en: 'Wolf cut', group: 'mid',
    prompt: 'a shaggy wolf cut with heavy choppy layers, wispy fringe and longer tapered ends at the nape' },
  { id: 'pixie', zh: '精灵短发', en: 'Pixie', group: 'short',
    prompt: 'a chic textured pixie cut with a long side-swept fringe and short tapered back' },
  { id: 'bob', zh: '法式波波', en: 'French bob', group: 'mid',
    prompt: 'a chin-length French bob with light wispy bangs and slightly tousled ends' },
  { id: 'lob', zh: '锁骨发', en: 'Lob', group: 'mid',
    prompt: 'a collarbone-length lob with soft inward-curled ends and a gentle side part' },
  { id: 'hime', zh: '公主切', en: 'Hime cut', group: 'long',
    prompt: 'a hime cut: straight blunt bangs, straight cheek-length side locks, long straight hair behind' },
  { id: 'straight', zh: '黑长直', en: 'Long straight', group: 'long',
    prompt: 'very long sleek straight hair past the shoulders with a smooth glossy finish and middle part' },
  { id: 'waves', zh: '大波浪', en: 'Long waves', group: 'long',
    prompt: 'long voluminous glamorous waves past the shoulders with soft face-framing layers' },
  { id: 'curly', zh: '羊毛卷', en: 'Tight curls', group: 'mid',
    prompt: 'shoulder-length voluminous tight springy curls with lots of texture' },
  { id: 'afro', zh: '爆炸头', en: 'Afro', group: 'mid',
    prompt: 'a large round natural afro with soft coily texture and even rounded shape' },
  { id: 'braids', zh: '编发', en: 'Braids', group: 'long',
    prompt: 'long neat box braids falling past the shoulders, a few braids tucked behind the ears' },
  { id: 'ponytail', zh: '高马尾', en: 'High ponytail', group: 'long',
    prompt: 'a sleek high ponytail pulled back tightly from the face, long ponytail hanging behind' },
];

export const COLORS = [
  { id: 'keep', zh: '原色', hex: null, prompt: '' },
  { id: 'black', zh: '自然黑', hex: '#1b1a1c', prompt: 'natural jet black' },
  { id: 'brown', zh: '深棕', hex: '#4a3122', prompt: 'rich dark chocolate brown' },
  { id: 'chestnut', zh: '栗棕', hex: '#7b4a2b', prompt: 'warm chestnut brown' },
  { id: 'ash', zh: '亚麻灰', hex: '#9a8f80', prompt: 'cool ash brown with linen tones' },
  { id: 'blonde', zh: '奶金', hex: '#d9bd8c', prompt: 'creamy honey blonde' },
  { id: 'platinum', zh: '铂金', hex: '#e8e4dc', prompt: 'icy platinum blonde' },
  { id: 'silver', zh: '银灰', hex: '#b9bec6', prompt: 'metallic silver grey' },
  { id: 'wine', zh: '酒红', hex: '#6d1f2e', prompt: 'deep burgundy wine red' },
  { id: 'copper', zh: '铜橙', hex: '#b5592a', prompt: 'vivid copper ginger' },
  { id: 'haze', zh: '雾霾蓝', hex: '#5d7390', prompt: 'smoky haze blue' },
  { id: 'pink', zh: '樱花粉', hex: '#e7a3b6', prompt: 'pastel sakura pink' },
  { id: 'mint', zh: '薄荷绿', hex: '#8fcdb8', prompt: 'pastel mint green' },
  { id: 'violet', zh: '幻紫', hex: '#7a5fb0', prompt: 'electric lavender violet' },
];

// ---- Seeded random style generator -------------------------------------------------

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const POOLS = {
  length: [
    ['超短', 'very short (about 2 cm)'],
    ['短发', 'short, ear-length'],
    ['及颌', 'chin-length'],
    ['及肩', 'shoulder-length'],
    ['长发', 'long, mid-back length'],
  ],
  texture: [
    ['直发', 'sleek straight'],
    ['微卷', 'soft loose waves'],
    ['卷发', 'bouncy defined curls'],
    ['蓬松纹理', 'airy piece-y texture'],
    ['湿发感', 'glossy wet-look'],
  ],
  fringe: [
    ['无刘海', 'no fringe, forehead visible'],
    ['齐刘海', 'blunt straight-across bangs'],
    ['空气刘海', 'wispy see-through bangs'],
    ['八字刘海', 'parted curtain bangs'],
    ['侧分刘海', 'long side-swept fringe'],
  ],
  part: [
    ['中分', 'middle part'],
    ['侧分', 'deep side part'],
    ['无分线', 'no visible part'],
    ['后梳', 'swept straight back'],
  ],
  detail: [
    ['', ''],
    ['', ''],
    ['两侧渐变', 'faded short sides'],
    ['层次剪裁', 'heavy layered cut'],
    ['半扎发', 'half-up top knot'],
    ['耳后挑染', 'peekaboo color streaks underneath'],
    ['剃线', 'a thin shaved line on one side'],
    ['挂耳', 'tucked behind one ear'],
  ],
  volume: [
    ['服帖', 'low volume, close to the head'],
    ['自然', 'natural volume'],
    ['高颅顶', 'lifted crown volume'],
  ],
};

const RANDOM_COLORS = [
  ...COLORS.filter((c) => c.id !== 'keep'),
  { id: 'ombre1', zh: '雾蓝渐变', prompt: 'dark roots fading into smoky blue ends (ombre)' },
  { id: 'ombre2', zh: '粉金渐变', prompt: 'rose gold ombre from brown roots to pink-gold ends' },
  { id: 'ombre3', zh: '银白挑染', prompt: 'dark hair with fine silver-white highlights' },
];

export function randomSeed() {
  return Math.floor(Math.random() * 900000) + 100000;
}

/**
 * Deterministically derive a hairstyle recipe from a numeric seed.
 * `allowedLengths` limits the length category (indices into POOLS.length) so random looks
 * respect the hair the person has now.
 */
export function styleFromSeed(seed, { randomColor = true, allowedLengths = null } = {}) {
  const rnd = mulberry32(seed * 2654435761);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const lengths = allowedLengths && allowedLengths.length ? allowedLengths : [0, 1, 2, 3, 4];
  const lengthIdx = lengths[Math.floor(rnd() * lengths.length)];
  const length = POOLS.length[lengthIdx];
  const texture = pick(POOLS.texture);
  const fringe = pick(POOLS.fringe);
  const part = pick(POOLS.part);
  let detail = pick(POOLS.detail);
  const volume = pick(POOLS.volume);
  const colorRoll = rnd();
  const color = !randomColor || colorRoll < 0.3 ? null : pick(RANDOM_COLORS);
  if (lengthIdx <= 1 && /半扎发|挂耳/.test(detail[0])) detail = ['', ''];

  const zhParts = [length[0], texture[0], fringe[0], part[0], volume[0], detail[0]].filter(Boolean);
  let en = `a ${length[1]} haircut, ${texture[1]} texture, ${fringe[1]}, ${part[1]}, ${volume[1]}`;
  if (detail[1]) en += `, ${detail[1]}`;
  return {
    seed,
    lengthIdx,
    texture: texture[0],
    zh: zhParts.join(' · '),
    prompt: en + ' — a fashionable salon-quality hairstyle',
    color: color ? { zh: color.zh, prompt: color.prompt, hex: color.hex || null } : null,
  };
}

/** Face-shape hint from landmarks, used to suggest flattering styles. */
export function suggestForFace(shape) {
  const map = {
    round: ['undercut', 'pompadour', 'sidepart', 'lob', 'waves', 'ponytail'],
    long: ['curtain', 'bob', 'hime', 'curly', 'perm', 'crop'],
    square: ['wolf', 'waves', 'perm', 'curtain', 'pixie', 'mullet'],
    oval: ['crop', 'mullet', 'bob', 'straight', 'braids', 'spiky'],
    heart: ['lob', 'bob', 'curtain', 'sidepart', 'curly', 'hime'],
  };
  return map[shape] || map.oval;
}
