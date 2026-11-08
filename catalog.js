/* The supplied 216-person archive is data, never executable instructions. */
(() => {
 'use strict';
 const data=window.CATALOG_DATA||[], sc=document.getElementById('scCatalog');
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let built=false, list=data.slice(), current=0, renderVersion=0;
 const $=s=>sc.querySelector(s);
 const completed=data.filter(c=>c.image).length;
 function build(){
  sc.innerHTML=`<div class="atlas-room"></div><div class="atlas-vignette"></div><div class="atlas-beam"></div><div class="atlas-orbit"></div>
   <button class="pgBtn pgBack" data-atlas="back">‹ 返回牌桌</button>
   <header class="atlas-mast"><span>新濠蜃楼城 · 私藏名录</span><b>百美夜宴</b><small>PORTRAITS OF THE GOLDEN DOME</small></header>
   <div class="atlas-count"><strong>${completed}</strong><span>幅立绘 / ${data.length} 位人物</span><small>尚有 ${data.length-completed} 位待绘</small></div>
   <form class="atlas-filters" role="search" onsubmit="return false">
    <label><span>寻人</span><input id="atlasSearch" autocomplete="off" placeholder="姓名、编号、职业或城区" aria-label="搜索角色"></label>
    <label><span>族群</span><select id="atlasRace" aria-label="筛选族群"><option value="">全部族群</option>${[...new Set(data.map(c=>c.race.replace(/（.*?）/g,'')))].map(r=>`<option>${esc(r)}</option>`).join('')}</select></label>
    <label><span>画册</span><select id="atlasStatus" aria-label="筛选立绘状态"><option value="">全部档案</option><option value="generated">已有立绘</option><option value="pending">待绘档案</option></select></label>
   </form>
   <main class="atlas-stage">
    <div class="atlas-art"><div class="atlas-shadow"></div><div class="atlas-backing"></div><button class="atlas-frame" data-atlas="zoom" aria-label="放大当前角色立绘"><div class="atlas-missing"><b>待绘</b><span>档案已收录 · 立绘尚未生成</span></div><img id="atlasPortrait" alt=""><span class="atlas-art-tip">点击赏原画 ↗</span></button><span class="atlas-seal">金穹<br>藏影</span><span class="atlas-vertical">灯火之外，众生入画。</span></div>
    <article class="atlas-dossier" aria-live="polite"><div class="atlas-index"></div><div class="atlas-identity"><span id="atlasId"></span><span id="atlasAge"></span></div><h1 id="atlasName"></h1><div id="atlasMeta"></div><p id="atlasJob"></p><div class="atlas-text"><section><h2>所属城区</h2><p id="atlasDistrict"></p></section><section><h2>衣装与气韵</h2><p id="atlasOutfit"></p></section><details><summary>外貌档案 <span>展开 +</span></summary><p id="atlasLook"></p></details></div><div class="atlas-controls"><button data-atlas="prev" aria-label="上一位角色">←</button><span id="atlasPosition"></span><button data-atlas="next" aria-label="下一位角色">→</button><label class="atlas-jump">直达<select id="atlasSelect" aria-label="选择角色"></select></label></div></article>
   </main>
   <div class="atlas-empty" hidden>今夜尚未寻得此人。<button data-atlas="reset">清除筛选，重阅名录</button></div>
   <footer class="atlas-footer"><div class="atlas-footer-title">夜宴席签 <small>左右滑动 · 点击赴约</small></div><div class="atlas-rail" id="atlasRail" aria-label="角色缩略画廊"></div></footer>
   <div class="atlas-zoom" hidden role="dialog" aria-modal="true" aria-label="角色原画"><button data-atlas="closeZoom" aria-label="关闭原画">关闭 ×</button><img alt=""></div>`;
  sc.addEventListener('click',e=>{
   const b=e.target.closest('[data-atlas]'); if(!b)return;
   const a=b.dataset.atlas;
   if(a==='back')return window.leavePage();
   if(a==='prev')return show(current-1);
   if(a==='next')return show(current+1);
   if(a==='pick')return show(list.findIndex(c=>c.id===b.dataset.id));
   if(a==='reset'){for(const id of ['atlasSearch','atlasRace','atlasStatus'])$('#'+id).value='';filter();}
   if(a==='zoom'&&list[current]?.image){const z=$('.atlas-zoom');z.hidden=false;z.querySelector('img').src=list[current].image;z.querySelector('img').alt=list[current].name+'完整立绘';for(const c of sc.children)if(c!==z)c.inert=true;z.querySelector('button').focus();}
   if(a==='closeZoom')closeZoom();
  });
  $('#atlasSearch').addEventListener('input',filter);$('#atlasRace').addEventListener('change',filter);$('#atlasStatus').addEventListener('change',filter);
  $('#atlasSelect').addEventListener('change',e=>show(list.findIndex(c=>c.id===e.target.value)));
  document.addEventListener('keydown',e=>{
   if(sc.classList.contains('off')||SCENE!=='page')return;
   if(!$('.atlas-zoom').hidden&&e.key==='Tab'){e.preventDefault();$('.atlas-zoom button').focus();return;}
   if(e.key==='Escape'){e.preventDefault();if(!$('.atlas-zoom').hidden)closeZoom();else window.leavePage();return;}
   if(e.target.matches('input,select,textarea')||!$('.atlas-zoom').hidden)return;
   if(e.key==='ArrowLeft'){e.preventDefault();show(current-1);}if(e.key==='ArrowRight'){e.preventDefault();show(current+1);}
  });
  for(const parent of [sc, $('.atlas-text')])parent.addEventListener('scroll',()=>{}, {passive:true});
  built=true;filter();
 }
 function closeZoom(restoreFocus=true){$('.atlas-zoom').hidden=true;for(const c of sc.children)c.inert=false;if(restoreFocus)$('.atlas-frame').focus();}
 function filter(){
  const q=$('#atlasSearch').value.trim().toLowerCase(),race=$('#atlasRace').value,status=$('#atlasStatus').value;
  const old=list[current]?.id;
  list=data.filter(c=>(!race||c.race.replace(/（.*?）/g,'')===race)&&(!status||c.status===status)&&(!q||[c.id,'chr-'+c.id,c.name,c.race,c.job,c.district].join(' ').toLowerCase().includes(q)));
  $('#atlasSelect').innerHTML=list.map(c=>`<option value="${c.id}">${c.id} · ${esc(c.name)}${c.image?'':' · 待绘'}</option>`).join('');
  $('.atlas-stage').hidden=!list.length;$('.atlas-empty').hidden=!!list.length;
  if(list.length)show(Math.max(0,list.findIndex(c=>c.id===old)));else $('#atlasRail').innerHTML='';
 }
 function show(n){
  if(!list.length)return;current=(n+list.length)%list.length;
  const c=list[current],v=++renderVersion,img=$('#atlasPortrait');
  $('.atlas-frame').classList.toggle('pending',!c.image);img.style.opacity='0';img.alt=c.name+' · '+c.age+' · 完整立绘';
  if(c.image){img.onload=()=>{if(v===renderVersion){$('.atlas-frame').classList.remove('pending');img.style.opacity='1';}};img.onerror=()=>{if(v!==renderVersion)return;$('.atlas-frame').classList.add('pending');$('.atlas-missing span').textContent='图像暂未载入 · 档案仍可阅读';};img.src=c.image;if(img.complete&&img.naturalWidth)img.style.opacity='1';}
  else{img.removeAttribute('src');$('.atlas-missing span').textContent='档案已收录 · 立绘尚未生成';}
  $('#atlasId').textContent='NO. '+c.id;$('#atlasAge').textContent=c.age+' · 成年';$('#atlasName').textContent=c.name;
  $('#atlasMeta').textContent=c.race;$('#atlasJob').textContent=c.job;$('#atlasDistrict').textContent=c.district;
  $('#atlasOutfit').textContent=c.outfitDesign;$('#atlasLook').textContent=c.hairDesign+'。'+c.faceDesign;
  $('#atlasPosition').textContent=String(current+1).padStart(3,'0')+' / '+list.length;$('#atlasSelect').value=c.id;
  $('.atlas-index').textContent=c.id;$('.atlas-text').scrollTop=0;$('.atlas-text details').open=false;
  // A bounded film strip, not 216 simultaneous full-resolution downloads.
  let start=Math.max(0,Math.min(current-4,list.length-11)),end=Math.min(list.length,start+11);
  $('#atlasRail').innerHTML=list.slice(start,end).map((r,i)=>`<button class="atlas-thumb${r.id===c.id?' selected':''}" data-atlas="pick" data-id="${r.id}" aria-label="查看${esc(r.name)}" aria-current="${r.id===c.id?'true':'false'}" style="--lean:${[-3,1,3,-1,2][i%5]}deg;--rise:${[7,0,11,3,9][i%5]}px">${r.image?`<img loading="lazy" src="${r.thumb||r.image}" alt="${esc(r.name)}">`:'<span class="atlas-thumb-empty">待绘</span>'}<b>${esc(r.name)}</b><small>${r.id}</small></button>`).join('');
  $('#atlasRail .selected')?.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'});
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
   for(const e of [$('.atlas-frame'),$('.atlas-dossier')]){e.getAnimations().forEach(a=>a.cancel());anim(e,[{opacity:0,translate:'20px 5px',filter:'blur(5px)'},{opacity:1,translate:'0 0',filter:'blur(0)'}],{duration:650,fill:'none',easing:'cubic-bezier(.2,.8,.2,1)'});}
  }
 }
 window.openCatalog=async()=>{
  if(!built)build();closeZoom(false);sc.classList.remove('off');
  const bg=$('.atlas-room');bg.style.backgroundImage='url("'+(U.bg||SRC.bg[0])+'")';
  applyAsset('bg').then(u=>bg.style.backgroundImage='url("'+u+'")');
  anim(el.blink,[{opacity:1},{opacity:0}],{duration:1000});sfx.shimmer();
 };
 FRAME_HOOKS.push(now=>{
  if(SCENE!=='page'||sc.classList.contains('off')||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  sc.style.setProperty('--ax',(-mx*12)+'px');sc.style.setProperty('--ay',(-my*8)+'px');
 });
})();
