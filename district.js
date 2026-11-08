(() => {
 'use strict';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let panel=null,index=0,previousFocus=null;
 window.DISTRICT_OPEN=false;
 function format(text){
  const inline=s=>esc(s).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<code>$1</code>');
  return text.split(/\n\s*\n/).map(block=>{
   if(/^#{1,6}\s/.test(block))return block.split('\n').map(line=>{const m=line.match(/^(#{1,6})\s+(.*)/);return m?'<h'+Math.min(4,m[1].length)+'>'+inline(m[2])+'</h'+Math.min(4,m[1].length)+'>':'<p>'+inline(line)+'</p>';}).join('');
   return '<p>'+block.split('\n').map(inline).join('<br>')+'</p>';
  }).join('');
 }
 function build(){
  panel=document.createElement('div');panel.id='districtSheet';panel.hidden=true;
  panel.innerHTML='<div class="district-shade" data-district-close></div><section class="district-dialog" role="dialog" aria-modal="true" aria-labelledby="districtTitle" tabindex="-1"><div class="district-ambience"></div><header class="district-header"><span id="districtNumber"></span><div><small>十五城区 · 城市档案</small><h2 id="districtTitle"></h2><p id="districtSummary"></p></div><button class="pgBtn" data-district-close aria-label="关闭城区详情">返回城图 ×</button></header><div class="district-columns"><article class="district-body" tabindex="0" aria-label="城区详细介绍"></article><aside class="district-people"><div class="district-people-head"><b>此地人物</b><span id="districtPeopleCount"></span></div><p class="district-community"></p><div class="district-residents"></div></aside></div><nav class="district-neighbors"><button class="pgBtn" data-district-step="-1">‹ 上一区</button><small>档案所属城区及原卡提及人物，不代表实时位置</small><button class="pgBtn" data-district-step="1">下一区 ›</button></nav></section>';
  document.getElementById('scWorld').appendChild(panel);
  panel.addEventListener('click',e=>{e.stopPropagation();const close=e.target.closest('[data-district-close]');if(close)return window.closeDistrict();const step=e.target.closest('[data-district-step]');if(step)window.openDistrict((index+15+Number(step.dataset.districtStep))%15);});
  panel.addEventListener('wheel',e=>e.stopPropagation(),{passive:true});
  panel.addEventListener('pointerdown',e=>e.stopPropagation());
  panel.addEventListener('pointerup',e=>e.stopPropagation());
  panel.addEventListener('keydown',e=>{
   if(e.key==='Escape'){e.preventDefault();e.stopPropagation();return window.closeDistrict();}
   if(e.key==='Tab'){
    const focusables=[...panel.querySelectorAll('button,[tabindex="0"],summary')].filter(e=>e.getClientRects().length);
    const first=focusables[0],last=focusables[focusables.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
   }
  });
 }
 window.openDistrict=k=>{
  const d=window.DISTRICT_DATA?.[k];if(!d)return;
  if(!panel)build();
  if(!window.DISTRICT_OPEN)previousFocus=document.activeElement;
  index=k;window.DISTRICT_OPEN=true;panel.hidden=false;
  for(const child of document.getElementById('scWorld').children)if(child!==panel)child.inert=true;
  const $=s=>panel.querySelector(s);
  $('#districtNumber').textContent=String(d.id).padStart(2,'0');
  $('#districtTitle').textContent=d.title.replace(/^第[^：]+：/,'').replace(/[（(].*$/,'');
  $('#districtSummary').textContent=d.summary;
  $('.district-body').innerHTML=format(d.content);$('.district-body').scrollTop=0;
  $('.district-community').textContent='常驻族群与从业者：'+d.communities;
  $('#districtPeopleCount').textContent=d.residents.length+' 位具名人物';
  $('.district-residents').innerHTML=d.residents.map(ref=>{
   const c=window.CATALOG_DATA.find(c=>c.id===ref.id);if(!c)return '';
   return '<details class="district-person"><summary>'+(c.image?'<img loading="lazy" src="'+esc(c.image)+'" alt="'+esc(c.name)+'">':'<span class="district-unpainted">待绘</span>')+'<span><small>NO. '+esc(c.id)+' · '+esc(ref.basis)+'</small><b>'+esc(c.name)+'</b><em>'+esc(c.race)+'</em></span><i>＋</i></summary><div class="district-person-text"><p>'+esc(c.job)+'</p><p>'+esc(c.district)+'</p>'+ (c.image?'<img loading="lazy" src="'+esc(c.image)+'" alt="'+esc(c.name)+'完整立绘">':'<p>档案已收录，立绘尚待绘制。</p>')+'<p>'+esc(c.outfitDesign)+'</p></div></details>';
  }).join('') || '<div class="district-unnamed"><b>本区原卡未指定具名常驻人物</b><p>'+esc(d.communities)+'</p><p>以上从业者在城区条目中有明确设定；不擅自给现有角色改派住址或补造姓名。</p></div>';
  $('.district-residents').scrollTop=0;
  $('.district-ambience').style.backgroundImage='url("'+(U.wmap||SRC.wmap[0])+'")';
  $('[data-district-close]').focus();
  const focus=$('.district-header button');focus.focus();
  sfx.pop();
 };
 window.closeDistrict=(restoreFocus=true)=>{
  if(!panel||panel.hidden)return;
  panel.hidden=true;window.DISTRICT_OPEN=false;
  for(const c of document.getElementById('scWorld').children)c.inert=false;
  if(restoreFocus&&previousFocus?.isConnected)previousFocus.focus();
 };
})();
