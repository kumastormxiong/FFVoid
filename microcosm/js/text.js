// 剧本文本 · 中文 / English
// kind: v = 画师的录音（暖色书法），h = 提示（细体），s = 系统
export const T = {
  // ---------- 开场 ----------
  intro: [
    { zh: '孩子，当你听到这段录音时，我已经走远了。', en: 'Child, by the time you hear this, I will have gone far away.' },
    { zh: '年轻时我总说：等我看懂她的灵魂，再画她的眼睛。', en: 'When I was young I used to say: once I understand her soul, I will paint her eyes.' },
    { zh: '后来，我的眼睛先暗了。', en: 'Then my own eyes went dark first.' },
    { zh: '我把所有的光，都藏进了她的瞳孔里。桌上那副透镜，戴上它。', en: 'I hid all the light inside her pupils. The lens on the table — put it on.' },
  ],
  lens_pc: [{ zh: '透镜让世界可以伸缩。滚轮向前放大，向后缩小。', en: 'The lens lets the world stretch. Scroll forward to zoom in, back to zoom out.', k: 'h' }],
  lens_vr: [{ zh: '透镜让世界可以伸缩。双手按住侧握键向外拉开放大，向内合拢缩小。也可以推右摇杆。', en: 'The lens lets the world stretch. Hold both grips and pull apart to zoom in, push together to zoom out. Or use the right stick.', k: 'h' }],
  lens_touch: [{ zh: '透镜让世界可以伸缩。双指张开放大，捏合缩小。', en: 'The lens lets the world stretch. Spread two fingers to zoom in, pinch to zoom out.', k: 'h' }],
  lens_hint: [{ zh: '桌上那副双环透镜，正泛着微光。走近，握住它。', en: 'The twin-ring lens on the table is glowing faintly. Walk over and take it.', k: 'h' }],
  ember_to_lantern: [{ zh: '把这点余温放进桌上的提灯里。', en: 'Bring this warmth to the lantern on the table.', k: 'h' }],
  painting_sealed: [{ zh: '她的瞳孔被一层干涸的树脂封住了。需要一点温度。', en: 'Her pupil is sealed under dried resin. It needs a little warmth.', k: 'h' }],
  ember_hint: [{ zh: '她的眼角，还留着一点余温。', en: 'At the corner of her eye, a little warmth remains.' }],
  too_small: [{ zh: '太小了，指尖捏不住。用透镜把它放大，再握住它。', en: 'Too small to pinch. Magnify it with the lens, then take hold.', k: 'h' }],
  too_heavy: [{ zh: '纹丝不动。在这个尺度下，它太重了。', en: 'It will not budge. At this scale it is far too heavy.', k: 'h' }],
  ember_got: [{ zh: '握在手里的东西不会随世界伸缩。你在放大时握住它，它就留在那样的大小。', en: 'What you hold does not stretch with the world. Grab it while magnified, and it keeps that size.', k: 'h' }],
  lantern_unlit: [{ zh: '提灯的灯芯还在，只是没有火。', en: 'The wick is still there. It only lacks a flame.', k: 'h' }],
  lantern_lit: [{ zh: '灯亮了。把它举到她的眼前。', en: 'The lantern is lit. Raise it to her eye.' }],
  seal_melt: [
    { zh: '树脂化开了。她的瞳孔深处，有一片旋转的青色云海。', en: 'The resin melts. Deep in her pupil, a cyan sea of clouds is turning.' },
    { zh: '去吧。走进她的眼睛。', en: 'Go. Step into her eye.' },
  ],
  enter_hint: [{ zh: '对着她的瞳孔一直放大。', en: 'Keep zooming into her pupil.', k: 'h' }],
  gramophone: [{ zh: '留声机里只剩下沙沙的底噪，像炭笔在纸上走。', en: 'Only a soft crackle is left on the gramophone, like charcoal moving on paper.', k: 'h' }],
  jars: [{ zh: '六只空颜料罐。每找回一种颜色，就会有一只被装满。', en: 'Six empty pigment jars. Each colour you bring back will fill one.', k: 'h' }],

  // ---------- 第一界 虹膜发条群岛 ----------
  w1_enter: [
    { zh: '年轻时，我以为时间是精密的发条。只要算准每一颗齿轮，就能留住她的青春。', en: 'When I was young I thought time was precise clockwork. Count every gear right and I could keep her young.' },
    { zh: '直到那朵机械睡莲，冻在了时间的裂缝里。', en: 'Until that mechanical lotus froze inside a crack in time.' },
  ],
  lotus_frozen: [{ zh: '睡莲冻住了，花心里锁着什么。它需要一轮太阳——可这里的太阳，是一只黑色的瞳孔。', en: 'The lotus is frozen, something locked in its heart. It needs a sun — but the sun here is a black pupil.', k: 'h' }],
  pollen_hint: [{ zh: '花蕊顶端那粒花粉在发光。对着它放大。', en: 'The pollen grain at the tip of the stamen is glowing. Zoom into it.', k: 'h' }],
  lotus_small_sun: [{ zh: '冰面冒起白汽，但还不够。', en: 'The frost steams, but not enough.', k: 'h' }],
  lotus_thaw: [
    { zh: '冰化了。原来我锁住的从来不是时间，而是我自己。', en: 'The ice melts. It was never time I locked away. It was myself.' },
  ],
  bridge: [{ zh: '星盘桥合拢了。一只发条鸟衔来了什么。', en: 'The astrolabe bridge closes. A clockwork bird brings something.' }],
  key_got: [{ zh: '发条钥匙。它属于一头沉睡在深海里的鲸。', en: 'A winding key. It belongs to a whale asleep in a deep sea.' }],
  astrolabe: [{ zh: '三环星盘错开了，桥断成两截。', en: 'The three astrolabe rings are out of line; the bridge is broken in two.', k: 'h' }],

  // ---------- 第二界 花粉折纸森国 ----------
  w2_enter: [
    { zh: '她在病床上折了一千只纸鹤，和一只纸狐狸。', en: 'In her hospital bed she folded a thousand paper cranes, and one paper fox.' },
    { zh: '她说，纸做的森林虽然脆弱，却永远不会凋零。可没有雨，连纸也会干裂。', en: 'She said a paper forest is fragile, but never withers. Yet without rain, even paper cracks.' },
  ],
  tree_dry: [{ zh: '古树干裂了。它在等一场来自深海的雨。', en: 'The old tree is cracked and dry. It is waiting for rain from a deep sea.', k: 'h' }],
  fox_sleep: [{ zh: '火狐睡得很沉，尾巴上挂着一盏没点亮的纸灯笼。也许等树开花，它就会醒。', en: 'The fire fox sleeps deeply, an unlit paper lantern on its tail. Perhaps it will wake when the tree blooms.', k: 'h' }],
  dew_hint: [{ zh: '枯枝末端挂着一滴黑色的露珠。里面是海。', en: 'A black dewdrop hangs from the end of a dead branch. Inside it is a sea.', k: 'h' }],
  bloom: [{ zh: '雨落下来。纸鹤醒了，满树金花一层层展开。', en: 'The rain falls. The cranes wake; golden flowers unfold, fold by fold.' }],
  fox_wake: [{ zh: '火狐醒了，点亮了灯笼。纸灯笼，也可以是一颗太阳。', en: 'The fire fox wakes and lights the lantern. A paper lantern can be a sun, too.' }],
  lantern_hint: [{ zh: '把灯笼带回睡莲那里。握着它，双手合拢，离开这粒花粉。', en: 'Take the lantern back to the lotus. Hold it and zoom out of this pollen grain.', k: 'h' }],

  // ---------- 第三界 露珠浮世绘深海 ----------
  w3_enter: [
    { zh: '我曾独自航行在名为悔恨的海上。一滴眼泪有多重？', en: 'I once sailed alone on a sea called regret. How heavy is a single tear?' },
    { zh: '潜进去，你会发现里面沉着一整座鲸鱼神庙。', en: 'Dive in, and you will find a whole whale shrine sunk inside.' },
  ],
  boulder_hint: [{ zh: '退后一步看——当这片海变小，巨石也不过是一颗石子。', en: 'Step back and look — when this sea is small, the boulder is only a pebble.', k: 'h' }],
  spring_free: [{ zh: '泉眼涌出了水。一颗浮世绘水球浮了上来。', en: 'The spring gushes. A woodblock water orb rises.' }],
  orb_hint: [{ zh: '折纸古树在等雨。握着水球，退回上一层。', en: 'The paper tree is waiting for rain. Hold the orb and zoom back out one layer.', k: 'h' }],
  whale_lock: [{ zh: '鲸的额头上有一个锁孔，它在等一把发条钥匙。', en: 'There is a keyhole on the whale\'s brow. It is waiting for a winding key.', k: 'h' }],
  key_small: [{ zh: '钥匙太小了。让这片海缩小一些，钥匙就会显得大。', en: 'The key is too small. Let this sea shrink a little and the key will seem larger.', k: 'h' }],
  key_big: [{ zh: '钥匙太大了，插不进去。', en: 'The key is too large to fit.', k: 'h' }],
  key_fit: [{ zh: '刚刚好。', en: 'Just right.', k: 'h' }],
  whale_wake: [{ zh: '发条转动，巨鲸张开了嘴。夜光珍珠里，是光的尽头。', en: 'The clockwork turns; the whale opens its mouth. Inside the night pearl is the end of light.' }],
  pearl_hint: [{ zh: '对着鲸口中的夜光珍珠放大。', en: 'Zoom into the night pearl in the whale\'s mouth.', k: 'h' }],

  // ---------- 第四界 珍珠包豪斯晶格 ----------
  w4_enter: [
    { zh: '穿过虹膜、花粉与眼泪，你来到了物质与光的尽头。', en: 'Through iris, pollen and tear, you reach the end of matter and light.' },
    { zh: '这里的颜色被拆成纯粹的几何。把光路重新对齐，记忆的原点就会打开。', en: 'Here colour is broken into pure geometry. Realign the light, and the origin of memory will open.' },
  ],
  prism_hint: [{ zh: '转动棱镜，把光送进中央的画框。', en: 'Turn the prisms to send the light into the central frame.', k: 'h' }],
  two_beams: [{ zh: '还差黄色的光。它被那道裂缝挡住了。', en: 'Only the yellow light is missing. The rift is blocking it.' }],
  stitch_hint1: [{ zh: '画框里那幅素描中，有一座桥。从某个角度看过去，它刚好能横跨裂缝。', en: 'In the sketch inside the frame there is a bridge. Seen from the right angle, it spans the rift exactly.', k: 'h' }],
  stitch_hint2: [{ zh: '站在平台中央，稍微放大一点，再慢慢挪动你的头。', en: 'Stand at the centre of the platform, zoom in a little, then slowly move your head.', k: 'h' }],
  stitched: [{ zh: '看见，就是存在。', en: 'To be seen is to exist.' }],
  frame_open: [{ zh: '三束光汇进了画框。最后一层，在等你。', en: 'Three beams pour into the frame. The last layer is waiting.' }],

  // ---------- 第五界 记忆炭笔原点 ----------
  w5_enter: [
    { zh: '……这里，好像来过。', en: '…I have been here before.' },
    { zh: '原来宇宙的尽头，就是我落笔的起点。', en: 'So the end of the universe is where my brush first touched the paper.' },
    { zh: '一粒微尘里藏着整间画室，而整间画室，也不过是另一幅画里的一粒微尘。', en: 'A whole atelier hides in a speck of dust, and the atelier is only a speck in another painting.' },
  ],
  stool: [{ zh: '他不在这里。只剩他的笔，还停在半空。', en: 'He is not here. Only his brush remains, still hovering in the air.', k: 'h' }],
  brush_got: [
    { zh: '千界画笔。它吸饱了你一路带回的六种颜色。', en: 'The Brush of Myriad Worlds, soaked with the six colours you carried back.' },
    { zh: '替我画完最后一笔吧——点在她的眼睛上。', en: 'Finish the last stroke for me — touch it to her eye.' },
  ],
  dotted: [
    { zh: '她的眼睛里，是黄昏的画室。还有你。', en: 'In her eye: the atelier at dusk. And you.' },
    { zh: '走进去。', en: 'Step inside.' },
  ],
  // ---------- 终幕 ----------
  finale: [
    { zh: '她不是在看我。', en: 'She was never looking at me.' },
    { zh: '她一直在看——那个会来替她点睛的人。', en: 'She was always looking at the one who would come to paint her eyes.' },
    { zh: '看见，就是完成。', en: 'To see is to finish.' },
  ],
  endless: [{ zh: '无限缩放已解锁：六界首尾相连，你可以一直潜下去。', en: 'Endless zoom unlocked: the six worlds are joined end to end. Dive forever.', k: 's' }],
  saved: [{ zh: '进度已保存', en: 'Progress saved', k: 's' }],
};

export const WORLD_NAMES = [
  { zh: '暮光画室', en: 'The Twilight Atelier', style: { zh: '厚涂水粉', en: 'Gouache' } },
  { zh: '虹膜发条群岛', en: 'The Iris Clockwork Archipelago', style: { zh: '清线钢笔淡彩', en: 'Ligne Claire' } },
  { zh: '花粉折纸森国', en: 'The Origami Spore Forest', style: { zh: '和纸立体剪纸', en: 'Washi Pop-up' } },
  { zh: '露珠浮世绘深海', en: 'The Woodblock Abyss', style: { zh: '浮世绘与金缮', en: 'Ukiyo-e & Kintsugi' } },
  { zh: '珍珠包豪斯晶格', en: 'The Pearl Cyber-Loom', style: { zh: '包豪斯丝网印刷', en: 'Bauhaus Risograph' } },
  { zh: '记忆炭笔原点', en: 'The Charcoal Singularity', style: { zh: '动态炭笔素描', en: 'Living Charcoal' } },
];

export const PIGMENTS = [
  { c: '#D4A373', zh: '琥珀 · 黄昏', en: 'Amber · Dusk' },
  { c: '#72EFDD', zh: '天青 · 时间', en: 'Cyan · Time' },
  { c: '#2A9D8F', zh: '翡翠 · 纸林', en: 'Jade · Paper Forest' },
  { c: '#FFD166', zh: '金缮 · 悔恨', en: 'Kintsugi Gold · Regret' },
  { c: '#FF007F', zh: '品红 · 光', en: 'Magenta · Light' },
  { c: '#D62828', zh: '朱砂 · 落款', en: 'Vermilion · Seal' },
];

export const LABELS = {
  lens: { zh: '双环尺度透镜', en: 'Twin-ring Scale Lens' },
  ember: { zh: '眼角的余温', en: 'Ember at her eye' },
  lantern: { zh: '黄铜提灯', en: 'Brass lantern' },
  painting: { zh: '《凝视》（未点睛）', en: '"Gaze" (eyes unpainted)' },
  gramophone: { zh: '留声机', en: 'Gramophone' },
  jars: { zh: '颜料罐', en: 'Pigment jars' },
  lotus: { zh: '机械睡莲', en: 'Mechanical lotus' },
  astrolabe: { zh: '三环星盘桥', en: 'Astrolabe bridge' },
  key: { zh: '发条钥匙', en: 'Winding key' },
  tree: { zh: '千纸鹤古树', en: 'Crane tree' },
  fox: { zh: '朱砂折纸火狐', en: 'Paper fire fox' },
  plantern: { zh: '红纸灯笼', en: 'Paper lantern' },
  boulder: { zh: '镇海巨石', en: 'Sea-pinning boulder' },
  orb: { zh: '浮世绘水球', en: 'Woodblock water orb' },
  whale: { zh: '木雕巨鲸神庙', en: 'Carved whale shrine' },
  prism: { zh: '包豪斯棱镜', en: 'Bauhaus prism' },
  frame: { zh: '奇点画框', en: 'Singularity frame' },
  stool: { zh: '空着的凳子', en: 'Empty stool' },
  brush: { zh: '千界画笔', en: 'Brush of Myriad Worlds' },
  sketch: { zh: '素描《凝视》', en: 'Sketch of "Gaze"' },
};
