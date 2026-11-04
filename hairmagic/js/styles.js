// Hairstyle library, hair colours and the seeded random-style generator.

// g: 'm' men's catalogue, 'f' women's catalogue (50 each)
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
  { id: 'ivy', g: 'm', zh: '常春藤短发', en: 'Ivy League',
    prompt: "a men's Ivy League cut: neat side-parted top about 5 cm with a soft natural taper on the sides" },
  { id: 'caesar', g: 'm', zh: '凯撒头', en: 'Caesar cut',
    prompt: "a men's Caesar cut: short even fringe-length top about 3 cm, straight across the forehead, short tapered sides" },
  { id: 'bowl', g: 'm', zh: '蘑菇头', en: 'Bowl cut',
    prompt: "a men's bowl cut: rounded even top about 6 cm with a straight blunt fringe, sides cut evenly around the head" },
  { id: 'ducktail', g: 'm', zh: '鸭尾头', en: 'Ducktail',
    prompt: "a men's ducktail: short top combed back with the back of the hair flipped up at the nape, tapered sides" },
  { id: 'fauxhawk', g: 'm', zh: '假莫西干', en: 'Faux hawk',
    prompt: "a men's faux hawk: tapered sides and a textured mohawk-style strip on top about 8 cm, swept back" },
  { id: 'mohawk', g: 'm', zh: '莫西干', en: 'Mohawk',
    prompt: "a men's mohawk: shaved sides and back with a tall textured strip of hair on top about 10 cm" },
  { id: 'fade', g: 'm', zh: '渐变寸头', en: 'Skin fade',
    prompt: "a men's skin fade: very short top about 2 cm with a smooth blend down to bare skin on the sides and back" },
  { id: 'twoblock', g: 'm', zh: '二八分', en: 'Two block',
    prompt: "a men's two block cut: longer textured top about 6 cm over a sharp shaved undercut on the sides and back" },
  { id: 'flow', g: 'm', zh: '飘逸中长', en: 'Flowing medium cut',
    prompt: "a men's flowing medium-length cut: swept-back layers on top, ear-length sides with soft movement" },
  { id: 'manbob', g: 'm', zh: '男士波波', en: 'Men\'s bob',
    prompt: "a men's chin-length bob: even blunt-cut length with a textured top and a tidy fringe" },
  { id: 'shagm', g: 'm', zh: '男士碎层', en: 'Men\'s shag',
    prompt: "a men's shaggy layered cut: choppy layers all over, a messy fringe and texture around the ears" },
  { id: 'emo', g: 'm', zh: '日系凌乱刘海', en: 'Emo fringe',
    prompt: "a men's Japanese-style emo cut: long asymmetric fringe falling over one eye, layered sides" },
  { id: 'bangsm', g: 'm', zh: '男士齐刘海', en: 'Blunt fringe',
    prompt: "a men's blunt straight-across fringe at the eyebrows, short layered sides and back" },
  { id: 'highfade', g: 'm', zh: '高渐变', en: 'High fade',
    prompt: "a men's high fade: longer top about 5 cm with a sharp high fade rising from the neckline up to the crown" },
  { id: 'pompfade', g: 'm', zh: '油头渐变', en: 'Pompadour fade',
    prompt: "a men's pompadour with a tapered fade: high volume at the front combed back with fading sides" },
  { id: 'sideswept', g: 'm', zh: '侧背分', en: 'Swept-back side part',
    prompt: "a men's side-swept cut: a deep side part with the top swept back and short sides" },
  { id: 'rocker', g: 'm', zh: '摇滚长卷', en: 'Rocker waves',
    prompt: "a men's rocker long wavy cut: shoulder-length voluminous waves with a loose middle part" },
  { id: 'surfer', g: 'm', zh: '冲浪卷发', en: 'Surfer hair',
    prompt: "a men's surfer cut: sun-bleached messy waves on top and around the ears, longer at the back" },
  { id: 'curlym', g: 'm', zh: '男士卷发', en: 'Curly top',
    prompt: "a men's curly top with defined curls about 12 cm long, short tapered sides" },
  { id: 'bunm', g: 'm', zh: '男士低丸子', en: 'Low bun',
    prompt: "a men's low bun: medium-long hair gathered into a small bun at the nape, short hair at the sides" },
  { id: 'pompundercut', g: 'm', zh: '油头两侧推', en: 'Pompadour undercut',
    prompt: "a men's pompadour with an undercut: high combed-back top and very short shaved sides" },
  { id: 'hitop', g: 'm', zh: '高顶渐变', en: 'Hi-top fade',
    prompt: "a men's hi-top fade: flat square top about 9 cm with a crisp fade on the sides and back" },
  { id: 'tousle', g: 'm', zh: '凌乱自然', en: 'Tousled',
    prompt: "a men's tousled natural cut: messy short layers on top, neat sides and light texture" },
  { id: 'wavyshort', g: 'm', zh: '波浪短发', en: 'Short wavy',
    prompt: "a men's short wavy cut: soft waves on top about 7 cm, tapered sides" },
  { id: 'crewfade', g: 'm', zh: '板寸渐变', en: 'Crew fade',
    prompt: "a men's crew cut with a fade: short flat top about 3 cm with a smooth fade to the sides" },
  { id: 'pompside', g: 'm', zh: '侧分油头', en: 'Side-part pompadour',
    prompt: "a men's side-parted pompadour: a neat deep side part with volume on top and tapered sides" },
  { id: 'cropfade', g: 'm', zh: '碎盖渐变', en: 'Crop fade',
    prompt: "a men's textured crop with a mid fade: choppy short top about 4 cm, faded sides and nape" },
  { id: 'midfade', g: 'm', zh: '中渐变', en: 'Mid fade',
    prompt: "a men's mid fade: short textured top about 6 cm with a mid-height gradient on the sides" },
  { id: 'spikyfade', g: 'm', zh: '刺猬渐变', en: 'Spiky fade',
    prompt: "a men's spiky fade: short upright spikes about 4 cm on top, fading smoothly down the sides" },
  { id: 'brushed', g: 'm', zh: '背梳短发', en: 'Brushed back',
    prompt: "a men's brushed-back short cut: top about 9 cm combed straight back with a matte finish, sides short" },
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
  { id: 'bowlw', g: 'f', zh: '女士蘑菇头', en: 'Bowl cut',
    prompt: "a women's bowl cut: sleek rounded bob with a blunt full fringe, sides ending at the jaw" },
  { id: 'butterfly', g: 'f', zh: '蝴蝶剪', en: 'Butterfly cut',
    prompt: "a women's butterfly cut: short crown layers with feathered wings framing the face and a blunt length at the shoulder" },
  { id: 'jellyfish', g: 'f', zh: '水母剪', en: 'Jellyfish cut',
    prompt: "a women's jellyfish cut: short layered crown with the ends flipped outward into soft curved layers past the shoulder" },
  { id: 'mullet_f', g: 'f', zh: '女士鲻鱼头', en: 'Women\'s mullet',
    prompt: "a women's mullet: short choppy top and sides with longer tapered layers at the nape" },
  { id: 'shortpixie', g: 'f', zh: '短精灵', en: 'Short pixie',
    prompt: "a women's very short pixie cut: tousled crop about 4 cm on top with a tapered nape" },
  { id: 'buzzf', g: 'f', zh: '女士寸头', en: 'Women\'s buzz cut',
    prompt: "a women's buzz cut: very short even length about 1 cm all over" },
  { id: 'sidebang_long', g: 'f', zh: '侧分长刘海', en: 'Long side-swept fringe',
    prompt: "a women's long side-swept fringe with mid-length layers framing the face" },
  { id: 'bangs_full', g: 'f', zh: '齐刘海长发', en: 'Full blunt bangs',
    prompt: "a women's long hair with full blunt bangs straight across the brows, sleek ends at the shoulders" },
  { id: 'curly_bob', g: 'f', zh: '卷发短波波', en: 'Curly bob',
    prompt: "a women's curly bob: defined curls at chin length with volume through the crown" },
  { id: 'wavy_bob', g: 'f', zh: '波浪波波', en: 'Wavy bob',
    prompt: "a women's wavy bob with soft S-waves at chin length and a light side part" },
  { id: 'longbob', g: 'f', zh: '长波波', en: 'Long bob',
    prompt: "a women's long bob: collarbone-to-shoulder length with soft blunt ends and a middle part" },
  { id: 'mermaid', g: 'f', zh: '美人鱼卷', en: 'Mermaid waves',
    prompt: "a women's long mermaid waves: deep glamorous curls falling past the shoulders" },
  { id: 'space_bun', g: 'f', zh: '双丸子头', en: 'Space buns',
    prompt: "a women's double space-bun style: two small buns high on the head with loose strands framing the face" },
  { id: 'twist_updo', g: 'f', zh: '盘发', en: 'Twisted updo',
    prompt: "a women's twisted updo: hair swept into a neat twisted bun at the back of the crown with face-framing pieces" },
  { id: 'frenchbraid', g: 'f', zh: '法式编发', en: 'French braid',
    prompt: "a women's French braid: long hair braided tightly from the crown down the back with soft face-framing strands" },
  { id: 'cornrows', g: 'f', zh: '小辫', en: 'Cornrows',
    prompt: "a women's cornrows: neat braids close to the scalp that sweep back into longer plaits at the back" },
  { id: 'bantu', g: 'f', zh: '班图结', en: 'Bantu knots',
    prompt: "a women's Bantu knot style: small neat coiled knots arranged over the head" },
  { id: 'fishtail', g: 'f', zh: '鱼骨辫', en: 'Fishtail braid',
    prompt: "a women's fishtail braid: a full textured braid over one shoulder with a loose voluminous finish" },
  { id: 'sidepart_long', g: 'f', zh: '侧分长直', en: 'Long side part',
    prompt: "a women's long straight hair with a deep side part and smooth glossy ends past the shoulders" },
  { id: 'curtain_bob', g: 'f', zh: '八字刘海波波', en: 'Curtain bob',
    prompt: "a women's bob with parted curtain bangs sweeping to both sides and soft curled ends" },
  { id: 'pompadour_f', g: 'f', zh: '女士油头', en: 'Women\'s pompadour',
    prompt: "a women's vintage pompadour: high volume at the front combed back into soft waves" },
  { id: 'pixie_curl', g: 'f', zh: '卷精灵', en: 'Curly pixie',
    prompt: "a women's curly pixie cut: tight springy curls about 6 cm on top with a short tapered back" },
  { id: 'bun_low', g: 'f', zh: '低丸子', en: 'Low bun',
    prompt: "a women's low bun: hair gathered loosely into a bun at the nape with soft strands around the face" },
  { id: 'hair_wrap', g: 'f', zh: '发带盘发', en: 'Hair wrap',
    prompt: "a women's half-up hair wrap: the top section pulled into a soft wrap with the rest of the hair falling past the shoulders" },
  { id: 'crown_braid', g: 'f', zh: '皇冠辫', en: 'Crown braid',
    prompt: "a women's crown braid: a plaited braid wrapped around the head with the rest of the hair loose at the back" },
  { id: 'shag_long', g: 'f', zh: '长层次', en: 'Long shag',
    prompt: "a women's long shag: many layers down the length with a feathered finish to the ends" },
  { id: 'soft_waves', g: 'f', zh: '短波浪', en: 'Short soft waves',
    prompt: "a women's short soft wave cut: light waves at ear length with a tousled finish" },
  { id: 'sleek_bob', g: 'f', zh: '光泽波波', en: 'Sleek bob',
    prompt: "a women's sleek bob with a glossy finish at chin length and a side part" },
  { id: 'mini_bob', g: 'f', zh: '迷你波波', en: 'Mini bob',
    prompt: "a women's mini bob: very short rounded bob with a tidy neckline and a light fringe" },
  { id: 'bedhead', g: 'f', zh: '慵懒卷发', en: 'Bedhead curls',
    prompt: "a women's tousled bedhead curls: loose messy curls at shoulder length" },
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
