// Hairstyle library, hair colours and the seeded random-style generator.

// g: 'm' men's catalogue, 'f' women's catalogue (20 each)
export const STYLES = [
  // ---- men
  { id: 'buzz', g: 'm', zh: '寸头', en: 'Buzz cut',
    prompt: "a clean, even men's buzz cut about 6 mm long all over, with a sharp natural hairline" },
  { id: 'crewcut', g: 'm', zh: '板寸', en: 'Crew cut',
    prompt: "a flat-top men's crew cut: short flat brushed-up top about 2 cm, tapered short sides" },
  { id: 'crop', g: 'm', zh: '法式短碎', en: 'French crop',
    prompt: "a men's short textured French crop: messy choppy top, short blunt fringe, skin-faded sides" },
  { id: 'taper', g: 'm', zh: '美式渐变', en: 'Taper fade',
    prompt: "a men's taper fade: textured short top brushed forward and up, smooth gradient fade from skin at the neck to the top" },
  { id: 'undercut', g: 'm', zh: '两侧推', en: 'Undercut',
    prompt: "a men's disconnected undercut: very short shaved sides and back, longer textured top swept back" },
  { id: 'pompadour', g: 'm', zh: '复古油头', en: 'Pompadour',
    prompt: "a glossy men's vintage pompadour with high volume at the front, combed back, tapered sides" },
  { id: 'slickback', g: 'm', zh: '大背头', en: 'Slick back',
    prompt: "a men's slicked-back hairstyle: medium-length top combed straight back with a glossy finish, short faded sides" },
  { id: 'quiff', g: 'm', zh: '飞机头', en: 'Quiff',
    prompt: "a men's modern quiff: front hair lifted up and slightly back with matte volume, short tapered sides" },
  { id: 'sidepart', g: 'm', zh: '绅士侧分', en: 'Side part',
    prompt: "a neat classic men's gentleman side part with a clean combed line and tapered short sides" },
  { id: 'comma', g: 'm', zh: '逗号刘海', en: 'Comma hair',
    prompt: "a Korean men's comma hairstyle: soft medium-length fringe curving inward like a comma above one eyebrow, natural volume" },
  { id: 'curtain', g: 'm', zh: '中分碎盖', en: 'Curtain',
    prompt: "a men's soft 90s middle-parted curtain hairstyle, ear-length layers framing the face" },
  { id: 'spiky', g: 'm', zh: '刺猬头', en: 'Spiky',
    prompt: "men's short spiky hair styled upward with matte texture and defined tips, short sides" },
  { id: 'perm', g: 'm', zh: '纹理烫', en: 'Textured perm',
    prompt: "a men's textured curly perm on top with loose defined curls and a low taper fade on the sides" },
  { id: 'foil', g: 'm', zh: '锡纸烫', en: 'Foil perm',
    prompt: "a men's foil perm: tight zigzag kinky curls on top about 6 cm long, short faded sides" },
  { id: 'mullet', g: 'm', zh: '鲻鱼头', en: 'Modern mullet',
    prompt: "a men's modern mullet: short choppy front and sides, longer flowing layers at the back of the neck" },
  { id: 'wolf', g: 'm', zh: '狼尾', en: 'Wolf cut',
    prompt: "a men's shaggy wolf cut with heavy choppy layers, wispy fringe and longer tapered ends at the nape" },
  { id: 'manbun', g: 'm', zh: '武士头', en: 'Man bun',
    prompt: "a men's top knot man bun: long hair pulled back into a bun at the crown, with short faded sides" },
  { id: 'longm', g: 'm', zh: '男士长发', en: 'Long hair',
    prompt: "men's shoulder-length layered hair with a loose middle part, tucked behind the ears, rock-style texture" },
  { id: 'afro', g: 'm', zh: '爆炸头', en: 'Afro',
    prompt: 'a large round natural afro with soft coily texture and even rounded shape' },
  { id: 'dreads', g: 'm', zh: '脏辫', en: 'Dreadlocks',
    prompt: "men's medium-length dreadlocks, neat individual locs falling to the jaw, slightly tied up at the top" },
  // ---- women
  { id: 'pixie', g: 'f', zh: '精灵短发', en: 'Pixie',
    prompt: "a chic women's textured pixie cut with a long side-swept fringe and short tapered back" },
  { id: 'shortbob', g: 'f', zh: '耳下短发', en: 'Ear-length bob',
    prompt: "a women's ear-length short bob with straight blunt ends and a light airy fringe" },
  { id: 'bob', g: 'f', zh: '法式波波', en: 'French bob',
    prompt: "a women's chin-length French bob with light wispy bangs and slightly tousled ends" },
  { id: 'lob', g: 'f', zh: '锁骨发', en: 'Lob',
    prompt: "a women's collarbone-length lob with soft inward-curled ends and a gentle side part" },
  { id: 'shag', g: 'f', zh: '层次碎发', en: 'Shag',
    prompt: "a women's shoulder-length shag cut with lots of choppy feathered layers and curtain bangs" },
  { id: 'wolff', g: 'f', zh: '女士狼尾', en: 'Wolf cut',
    prompt: "a women's wolf cut: voluminous choppy crown layers, wispy bangs, longer thin layers past the shoulders" },
  { id: 'hush', g: 'f', zh: '鲸鱼剪', en: 'Hush cut',
    prompt: "a women's Korean hush cut: soft feathery face-framing layers, airy see-through bangs, mid-length light ends" },
  { id: 'octopus', g: 'f', zh: '八爪鱼剪', en: 'Octopus cut',
    prompt: "a women's octopus cut: short voluminous layered crown with long thin wispy tentacle-like layers below the shoulders" },
  { id: 'hime', g: 'f', zh: '公主切', en: 'Hime cut',
    prompt: "a women's hime cut: straight blunt bangs, straight cheek-length side locks, long straight hair behind" },
  { id: 'airbangs', g: 'f', zh: '空气刘海', en: 'Air bangs',
    prompt: "women's long straight hair with thin see-through air bangs and soft face-framing pieces" },
  { id: 'curtainlong', g: 'f', zh: '八字刘海长发', en: 'Curtain bangs long',
    prompt: "women's long layered hair with parted curtain bangs sweeping to both sides, soft blow-dried ends" },
  { id: 'straight', g: 'f', zh: '黑长直', en: 'Long straight',
    prompt: "women's very long sleek straight hair past the shoulders with a smooth glossy finish and middle part" },
  { id: 'waves', g: 'f', zh: '大波浪', en: 'Long waves',
    prompt: "women's long voluminous glamorous waves past the shoulders with soft face-framing layers" },
  { id: 'ripple', g: 'f', zh: '水波纹', en: 'Water ripple',
    prompt: "women's long hair with a water-ripple perm: regular soft S-shaped waves from the ears down" },
  { id: 'curly', g: 'f', zh: '羊毛卷', en: 'Tight curls',
    prompt: "women's shoulder-length voluminous tight springy curls with lots of texture" },
  { id: 'ponytail', g: 'f', zh: '高马尾', en: 'High ponytail',
    prompt: 'a sleek high ponytail pulled back tightly from the face, long ponytail hanging behind' },
  { id: 'bun', g: 'f', zh: '丸子头', en: 'Top bun',
    prompt: 'a cute messy top bun on the crown with a few loose face-framing strands' },
  { id: 'halfup', g: 'f', zh: '半扎公主头', en: 'Half-up',
    prompt: 'long hair in a half-up princess style: the top section tied back at the crown, the rest falling loose' },
  { id: 'braids', g: 'f', zh: '编发', en: 'Braids',
    prompt: 'long neat box braids falling past the shoulders, a few braids tucked behind the ears' },
  { id: 'twinbraids', g: 'f', zh: '双麻花辫', en: 'Twin braids',
    prompt: 'two long three-strand plaited braids hanging over the front of each shoulder, centre part' },
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
export function styleFromSeed(seed, { randomColor = true, allowedLengths = null, line = 'm' } = {}) {
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
    prompt: en + (line === 'f' ? " — a fashionable salon-quality women's hairstyle" : " — a fashionable salon-quality men's haircut"),
    color: color ? { zh: color.zh, prompt: color.prompt, hex: color.hex || null } : null,
  };
}

/** Face-shape hint: flattering styles per catalogue. */
export function suggestForFace(shape, line = 'm') {
  const m = {
    round: ['undercut', 'pompadour', 'quiff', 'sidepart', 'slickback', 'taper'],
    long: ['curtain', 'comma', 'crop', 'perm', 'crewcut', 'foil'],
    square: ['wolf', 'perm', 'curtain', 'comma', 'mullet', 'longm'],
    oval: ['crop', 'mullet', 'taper', 'quiff', 'manbun', 'spiky'],
    heart: ['curtain', 'sidepart', 'comma', 'longm', 'perm', 'slickback'],
  };
  const f = {
    round: ['lob', 'shag', 'curtainlong', 'waves', 'ponytail', 'halfup'],
    long: ['bob', 'hime', 'curly', 'airbangs', 'shortbob', 'hush'],
    square: ['wolff', 'waves', 'ripple', 'shag', 'pixie', 'curtainlong'],
    oval: ['pixie', 'bob', 'straight', 'octopus', 'braids', 'bun'],
    heart: ['lob', 'bob', 'hush', 'curtainlong', 'curly', 'hime'],
  };
  const map = line === 'f' ? f : m;
  return map[shape] || map.oval;
}
