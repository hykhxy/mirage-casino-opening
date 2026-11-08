/* =====================================================================
   页面：创造角色（红桃 K）/ 世界观（红桃 A）
   ===================================================================== */
(() => {
'use strict';
const $i = id => document.getElementById(id);
const mk = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
function toast(t){ const e = mk('div', 'toast', esc(t)); app.appendChild(e); setTimeout(() => e.remove(), 2300); }
let CUR = null, PAGE_BUSY = false;

/* ---------------- 资料 ---------------- */
const RACES = [
  { n:'人族', d:'没有兽耳兽尾，却握着这座城大半的牌照与账本。精于算计，也最容易被筹码迷住双眼。' },
  { n:'九尾狐族', d:'修长狐耳、蓬松狐尾，泪痣与狐狸眼自带三分媚意。垄断贵宾厅厅主与首席公关，最会在推杯换盏间摸清豪客的底牌。' },
  { n:'银狼族', d:'灰银狼耳、垂地狼尾，冰蓝或琥珀金瞳。能听见二十米外的吞咽与脉搏；外冷内热、极重契约，多任风控、安保与德州扑克冷面牌手。' },
  { n:'波斯猫族', d:'三角猫耳、随心情勾绕的猫尾，手指柔若无骨。0.3 秒内完成花式洗牌、切牌与听骰辨位——中场与高额桌首席荷官的主力。' },
  { n:'垂耳兔族', d:'柔软垂耳与害羞时会颤动的绒球短尾。甜美外表下，是高压职场练出的察言观色：迎宾礼仪、角子机特使与演艺偶像。' },
  { n:'雪豹族', d:'高贵冷艳，带斑点的白色豹耳。多执掌超跑俱乐部、游艇会与私人拍卖行。' },
  { n:'金毛犬族', d:'忠诚热情、嗅觉无双。活跃于老城美食街、酒店管家部与戒赌社工一线。' },
  { n:'白鹿族', d:'温婉治愈，头顶细长鹿角。主理空中植物园、中草药水疗与心理脱敏诊所。' },
  { n:'夜鸮族', d:'昼伏夜出、过目不忘。掌控着天眼监控中心与精算数据库。' },
  { n:'龙角裔', d:'数量最为稀少，头顶晶莹龙角——九大博彩财团核心家族的掌权者与神秘继承人。' },
];
const TALENTS = [
  { k:'听', n:'听骰辨位', d:'凭盅内回响分辨落点；场子一吵就失灵' },
  { k:'千', n:'千手', d:'洗、切、发、换一气呵成；天眼之下不敢妄动' },
  { k:'记', n:'过目记牌', d:'记得住整副牌序——可惜连续洗牌机专克你' },
  { k:'读', n:'读心微表情', d:'看穿对手的犹豫与虚张声势，代价是偏头痛' },
  { k:'算', n:'精算直觉', d:'对赔率与庄家优势一清二楚，不被情绪裹挟' },
  { k:'止', n:'见好就收', d:'能在最高点起身离桌——这座城里最稀有的天赋' },
  { k:'运', n:'回光鸿运', d:'绝境时有小概率逆转，但它从不可靠' },
  { k:'盲', n:'天眼盲区', d:'熟知监控死角与夜鸮交班的那三十秒' },
  { k:'脉', n:'叠码人脉', d:'认识半个贵宾厅的厅主与叠码仔，也欠着他们人情' },
  { k:'嗅', n:'赌徒嗅觉', d:'嗅得出谁快要输红眼，也嗅得出陷阱' },
];
const JOBS = ['荷官', '职业牌手', '叠码仔', '贵宾厅公关', '天眼监控员', '精算师', '调查记者', '戒赌社工', '财阀继承人', '初来乍到的游客'];
const GENDERS = ['女', '男', '其他'];

/* =====================================================================
   创造角色
   ===================================================================== */
const KEY = 'ttm-character-v1';
const ST = { name:'', gender:'', genderX:'', age:'', job:'', race:-1, look:'', bg:'', talents:[], portrait:null };
function loadST(){ try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) Object.assign(ST, s); } catch (_){} }
function buildCreate(){
  const sc = $i('scCreate');
  sc.innerHTML = `
  <div class="pgBg"></div><div class="light"></div><div class="pgVig"></div>
  <button class="pgBtn pgBack" data-act="back">‹ 返回牌桌</button>
  <div class="crWrap">
    <div class="crLeft">
      <div class="mirror cin" data-d="0"><div class="mirIn" id="mirIn">
        <img id="pImg" alt="">
        <div class="ph" id="pPh"><svg viewBox="0 0 100 120"><path d="M50 10c13 0 22 10 22 24s-9 26-22 26-22-12-22-26 9-24 22-24zM12 118c2-28 18-44 38-44s36 16 38 44z" fill="none" stroke="#f0d8a6" stroke-width="1.5"/></svg><b>立 绘</b><span>点 击 或 拖 入 图 片</span></div>
        <div class="shine"></div>
      </div></div>
      <div class="upRow cin" data-d="1">
        <button class="pgBtn" data-act="local">本地上传</button>
        <button class="pgBtn" data-act="url">外链图片</button>
        <button class="pgBtn" data-act="clearP" title="移除立绘">移除</button>
        <input type="file" id="pFile" accept="image/*" hidden>
      </div>
      <div class="urlRow cin" id="urlRow" data-d="2"><input class="inp" id="pUrl" placeholder="https://… 图片外链"><button class="pgBtn" data-act="loadUrl">载入</button></div>
      <section class="avatarPicker cin" data-d="3"><div class="avatarHead"><b>选一张席间肖像</b><small>点击即用作头像</small></div><div class="avatarChoices">${(window.AVATAR_DATA||[]).map((a,i)=>`<button type="button" class="avatarChoice" data-avatar="${i}" aria-label="选择${esc(a.name)}头像" title="${esc(a.name)} · ${esc(a.source)}"><img loading="lazy" src="${esc(a.url)}" alt="${esc(a.name)}"><span>${esc(a.name)}</span></button>`).join('')}</div></section>
      <div class="whisper cin" data-d="3">「镜子不会骗人，小客人。」<br><span style="font-size:.7em;opacity:.7;letter-spacing:.4em">—— 头 头 猫</span></div>
    </div>
    <div class="crPanel" id="crPanel">
      <div class="crHead"><h2>命格装帧</h2><span>红 桃 K · 创 造 角 色</span></div>
      <div class="crBody">
        <div class="fd cin" data-d="1"><label>名字</label><input class="inp" id="fName" maxlength="24" placeholder="你在这座城里的名字"></div>
        <div class="fd cin" data-d="1"><label>年龄</label><input class="inp" id="fAge" maxlength="12" placeholder="例如 24"></div>
        <div class="fd cin" data-d="2"><label>性别</label><div class="chips" id="fGender">${GENDERS.map(g => `<button class="chip" data-v="${g}">${g}</button>`).join('')}</div>
          <input class="inp" id="fGenderX" maxlength="12" placeholder="自定义性别" style="display:none"></div>
        <div class="fd cin" data-d="2"><label>职业</label><input class="inp" id="fJob" maxlength="24" placeholder="输入或从下方挑选">
          <div class="chips" id="fJobs">${JOBS.map(j => `<button class="chip" data-v="${j}">${j}</button>`).join('')}</div></div>
        <div class="fd full cin" data-d="3"><label>种族<em id="raceName"></em></label>
          <div class="races" id="fRace">${RACES.map((r, i) => `<div class="race" data-i="${i}"><img data-src="race${i}" alt=""><b>${r.n}</b></div>`).join('')}</div>
          <div class="raceDesc" id="raceDesc">挑一个种族——人族，或九大兽耳娘亚种。</div></div>
        <div class="fd full cin" data-d="4"><label>赌运天赋<em id="talCnt">最多选 2 项</em></label>
          <div class="talents" id="fTal">${TALENTS.map((t, i) => `<div class="tal" data-i="${i}"><i><span>${t.k}</span></i><b>${t.n}</b><small>${t.d}</small></div>`).join('')}</div></div>
        <div class="fd full cin" data-d="5"><label>身材样貌</label><textarea class="inp" id="fLook" maxlength="600" placeholder="身高、身形、发色瞳色、耳尾特征、惯穿的衣服……"></textarea></div>
        <div class="fd full cin" data-d="6"><label>身份背景</label><textarea class="inp" id="fBg" maxlength="1200" placeholder="你为何来到新濠蜃楼城？欠着谁、等着谁、想赢回什么？"></textarea></div>
      </div>
      <div class="crFoot"><span class="st" id="saveSt"></span>
        <button class="pgBtn" data-act="save">保 存 设 定</button>
        <button class="pgBtn main" data-act="create">创 造 角 色</button></div>
    </div>
  </div>
  <div class="modal" id="crModal"><div class="mBox">
    <div class="mHead"><h3>角色设定</h3><div class="seal2">定</div></div>
    <div class="mBody" id="mBody"></div>
    <div class="mFoot"><button class="pgBtn" data-act="closeM">再改改</button><button class="pgBtn main" data-act="copy">一 键 复 制</button></div>
  </div></div>`;
  // 种族图
  sc.querySelectorAll('img[data-src]').forEach(i => { const k = i.dataset.src; if (U[k]) i.src = U[k]; else applyAsset(k); });
  // 事件
  sc.addEventListener('click', e => {
    const avatar=e.target.closest('[data-avatar]');if(avatar){const a=window.AVATAR_DATA[+avatar.dataset.avatar];ST.portrait={type:'url',src:a.url,name:a.name};syncUI();dirty();mirrorFlash();toast('头像已选：'+a.name);return;}
    const a = e.target.closest('[data-act]'); if (a) return act(a.dataset.act);
    const g = e.target.closest('#fGender .chip'); if (g){ ST.gender = g.dataset.v; syncUI(); sfx.pop(); return; }
    const j = e.target.closest('#fJobs .chip'); if (j){ ST.job = j.dataset.v; $i('fJob').value = ST.job; syncUI(); sfx.pop(); return; }
    const r = e.target.closest('.race'); if (r){ ST.race = +r.dataset.i; syncUI(); sfx.pop(); return; }
    const t = e.target.closest('.tal'); if (t){ const i = +t.dataset.i, k = ST.talents.indexOf(i);
      if (k >= 0) ST.talents.splice(k, 1); else { if (ST.talents.length >= 2) ST.talents.shift(); ST.talents.push(i); }
      syncUI(); sfx.pop(); return; }
    if (e.target.closest('#mirIn')) $i('pFile').click();
    if (e.target === $i('crModal')) act('closeM');
  });
  const bind = (id, key) => $i(id).addEventListener('input', e => { ST[key] = e.target.value; dirty(); });
  bind('fName', 'name'); bind('fAge', 'age'); bind('fLook', 'look'); bind('fBg', 'bg'); bind('fGenderX', 'genderX');
  $i('fJob').addEventListener('input', e => { ST.job = e.target.value; syncUI(); });
  $i('pFile').addEventListener('change', e => { const f = e.target.files[0]; if (f) readLocal(f); e.target.value = ''; });
  $i('pUrl').addEventListener('keydown', e => { if (e.key === 'Enter') act('loadUrl'); });
  const mir = $i('mirIn');
  ['dragenter', 'dragover'].forEach(t => mir.addEventListener(t, e => { e.preventDefault(); mir.classList.add('drag'); }));
  ['dragleave', 'drop'].forEach(t => mir.addEventListener(t, e => { e.preventDefault(); mir.classList.remove('drag'); }));
  mir.addEventListener('drop', e => { const f = e.dataTransfer.files[0]; if (f && f.type.startsWith('image/')) readLocal(f); });
  // 输入框内允许正常输入（全局禁用了选择）
  sc.querySelectorAll('.inp').forEach(i => i.addEventListener('pointerdown', e => e.stopPropagation()));
  // 镜面随鼠标微倾
  sc.addEventListener('pointermove', e => {
    if(MOBILE)return;
    const p = toLocal(e.clientX, e.clientY), dx = p.x/W - .5, dy = p.y/H - .5;
    sc.querySelector('.mirror').style.transform = `rotateY(${dx*10}deg) rotateX(${-dy*8}deg)`;
    $i('crPanel').style.transform = `rotateY(${dx*-3}deg) rotateX(${dy*2}deg)`;
  });
}
let dirtyT;
function dirty(){ $i('saveSt').textContent = '有 未 保 存 的 改 动'; clearTimeout(dirtyT); }
function syncUI(){
  $i('fName').value = ST.name; $i('fAge').value = ST.age; $i('fLook').value = ST.look; $i('fBg').value = ST.bg; $i('fGenderX').value = ST.genderX;
  if (document.activeElement !== $i('fJob')) $i('fJob').value = ST.job;
  document.querySelectorAll('#fGender .chip').forEach(c => c.classList.toggle('on', c.dataset.v === ST.gender));
  $i('fGenderX').style.display = ST.gender === '其他' ? '' : 'none';
  document.querySelectorAll('#fJobs .chip').forEach(c => c.classList.toggle('on', c.dataset.v === ST.job));
  document.querySelectorAll('#fRace .race').forEach(c => c.classList.toggle('on', +c.dataset.i === ST.race));
  $i('raceName').textContent = ST.race >= 0 ? RACES[ST.race].n : '';
  $i('raceDesc').textContent = ST.race >= 0 ? RACES[ST.race].d : '挑一个种族——人族，或九大兽耳娘亚种。';
  document.querySelectorAll('#fTal .tal').forEach(c => c.classList.toggle('on', ST.talents.includes(+c.dataset.i)));
  $i('talCnt').textContent = `已选 ${ST.talents.length} / 2`;
  document.querySelectorAll('.avatarChoice').forEach(c=>c.classList.toggle('selected',ST.portrait?.src===window.AVATAR_DATA?.[+c.dataset.avatar]?.url));
  const img = $i('pImg'), ph = $i('pPh');
  if (ST.portrait){ img.src = ST.portrait.src; img.classList.add('on'); ph.style.opacity = 0; } else { img.classList.remove('on'); img.removeAttribute('src'); ph.style.opacity = 1; }
  dirty();
}
function readLocal(f){
  if (f.size > 8*1024*1024) return toast('图片太大了（请小于 8MB）');
  const fr = new FileReader();
  fr.onload = () => {
    // 压缩到合适尺寸，便于本地保存
    const im = new Image();
    im.onload = () => {
      const s = Math.min(1, 900/Math.max(im.width, im.height)), c = document.createElement('canvas');
      c.width = Math.round(im.width*s); c.height = Math.round(im.height*s); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      let src; try { src = c.toDataURL('image/webp', .86); } catch (_){ src = fr.result; }
      ST.portrait = { type:'local', src, name:f.name }; syncUI(); mirrorFlash(); toast('立绘已载入');
    };
    im.onerror = () => toast('这张图片读不出来');
    im.src = fr.result;
  };
  fr.readAsDataURL(f);
}
function mirrorFlash(){ sfx.shimmer(); const r = rectL($i('mirIn')); burst(r.left + r.width/2, r.top + r.height/2, 36, 5); anim($i('mirIn'), [{ filter:'brightness(2)' }, { filter:'brightness(1)' }], { duration:900, fill:'none' }); }
function act(a){
  if (a === 'back') return leave();
  if (a === 'local') return $i('pFile').click();
  if (a === 'url'){ $i('urlRow').classList.toggle('on'); $i('pUrl').focus(); return; }
  if (a === 'clearP'){ ST.portrait = null; syncUI(); return; }
  if (a === 'loadUrl'){
    const u = $i('pUrl').value.trim();
    if (!/^https?:\/\//i.test(u)) return toast('请输入 http(s) 开头的图片外链');
    const im = new Image(); toast('正在载入外链……');
    im.onload = () => { ST.portrait = { type:'url', src:u }; syncUI(); mirrorFlash(); $i('urlRow').classList.remove('on'); toast('外链立绘已载入'); };
    im.onerror = () => toast('外链无法打开，换一个试试');
    im.src = u; return;
  }
  if (a === 'save') return save();
  if (a === 'create'){ save(true); showModal(); return; }
  if (a === 'closeM'){ $i('crModal').classList.remove('on'); return; }
  if (a === 'copy') return copyText();
}
function save(quiet){
  try { localStorage.setItem(KEY, JSON.stringify(ST)); }
  catch (_){
    try { localStorage.setItem(KEY, JSON.stringify(Object.assign({}, ST, { portrait:null }))); if (!quiet) toast('已保存（本地立绘过大，未一并保存）'); }
    catch (__){ if (!quiet) toast('保存失败：浏览器存储不可用'); return; }
  }
  $i('saveSt').textContent = '已 保 存 · ' + new Date().toLocaleTimeString().slice(0, 5);
  if (!quiet){ toast('设定已保存'); sfx.seal(); }
}
const FIELDS = () => [
  ['名字', ST.name], ['性别', ST.gender === '其他' ? (ST.genderX || '其他') : ST.gender], ['年龄', ST.age], ['种族', ST.race >= 0 ? RACES[ST.race].n : ''],
  ['职业', ST.job], ['赌运天赋', ST.talents.map(i => `${TALENTS[i].n}（${TALENTS[i].d}）`).join('\n')], ['身材样貌', ST.look], ['身份背景', ST.bg],
  ['立绘', ST.portrait ? (ST.portrait.type === 'url' ? ST.portrait.src : `本地图片${ST.portrait.name ? '「' + ST.portrait.name + '」' : ''}（不含在文本中）`) : ''],
];
function showModal(){
  const f = FIELDS();
  $i('mBody').innerHTML = `<div class="pt">${ST.portrait ? `<img src="${esc(ST.portrait.src)}" alt="">` : ''}<b>${esc(ST.name || '无名之客')}</b></div>` +
    f.filter(([k]) => k !== '名字').map(([k, v]) => `<dt>${k}</dt><dd class="${v ? '' : 'empty'}">${v ? esc(v) : '未填写'}</dd>`).join('');
  $i('crModal').classList.add('on'); sfx.shimmer(); sfx.seal();
}
function copyText(){
  const txt = '【新濠蜃楼城 · 角色设定】\n' + FIELDS().map(([k, v]) => `${k}：${v ? (String(v).includes('\n') ? '\n' + v : v) : '（未填写）'}`).join('\n');
  const ok = () => { toast('已复制全部设定'); sfx.ting(); };
  const fallback = () => { const t = document.createElement('textarea'); t.value = txt; t.style.cssText = 'position:fixed;left:-9999px'; document.body.appendChild(t); t.select();
    try { document.execCommand('copy') ? ok() : toast('复制失败，请手动选择文本'); } catch (_){ toast('复制失败，请手动选择文本'); } t.remove(); };
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(ok, fallback); else fallback();
}

/* =====================================================================
   世界观
   ===================================================================== */
const DIST = [
  ['金穹天枢', .56, .36, '永不日落的黄金心脏。金莲塔、威尼斯天幕城、摩珀斯星钻与永利流光宫以空中廊桥无缝串联。'],
  ['氹仔霓虹', .39, .21, '威尼斯水城与运河天幕商业区。人造天空永远停在黄昏，贡多拉载着筹码与情话。'],
  ['九尾狐灯笼街', .16, .34, '东洋汤屋与花街夜宴区。千盏绯色灯笼下，狐族公关替贵客斟第一杯酒。'],
  ['银狼金融港', .86, .23, '离岸银行与典当拍卖中心。一米六高的遮羞柜台后，银狼估价从不手软。'],
  ['波斯猫丝绒坊', .66, .1, '高定秀场、香氛沙龙与私人会所。猫族主理人慵懒地记住每一位客人的喜好。'],
  ['垂耳兔甜梦谷', .755, .38, '全息游乐场、电竞巨蛋与潮玩街。最甜的糖果，也是最早的筹码启蒙。'],
  ['雪豹极光湾', .29, .69, '游艇码头、跨海赛道与直升机坪。雪豹族执掌着超跑与私人拍卖。'],
  ['白鹿森语林', .76, .19, '空中植物园、禅意水疗与戒赌康复绿洲。荷官们下了班来这里泡药浴。'],
  ['夜鸮钟楼区', .21, .62, '皇家歌剧院、午夜爵士吧与古董珍玩街。钟楼的指针，是全城唯一敢走动的时间。'],
  ['金毛犬暖阳巷', .38, .58, '老城大排档、葡式石板街与烟火夜市。凌晨三点的一碗水蟹粥，救过很多人。'],
  ['龙角云顶塔', .5, .1, '摩天行政公寓、空中无边泳池与顶层酒廊。龙角裔俯瞰着整座城的流水。'],
  ['锈铁暗渠', .53, .56, '地下拳场、黑市当铺与叠码仔清账街。光照不到的地方，账总要有人还。'],
  ['赛马与赛狗场', .69, .53, '皇家草地赛马与星光赛狗场。电磁闸箱一开，心跳就跟着马蹄走。'],
  ['免税长廊', .85, .55, '幻境免税长廊与米其林星厨大道。赢了的人来这里花钱，输了的人来这里典当。'],
  ['静海灯塔', .59, .7, '整座欲望都市唯一的无赌净土。百年白塔下，永远为回头者亮着一盏暖灯。'],
];
const CHS = [
  { id:'city', img:'wcity', no:'壹', title:'新濠蜃楼城', en:'Neo-Mirage Metropolis', nav:'序',
    body:`<p>它坐落于南洋暖流与深海海沟交汇的<b>翡翠湾</b>畔：本岛老城、跨海三桥连接的<b>金光填海大道</b>，以及外围的人工环形岛群。</p>
      <p>百年前，这里只是远洋商船避风补给的渔港。《金穹特别自由港法案》颁布后，九大博彩财团投入逾四万亿信用点填海造陆——用钢筋、防弹玻璃幕墙、全息天幕与镀金穹顶，在滩涂上筑起一座<b>二十四小时永不落幕的欲望迷宫</b>。人们叫它「不夜金穹」。</p>`,
    stats:[['3', '座跨海大桥'], ['15', '大娱乐城区'], ['24', '小时永不落幕']],
    q:['欢迎来到没有黑夜的城。', '头头猫'] },
  { id:'map', img:'wmap', no:'贰', title:'十五城区', en:'Fifteen Districts', nav:'城图', map:true,
    body:`<p>以金穹天枢为心脏，十五座城区沿填海大道与环岛辐射开来。每一区都有自己的族群、行规与陷阱。<b>点地图上的光点</b>，或点下方的名字。</p>`,
    q:['迷路了就往海边走，灯塔那边，不收筹码。', '头头猫'] },
  { id:'race', img:'wcity', no:'叁', title:'金穹共生', en:'The Golden Dome Charter', nav:'九族', races:true, right:true,
    body:`<p>八十年前签署的<b>《金穹共生宪章》</b>，确立了人族与兽耳娘在法律、金融、雇佣与婚姻上的完全平权。兽耳娘保有人类九成五以上的体态，头顶毛茸兽耳、尾椎延伸兽尾，听觉、嗅觉与夜视远超常人。</p>
      <p>GCMC 严禁她们用天赋在赌桌上出千，却允许娱乐场聘请她们担任首席荷官、贵宾厅公关、天眼分析师与戒断顾问。</p>`,
    q:['我是猫族哦——所以，别想在我面前藏牌。', '头头猫'] },
  { id:'eye', img:'weye', no:'肆', title:'穹顶之眼', en:'Sky-Eye Surveillance', nav:'天眼',
    body:`<p>抬头看那些华丽藻井：深色半球形装饰罩后，藏着超过<b>五万路 8K 高速摄像机</b>。由夜鸮族首席监控官率领的天眼中心，二十四小时紧盯每一张赌台。</p>
      <p>瞳孔放大率监测、面部毛细血管热成像、手部动作帧级回放——任何藏牌、换牌、与荷官暗通款曲的举动，都会在 <b>1.5 秒</b>内触发红色警报。千元以上的筹码内嵌 <b>RFID</b> 芯片；算牌客，则败给八副牌与连续洗牌机。</p>`,
    stats:[['50000', '路 8K 摄像机'], ['1.5', '秒触发警报'], ['8', '副牌 · CSM']],
    q:['它们看得见你的手，看不见你的心——心交给我来看。', '头头猫'] },
  { id:'math', img:'wmath', no:'伍', title:'久赌必输', en:'The Iron Law of the House', nav:'铁律', right:true,
    body:`<p>这里的每一场赌局，都服从<b>大数定律</b>、<b>庄家优势</b>与<b>赌徒破产定理</b>。百家乐庄注的庄家优势只有 1.06%，每注一千，期望亏损不过十块六。</p>
      <p>可一张熟练的赌台每小时能开 65 到 80 局。亢奋地坐上十小时，流水便是八十万，理论损耗 <b>8,480</b>——还没算上连赢后的加注与连输后的倍投。大厅里没有窗、没有钟，穹顶光把色温锁在 3200–3800K 的永恒黄昏。</p>`,
    stats:[['1.06', '% 庄家优势'], ['80', '局 / 小时'], ['8480', '十小时期望损耗']],
    q:['庄家从来不需要运气，小客人。', '头头猫'] },
  { id:'light', img:'wlight', no:'陆', title:'静海灯塔', en:'Quiet-Sea Lighthouse', nav:'灯塔',
    body:`<p>半岛最南端的望洋山岬角上，百年白色石塔与修道院改建的阳光庭院，是整座欲望都市<b>唯一的无赌净土</b>。墙上没有鸡汤，只钉着成千上万张作废的 VIP 会员卡与已结清的借据存根。</p>
      <p>清醒过来的人，可以在这里签署<b>《自我禁入令》</b>：一旦生效，全城天眼同步拉黑其虹膜与步态。城市向赌场征收 <b>39%</b> 博彩特别税，再强制抽取 <b>2%</b> 流水注入破蜃基金会——既制造欲望，也提供救赎。</p>
      <div class="chips2 rv" style="transition-delay:.5s"><span>二 年</span><span>五 年</span><span>终 身</span></div>`,
    q:['想回头的时候，那盏灯一直亮着。', '头头猫'], end:true },
];
let wi = 0, wBusy = false;
function buildWorld(){
  const sc = $i('scWorld');
  sc.innerHTML = `<div class="wProg" id="wProg"></div><button class="pgBtn pgBack" data-act="back">‹ 返回牌桌</button>
    <button class="wArrow l" data-act="prev">‹</button><button class="wArrow r" data-act="next">›</button>
    <div class="wTrack">${CHS.map((c, i) => chHTML(c, i)).join('')}</div>
    <div class="wNav">${CHS.map((c, i) => `<button class="wDot" data-go="${i}"><i></i><span>${c.nav}</span></button>`).join('')}</div>`;
  sc.querySelectorAll('[data-src]').forEach(i => { const k = i.dataset.src; if (U[k]) i.src = U[k]; else applyAsset(k); });
  sc.querySelectorAll('.wCh').forEach((c, i) => { const k = CHS[i].img; const set = u => c.querySelector('.pgBg').style.backgroundImage = `url("${u}")`; U[k] ? set(U[k]) : asset(k).then(set); });
  sc.addEventListener('click', e => {
    const a = e.target.closest('[data-act]');
    if (a){ const v = a.dataset.act; if (v === 'back') return leave(); if (v === 'prev') return go(wi - 1); if (v === 'next') return go(wi + 1); }
    const d = e.target.closest('[data-go]'); if (d) return go(+d.dataset.go);
    const p = e.target.closest('[data-pin]'); if (p) return showPin(+p.dataset.pin);
    const r = e.target.closest('.rCard'); if (r){ const k = +r.dataset.i; $i('rInfo').innerHTML = `<b>${RACES[k].n}</b>${RACES[k].d}`; sfx.pop(); }
  });
  sc.addEventListener('pointerover', e => { const r = e.target.closest('.rCard'); if (r){ const k = +r.dataset.i; $i('rInfo').innerHTML = `<b>${RACES[k].n}</b>${RACES[k].d}`; } });
  let wl = 0;
  sc.addEventListener('wheel', e => { if (e.target.closest('.wTxt') && e.target.closest('.wTxt').scrollHeight > e.target.closest('.wTxt').clientHeight + 4) return; const n = performance.now(); if (n - wl < 900) return; if (Math.abs(e.deltaY) + Math.abs(e.deltaX) < 20) return; wl = n; go(wi + ((e.deltaY || e.deltaX) > 0 ? 1 : -1)); }, { passive:true });
  let sx0 = null;
  sc.addEventListener('pointerdown', e => { if(e.target.closest('#districtSheet')) return; sx0 = toLocal(e.clientX, e.clientY); });
  sc.addEventListener('pointerup', e => { if (!sx0) return; const p = toLocal(e.clientX, e.clientY), dx = p.x - sx0.x; if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(p.y - sx0.y)*1.3) go(wi + (dx < 0 ? 1 : -1)); sx0 = null; });
  addEventListener('keydown', e => { if (CUR !== 'world' || window.DISTRICT_OPEN) return; if (e.key === 'ArrowRight') go(wi + 1); if (e.key === 'ArrowLeft') go(wi - 1); if (e.key === 'Escape') leave(); });
}
function chHTML(c, i){
  let extra = '';
  if (c.stats) extra += `<div class="stats rv" style="transition-delay:.35s">${c.stats.map(([n, t]) => `<div class="stat"><b data-n="${n}">0</b><small>${t}</small></div>`).join('')}</div>`;
  if (c.map) extra += `<div class="dlist rv" style="transition-delay:.35s">${DIST.map((d, k) => `<span data-pin="${k}"><i>${String(k + 1).padStart(2, '0')}</i>${d[0]}</span>`).join('')}</div>`;
  if (c.races) extra += `<div class="raceRow rv" style="transition-delay:.35s">${RACES.map((r, k) => `<div class="rCard" data-i="${k}"><img data-src="race${k}" alt=""><b>${r.n}</b></div>`).join('')}</div><div class="rInfo rv" id="rInfo" style="transition-delay:.5s">悬停或点击一位，听听她们的故事。</div>`;
  const mapBox = c.map ? `<div class="mapBox" id="mapBox" style="position:absolute;right:4cqw;top:50%;translate:0 -52%;width:min(52cqw,calc(78cqh * 1672 / 941));aspect-ratio:1672/941;border:1px solid rgba(230,190,110,.6);box-shadow:0 30px 70px rgba(0,0,0,.7),0 0 0 6px rgba(20,6,3,.6),0 0 0 7px rgba(230,190,110,.3);transform-style:preserve-3d;transition:transform .5s cubic-bezier(.2,.8,.2,1)">
      <img data-src="wmap" alt="" style="width:100%;height:100%;display:block">
      <div class="mapPins">${DIST.map((d, k) => `<div class="pin" data-pin="${k}" style="left:${d[1]*100}%;top:${d[2]*100}%"></div>`).join('')}</div>
      <div class="pinTip" id="pinTip"></div></div>` : '';
  return `<section class="wCh${c.right ? ' right' : ''}${c.map ? ' mapCh' : ''}" data-i="${i}">
    <div class="pgBg"${c.map ? ' style="filter:blur(14px) brightness(.35)"' : ''}></div><div class="shade"></div>${mapBox}
    <div class="wTxt">
      <div class="wNo rv">第 ${c.no} 章 · ${c.nav}</div>
      <h2 class="rv" style="transition-delay:.08s">${c.title}</h2>
      <div class="en rv" style="transition-delay:.14s">${c.en}</div>
      <div class="rv" style="transition-delay:.22s">${c.body}</div>
      ${extra}
      <div class="q rv" style="transition-delay:.6s">「${c.q[0]}」<small>—— ${c.q[1]}</small></div>
      ${c.end ? `<div class="rv" style="transition-delay:.8s;margin-top:1.4em;display:flex;gap:.8em"><button class="pgBtn main" data-act="back">回 到 牌 桌</button><button class="pgBtn" data-go="0">从 头 再 读</button></div>` : ''}
    </div></section>`;
}
function countUp(sec){
  sec.querySelectorAll('[data-n]').forEach(b => {
    const n = parseFloat(b.dataset.n), dec = (b.dataset.n.split('.')[1] || '').length, t0 = performance.now(), dur = 1400;
    const st = () => { const t = Math.min(1, (performance.now() - t0)/dur), v = n*(1 - Math.pow(1 - t, 3)); b.textContent = dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US'); if (t < 1) requestAnimationFrame(st); };
    st();
  });
}
function showPin(k){
  const sc = $i('scWorld');
  sc.querySelectorAll('.pin').forEach(p => p.classList.toggle('on', +p.dataset.pin === k));
  sc.querySelectorAll('.dlist span').forEach(p => p.classList.toggle('on', +p.dataset.pin === k));
  window.openDistrict(k);
}

async function go(n, first){
  if (wBusy || CUR !== 'world' || (PAGE_BUSY && !first)) return; n = Math.max(0, Math.min(CHS.length - 1, n)); if (n === wi && !first) return;
  wBusy = true;
  const secs = $i('scWorld').querySelectorAll('.wCh'), cur = secs[wi], nxt = secs[n], dir = n > wi ? 1 : -1;
  if (!first && cur !== nxt){
    sfx.whoosh(); sfx.flutter(6);
    cur.classList.remove('in');
    anim(cur, [{ transform:'none', opacity:1, filter:'blur(0)' }, { transform:`translateX(${-dir*22}%) rotateY(${dir*32}deg) translateZ(-380px)`, opacity:0, filter:'blur(10px)' }], { duration:950, easing:'cubic-bezier(.6,0,.3,1)', fill:'forwards' })
      .finished.then(() => { cur.classList.remove('on'); cur.getAnimations().forEach(a => a.cancel()); });
    nxt.classList.add('on');
    await anim(nxt, [{ transform:`translateX(${dir*26}%) rotateY(${-dir*30}deg) translateZ(-300px)`, opacity:0, filter:'blur(10px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:1050, easing:'cubic-bezier(.2,.7,.2,1)', fill:'forwards' }).finished;
    nxt.getAnimations().forEach(a => a.cancel());
  } else nxt.classList.add('on');
  wi = n;
  requestAnimationFrame(() => nxt.classList.add('in'));
  setTimeout(() => countUp(nxt), 350);
  $i('scWorld').querySelectorAll('.wDot').forEach((d, k) => d.classList.toggle('on', k === n));
  $i('wProg').style.width = (n + 1)/CHS.length*100 + '%';
  wBusy = false;
}

/* =====================================================================
   打开 / 离开页面（视角一黑后切换）
   ===================================================================== */
const built = {};
window.openPage = async name => {
  if (!['create', 'world', 'catalog'].includes(name) || PAGE_BUSY) return;
  PAGE_BUSY = true;
  CUR = name; SCENE = 'page'; hint(''); dustLevel = .16;
  document.querySelectorAll('.scene.page').forEach(s => s.classList.add('off'));
  try {
  if (name === 'catalog'){ await window.openCatalog(); return; }
  const sc = $i(name === 'create' ? 'scCreate' : name === 'catalog' ? 'scCatalog' : 'scWorld');
  if (!built[name]){ name === 'create' ? (loadST(), buildCreate()) : buildWorld(); built[name] = true; }
  if (name === 'create') await Promise.race([applyAsset('createbg'), sleep(5000)]);
  else await Promise.race([Promise.all(['wcity', 'wmap', 'weye', 'wmath', 'wlight'].map(k => applyAsset(k))), sleep(5000)]);
  sc.classList.remove('off');
  el.blink.getAnimations().forEach(a => a.cancel()); el.blink.style.opacity = 1;
  anim(el.blink, [{ opacity:1 }, { opacity:0 }], { duration:1200, easing:'ease-out', fill:'forwards' });
  sfx.shimmer();
  if (name === 'create'){
    syncUI(); $i('saveSt').textContent = (()=>{try{return !!localStorage.getItem(KEY)}catch(_){return false}})() ? '已 读 取 上 次 保 存 的 设 定' : '';
    anim(sc.querySelector('.pgBg'), [{ transform:'scale(1.25)', filter:'blur(12px) brightness(.2)' }, { transform:'scale(1.04)', filter:'brightness(.62) saturate(1.05)' }], { duration:1800, easing:'cubic-bezier(.2,.7,.2,1)', fill:'none' });
    anim($i('crPanel'), [{ transform:'rotateY(-38deg) translateX(18%) translateZ(-200px)', opacity:0 }, { transform:'none', opacity:1 }], { duration:1300, delay:300, easing:'cubic-bezier(.2,.8,.2,1)', fill:'backwards' });
    sc.querySelectorAll('.cin').forEach(c => anim(c, [{ opacity:0, transform:'translateY(16px)', filter:'blur(6px)' }, { opacity:1, transform:'none', filter:'none' }], { duration:900, delay:500 + (+c.dataset.d)*110, easing:'cubic-bezier(.2,.8,.2,1)', fill:'backwards' }));
  } else {
    sc.querySelectorAll('.wCh').forEach(c => { c.classList.remove('on', 'in'); c.getAnimations().forEach(a => a.cancel()); });
    wi = 0; await go(0, true);
    anim(sc.querySelector('.wCh .pgBg'), [{ transform:'scale(1.3)', filter:'blur(12px) brightness(.2)' }, { transform:'scale(1.05)', filter:'brightness(.7) saturate(1.08)' }], { duration:2000, easing:'cubic-bezier(.2,.7,.2,1)', fill:'none' });
  }
  } finally { PAGE_BUSY = false; }
};
async function leave(){
  if (!CUR || PAGE_BUSY) return;
  PAGE_BUSY = true;
  // Finish a chapter turn before hiding/reopening the scene it owns.
  if (CUR === 'world') { window.closeDistrict?.(false); while (wBusy) await sleep(30); }
  const sc = $i(CUR === 'create' ? 'scCreate' : CUR === 'catalog' ? 'scCatalog' : 'scWorld');
  if (CUR === 'create' && $i('saveSt').textContent.includes('未')) save(true);
  sfx.whoosh();
  anim(sc, [{ transform:'none', filter:'none' }, { transform:'scale(.9)', filter:'blur(8px) brightness(.4)' }], { duration:800, easing:'cubic-bezier(.6,0,.4,1)' });
  await anim(el.blink, [{ opacity:0 }, { opacity:1 }], { duration:800, fill:'forwards' }).finished;
  sc.getAnimations().forEach(a => a.cancel());
  sc.classList.add('off'); CUR = null; dustLevel = .22;
  try { await window.backToDuel(); } finally { PAGE_BUSY = false; };
}
window.leavePage = leave;
/* 页面视差 */
FRAME_HOOKS.push(() => {
  if (SCENE !== 'page' || !CUR || MOBILE) return;
  if (CUR === 'create'){ const b = $i('scCreate').querySelector('.pgBg'); if (b && !b.getAnimations().some(a => a.effect && a.effect.getKeyframes().some(k => k.filter))) b.style.translate = `${-mx*18}px ${-my*10}px`; }
  else if (CUR === 'world'){
    const s = $i('scWorld').querySelector('.wCh.on'); if (!s) return;
    const b = s.querySelector('.pgBg'); if (b) b.style.translate = `${-mx*22}px ${-my*12}px`;
    const m = s.querySelector('.mapBox'); if (m) m.style.transform = `rotateY(${mx*-6}deg) rotateX(${my*4}deg)`;
    const t = s.querySelector('.wTxt'); if (t) t.style.transform = `translate(${mx*6}px,${my*4}px)`;
  }
});

/* 页面拦截全局点击（不触发对局里的逗弄） */
DOWN_HOOKS.unshift(e => SCENE === 'page');

/* 输入框获得焦点时浏览器会偷偷滚动 overflow:hidden 的舞台，导致整页错位 → 锁死 */
[app, ...document.querySelectorAll('.scene')].forEach(s => s.addEventListener('scroll', () => { if (s.scrollTop || s.scrollLeft){ s.scrollTop = 0; s.scrollLeft = 0; } }));

window.MIRAGE_MOBILE.mount();
boot();
})();
