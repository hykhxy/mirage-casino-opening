/* =====================================================================
   对局：牌（比大小三局两胜）/ 枪（俄罗斯轮盘）/ 骰（猜大小三局两胜）
   结算：头头猫甩出红桃 K / A / 2 → 创造角色 / 世界观 / 图鉴
   依赖 index.html 主脚本中的全局：W H cover root el anim sleep sfx tone noise AC burst popText say hint
   rectL CLOCK mx my SCENE busy select FRAME_HOOKS LAYOUT_HOOKS DOWN_HOOKS applyAsset ease lerp clamp01 FACE buildDice
   ===================================================================== */
(() => {
'use strict';
const $i = id => document.getElementById(id);
const scDuel = $i('scDuel'), duelCam = $i('duelCam'), duelBox = $i('duelBox'), dCat = $i('dCat'), dCatSway = $i('dCatSway'), dCatInner = $i('dCatInner');
const dTalk = $i('dTalk'), dFelt = $i('dFelt'), dUi = $i('dUi'), dEyes = $i('dEyes'), dMouth = $i('dMouth'), dGunSpin = $i('dGunSpin'), dRed = $i('dRed');
const DLY = [...duelBox.querySelectorAll('.lyr')].map(e => [e, +e.dataset.d]);
const MOUTH_D = { x:50.7, y:34 };
const G = { mode:null, pose:'sit', nextBlink:0, blinkEnd:0, talkUntil:0, sq:null, tease:false, busy:false, going:false, finale:null, me:0, her:0 };
window.DUEL = G;

/* A duel owns its waits and callbacks. Leaving it invalidates every continuation. */
const RUN_CANCELLED = Symbol('duel cancelled');
let RUN = { active:true, waiters:new Set() };
function cancelRun(){
  RUN.active = false;
  for (const cancel of [...RUN.waiters]) cancel();
  RUN.waiters.clear();
}
function startRun(){ cancelRun(); RUN = { active:true, waiters:new Set() }; }
function guard(session, promise){
  return new Promise((resolve, reject) => {
    const cancel = () => { session.waiters.delete(cancel); reject(RUN_CANCELLED); };
    if (!session.active){ Promise.resolve(promise).catch(() => {}); cancel(); return; }
    session.waiters.add(cancel);
    Promise.resolve(promise).then(value => {
      session.waiters.delete(cancel);
      session.active ? resolve(value) : reject(RUN_CANCELLED);
    }, error => { session.waiters.delete(cancel); reject(session.active ? error : RUN_CANCELLED); });
  });
}
function after(fn){ const session = RUN; return (...args) => { if (session.active) return fn(...args); }; }
function ignoreAnimationCancel(error){ if (error?.name !== 'AbortError') throw error; }

/* Return directly to the three-object table, without replaying video/loading. */
const changeRuleBtn = $i('changeRuleBtn');
FRAME_HOOKS.push(() => changeRuleBtn.classList.toggle('off', SCENE !== 'duel' || !G.mode));
changeRuleBtn.addEventListener('pointerdown', e => e.stopPropagation());
changeRuleBtn.addEventListener('click', e => {
  e.stopPropagation();
  if (SCENE !== 'duel' || !G.mode) return;
  cancelRun();
  if (G.sq){ G.sq.done = true; G.sq.off(); G.sq.hand.remove(); G.sq = null; }
  for (const scene of [scDuel, el.scTop]){
    scene.getAnimations({ subtree:true }).forEach(a => a.cancel());
  }
  el.blink.getAnimations().forEach(a => a.cancel()); el.blink.style.opacity = '0';
  scDuel.classList.add('off'); scDuel.classList.remove('gun');
  dFelt.replaceChildren(); dUi.replaceChildren();
  dTalk.querySelectorAll('.bub,.lead,.leadDot').forEach(b => b.remove());
  dTalk.querySelector('svg').replaceChildren();
  dGunSpin.classList.remove('on', 'slow'); dRed.style.opacity = '0';
  duelCam.style.transform = ''; duelCam.style.filter = ''; duelCam.style.transformOrigin = '';
  Object.assign(G, { mode:null, pose:'sit', me:0, her:0, finale:null, tease:false, busy:false, going:false, talkUntil:0 });
  selected = null; busy = false;
  el.scTop.style.transform = ''; el.scTop.style.filter = ''; el.scTop.style.transformOrigin = '';
  el.topTilt.style.transform = ''; el.topTilt.style.filter = '';
  placeTopStatic(); finalizeRest();
  $i('bdCard').dataset.f = '0';
  Object.entries(ITEMS).forEach(([k, item]) => {
    item.style.opacity = '1'; item.style.filter = ''; item.classList.remove('hover');
    item.querySelector('.lift').style.transform = '';
    LBL[k].style.opacity = ''; LBL[k].classList.remove('hi'); LBL[k].classList.add('on');
    CG[k].classList.remove('on');
  });
  el.topTalk.querySelectorAll('.bub,.lead,.leadDot').forEach(b => b.remove());
  el.topTalk.querySelector('svg')?.replaceChildren();
  document.querySelectorAll('.scene').forEach(scene => scene.classList.toggle('off', scene !== el.scTop));
  SCENE = 'top'; parallaxOn = true; dustLevel = .22;
  changeRuleBtn.classList.add('off');
  sayTop({ t:'换个玩法？\n再挑一样吧。', x:15, y:11, v:1, size:3.6, rot:2 });
  hint('重 新 选 择 · 牌 ／ 枪 ／ 骰'); sfx.swish();
  el.scTop.tabIndex = -1; el.scTop.focus({ preventScroll:true });
});

let DB = { x:0, y:0, w:1, h:1 }, CW = 90;
const rnd = (a, b) => a + Math.random()*(b - a);
const pick = a => a[Math.floor(Math.random()*a.length)];
const mk = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

/* ---------------- 声音（追加） ---------------- */
const S2 = fn => (...a) => { if (AC) fn(AC.currentTime, ...a); };
const sx = {
  heart:S2(t => { tone(t, 60, .55, .16, 'sine', .004, 38); tone(t + .2, 52, .38, .2, 'sine', .004, 34); }),
  shot:S2((t, k = 1) => { noise(t, .55, 'lowpass', 5000, 260, .9*k, .002, .7); tone(t, 90, .85*k, .7, 'sine', .003, 28); noise(t + .04, 1.6, 'bandpass', 1400, 260, .14*k, .06); }),
  rattle:S2((t, dur = 1.4) => { const n = Math.floor(dur*18); for (let i = 0; i < n; i++){ const tt = t + i/18 + Math.random()*.03; noise(tt, .03, 'bandpass', 2400 + Math.random()*1800, 2100, .13, .001, 3); if (i % 3 === 0) tone(tt, 1700 + Math.random()*900, .03, .05, 'triangle', .001); } }),
  slam:S2(t => { tone(t, 120, .65, .32, 'sine', .004, 46); noise(t, .2, 'lowpass', 2200, 200, .45, .002); }),
  thwack:S2(t => { noise(t, .14, 'bandpass', 1000, 380, .55, .002, 1.5); tone(t, 240, .32, .16, 'triangle', .002, 90); }),
  load:S2(t => { noise(t, .03, 'highpass', 3000, 6000, .25, .001); tone(t + .02, 2600, .08, .06, 'square', .001, 1800); tone(t + .06, 900, .12, .08, 'triangle', .001, 500); }),
  win:S2(t => [523.3, 659.3, 784, 1046.5].forEach((f, i) => tone(t + i*.09, f, .09, 1.1, 'triangle', .01))),
  lose:S2(t => [392, 311.1, 261.6].forEach((f, i) => tone(t + i*.16, f, .08, .9, 'sine', .02))),
  deal:S2(t => { noise(t, .22, 'bandpass', 1600, 4200, .12, .02, 1.4); }),
  peel:S2((t, k = 1) => noise(t, .08, 'bandpass', 3000 + k*1500, 2400, .05, .01, 2)),
};

/* ---------------- 布局 ---------------- */
const vis = () => ({ L:Math.max(0, -DB.x/DB.w*100), R:Math.min(100, (W - DB.x)/DB.w*100) });
function vx(x){ const v = vis(); if (v.R - v.L > 88) return x; return v.L + 2 + x/100*(v.R - v.L - 22); }
const fx = f => W/2 + (f - .5)*Math.min(DB.w, W*1.1);       // 横向：以屏幕中心为基准
const fy = f => DB.y + DB.h*f;                                // 纵向：跟随桌面
function duelLayout(){
  DB = cover(duelBox, 16/9, 1.0);
  duelBox.style.setProperty('--bh', DB.h + 'px'); dTalk.style.setProperty('--bh', DB.h + 'px');
  CW = Math.min(W*.2, H*.15, DB.w*.075);
  dFelt.style.setProperty('--cw', CW + 'px');
  dFelt.style.setProperty('--chw', Math.min(W*.16, H*.15) + 'px');
  dFelt.style.setProperty('--cupw', Math.min(W*.3, H*.26) + 'px');
  dFelt.style.setProperty('--ds', Math.min(W*.075, H*.075) + 'px');
  dUi.style.setProperty('--cyw', Math.min(W*.3, H*.33) + 'px');
  dUi.style.setProperty('--pgw', Math.min(W*.62, H*1.05) + 'px');
  dUi.style.setProperty('--aimw', Math.min(W*.16, H*.2) + 'px');
  dUi.style.setProperty('--mz', Math.min(W*.22, H*.3) + 'px');
}
LAYOUT_HOOKS.push(duelLayout);

/* ---------------- 立绘：姿态 / 眨眼 / 说话 ---------------- */
function setPose(p){
  G.pose = p;
  dCatInner.querySelectorAll('.pose').forEach(i => i.classList.toggle('on', i.dataset.p === p));
  if (p !== 'sit'){ dEyes.style.opacity = 0; dMouth.style.opacity = 0; }
  anim(dCatInner, [{ translate:'0 0.6%', scale:'0.99' }, { translate:'0 0', scale:'1' }], { duration:520, easing:'cubic-bezier(.2,.8,.2,1)', composite:'add', fill:'none' });
}
function talk(s, big){
  const spec = Object.assign({ size:2.8, rot:0 }, s, { x:vx(s.x) });
  if (big) spec.big = 1;
  // 只保留上一句作淡影，更早的散去，免得画面拥挤
  dTalk.querySelectorAll('.bub.old,.lead.old,.leadDot.old').forEach(o => { o.style.transition = 'opacity .6s'; o.style.opacity = 0; setTimeout(after(() => o.remove()), 650); });
  const b = say(dTalk, spec, MOUTH_D);
  G.talkUntil = CLOCK + Math.min(2600, 300 + [...s.t].length*105);
  return b;
}
const T = (t, x, y, o = {}) => Object.assign({ t, x, y }, o);
function bump(k = 1){
  anim(dCatInner, [{ rotate:'0deg' }, { rotate:(-1.6*k) + 'deg' }, { rotate:(.8*k) + 'deg' }, { rotate:'0deg' }], { duration:620, easing:'ease-out', composite:'add', fill:'none' });
}
function shakeCat(dur = 1400, amp = 2.2){
  const kf = []; for (let i = 0; i <= 20; i++) kf.push({ rotate:(i % 2 ? amp : -amp)*(1 - i/24) + 'deg', translate:`${(i % 2 ? 1 : -1)*.4}% ${(i % 3) * -.25}%`, offset:i/20 });
  return anim(dCatInner, kf, { duration:dur, composite:'add', fill:'none' });
}

/* ---------------- 主循环钩子 ---------------- */
FRAME_HOOKS.push((now, dt) => {
  if (SCENE !== 'duel') return;
  for (const [e, d] of DLY) e.style.transform = `translate3d(${-mx*d}px,${-my*d*.55}px,0)`;
  dFelt.style.transform = `translate3d(${-mx*26}px,${-my*14}px,0)`;
  dCatSway.style.transform = `rotate(${Math.sin(now/2700)*.55}deg) translateY(${Math.sin(now/1900)*.28}%)`;
  if (G.pose === 'sit'){
    if (now > G.nextBlink){ G.blinkEnd = now + 130; G.nextBlink = now + (Math.random() < .2 ? 260 : 2400 + Math.random()*3600); }
    dEyes.style.opacity = now < G.blinkEnd ? 1 : 0;
    dMouth.style.opacity = now < G.talkUntil && (Math.floor(now/115) % 3 !== 2) ? 1 : 0;
  }
  if (G.sq) sqTick(dt);
});

/* ---------------- 点击：空白处 / 点她 → 她说话 ---------------- */
const TEASE = {
  card:[T('看牌，别看我。', 66, 14, { size:2.5, rot:3 }), T('手心出汗了哦？', 20, 20, { size:2.6, rot:-3 }), T('急什么，\n夜还长。', 70, 26, { v:1, size:2.6 })],
  gun:[T('别乱碰，\n会走火的。', 68, 12, { v:1, size:2.6 }), T('心跳好快呢。', 22, 18, { size:2.6, rot:-2 }), T('怕了？', 70, 30, { size:3.2, rot:5 })],
  dice:[T('听——\n骰子在笑。', 70, 14, { v:1, size:2.6 }), T('大小由天，\n输赢由我。', 18, 12, { v:1, size:2.6 }), T('盯着盅，\n别盯着我。', 68, 26, { v:1, size:2.4 })],
  fin:[T('挑一张嘛。', 66, 16, { size:2.6, rot:3 }), T('红桃Ｋ，是你。', 20, 16, { size:2.5, rot:-2 }), T('红桃Ａ，是这座城。', 64, 28, { size:2.4, rot:2 })],
};
let teaseI = 0;
DOWN_HOOKS.push(e => {
  if (SCENE !== 'duel') return false;
  if (e.target.closest('.pc.act,.dchip,#dCupW,.bl,.rc,#gAim,#gBul,button')) return false;
  const onCat = !!e.target.closest('#dCat');
  if (G.tease){
    const list = TEASE[G.finale ? 'fin' : G.mode] || TEASE.card;
    talk(list[teaseI++ % list.length]);
    if (onCat){ bump(); const r = rectL(dCat); burst(r.left + r.width*.5, r.top + r.height*.2, 10, 2); }
  }
  return true;
});

/* ---------------- 进入对局 ---------------- */
const NEED = {
  card:['ttSit', 'ttEyes', 'ttMouth', 'ttWin', 'ttPout', 'tnear', 'seat', 'cblank', 'cback', 'press', 'ck', 'ca', 'c2'],
  gun:['ttSit', 'ttEyes', 'ttMouth', 'ttGun', 'ttAim', 'ttWin', 'ttPout', 'tnear', 'gunroom', 'gun', 'cyl', 'bullet', 'povgun', 'cback', 'ck', 'ca', 'c2'],
  dice:['ttSit', 'ttEyes', 'ttMouth', 'ttDice', 'ttWin', 'ttPout', 'tnear', 'seat', 'cup', 'die', 'cback', 'ck', 'ca', 'c2'],
};
async function enterDuel(mode, how){
  const session = RUN;
  try {

  G.going = false; busy = false; G.mode = mode; G.me = G.her = 0; G.finale = null; G.tease = false;
  await guard(session, Promise.race([Promise.all(NEED[mode].map(k => applyAsset(k))), sleep(7000)]));
  duelLayout();
  scDuel.classList.toggle('gun', mode === 'gun');
  scDuel.style.setProperty('--duel-bg', mode === 'gun' ? 'var(--img-gunroom)' : 'var(--img-seat)');
  dFelt.innerHTML = ''; dUi.innerHTML = ''; dTalk.querySelectorAll('.bub').forEach(b => b.remove()); dTalk.querySelector('svg').innerHTML = '';
  setPose(mode === 'gun' ? 'gun' : mode === 'dice' ? 'dice' : 'sit');
  dGunSpin.classList.toggle('on', mode === 'gun');
  scDuel.classList.remove('off');
  SCENE = 'duel'; parallaxOn = true;
  el.scTop.classList.add('off'); el.scSeat.classList.add('off');
  el.scTop.style.transform = ''; el.topTilt.getAnimations().forEach(a => a.cancel());
  const from = how === 'zoom'
    ? { transform:'scale(1.35)', filter:'blur(14px) brightness(.2)' }
    : { transform:'translateY(-30%) rotateX(-32deg) scale(1.25)', filter:'blur(12px) brightness(.15)' };
  anim(duelCam, [from, { transform:'none', filter:'blur(0) brightness(1)' }], { duration:how === 'zoom' ? 1900 : 2300, easing:'cubic-bezier(.2,.7,.15,1)' }).finished.then(after(() => { duelCam.getAnimations().forEach(a => a.cancel()); }), ignoreAnimationCancel);
  anim(el.blink, [{ opacity:1 }, { opacity:0 }], { duration:1300, easing:'ease-out' });
  sfx.whoosh(); sfx.sit();
  dustLevel = .22;
  await guard(session, sleep(1500));
  G.tease = true;
  if (mode === 'card') cardGame(); else if (mode === 'gun') gunGame(); else diceGame();

  } catch (error) { if (error !== RUN_CANCELLED && error.name !== "AbortError") throw error; }
}

window.__enterDuel = (...args) => { startRun(); return enterDuel(...args); };   // 调试入口：__enterDuel('card'|'gun'|'dice', 'zoom'|'tilt')
/* 俯视桌面 → 对局：牌为「钻入牌面」，枪 / 骰为「视线由桌面抬起」 */
window.pickItem = async k => {
  if (G.going || SCENE !== 'top') return;
  startRun();

  const session = RUN;
  try {
  G.going = true;
  await guard(session, select(k));
  busy = true; hint('');
  await guard(session, sleep(k === 'card' ? 900 : 700));
  SCENE = 'leaving';
  if (k === 'card'){
    const r = rectL($i('bdCard')), ox = r.left + r.width/2, oy = r.top + r.height/2;
    el.scTop.style.transformOrigin = `${ox}px ${oy}px`;
    sfx.whoosh();
    anim(el.scTop, [{ transform:'scale(1)', filter:'blur(0) brightness(1)' }, { transform:'scale(4.2)', filter:'blur(6px) brightness(1.6)' }], { duration:1100, easing:'cubic-bezier(.6,0,.4,1)' });
    await guard(session, anim(el.blink, [{ opacity:0 }, { opacity:0, offset:.45 }, { opacity:1 }], { duration:1100, easing:'ease-in' }).finished);
  } else {
    if (k === 'gun'){ const b = $i('bdGun'); b.getAnimations().forEach(a => a.cancel()); anim(b, [{ transform:'rotateZ(0deg)' }, { transform:'rotateZ(-1440deg)' }], { duration:1300, easing:'cubic-bezier(.5,0,.3,1)' }); sfx.ratchet(24, 1.2); }
    sfx.whoosh();
    anim(el.topTilt, [{ transform:'none', filter:'none' }, { transform:'translateY(62%) rotateX(58deg) scale(1.15)', filter:'blur(10px) brightness(.25)' }], { duration:1300, easing:'cubic-bezier(.6,0,.35,1)' });
    await guard(session, anim(el.blink, [{ opacity:0 }, { opacity:0, offset:.5 }, { opacity:1 }], { duration:1300, easing:'ease-in' }).finished);
  }
  enterDuel(k, k === 'card' ? 'zoom' : 'tilt');

  } catch (error) { if (error !== RUN_CANCELLED && error.name !== "AbortError") throw error; }
};

/* ---------------- 通用：回合标、印章、比分 ---------------- */
function scoreUI(title, sub){
  const s = mk('div', '', `<div class="tl">${title}</div><div class="sub">${sub}</div><div class="mks"><div class="mk cur"></div><div class="mk"></div><div class="mk"></div></div>`);
  s.id = 'dScore'; dUi.appendChild(s); requestAnimationFrame(() => s.classList.add('on'));
}
function markRound(i, win){
  const m = dUi.querySelectorAll('.mk');
  if (m[i]){ m[i].classList.remove('cur'); m[i].classList.add(win ? 'w' : 'l'); m[i].textContent = win ? '胜' : '负'; }
  if (m[i + 1]) m[i + 1].classList.add('cur');
}
async function stamp(win){
  const session = RUN;
  try {

  const s = mk('div', win ? '' : 'l', win ? '胜' : '负'); s.id = 'dStamp'; dUi.appendChild(s);
  win ? sx.win() : sx.lose(); sfx.seal();
  await guard(session, anim(s, [{ opacity:0, transform:'scale(2.4) rotate(-18deg)', filter:'blur(8px)' }, { opacity:1, transform:'scale(1) rotate(-8deg)', filter:'blur(0)', offset:.22 },
    { opacity:1, transform:'scale(1) rotate(-8deg)', offset:.8 }, { opacity:0, transform:'scale(.9) rotate(-8deg) translateY(-20%)' }], { duration:1700, easing:'ease-out' }).finished);
  s.remove();

  } catch (error) { if (error !== RUN_CANCELLED && error.name !== "AbortError") throw error; }
}
async function banner(t, sub){
  const session = RUN;
  try {

  const b = mk('div', 'tot', t + (sub ? `<b style="display:block;font-size:.42em;letter-spacing:.6em;margin:.6em 0 0;text-align:center">${sub}</b>` : ''));
  b.style.cssText = `left:50%;top:40%;--fz:${Math.min(W*.09, H*.13)};text-align:center`;
  dUi.appendChild(b); sfx.shimmer();
  await guard(session, anim(b, [{ opacity:0, transform:'scale(1.3)', filter:'blur(10px)', letterSpacing:'.8em' }, { opacity:1, transform:'scale(1)', filter:'blur(0)', letterSpacing:'.2em', offset:.3 },
    { opacity:1, offset:.75 }, { opacity:0, transform:'scale(.96)', filter:'blur(6px)' }], { duration:1800, easing:'ease-out' }).finished);
  b.remove();

  } catch (error) { if (error !== RUN_CANCELLED && error.name !== "AbortError") throw error; }
}
function label(t, x, y, fz){
  const l = mk('div', 'tot', t); l.style.cssText = `left:${x}px;top:${y}px;--fz:${fz || Math.max(16, CW*.26)}`; dFelt.appendChild(l);
  anim(l, [{ opacity:0, transform:'translateY(10px)', filter:'blur(6px)' }, { opacity:1, transform:'none', filter:'blur(0)' }], { duration:600, easing:'ease-out' });
  return l;
}
function plan(){
  const win = Math.random() < .5;
  return { win, seq:pick(win ? [[1, 1], [1, 0, 1], [0, 1, 1]] : [[0, 0], [0, 1, 0], [1, 0, 0]]) };
}
const CN = ['一', '二', '三'];
const clearFelt = (ms = 500) => Promise.all([...dFelt.children].map(c => anim(c, [{ opacity:getComputedStyle(c).opacity }, { opacity:0 }], { duration:ms }).finished.then(after(() => c.remove()), ignoreAnimationCancel)));

/* =====================================================================
   一、牌 · 比大小
   ===================================================================== */
const SUITS = ['♠', '♥', '♣', '♦'];
const RN = { 11:'J', 12:'Q', 13:'K', 14:'A' };
const FACEC = { 11:'侍', 12:'后', 13:'王' };
function faceHTML(c){
  if (c.img) return '';
  const red = c.s === '♥' || c.s === '♦', cl = red ? 'red' : 'blk', lab = RN[c.r] || c.r;
  const ix = `<span class="ix ${cl}">${lab}<small>${c.s}</small></span><span class="ix b ${cl}">${lab}<small>${c.s}</small></span>`;
  const ct = FACEC[c.r] ? `<div class="ct face ${cl}">${FACEC[c.r]}<i>${c.s}</i></div>` : `<div class="ct ${cl}" ${c.r === 14 ? 'style="font-size:calc(var(--cw) * .72)"' : ''}>${c.s}</div>`;
  return `<div class="ring"></div>${ix}${ct}`;
}
function mkCard(c, x, y, o = {}){
  const e = mk('div', 'pc' + (o.fy ? ' fy' : '') + (o.cls ? ' ' + o.cls : ''),
    `<div class="pc-sh"></div><div class="pc-in"><div class="pc-b"></div><div class="pc-f"${c.img ? ` style="background-image:var(--img-${c.img})"` : ''}>${faceHTML(c)}</div><div class="gl2"></div></div>`);
  e.style.left = x + 'px'; e.style.top = y + 'px';
  if (o.w) e.style.setProperty('--cw', o.w + 'px');
  e._base = `rotateX(${o.tilt ?? 50}deg) rotateZ(${o.rz || 0}deg) scale(${o.sc || 1})`;
  e.style.transform = e._base; e._c = c;
  dFelt.appendChild(e);
  return e;
}
function flyIn(e, from, o = {}){
  const x = parseFloat(e.style.left), y = parseFloat(e.style.top), dx = from.x - x, dy = from.y - y, sp = o.spin ?? 720, arc = o.arc ?? H*.12;
  sx.deal();
  return anim(e, [
    { transform:`translate3d(${dx}px,${dy}px,${o.z0 ?? 160}px) rotateX(8deg) rotateZ(${sp}deg) scale(.45)`, opacity:0 },
    { opacity:1, offset:.1 },
    { transform:`translate3d(${dx*.45}px,${dy*.45 - arc}px,${(o.z0 ?? 160)*.6}px) rotateX(26deg) rotateZ(${sp*.35}deg) scale(.8)`, offset:.5 },
    { transform:`translate3d(0,0,14px) ${e._base}`, offset:.86 },
    { transform:`translate3d(0,0,0) ${e._base}`, opacity:1 }], { duration:o.dur || 820, delay:o.delay || 0, easing:'cubic-bezier(.25,.6,.3,1)', fill:'both' }).finished
    .then(after(() => { e.getAnimations().forEach(a => a.cancel()); e.style.transform = e._base; e.style.opacity = 1; }), ignoreAnimationCancel);
}
function flipY(e, to = 180, lift = 1){
  const inn = e.querySelector('.pc-in'); sfx.flutter(5);
  return anim(inn, [{ transform:'translateZ(0) rotateY(0deg)' }, { transform:`translateZ(${CW*.6*lift}px) rotateY(${to/2}deg) rotateZ(-4deg)`, offset:.5 }, { transform:`translateZ(0) rotateY(${to}deg)` }],
    { duration:760, easing:'cubic-bezier(.3,.6,.3,1)' }).finished.then(after(() => { inn.getAnimations().forEach(a => a.cancel()); inn.style.transform = `rotateY(${to}deg)`; }), ignoreAnimationCancel);
}
/* 咪牌：按住慢慢掀开（也可向上拖动加速） */
function squeeze(e){
  return new Promise(res => {
    e.classList.add('act', 'hot');
    let hand = $i('dPress');
    if (!hand){ hand = mk('img'); hand.id = 'dPress'; hand.alt = ''; hand.src = U.press || SRC.press[0]; hand.style.pointerEvents = 'none'; dUi.appendChild(hand); }
    const s = G.sq = { e, inn:e.querySelector('.pc-in'), p:0, hold:false, y0:0, dp:0, res, hand, r0:null, lastPeel:0 };
    const down = ev => {
      ev.stopPropagation(); if (s.done) return;
      s.pointerId = ev.pointerId; s.hold = true; s.y0 = ev.clientY; s.x0 = ev.clientX; s.dp = 0; s.r0 = s.r0 || rectL(e);
      try { e.setPointerCapture(ev.pointerId); } catch (_){}
      hint(''); sfx.pop();
    };
    const move = ev => { if (!s.hold) return; const a = toLocal(s.x0, s.y0), b = toLocal(ev.clientX, ev.clientY); s.dp = Math.max(0, (a.y - b.y)/(s.r0.height*1.6)); };
    const up = () => { s.hold = false; };
    e.addEventListener('pointerdown', down); e.addEventListener('pointermove', move); e.addEventListener('pointerup', up); e.addEventListener('pointercancel', up);
    s.off = () => { if (s.pointerId != null && e.hasPointerCapture(s.pointerId)) e.releasePointerCapture(s.pointerId); e.removeEventListener('pointerdown', down); e.removeEventListener('pointermove', move); e.removeEventListener('pointerup', up); e.removeEventListener('pointercancel', up); };
  });
}
function sqTick(dt){
  const s = G.sq; if (s.done) return;
  if (s.hold) s.p = Math.min(1, Math.max(s.p + dt/2300, s.p + s.dp*.08, s.dp));
  else if (s.p > 0) s.p = Math.max(0, s.p - dt/650);
  const p = s.p, e = s.e;
  s.inn.style.transform = `translateZ(${Math.sin(p*Math.PI)*CW*.55}px) rotateX(${-p*180}deg) rotateZ(${Math.sin(p*Math.PI)*-5}deg)`;
  if (p - s.lastPeel > .12){ s.lastPeel = p; sx.peel(p); } else if (p < s.lastPeel - .2) s.lastPeel = p;
  // 手：指尖（图中 0.54,0.21 实测）压在牌的下半部，随掀起的边上移
  const r = s.r0 || rectL(e), hw = r.width*2.7, hh = hw*1.5;
  const tipX = r.left + r.width*.52, tipY = r.top + r.height*(.58 - p*.7);
  s.hand.style.width = hw + 'px';
  s.hand.style.left = tipX - hw*.54 + 'px'; s.hand.style.top = tipY - hh*.21 + 'px';
  const show = s.hold || p > 0 ? 1 : 0;
  s.hand.style.opacity = show*(p < .62 ? 1 : Math.max(0, 1 - (p - .62)/.25));
  s.hand.style.transform = `scale(${s.hold ? .96 : 1}) rotate(${-4 + p*6}deg)`;
  if (p >= 1){
    s.done = true; s.off(); e.classList.remove('act', 'hot'); G.sq = null;
    s.inn.style.transform = 'rotateX(-180deg)'; s.hand.style.opacity = 0;
    const rr = rectL(e); burst(rr.left + rr.width/2, rr.top + rr.height/2, 26, 4); sfx.ting();
    anim(e, [{ filter:'brightness(1.8)' }, { filter:'brightness(1)' }], { duration:600 });
    s.res();
  }
}
function dealHands(want){
  for (;;){
    const deck = []; for (const s of SUITS) for (let r = 2; r <= 14; r++) deck.push({ r, s });
    const take = () => deck.splice(Math.floor(Math.random()*deck.length), 1)[0];
    const me = [take(), take()], her = [take(), take()];
    const a = me[0].r + me[1].r, b = her[0].r + her[1].r;
    if (a !== b && (a > b) === !!want) return { me, her, a, b };
  }
}
async function cardGame(){
  const session = RUN;
  try {

  const P = plan();
  scoreUI('比 大 小', '三局两胜');
  talk(T('比大小，\n三局两胜。', 70, 8, { v:1, size:3.4, rot:2 }));
  await guard(session, sleep(1300));
  talk(T('牌，由我来发——', 16, 14, { size:2.8, rot:-3 }));
  await guard(session, sleep(1300));
  talk(T('不许偷看我的手哦。', 62, 30, { size:2.2, rot:3, cls:'small' }));
  await guard(session, sleep(1100));
  let i = 0;
  while (G.me < 2 && G.her < 2){ await guard(session, cardRound(i, P.seq[i])); i++; }
  await guard(session, finale(G.me >= 2));

  } catch (error) { if (error !== RUN_CANCELLED && error.name !== "AbortError") throw error; }
}
async function cardRound(i, want){
  const session = RUN;
  try {

  await guard(session, banner(`第${CN[i]}局`));
  const h = dealHands(want);
  const from = { x:W/2 + CW*.3, y:fy(.5) };
  // 手机横屏时桌面被 cover 裁掉一截：牌位不得低于屏幕下沿
  const yMe = Math.min(fy(.87), H - CW*.95), yHer = Math.min(fy(.745), yMe - CW*1.15), gap = CW*.68;
  const me = [mkCard(h.me[0], W/2 - gap, yMe, { rz:-5 }), mkCard(h.me[1], W/2 + gap, yMe, { rz:4 })];
  const her = [mkCard(h.her[0], W/2 - gap*.62, yHer, { rz:3, sc:.66, fy:1 }), mkCard(h.her[1], W/2 + gap*.62, yHer, { rz:-4, sc:.66, fy:1 })];
  [me[0], her[0], me[1], her[1]].forEach(c => c.style.opacity = 0);
  bump(.6);
  talk(pick([T('接好。', 64, 12, { size:3.2, rot:4 }), T('看清楚了——', 18, 16, { size:2.8, rot:-2 }), T('这一局……', 66, 10, { size:3, rot:3 })]));
  await guard(session, Promise.all([flyIn(me[0], from, { spin:900 }), flyIn(her[0], from, { delay:260, spin:-540, arc:H*.04, z0:60 }), flyIn(me[1], from, { delay:520, spin:-720 }), flyIn(her[1], from, { delay:780, spin:540, arc:H*.04, z0:60 })]));
  hint('按 住 你 的 牌 · 慢 慢 掀 开');
  if (i === 0) setTimeout(after(() => talk(T('咪牌，\n要慢。', 72, 14, { v:1, size:2.8 }))), 600);
  await guard(session, squeeze(me[0]));
  talk(pick([T('嗯哼？', 66, 14, { size:3, rot:-4 }), T('表情别太明显哦。', 18, 20, { size:2.4, rot:2 }), T('还有一张。', 64, 26, { size:2.6, rot:3 })]));
  hint('再 掀 一 张');
  await guard(session, squeeze(me[1]));
  hint('');
  const lMe = label(`你 · <b>${h.a}</b>`, W/2 - gap - CW*1.3, yMe + CW*.2);
  await guard(session, sleep(500));
  talk(pick([T('该我了。', 66, 12, { size:3, rot:3 }), T('轮到我咯——', 18, 14, { size:2.8, rot:-3 })]));
  await guard(session, sleep(500));
  await guard(session, flipY(her[0])); await guard(session, sleep(240)); await guard(session, flipY(her[1]));
  const lHer = label(`头头猫 · <b>${h.b}</b>`, W/2 - gap*.62 - CW*1.25, yHer + CW*.15, Math.max(14, CW*.2));
  await guard(session, sleep(700));
  const win = h.a > h.b;
  if (win) G.me++; else G.her++;
  (win ? me : her).forEach(c => anim(c, [{ filter:'brightness(1) drop-shadow(0 0 0 #fc0)' }, { filter:'brightness(1.25) drop-shadow(0 0 14px #ffc860)' }], { duration:500, fill:'forwards' }));
  markRound(i, win);
  stamp(win);
  if (win){ setPose('pout'); talk(pick([T('哎呀……\n这把算你的。', 70, 10, { v:1, size:2.8 }), T('运气不错嘛，\n小客人。', 18, 10, { v:1, size:2.8 })])); }
  else { setPose('win'); talk(pick([T('嘻，我的。', 68, 12, { size:3.2, rot:4 }), T('手气还没热？', 18, 16, { size:2.8, rot:-3 })])); }
  await guard(session, sleep(2300));
  setPose('sit');
  await guard(session, clearFelt(450)); lMe.remove(); lHer.remove();

  } catch (error) { if (error !== RUN_CANCELLED && error.name !== "AbortError") throw error; }
}

/* =====================================================================
   二、枪 · 六膛
   ===================================================================== */
const CHAM = [[.498, .202], [.761, .37], [.76, .623], [.496, .76], [.237, .619], [.236, .368]];
async function gunGame(){
  const session = RUN;
  try {

  talk(T('这里，\n只有你和我。', 70, 8, { v:1, size:3.2, rot:2 }));
  sfx.ratchet(30, 3);
  await guard(session, sleep(1600));
  talk(T('规矩很简单——', 16, 16, { size:2.8, rot:-3 }));
  await guard(session, sleep(1400));
  talk(T('六个膛，\n装几颗，你来定。', 66, 24, { v:1, size:2.7, rot:2 }), 1);
  await guard(session, sleep(1300));
  // 她停下转枪，摊开掌心：弹巢递到面前
  dGunSpin.classList.add('slow');
  await guard(session, sleep(500));
  dGunSpin.classList.remove('on', 'slow');
  setPose('sit');
  const cw = mk('div', '', `<div class="halo3"></div><div id="gCyl"><img src="${U.cyl || SRC.cyl[0]}" alt="">${CHAM.map(([x, y]) => `<div class="ch" style="left:${x*100}%;top:${y*100}%"></div>`).join('')}</div>`);
  cw.id = 'gCylW'; dUi.appendChild(cw);
  const cyl = $i('gCyl');
  sfx.metal(.8);
  await guard(session, anim(cw, [{ opacity:0, transform:'translateY(-18%) scale(.4) rotateX(60deg)' }, { opacity:1, transform:'translateY(0) scale(1.05) rotateX(0deg)', offset:.7 }, { opacity:1, transform:'scale(1)' }], { duration:900, easing:'cubic-bezier(.2,.8,.2,1)', fill:'forwards' }).finished);
  anim(cyl, [{ rotate:'0deg' }, { rotate:'-360deg' }], { duration:9000, iterations:Infinity });
  const bw = mk('div', '', [1, 2, 3, 4, 5].map(n => `<div class="bl" data-n="${n}"><img src="${U.bullet || SRC.bullet[0]}" alt=""><i>${n}</i></div>`).join(''));
  bw.id = 'gBul'; dUi.appendChild(bw);
  const num = mk('div', ''); num.id = 'gNum'; dUi.appendChild(num);
  await guard(session, anim(bw, [{ opacity:0, transform:'translateY(30px)' }, { opacity:1, transform:'none' }], { duration:600, fill:'forwards' }).finished);
  bw.classList.add('on');
  talk(T('一到五，\n选吧。', 18, 12, { v:1, size:2.8 }));
  hint('选 择 装 填 几 发');
  const bls = [...bw.querySelectorAll('.bl')];
  const hl = n => { bls.forEach((b, j) => b.classList.toggle('hi', j < n)); num.style.opacity = n ? 1 : 0; num.textContent = n ? `装 ${n} 发 · 走火 ${n}/6` : ''; };
  bls.forEach(b => { b.onpointerenter = () => { hl(+b.dataset.n); sfx.pop(); }; });
  bw.onpointerleave = () => hl(0);
  const n = await guard(session, new Promise(r => { let chosen = false; bls.forEach(b => b.onclick = ev => { ev.stopPropagation(); if (chosen) return; chosen = true; bls.forEach(x => x.onclick = null); r(+b.dataset.n); }); }));
  bw.classList.remove('on'); hint(''); hl(n);
  talk(n >= 4 ? T(`${n}颗？\n……你疯了吗。`, 68, 10, { v:1, size:2.8 }) : n === 1 ? T('一颗？\n真谨慎。', 70, 12, { v:1, size:2.8 }) : T(`${n}颗，\n有意思。`, 70, 12, { v:1, size:2.8 }));
  // 装弹：子弹依次飞入弹膛
  const chs = [...cw.querySelectorAll('.ch')];
  cyl.getAnimations().forEach(a => a.pause());
  for (let j = 0; j < n; j++){
    const b = bls[j], br = rectL(b), cr = rectL(chs[j]);
    const fly = mk('img'); fly.src = b.querySelector('img').src; fly.style.cssText = `position:absolute;left:${br.left}px;top:${br.top}px;width:${br.width}px;z-index:8;pointer-events:none`;
    dUi.appendChild(fly); b.style.opacity = .15;
    const tx = cr.left + cr.width/2 - (br.left + br.width/2), ty = cr.top + cr.height/2 - (br.top + br.height/2);
    await guard(session, anim(fly, [{ transform:'none' }, { transform:`translate(${tx*.6}px,${ty*.6 - 40}px) rotate(-20deg) scale(.8)`, offset:.6 }, { transform:`translate(${tx}px,${ty}px) scale(.35)`, opacity:.2 }], { duration:420, easing:'cubic-bezier(.4,0,.3,1)' }).finished);
    fly.remove(); chs[j].classList.add('on'); sx.load();
  }
  await guard(session, anim(bw, [{ opacity:1 }, { opacity:0 }], { duration:400, fill:'forwards' }).finished); num.style.opacity = 0;
  talk(T('转一转——', 18, 18, { size:3, rot:-3 }));
  cyl.getAnimations().forEach(a => a.cancel());
  sfx.ratchet(36, 1.8);
  await guard(session, anim(cyl, [{ rotate:'0deg' }, { rotate:`${1440 + Math.floor(rnd(0, 6))*60}deg` }], { duration:1900, easing:'cubic-bezier(.15,.6,.2,1)', fill:'forwards' }).finished);
  sfx.click();
  await guard(session, anim(cw, [{ opacity:1, transform:'scale(1)' }, { opacity:0, transform:'translateY(10%) scale(.25)' }], { duration:520, easing:'cubic-bezier(.5,0,.6,1)', fill:'forwards' }).finished);
  cw.remove(); bw.remove(); num.remove();
  // 她瞄准你
  setPose('aim'); sfx.click();
  talk(T('别眨眼。', 70, 14, { size:3.2, rot:3 }), 1);
  const cr = rectL(dCat), mz = { x:cr.left + cr.width*.471, y:cr.top + cr.height*.706 };
  duelCam.style.transformOrigin = `${mz.x}px ${mz.y}px`;
  const push = anim(duelCam, [{ transform:'scale(1)' }, { transform:'scale(1.16)' }], { duration:3600, easing:'cubic-bezier(.3,0,.2,1)', fill:'forwards' });
  anim(dRed, [{ opacity:0 }, { opacity:.55 }, { opacity:.2 }, { opacity:.6 }, { opacity:.3 }], { duration:3600, fill:'forwards' });
  for (let j = 0; j < 4; j++){ sx.heart(); await guard(session, sleep(820 - j*90)); }
  await guard(session, push.finished);
  const fire = typeof window.__fire === 'boolean' ? window.__fire : Math.random() < n/6;   // __fire 仅供调试
  if (fire){
    const p = rectL(dCat), m2 = { x:p.left + p.width*.471, y:p.top + p.height*.706 };
    muzzle(m2.x, m2.y, 1.4); sx.shot(1);
    const f = mk('div'); f.id = 'gFlash'; f.style.setProperty('--fx', m2.x + 'px'); f.style.setProperty('--fy', m2.y + 'px'); dUi.appendChild(f);
    anim(f, [{ opacity:1 }, { opacity:0 }], { duration:900, easing:'ease-out' }).finished.then(after(() => f.remove()), ignoreAnimationCancel);
    crack(m2.x, m2.y);
    const sh = []; for (let j = 0; j <= 14; j++) sh.push({ transform:`scale(1.16) translate(${rnd(-14, 14)*(1 - j/14)}px,${rnd(-10, 10)*(1 - j/14)}px)` });
    anim(duelCam, sh, { duration:600, fill:'forwards' });
    anim(dRed, [{ opacity:1 }, { opacity:.85 }], { duration:500, fill:'forwards' });
    await guard(session, sleep(500));
    await guard(session, anim(el.blink, [{ opacity:0 }, { opacity:.92 }], { duration:700, fill:'forwards' }).finished);
    await guard(session, sleep(900));
    duelCam.getAnimations().forEach(a => a.cancel()); duelCam.style.transform = '';
    dRed.getAnimations().forEach(a => a.cancel()); dRed.style.opacity = .25;
    dUi.querySelectorAll('#gCrack').forEach(c => anim(c, [{ opacity:.9 }, { opacity:0 }], { duration:2400, fill:'forwards' }).finished.then(after(() => c.remove()), ignoreAnimationCancel));
    setPose('win');
    anim(el.blink, [{ opacity:.92 }, { opacity:0 }], { duration:1400 });
    talk(T('……放心，\n是橡胶弹。', 68, 8, { v:1, size:2.9 }));
    await guard(session, sleep(1800));
    talk(T('不过——\n你输了哦。', 16, 12, { v:1, size:3.2 }), 1);
    sx.lose();
    await guard(session, sleep(1800));
    anim(dRed, [{ opacity:.25 }, { opacity:0 }], { duration:1000, fill:'forwards' });
    await guard(session, finale(false));
  } else {
    sfx.click(); await guard(session, sleep(60)); sfx.click();
    popText('咔哒。', mz.x, mz.y - H*.05, -6);
    anim(dRed, [{ opacity:.6 }, { opacity:0 }], { duration:900, fill:'forwards' });
    await guard(session, sleep(900));
    anim(duelCam, [{ transform:'scale(1.16)' }, { transform:'scale(1)' }], { duration:900, easing:'cubic-bezier(.3,.7,.2,1)', fill:'forwards' }).finished.then(after(() => { duelCam.getAnimations().forEach(a => a.cancel()); }), ignoreAnimationCancel);
    setPose('pout');
    talk(T('……空、空膛？', 68, 10, { size:3, rot:4 }));
    await guard(session, sleep(1600));
    setPose('sit');
    talk(T('哼……\n轮到你了。', 18, 12, { v:1, size:3 }), 1);
    await guard(session, sleep(900));
    await guard(session, playerShoots());
  }

  } catch (error) { if (error !== RUN_CANCELLED && error.name !== "AbortError") throw error; }
}
function muzzle(x, y, k = 1){
  const m = mk('div', 'muz'); m.style.left = x + 'px'; m.style.top = y + 'px'; dUi.appendChild(m);
  anim(m, [{ transform:'scale(.2)', opacity:1 }, { transform:`scale(${k})`, opacity:1, offset:.25 }, { transform:`scale(${k*1.3})`, opacity:0 }], { duration:380, easing:'ease-out' }).finished.then(after(() => m.remove()), ignoreAnimationCancel);
  burst(x, y, 30, 7, .3);
}
function crack(x, y){
  const ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg'); svg.id = 'gCrack';
  let d = '';
  for (let i = 0; i < 14; i++){
    let a = i/14*Math.PI*2 + rnd(-.15, .15), px = x, py = y, len = rnd(.25, .6)*Math.max(W, H);
    d += `M${px},${py}`;
    for (let s = 0; s < 6; s++){ a += rnd(-.3, .3); px += Math.cos(a)*len/6; py += Math.sin(a)*len/6; d += ` L${px.toFixed(1)},${py.toFixed(1)}`; }
  }
  for (let r = 1; r <= 3; r++){ const rr = r*Math.min(W, H)*.06; d += ` M${x + rr},${y}`; for (let s = 1; s <= 12; s++){ const a = s/12*Math.PI*2; d += ` L${(x + Math.cos(a)*rr*rnd(.85, 1.15)).toFixed(1)},${(y + Math.sin(a)*rr*rnd(.85, 1.15)).toFixed(1)}`; } }
  const p = document.createElementNS(ns, 'path'); p.setAttribute('d', d); svg.appendChild(p); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  dUi.appendChild(svg);
  anim(svg, [{ opacity:0 }, { opacity:.9 }], { duration:120, fill:'forwards' });
}
async function playerShoots(){
  const session = RUN;
  try {

  // 你的手握枪从右下伸入
  const pg = mk('div', '', `<img src="${U.povgun || SRC.povgun[0]}" alt="">`); pg.id = 'gPov'; dUi.appendChild(pg);
  sfx.swish();
  await guard(session, anim(pg, [{ opacity:0, transform:'translate(40%,45%) rotate(14deg)' }, { opacity:1, transform:'none' }], { duration:900, easing:'cubic-bezier(.2,.8,.2,1)', fill:'forwards' }).finished);
  anim(pg, [{ transform:'translate(0,0) rotate(0deg)' }, { transform:'translate(0,-.6%) rotate(-.6deg)' }], { duration:2400, iterations:Infinity, direction:'alternate', easing:'ease-in-out', composite:'add' });
  // 橡胶弹
  const bw = mk('div', '', `<div class="bl hi" style="width:clamp(34px,4.4cqw,60px)"><img src="${U.bullet || SRC.bullet[0]}" alt=""><i>橡胶弹</i></div>`); bw.id = 'gBul';
  bw.style.left = '38%'; dUi.appendChild(bw);
  await guard(session, anim(bw, [{ opacity:0, transform:'translateY(30px)' }, { opacity:1, transform:'none' }], { duration:600, fill:'forwards' }).finished);
  bw.classList.add('on');
  hint('点 击 子 弹 · 装 填');
  talk(T('橡胶弹哦，\n别打脸。', 70, 12, { v:1, size:2.7 }));
  await guard(session, new Promise(r => bw.querySelector('.bl').onclick = ev => { ev.stopPropagation(); r(); }));
  hint(''); bw.classList.remove('on');
  const b = bw.querySelector('.bl'), br = rectL(b), gr = rectL(pg), tx = gr.left + gr.width*.47 - (br.left + br.width/2), ty = gr.top + gr.height*.22 - (br.top + br.height/2);
  await guard(session, anim(b, [{ transform:'none' }, { transform:`translate(${tx*.5}px,${ty*.5 - 50}px) rotate(40deg)`, offset:.55 }, { transform:`translate(${tx}px,${ty}px) rotate(90deg) scale(.3)`, opacity:0 }], { duration:560, easing:'cubic-bezier(.4,0,.3,1)', fill:'forwards' }).finished);
  bw.remove(); sx.load(); await guard(session, sleep(140)); sfx.ratchet(4, .25);
  anim(pg.querySelector('img'), [{ transform:'none' }, { transform:'rotate(-6deg) translate(1%,-2%)' }, { transform:'none' }], { duration:420, easing:'ease-out' });
  // 准星
  const cr = rectL(dCat), tgt = { x:cr.left + cr.width*.36, y:cr.top + cr.height*.5 };   // 瞄她的肩头
  const aim = mk('div'); aim.id = 'gAim'; aim.style.left = tgt.x + 'px'; aim.style.top = tgt.y + 'px'; aim.style.pointerEvents = 'auto'; dUi.appendChild(aim);
  anim(aim, [{ opacity:0, transform:'scale(2)' }, { opacity:1, transform:'scale(1)' }], { duration:500, fill:'forwards' });
  setPose('pout');
  talk(T('等、等一下——', 66, 10, { size:2.8, rot:5 }));
  hint('点 击 准 星 · 开 枪');
  await guard(session, new Promise(r => { aim.onclick = ev => { ev.stopPropagation(); r(); }; }));
  hint('');
  aim.remove();
  const g2 = rectL(pg), m = { x:g2.left + g2.width*.29, y:g2.top + g2.height*.168 };
  muzzle(m.x, m.y, .9); sx.shot(.7);
  anim(pg.querySelector('img'), [{ transform:'none' }, { transform:'rotate(-11deg) translate(3%,-3%)', offset:.15 }, { transform:'none' }], { duration:520, easing:'cubic-bezier(.2,.8,.2,1)' });
  const st = mk('div', 'streak'), ang = Math.atan2(tgt.y - m.y, tgt.x - m.x), len = Math.hypot(tgt.x - m.x, tgt.y - m.y);
  st.style.cssText = `left:${m.x}px;top:${m.y}px;width:${len}px;transform:rotate(${ang}rad)`; dUi.appendChild(st);
  await guard(session, anim(st, [{ clipPath:'inset(0 100% 0 0)', opacity:1 }, { clipPath:'inset(0 0 0 0)', opacity:1, offset:.6 }, { clipPath:'inset(0 0 0 100%)', opacity:0 }], { duration:220 }).finished);
  st.remove();
  sx.thwack(); burst(tgt.x, tgt.y, 40, 6); popText('啪！', tgt.x + W*.04, tgt.y - H*.08, 8);
  shakeCat(700, 3.2);
  anim(dCat, [{ filter:'brightness(1.8)' }, { filter:'none' }], { duration:400 });
  await guard(session, sleep(500));
  talk(T('呜——！', 68, 12, { size:4, rot:-5 }), 1);
  await guard(session, sleep(1300));
  talk(T('橡胶弹\n也很疼的好不好！', 16, 10, { v:1, size:2.7 }));
  await guard(session, sleep(1700));
  anim(pg, [{ opacity:1, transform:'none' }, { opacity:0, transform:'translate(40%,45%) rotate(14deg)' }], { duration:800, easing:'cubic-bezier(.5,0,.6,1)', fill:'forwards' }).finished.then(after(() => pg.remove()), ignoreAnimationCancel);
  await guard(session, finale(true));

  } catch (error) { if (error !== RUN_CANCELLED && error.name !== "AbortError") throw error; }
}

/* =====================================================================
   三、骰 · 猜大小（三局两胜）
   ===================================================================== */
async function diceGame(){
  const session = RUN;
  try {

  const P = plan();
  scoreUI('骰 盅', '三局两胜');
  talk(T('骰子，\n听天由命。', 70, 8, { v:1, size:3.2, rot:2 }));
  await guard(session, sleep(1400));
  talk(T('三颗骰——四到十是小，\n十一到十七是大。', 22, 20, { size:2.4, rot:-2 }));
  await guard(session, sleep(1900));
  let i = 0;
  while (G.me < 2 && G.her < 2){ await guard(session, diceRound(i, P.seq[i])); i++; }
  await guard(session, finale(G.me >= 2));

  } catch (error) { if (error !== RUN_CANCELLED && error.name !== "AbortError") throw error; }
}
function rollFor(big){
  for (;;){ const d = [0, 0, 0].map(() => 1 + Math.floor(Math.random()*6)); const s = d[0] + d[1] + d[2]; if (d[0] === d[1] && d[1] === d[2]) continue; if ((s >= 11) === big) return { d, s }; }
}
async function diceRound(i, want){
  const session = RUN;
  try {

  await guard(session, banner(`第${CN[i]}局`));
  setPose('dice');
  talk(pick([T('听好了——', 68, 10, { size:3, rot:3 }), T('摇咯～', 66, 14, { size:3.4, rot:-3 })]));
  sx.rattle(1.5); await guard(session, shakeCat(1500, 2.4).finished);
  // 落盅
  setPose('sit');
  const cupW0 = parseFloat(getComputedStyle(dFelt).getPropertyValue('--cupw')) || 200;
  const cx = W/2, cy = Math.min(fy(.86), H - cupW0*.42);
  const cup = mk('div', '', `<div class="halo2"></div><img src="${U.cup || SRC.cup[0]}" alt="">`); cup.id = 'dCupW'; cup.style.left = cx + 'px'; cup.style.top = cy + 'px';
  dFelt.appendChild(cup);
  await guard(session, anim(cup, [{ opacity:0, transform:`translate(0,${fy(.5) - cy}px) scale(.5)` }, { opacity:1, transform:'translate(0,-6%) scale(1.02)', offset:.75 }, { opacity:1, transform:'none' }], { duration:650, easing:'cubic-bezier(.5,0,.6,1)', fill:'forwards' }).finished);
  sx.slam(); burst(cx, cy, 16, 3, .2);
  anim(duelCam, [{ transform:'translateY(0)' }, { transform:'translateY(.5%)' }, { transform:'translateY(0)' }], { duration:220 });
  talk(T('买定离手——\n大，还是小？', 70, 10, { v:1, size:2.8 }), 1);
  // 筹码
  const cupW = parseFloat(getComputedStyle(dFelt).getPropertyValue('--cupw')) || 200;
  const mkChip = (t, s, x, cls) => { const c = mk('div', 'dchip ' + cls, `<b>${t}</b><small>${s}</small>`); c.style.left = x + 'px'; c.style.top = cy - cupW*.25 + 'px'; dFelt.appendChild(c);
    anim(c, [{ opacity:0, transform:'translateY(40%) scale(.6)' }, { opacity:1, transform:'none' }], { duration:500, easing:'cubic-bezier(.3,1.5,.5,1)' }); return c; };
  const cS = mkChip('小', '四 至 十', cx - cupW*.95, 'blk'), cB = mkChip('大', '十一至十七', cx + cupW*.95, '');
  hint('押 大 · 还 是 押 小');
  const guess = await guard(session, new Promise(r => { cS.onclick = ev => { ev.stopPropagation(); r('small'); }; cB.onclick = ev => { ev.stopPropagation(); r('big'); }; }));
  hint(''); sfx.metal(.5);
  const mine = guess === 'big' ? cB : cS, other = guess === 'big' ? cS : cB;
  mine.classList.add('pick'); other.classList.add('dim'); mine.onclick = other.onclick = null;
  talk(pick(guess === 'big' ? [T('押大？\n胆子不小。', 18, 12, { v:1, size:2.8 }), T('大……嗯哼。', 68, 14, { size:3, rot:3 })] : [T('押小？\n这么稳。', 18, 12, { v:1, size:2.8 }), T('小……真乖。', 68, 14, { size:3, rot:3 })]));
  const roll = rollFor(want ? guess === 'big' : guess !== 'big');
  // 骰子（盅下）
  const pl = mk('div', 'dplane'); pl.style.left = cx + 'px'; pl.style.top = cy - cupW*.18 + 'px'; pl.style.transform = 'rotateX(52deg)';
  const ds = parseFloat(getComputedStyle(dFelt).getPropertyValue('--ds')) || 50;
  const OFF = [[-ds*.75, -ds*.35, -14], [ds*.72, -ds*.45, 21], [ds*.05, ds*.6, -4]];
  pl.innerHTML = OFF.map(() => '<div class="dsh"></div><div class="die"></div>').join('');
  pl.style.opacity = 0; dFelt.insertBefore(pl, cup);
  buildDice();
  const dice = [...pl.querySelectorAll('.die')], shs = [...pl.querySelectorAll('.dsh')];
  dice.forEach((d, j) => { const [ox, oy, rz] = OFF[j], [ax, ay] = FACE[roll.d[j]];
    d.style.left = `calc(var(--ds) * -.5 + ${ox}px)`; d.style.top = `calc(var(--ds) * -.5 + ${oy}px)`;
    d._fin = `translateZ(calc(var(--ds) * .5)) rotateZ(${rz}deg) rotateX(${ax}deg) rotateY(${ay}deg)`; d.style.transform = d._fin;
    shs[j].style.left = ox + 'px'; shs[j].style.top = oy + 'px'; shs[j].style.position = 'absolute'; });
  // 掀盅
  await guard(session, sleep(600));
  cup.classList.add('act');
  hint('点击骰盅或向上掀开 · 稍候自动开盅');
  // The landing fill-forwards used to override every drag transform.
  cup.getAnimations().forEach(a => a.cancel());
  cup.style.opacity = '1'; cup.style.transform = 'none';
  cup.setAttribute('role', 'button'); cup.tabIndex = 0;
  cup.setAttribute('aria-label', '开盅查看点数');
  await guard(session, new Promise(res => {
    let y0 = null, dy = 0, done = false, holding = false;
    const lift = () => {
      if (done) return; done = true;
      cup.classList.remove('act'); cup.tabIndex = -1;
      cup.onpointerdown = cup.onpointermove = cup.onpointerup = cup.onpointercancel = cup.onkeydown = cup.onclick = null;
      res();
    };
    cup.onpointerdown = ev => {
      ev.stopPropagation(); holding = true; dy = 0;
      y0 = toLocal(ev.clientX, ev.clientY).y;
      try { cup.setPointerCapture(ev.pointerId); } catch (_){}
      sfx.pop();
    };
    cup.onpointermove = ev => {
      if (y0 == null || done) return;
      dy = Math.max(0, y0 - toLocal(ev.clientX, ev.clientY).y);
      cup.style.transform = `translateY(${-dy}px) rotate(${-dy*.03}deg)`;
      pl.style.opacity = Math.min(1, dy/(cupW*.3));
      if (dy > cupW*.45) lift();
    };
    cup.onpointerup = ev => { ev.stopPropagation(); holding = false; lift(); };
    cup.onclick = ev => { ev.stopPropagation(); lift(); };
    cup.onkeydown = ev => { if (ev.key === 'Enter' || ev.key === ' '){ ev.preventDefault(); lift(); } };
    cup.onpointercancel = () => { holding = false; y0 = null; cup.style.transform = 'none'; pl.style.opacity = '0'; };
    sleep(2400).then(after(() => { if (!holding) lift(); else sleep(1800).then(after(lift), ignoreAnimationCancel); }), ignoreAnimationCancel);
  }));
  hint('');
  const cur = cup.style.transform || 'none';
  anim(cup, [{ transform:cur, opacity:1 }, { transform:'translate(-6%,-140%) rotate(-14deg) scale(.9)', opacity:0 }], { duration:700, easing:'cubic-bezier(.3,.6,.3,1)', fill:'forwards' });
  pl.style.opacity = 1;
  dice.forEach((d, j) => { anim(d, [{ transform:`${d._fin} rotateZ(14deg)` }, { transform:`${d._fin} rotateZ(-5deg)`, offset:.5 }, { transform:d._fin }], { duration:520, delay:j*70, easing:'ease-out' }); sfx.dice(.7); });
  sfx.ting();
  const pr = rectL(pl); burst(pr.left, pr.top, 20, 3);
  await guard(session, sleep(600));
  const big = roll.s >= 11, win = want ? true : false;
  const lab = label(`${roll.d.join(' · ')}　<b>${roll.s}</b> 点 · ${big ? '大' : '小'}`, cx, cy - cupW*.95, Math.max(18, CW*.3));
  await guard(session, sleep(900));
  if (win) G.me++; else G.her++;
  markRound(i, win); stamp(win);
  if (win){ setPose('pout'); talk(pick([T('……猜中了？', 68, 12, { size:3, rot:4 }), T('哼，\n这把让你。', 18, 12, { v:1, size:2.8 })])); }
  else { setPose('win'); talk(pick([T('可惜～\n天不帮你。', 68, 10, { v:1, size:2.8 }), T('嘻，盅里的\n是我的人。', 18, 10, { v:1, size:2.6 })])); }
  await guard(session, sleep(2300));
  setPose('sit');
  await guard(session, clearFelt(450)); lab.remove();

  } catch (error) { if (error !== RUN_CANCELLED && error.name !== "AbortError") throw error; }
}

/* =====================================================================
   结算：甩出红桃 K / A / 2
   ===================================================================== */
const FIN = [
  { img:'ck', t:'创造角色', s:'红桃 K', page:'create' },
  { img:'ca', t:'世界观', s:'红桃 A', page:'world' },
  { img:'c2', t:'角色图鉴', s:'红桃 2 · 百美夜宴', page:'catalog' },
];
async function finale(won){
  const session = RUN;
  try {

  G.finale = { won, cards:[], busy:true };
  hint('');
  await guard(session, clearFelt(400));
  dUi.querySelectorAll('#dScore').forEach(s => anim(s, [{ opacity:1 }, { opacity:0 }], { duration:600, fill:'forwards' }));
  if (won){
    setPose('pout'); sx.win();
    await guard(session, banner('你 赢 了', '头 头 猫 · 输'));
    talk(T('……不、不算！', 68, 10, { size:3.2, rot:4 }), 1); await guard(session, sleep(1500));
    talk(T('好吧好吧，\n愿赌服输。', 16, 12, { v:1, size:2.9 })); await guard(session, sleep(1600));
    setPose('sit');
    talk(T('赢家的奖励——\n接着。', 68, 22, { v:1, size:2.9 }));
  } else {
    setPose('win'); sx.lose();
    await guard(session, banner('你 输 了', '头 头 猫 · 胜'));
    talk(T('嘻，输给我，\n不丢人。', 68, 10, { v:1, size:2.9 })); await guard(session, sleep(1600));
    setPose('sit');
    talk(T('作为安慰——\n三张牌，送你。', 16, 12, { v:1, size:2.8 }), 1);
  }
  await guard(session, sleep(900));
  bump(1);
  const w = CW*1.3, gap = Math.min(w*1.55, W*.3), y = Math.min(fy(.8), H - w*1.45), from = { x:W/2, y:fy(.48) };
  const cards = FIN.map((f, i) => {
    const c = mkCard({ img:f.img }, W/2 + (i - 1)*gap, y + (i === 1 ? -w*.06 : 0), { fy:1, tilt:30, rz:(i - 1)*7, w, cls:'rc' });
    c.style.opacity = 0;
    const l = mk('div', 'rcl' + (f.page ? '' : ' mute'), `<b>${f.t}</b><small>${f.s}</small>`);
    l.style.left = W/2 + (i - 1)*gap + 'px'; l.style.top = y + w*.95 + 'px'; l.style.setProperty('--lf', Math.max(11, w*.12) + 'px'); dFelt.appendChild(l);
    c._lab = l; return c;
  });
  sfx.flutter(14);
  await guard(session, Promise.all(cards.map((c, i) => flyIn(c, from, { delay:i*180, spin:[-900, 720, 1080][i], arc:H*.2, dur:1000, z0:220 }))));
  cards.forEach((c, i) => {
    anim(c._lab, [{ opacity:0, transform:'translateY(8px)' }, { opacity:1, transform:'none' }], { duration:600, delay:i*140, fill:'forwards' });
    c.onclick = ev => { ev.stopPropagation(); pickFinal(i); };
    c.onpointerenter = () => { if (!G.finale.busy) sfx.pop(); };
  });
  G.finale.cards = cards;
  talk(T('翻开一张吧。', 66, 14, { size:3, rot:3 }));
  setTimeout(after(() => talk(T('红桃Ｋ是你，\n红桃Ａ是这座城。', 12, 16, { size:2.5, rot:-2 }))), 1300);
  hint('');
  G.finale.busy = false;

  } catch (error) { if (error !== RUN_CANCELLED && error.name !== "AbortError") throw error; }
}
async function pickFinal(i){
  const session = RUN;
  try {

  const F = G.finale; if (!F || F.busy) return;
  F.busy = true; hint('');
  const c = F.cards[i], f = FIN[i], inn = c.querySelector('.pc-in');
  const opened = c.dataset.open === '1';
  if (!opened){
    sfx.flutter(8); sfx.swish();
    inn.getAnimations().forEach(a => a.cancel());
    await guard(session, anim(inn, [{ transform:'translateZ(0) rotateY(0deg) rotateZ(0deg) scale(1)' }, { transform:`translateZ(${CW*1.4}px) rotateY(270deg) rotateZ(-200deg) scale(1.25)`, offset:.55 },
      { transform:'translateZ(0) rotateY(540deg) rotateZ(-360deg) scale(1)' }], { duration:1300, easing:'cubic-bezier(.3,.6,.25,1)' }).finished);
    inn.getAnimations().forEach(a => a.cancel()); inn.style.transform = 'rotateY(180deg)'; c.dataset.open = '1';
    const r = rectL(c); burst(r.left + r.width/2, r.top + r.height/2, 46, 6); sfx.shimmer();
    await guard(session, sleep(500));
  }
  if (!f.page){
    talk(T('图鉴……\n还在画呢。', 68, 10, { v:1, size:2.8 })); bump();
    await guard(session, sleep(1400));
    talk(T('下回再翻它吧。', 18, 18, { size:2.6, rot:-2 }));
    await guard(session, sleep(1200));
    await guard(session, flipBack(c));
    F.busy = false; hint('');
    return;
  }
  talk(i === 0 ? T('去吧，\n镜子在等你。', 68, 10, { v:1, size:2.8 }) : T('这座城的故事，\n长着呢。', 16, 12, { v:1, size:2.7 }));
  await guard(session, sleep(1100));
  // 视角钻入牌面 → 一黑 → 切换页面
  const r = rectL(c), ox = r.left + r.width/2, oy = r.top + r.height/2;
  duelCam.style.transformOrigin = `${ox}px ${oy}px`;
  sfx.whoosh();
  anim(duelCam, [{ transform:'scale(1)', filter:'blur(0) brightness(1)' }, { transform:'scale(5) rotate(-4deg)', filter:'blur(8px) brightness(1.7)' }], { duration:1200, easing:'cubic-bezier(.65,0,.35,1)', fill:'forwards' });
  await guard(session, anim(el.blink, [{ opacity:0 }, { opacity:0, offset:.4 }, { opacity:1 }], { duration:1200, easing:'ease-in', fill:'forwards' }).finished);
  SCENE = 'page';
  scDuel.classList.add('off');
  window.openPage(f.page);

  } catch (error) { if (error !== RUN_CANCELLED && error.name !== "AbortError") throw error; }
}
function flipBack(c){
  const inn = c.querySelector('.pc-in'); c.dataset.open = '0'; sfx.flutter(5);
  return anim(inn, [{ transform:'rotateY(180deg)' }, { transform:`translateZ(${CW*.5}px) rotateY(90deg)` }, { transform:'rotateY(0deg)' }], { duration:700, easing:'ease-in-out' }).finished
    .then(after(() => { inn.getAnimations().forEach(a => a.cancel()); inn.style.transform = ''; }), ignoreAnimationCancel);
}
/* 从页面返回牌桌 */
window.backToDuel = async () => {
  const session = RUN;
  try {

  duelCam.getAnimations().forEach(a => a.cancel()); duelCam.style.transform = ''; duelCam.style.transformOrigin = '';
  scDuel.classList.remove('off'); SCENE = 'duel';
  el.blink.getAnimations().forEach(a => a.cancel());
  anim(duelCam, [{ transform:'scale(1.3)', filter:'blur(12px) brightness(.3)' }, { transform:'none', filter:'none' }], { duration:1400, easing:'cubic-bezier(.2,.7,.2,1)' }).finished.then(after(() => duelCam.getAnimations().forEach(a => a.cancel())), ignoreAnimationCancel);
  anim(el.blink, [{ opacity:1 }, { opacity:0 }], { duration:1100 });
  setPose('sit');
  await guard(session, sleep(700));
  talk(pick([T('回来啦？', 66, 12, { size:3.2, rot:3 }), T('还想翻\n哪一张？', 18, 12, { v:1, size:2.8 })]));
  if (G.finale) G.finale.busy = false;
  hint('');

  } catch (error) { if (error !== RUN_CANCELLED && error.name !== "AbortError") throw error; }
};
})();
