// 抓取与触碰：跨尺度锚定（手中物品保持物理尺寸，世界在它周围伸缩）
import * as THREE from 'three';

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _s = new THREE.Vector3(), _q = new THREE.Quaternion();

export class Item {
  constructor({ id, obj, radius, label, minR = 0.011, maxR = 0.42, center = null, grabbable = () => true, onGrab = null, onRelease = null, deny = null }) {
    Object.assign(this, { id, obj, radius, label, minR, maxR, center, grabbable, onGrab, onRelease, deny });
    this.held = null; this.fly = 0; this.flyFrom = new THREE.Vector3(); this.flyTo = new THREE.Vector3();
    this.active = true; obj.userData.item = this;
  }
  get physR() { this.obj.getWorldScale(_s); return this.radius * _s.x; }
  centerWorld(out) { if (this.center) return this.obj.localToWorld(out.copy(this.center)); return this.obj.getWorldPosition(out); }
  get worldObj() { let o = this.obj; while (o) { if (o.userData.world) return o.userData.world; o = o.parent; } return null; }
}

export class Touch {
  constructor({ id, obj, radius, label, onTouch, center = null, active = () => true }) {
    Object.assign(this, { id, obj, radius, label, onTouch, center, active });
  }
  get physR() { this.obj.getWorldScale(_s); return this.radius * _s.x; }
  centerWorld(out) { if (this.center) return this.obj.localToWorld(out.copy(this.center)); return this.obj.getWorldPosition(out); }
}

function visibleChain(o) { while (o) { if (!o.visible) return false; o = o.parent; } return true; }

export class Interact {
  constructor(ctx) {
    this.ctx = ctx; this.items = []; this.touches = [];
  }
  addItem(opts) { const it = new Item(opts); this.items.push(it); this.ctx.items[it.id] = it; return it; }
  addTouch(opts) { const t = new Touch(opts); this.touches.push(t); return t; }

  // 射线拾取：返回最近的物品或可触碰物
  pick(origin, dir, maxDist = 4, excludeHeld = true) {
    let best = null, bestD = maxDist;
    const test = (o, kind) => {
      if (kind === 'item' && (!o.active || (excludeHeld && o.held))) return;
      if (kind === 'touch' && !o.active()) return;
      if (!visibleChain(o.obj)) return;
      const r = Math.max(o.physR * 1.15, 0.025);
      o.centerWorld(_a);
      _b.copy(_a).sub(origin);
      const t = _b.dot(dir);
      if (t < 0 || t - r > bestD) return;
      const d2 = _b.lengthSq() - t * t;
      if (d2 > r * r) return;
      const hit = Math.max(0, t - Math.sqrt(Math.max(0, r * r - d2)));
      // 同距离时物品优先
      const score = hit + (kind === 'touch' ? 0.05 : 0);
      if (score < bestD) { bestD = score; best = { kind, target: o, dist: hit }; }
    };
    for (const it of this.items) test(it, 'item');
    for (const t of this.touches) test(t, 'touch');
    return best;
  }

  // 近距离（VR 手部）拾取
  near(pos, reach = 0.07) {
    let best = null, bestD = Infinity;
    for (const it of this.items) {
      if (!it.active || it.held || !visibleChain(it.obj)) continue;
      it.centerWorld(_a);
      const d = _a.distanceTo(pos) - Math.max(it.physR, 0.02);
      if (d < reach && d < bestD) { bestD = d; best = { kind: 'item', target: it, dist: d }; }
    }
    return best;
  }

  // 尝试抓取。返回 true/false；失败时给出原因
  grab(it, holder, { fly = true } = {}) {
    const story = this.ctx.story;
    if (!it.grabbable()) { if (it.deny) it.deny('locked'); return false; }
    const r = it.physR;
    if (r < it.minR) { story.say(it.denySmall || 'too_small', { cooldown: 6 }); this.ctx.audio.deny(); if (it.deny) it.deny('small'); return false; }
    if (r > it.maxR) { story.say(it.denyHeavy || 'too_heavy', { cooldown: 6 }); this.ctx.audio.deny(true); if (it.deny) it.deny('heavy'); this.wobble(it); return false; }
    holder.attach(it.obj);
    it.held = holder;
    if (fly) {
      it.fly = 1; it.flyFrom.copy(it.obj.position);
      // 让物品的中心飞到手心
      if (it.center) { _a.copy(it.center).multiplyScalar(it.obj.scale.x).applyQuaternion(it.obj.quaternion); it.flyTo.copy(_a).negate(); }
      else it.flyTo.set(0, 0, 0);
    }
    this.ctx.audio.grab();
    if (it.onGrab) it.onGrab(holder);
    this.ctx.story.emit('grab', it);
    return true;
  }

  release(it) {
    if (!it.held) return;
    const eng = this.ctx.engine;
    let target = eng.contextWorld;
    if (!eng.inside && eng.cur.isOpen()) {
      it.centerWorld(_a);
      if (_a.distanceTo(eng.bubbleCenter) < eng.bubbleRadius) target = eng.child;
    }
    target.group.attach(it.obj);
    it.held = null; it.fly = 0;
    this.ctx.audio.release();
    if (it.onRelease) it.onRelease(target);
    this.ctx.story.emit('release', { item: it, world: target });
  }

  wobble(it) { it.wob = 0.5; }

  update(dt) {
    for (const it of this.items) {
      if (it.held && it.fly > 0) {
        it.fly = Math.max(0, it.fly - dt * 5);
        const k = 1 - it.fly; const e = 1 - Math.pow(1 - k, 3);
        it.obj.position.lerpVectors(it.flyFrom, it.flyTo, e);
      }
      if (it.wob > 0) {
        it.wob -= dt;
        it.obj.rotation.z = Math.sin(it.wob * 50) * 0.04 * it.wob;
      }
    }
  }

  // 手中物品所处的世界语境
  contextOf(it) { return it.held ? this.ctx.engine.contextWorld : it.worldObj; }
}
