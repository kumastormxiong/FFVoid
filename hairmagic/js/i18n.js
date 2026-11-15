// HairMagic — tiny i18n layer. English is the default; Chinese can be switched on and is remembered.
const KEY = 'hm.lang';
let lang = 'en';
try {
  const s = localStorage.getItem(KEY);
  if (s === 'zh' || s === 'en') lang = s;
} catch {}

// key: [English, 中文]
const D = {
  // ---- document
  'doc.title': ['HairMagic', 'HairMagic · 发型魔镜'],
  'doc.desc': [
    'Take 3–5 selfies and try on 50 realistic AI hairstyles, random seeds, and keep everything by date.',
    '用手机拍 3–5 张头像，AI 真实感试发型：50 款发型、随机种子、按日期保存。',
  ],
  'brand.aria': ['HairMagic home', 'HairMagic 首页'],
  'lang.switch': ['中文', 'EN'],
  'lang.aria': ['Switch language to Chinese', '切换为 English'],
  'date.aria': ['Change date', '切换日期'],
  'date.today': ['Today', '今天'],

  // ---- empty state
  'empty.h1': ['Scan your head,<br />then try endless hairstyles.', '拍下你的头，<br />再换一万种发型。'],
  'empty.p': [
    'The front camera guides you through 3–5 angles: front, left, right, up and down. Photos stay on this phone, filed by date.',
    '前置摄像头会引导你拍 3–5 个角度：正面、左右侧、抬头、低头。照片只保存在这台手机上，按日期归档。',
  ],
  'empty.scan': ['Start head scan', '开始扫描头像'],
  'empty.pick': ['Choose from photos', '从相册选择'],

  // ---- stage
  'stage.base.alt': ['Original photo', '原始照片'],
  'stage.after.alt': ['New hairstyle', '新发型效果'],
  'stage.compare': ['Compare', '对比'],
  'stage.compare.title': ['Compare with original', '对比原图'],
  'stage.3d.title': ['3D Gaussian splat head', '3D 高斯泼溅头像'],
  'stage.save': ['Save', '保存'],
  'stage.save.title': ['Save image', '保存图片'],
  'stage.progress': ['Generating…', '正在生成…'],
  'angles.aria': ['Capture angles', '拍摄角度'],
  'angles.add': ['Add an angle', '补拍角度'],
  'retake': ['Retake today’s original photos', '重拍今天的原始照片'],

  // ---- angles / capture steps
  'angle.front': ['Front', '正面'],
  'angle.left': ['Left', '左侧'],
  'angle.right': ['Right', '右侧'],
  'angle.up': ['Up', '抬头'],
  'angle.down': ['Down', '低头'],
  'angle.other': ['Other', '其他'],
  'step.front': ['Face the camera and hold still', '正对镜头，保持不动'],
  'step.left': ['Slowly turn your face to the left of the screen', '脸慢慢转向画面左边'],
  'step.right': ['Slowly turn your face to the right of the screen', '脸慢慢转向画面右边'],
  'step.up': ['Lift your chin slightly', '下巴微微抬起'],
  'step.down': ['Tuck your chin slightly', '下巴微微收低'],
  'hint.front.yaw': ['Straighten your head and face the camera', '头摆正，正对镜头'],
  'hint.front.pitch': ['Level your chin, not up or down', '下巴放平，别抬也别低'],
  'hint.front.eyes': ['Head straight, eyes on the camera', '头摆正，眼睛看镜头'],
  'hint.side.over': ['Turned too far, come back a little', '转过头了，回来一点'],
  'hint.side.pitch': ['Level your chin and only turn your head', '下巴放平，只转头'],
  'hint.side.more': ['Turn a bit more (about 30°)', '再多转一点（约 30°）'],
  'hint.hold': ['Hold it…', '保持住…'],
  'hint.ud.less': ['A smaller movement is enough', '幅度小一点就好'],
  'hint.up.face': ['Face forward, only lift your chin', '脸朝前，只抬头'],
  'hint.down.face': ['Face forward, only lower your chin', '脸朝前，只低头'],
  'hint.up.more': ['Lift your chin a bit higher', '下巴再抬高一点'],
  'hint.down.more': ['Tuck your chin a bit lower', '下巴再收低一点'],

  // ---- capture overlay
  'cap.close': ['Close', '关闭'],
  'cap.starting': ['Starting camera…', '正在启动摄像头…'],
  'cap.loading': ['The face model loads on first use', '首次使用需要加载人脸模型'],
  'cap.import.title': ['Import from photos', '从相册导入'],
  'cap.shutter': ['Shoot manually', '手动拍摄'],
  'cap.done': ['Done', '完成'],
  'cap.optional': ['Optional', '可选'],
  'cap.alldone': ['All angles captured', '全部角度已拍好'],
  'cap.alldone.sub': ['Tap “Done” to start trying hairstyles', '点“完成”开始换发型'],
  'cap.noface': ['Fit your whole face in the middle of the frame', '把整张脸放进画面中间'],
  'cap.near': ['Too close, hold the phone farther away', '太近了，手机拿远一点'],
  'cap.far': ['Too far, move a bit closer', '太远了，靠近一点'],
  'cap.edge': ['Keep your head in the frame, move toward the center', '头别出画面，往中间挪一点'],
  'cap.top': ['Keep the top of your head in view: lower the phone or step back', '头顶要完整入画，手机放低一点或退后'],
  'cap.fail': ['Can’t open the camera', '无法打开摄像头'],
  'cap.fail.denied': [
    'Allow camera access in your browser settings, or import from photos (bottom left)',
    '请在浏览器设置里允许使用相机，或用左下角从相册导入',
  ],
  'cap.fail.other': ['You can import photos with the button at the bottom left', '可以用左下角从相册导入照片'],
  'cap.mirror.on': ['Mirror on', '镜像 开'],
  'cap.mirror.off': ['Mirror off', '镜像 关'],
  'cap.noface.toast': ['No face detected. Put your face inside the frame.', '没有检测到人脸，请把脸放进取景框'],
  'retake.confirm': [
    'Retaking replaces today’s original photos, and looks made from the replaced photos will be removed too. Continue?',
    '重拍会用新照片替换今天的原始照片，用被替换照片生成的造型也会一并清除。继续吗？',
  ],

  // ---- import
  'imp.detect': ['Detecting faces…', '正在识别人脸…'],
  'imp.ok': ['Imported {n}', '已导入 {n} 张'],
  'imp.dup': [', {n} skipped (duplicate angle)', '，{n} 张角度重复已跳过'],
  'imp.noface': [', {n} without a detectable face', '，{n} 张没识别到人脸'],
  'imp.none': [
    'No clear face found in the photos (profile turns beyond about 50° are not supported).',
    '没有在照片里找到清晰的人脸（侧脸别超过约 50°）',
  ],

  // ---- hair length
  'len.label': ['Current hair length', '当前发长'],
  'len.analyzing': ['Analyzing…', '分析中…'],
  'len.adjust': ['Adjust', '调整'],
  'len.estimating': ['Estimating…', '正在估算…'],
  'len.after': ['Estimated after you take photos', '拍照后自动估算'],
  'len.rough': [' · rough estimate, tap to adjust', ' · 粗估，点右侧校准'],
  'len.detail': ['top {t} · sides {s} · back {b} cm', '顶 {t} · 侧 {s} · 后 {b} cm'],
  'len.sheet.aria': ['Adjust current hair length', '调整当前发长'],
  'len.sheet.note': [
    'Estimated by AI from your front photo. You can correct it and the recommendations will follow.',
    'AI 根据正面照估算，可以手动修正，造型推荐会跟着变。',
  ],
  'len.src.vlm': [
    'Estimated by AI from your front photo. You can correct it and the recommendations will follow.',
    'AI 根据正面照估算的发长，可以手动修正，发型推荐会跟着变。',
  ],
  'len.src.manual': ['This is the length you set manually.', '这是你手动设置的发长。'],
  'len.src.geo': [
    'Estimated from photo geometry, so it may be off. Please correct it manually.',
    '根据照片几何估算，误差可能较大，建议手动修正。',
  ],
  'len.top': ['Top', '顶部'],
  'len.side': ['Sides', '两侧'],
  'len.back': ['Back', '后部'],
  'len.growth': ['Hair grows about 1.25 cm per month.', '头发平均每月长约 1.25 cm。'],
  'len.reanalyze': ['Re-estimate with AI', '重新 AI 估算'],
  'len.done': ['Done', '完成'],
  'len.reanalyzed': ['Hair length re-estimated', '已重新估算发长'],
  'len.n0': ['Buzz cut', '寸头'],
  'len.n1': ['Short', '短发'],
  'len.n2': ['Medium-short', '中短发'],
  'len.n3': ['Chin-length', '及颌'],
  'len.n4': ['Shoulder-length', '及肩'],
  'len.n5': ['Long', '长发'],
  'len.unknown': ['Unknown', '未知'],
  'zone.top': ['top', '顶部'],
  'zone.side': ['sides', '两侧'],
  'zone.back': ['back', '后部'],
  'svc.perm': ['perm', '烫发'],
  'svc.braid': ['braiding', '编发'],
  'svc.braidext': ['braiding / extensions', '编发/接发'],
  'svc.permcurl': ['perm / curling', '烫/卷发'],

  // ---- looks, styles
  'looks.title': ['Today’s looks', '今天的造型'],
  'looks.count': ['{n} sets', '{n} 组'],
  'looks.original': ['Original', '原图'],
  'looks.angles': ['{n} angles', '{n} 角度'],
  'looks.delete': ['Delete the look “{name}”?', '删除造型「{name}」？'],
  'line.aria': ['Hairstyle category', '发型类别'],
  'line.m': ['Men’s styles', '男士发型'],
  'line.f': ['Women’s styles', '女士发型'],
  'line.m.short': ['men’s', '男士'],
  'line.f.short': ['women’s', '女士'],
  'seg.aria': ['Style source', '造型来源'],
  'seg.now': ['Ready to cut', '现在可剪'],
  'seg.all': ['All 50 styles', '全部 50 款'],
  'seg.seed': ['Random seed', '随机种子'],
  'note.shape': [', {shape} picks marked ★', '，{shape}推荐款标 ★'],
  'note.now': [
    'With your current hair ({len}), these {n} {line} styles can be cut right now{shape}.',
    '按你现在的发长（{len}），{line}发型里这 {n} 款现在就能剪{shape}。',
  ],
  'note.estimating': ['Estimating your hair length…', '正在估算你的发长…'],
  'note.all': [
    'Styles that need growing out show roughly how many months (at {g} cm per month).',
    '需要留长的发型会标出大约要留几个月（按每月 {g} cm）。',
  ],
  'note.none': ['No matching styles. Try “All 50 styles”.', '没有匹配的发型，试试“全部 50 款”。'],
  'badge.rec': ['★ Pick', '★ 推荐'],
  'meta.grow': ['Grow out ~{n} mo', '需留发约 {n} 个月'],
  'meta.ok.svc': ['Ready now · needs {svc}', '现在可做 · 需{svc}'],
  'meta.ok': ['Ready to cut', '现在可剪'],
  'toast.grow': [
    '{name}: the {zone} needs about {need} cm, you have about {cur} cm. Roughly {n} months of growth.',
    '{name}：{zone}需要约 {need} cm，你现在约 {cur} cm，预计留发 {n} 个月',
  ],
  'shape.round': ['round-face', '圆脸'],
  'shape.long': ['long-face', '长脸'],
  'shape.square': ['square-face', '方脸'],
  'shape.heart': ['heart-face', '心形脸'],
  'shape.oval': ['oval-face', '鹅蛋脸'],

  // ---- seed
  'seed.label': ['Seed', '种子'],
  'seed.dice': ['New random seed', '换一个随机种子'],
  'seed.grow': ['Allow styles that need growing out', '允许需要留发的造型'],
  'seed.color': ['Random hair color', '随机发色'],
  'seed.needs': ['This length needs about {n} months of growth', '这个长度需要留发约 {n} 个月'],
  'seed.ok': ['You can cut this length right now', '现在就能剪出这个长度'],
  'seed.name': ['Seed #{n}', '种子 #{n}'],

  // ---- colors
  'color.title': ['Hair color', '发色'],
  'color.keep': ['Original', '原色'],

  // ---- options
  'opt.scope': ['Scope', '生成范围'],
  'opt.scope.one': ['Current angle', '当前角度'],
  'opt.scope.all': ['All angles', '全部角度'],
  'opt.quality': ['Quality', '画质'],
  'opt.quality.fast': ['Fast', '极速'],
  'opt.quality.hd': ['HD', '高清'],
  'opt.lock': ['Identity lock', '原貌锁定'],
  'opt.lock.desc': ['Keep facial features unchanged by AI', '保留五官不被 AI 改动'],

  // ---- generate
  'gen.btn': ['Generate look', '生成造型'],
  'gen.busy': ['Generating…', '生成中…'],
  'gen.photos.one': ['{n} photo', '{n} 张'],
  'gen.photos.other': ['{n} photos', '{n} 张'],
  'gen.progress.multi': ['Generating {i}/{n} · {angle}', '正在生成 {i}/{n} · {angle}'],
  'gen.progress.one': ['Generating your new hairstyle…', '正在生成新发型…'],
  'gen.hdquota': ['HD quota used up, switching to Fast mode', '高清额度用完了，自动改用极速模式'],
  'gen.lock': ['Identity lock: aligning features…', '原貌锁定：对齐五官…'],
  'gen.done': ['Generated {n} · {s}s', '已生成 {n} 张 · {s} 秒'],
  'gen.done.grow': [' · this style needs ~{m} months of growth', ' · 这个发型需留发约 {m} 个月'],

  // ---- archive, dates
  'archive.title': ['Archive', '档案'],
  'archive.desc': [
    'Every day’s photos and looks are kept on this device, by date.',
    '每天拍的头像和造型都按日期留在这台设备上。',
  ],
  'archive.empty': [
    'Nothing here yet. Tap “Scan” below to capture today’s photos.',
    '还没有记录。点下方“扫描”拍下今天的头像。',
  ],
  'archive.stats': ['{p} photos · {s} sets', '{p} 张头像 · {s} 组造型'],
  'archive.open': ['Open', '打开'],
  'archive.del': ['Delete this day', '删除这天'],
  'archive.del.confirm': ['Delete all photos and looks from {date}? This can’t be undone.', '删除 {date} 的全部头像和造型？此操作不可撤销。'],
  'dates.title': ['Choose date', '选择日期'],
  'dates.stats': ['{p} photos · {s} sets', '{p} 张头像 · {s} 组造型'],
  'nav.aria': ['Main navigation', '主导航'],
  'nav.looks': ['Looks', '造型'],
  'nav.scan': ['Scan', '扫描'],
  'nav.scan.aria': ['Scan head', '扫描头像'],
  'nav.archive': ['Archive', '档案'],
  'wk.0': ['Sun', '周日'],
  'wk.1': ['Mon', '周一'],
  'wk.2': ['Tue', '周二'],
  'wk.3': ['Wed', '周三'],
  'wk.4': ['Thu', '周四'],
  'wk.5': ['Fri', '周五'],
  'wk.6': ['Sat', '周六'],
  'mon.1': ['Jan', '1月'],
  'mon.2': ['Feb', '2月'],
  'mon.3': ['Mar', '3月'],
  'mon.4': ['Apr', '4月'],
  'mon.5': ['May', '5月'],
  'mon.6': ['Jun', '6月'],
  'mon.7': ['Jul', '7月'],
  'mon.8': ['Aug', '8月'],
  'mon.9': ['Sep', '9月'],
  'mon.10': ['Oct', '10月'],
  'mon.11': ['Nov', '11月'],
  'mon.12': ['Dec', '12月'],

  // ---- 3D
  'v3.close': ['Close', '关闭'],
  'v3.title': ['3D hairstyle', '3D 发型'],
  'v3.title.orig': ['3D head · original photos', '3D 头像 · 原图'],
  'v3.hint': ['Drag to rotate · pinch to zoom · two fingers to pan', '拖动旋转 · 双指缩放 · 双指平移'],
  'v3.spin': ['Auto-rotate', '自动旋转'],
  'v3.reset': ['Front', '正面'],
  'v3.train': ['Train 3D head', '开始训练 3D 头像'],
  'v3.retrain': ['Train again', '重新训练'],
  'v3.intro.n': ['Train a 3D head from these {n} angles', '用这组 {n} 个角度训练 3D 头像'],
  'v3.intro.1': ['Make a 3D head from this 1 photo', '用这 1 张照片生成 3D 头像'],
  'v3.intro.sub.n': [
    'All angles go into the 3D head network together; expression, gaze and head pose follow the front photo.',
    '所有角度一起送进 3D 人头重建网络，表情、眼神和姿态以正面照为准。',
  ],
  'v3.intro.sub.1': [
    'With a single angle the sides and the back of the head are guessed. Add more angles (or generate with “All angles”) for a more accurate model.',
    '只有一个角度时侧面和后脑是推测的。多拍几个角度（或用「全部角度」生成发型）会更准。',
  ],
  'v3.worker.on': [' The training node is online, about 1–3 minutes.', ' 训练节点在线，约 1–3 分钟。'],
  'v3.worker.off': [
    ' The training node is offline: the job will queue and start once your computer runs the training node.',
    ' 训练节点目前离线：任务会排队，等你的电脑开机运行训练节点后自动开始。',
  ],
  'v3.uploading': ['Uploading photos…', '正在上传照片…'],
  'v3.queuefull': ['The training queue is full, please try again later', '训练队列已满，请稍后再试'],
  'v3.uploadfail': ['Upload failed', '上传失败'],
  'v3.expired': ['The training job expired', '训练任务已过期'],
  'v3.expired.sub': ['Just start the training again', '重新开始训练即可'],
  'v3.downloading': ['Training finished, downloading the 3D model…', '训练完成，正在下载 3D 模型…'],
  'v3.failed': ['3D training failed', '3D 训练失败'],
  'v3.retry': ['Please try again', '请重试'],
  'v3.queue.ahead': ['Queued, {n} job(s) ahead of you', '排队中，前面还有 {n} 个任务'],
  'v3.queue.soon': ['The training node is about to start…', '训练节点即将开始…'],
  'v3.queue.wait': ['Queued, waiting for the training node to come online', '已排队，等待训练节点上线'],
  'v3.queue.sub': [
    'The training node is a GPU program on your computer; it picks up jobs automatically once it is running. You can close this page and check back later.',
    '训练节点是你电脑上的 GPU 程序，开机并运行后会自动接单。可以先关闭这个页面，稍后回来查看。',
  ],
  'v3.training': ['Training…', '训练中…'],
  'v3.loading': ['Loading the 3D model…', '正在载入 3D 模型…'],
  'v3.points': ['{n}k Gaussians', '{n}k 个高斯点'],
  'v3.loadfail': ['Couldn’t load the 3D model', '3D 模型载入失败'],
  'v3.loadfail.sub': ['This device may not support WebGL2', '这台设备可能不支持 WebGL2'],

  // ---- errors
  'err.quota': ['Today’s free AI quota is used up. It resets at {time}.', '今天的免费 AI 额度已用完，将在 {time} 重置'],
  'err.timeout': ['Generation timed out. Please retry, especially on a slow network.', '生成超时，网络较慢时请重试'],
  'err.network': ['Network connection failed. Check your network and retry.', '网络连接失败，请检查网络后重试'],
  'err.origin': ['Please open this app via ffvoid.com/hairmagic', '请通过 ffvoid.com/hairmagic 访问'],
  'err.generic': ['AI generation failed ({code}). Please retry.', 'AI 生成失败（{code}），请重试'],
  'err.unknown': ['unknown error', '未知错误'],
  'err.boot': ['Startup error: {m}', '启动出错：{m}'],
};

const subs = new Set();

export const getLang = () => lang;

export function t(key, vars) {
  const e = D[key];
  let s = e ? e[lang === 'zh' ? 1 : 0] : key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] === undefined ? m : vars[k]));
  return s;
}

/** Plural helper: uses key + ".one" / ".other" */
export const tn = (key, n, vars = {}) => t(key + (n === 1 ? '.one' : '.other'), { n, ...vars });

/** For data that carries its own bilingual strings: pick(en, zh). */
export const pick = (en, zh) => (lang === 'zh' ? zh : en);

export function applyStatic(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  root.querySelectorAll('[data-i18n-html]').forEach((el) => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(';').forEach((pair) => {
      const [attr, k] = pair.split(':');
      if (attr && k) el.setAttribute(attr.trim(), t(k.trim()));
    });
  });
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  document.title = t('doc.title');
  const m = document.querySelector('meta[name="description"]');
  if (m) m.setAttribute('content', t('doc.desc'));
}

export function setLang(l) {
  if (l !== 'zh' && l !== 'en') return;
  lang = l;
  try {
    localStorage.setItem(KEY, l);
  } catch {}
  applyStatic();
  subs.forEach((f) => {
    try {
      f();
    } catch (e) {
      console.warn(e);
    }
  });
}

export const onLangChange = (f) => subs.add(f);
