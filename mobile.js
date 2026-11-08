/* Phone-only viewport adapter. Desktop layout and animation inputs are untouched. */
(() => {
 'use strict';
 const enabled=/Android|iPhone|iPod|Mobile/i.test(navigator.userAgent)||
  (navigator.maxTouchPoints>1&&matchMedia('(pointer:coarse)').matches&&Math.min(screen.width,screen.height)<900);
 function viewport(sw,sh,forced){
  const rot=!!forced&&sh>sw,landscape=rot||sw>sh;
  const aw=rot?sh:sw,ah=rot?sw:sh,w=landscape?1280:sw,h=landscape?720:sh;
  const scale=landscape?Math.min(aw/w,ah/h):1,ox=(aw-w*scale)/2,oy=(ah-h*scale)/2;
  return {sw,sh,w,h,rot,landscape,scale,ox,oy,transform:rot?
   `translate(${sw-oy}px,${ox}px) rotate(90deg) scale(${scale})`:
   `translate(${ox}px,${oy}px) scale(${scale})`};
 }
 function local(x,y,v){return v.rot?{x:(y-v.ox)/v.scale,y:(v.sw-v.oy-x)/v.scale}:{x:(x-v.ox)/v.scale,y:(y-v.oy)/v.scale};}
 function rect(r,v){const p=local(v.rot?r.right:r.left,r.top,v);return {left:p.x,top:p.y,width:(v.rot?r.height:r.width)/v.scale,height:(v.rot?r.width:r.height)/v.scale};}
 function animation(kf,opt){
  // Animated blur on full-screen layers forces repeated off-screen rasterization on phones.
  // Preserve transforms, opacity, duration, game waits and all desktop animation inputs.
  return {kf:kf.map(k=>{const n={...k};if(typeof n.filter==='string')n.filter=n.filter.replace(/blur\([^)]*\)\s*/g,'').trim()||'none';return n;}),opt};
 }
 function duelGeometry(w,h,bg){
  const cw=Math.min(w*.2,h*.15,bg.w*.075),cupW=Math.min(w*.3,h*.26),yMe=Math.min(bg.y+bg.h*.87,h-cw*.95);
  const finalW=Math.min(cw*1.3,w*.22);
  return {cw,gap:cw*.68,yMe,yHer:Math.min(bg.y+bg.h*.745,yMe-cw*1.15),cupW,cupX:w/2,cupY:Math.min(bg.y+bg.h*.86,h-cupW*.42),finalW,finalGap:Math.min(finalW*1.55,w*.3),finalY:w<h?h*.68:Math.min(bg.y+bg.h*.8,h-finalW*1.8)};
 }
 function mount(){
  if(!enabled)return;
  const dock=document.getElementById('musicDock');
  const settings=document.createElement('button');settings.id='musicSettings';settings.textContent='☷';settings.type='button';settings.setAttribute('aria-label','展开音乐设置');settings.setAttribute('aria-expanded','false');dock.appendChild(settings);
  settings.onclick=e=>{e.stopPropagation();const open=dock.classList.toggle('settings-open');settings.setAttribute('aria-expanded',String(open));settings.setAttribute('aria-label',open?'收起音乐设置':'展开音乐设置');};
  const scenes=['scCreate','scWorld','scCatalog'].map(id=>document.getElementById(id));
  const update=()=>{
   const page=scenes.some(s=>!s.classList.contains('off'));
   const sheet=document.getElementById('districtSheet');
   document.documentElement.classList.toggle('phone-page',page);
   document.documentElement.classList.toggle('phone-district',!!sheet&&!sheet.hidden);
  };
  const obs=new MutationObserver(update);scenes.forEach(s=>obs.observe(s,{attributes:true,attributeFilter:['class'],childList:true}));
  const sheets=new MutationObserver(update);sheets.observe(document.getElementById('scWorld'),{subtree:true,attributes:true,attributeFilter:['hidden']});update();
 }
 document.documentElement.classList.toggle('mobile',enabled);
 window.MIRAGE_MOBILE={enabled,viewport,local,rect,animation,duelGeometry,mount};
})();
