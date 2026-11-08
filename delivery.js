/* Public multi-CDN delivery. No credentials, data URLs, or private/local media. */
(() => {
 'use strict';
 const repo='hykhxy/mirage-casino-opening',version='v4';
 const base='https://hykhxy.github.io/mirage-casino-opening/';
 const providers={pages:base,gcore:`https://gcore.jsdelivr.net/gh/${repo}@${version}/`,jsdelivr:`https://cdn.jsdelivr.net/gh/${repo}@${version}/`,fastly:`https://fastly.jsdelivr.net/gh/${repo}@${version}/`};
 let preferred=new URLSearchParams(location.search).get('line')||'auto';
 if(preferred==='auto')try{preferred=localStorage.getItem('mirage-cdn-line')||'auto';}catch(_){}
 const lowPower=matchMedia('(max-width:850px), (pointer:coarse), (prefers-reduced-motion:reduce)').matches;
 const localBase=new URL('./',document.currentScript?.src||location.href).href;
 const cache=new Map(),failures=[];
 function pathOf(value){
  if(!value)return null;
  const s=String(value);let assetPath=s.replace(/^\.\//,'');
  if(!assetPath.startsWith('assets/')){
   let u;try{u=new URL(s,localBase);}catch(_){return null;}
   const known=[...Object.values(providers),localBase,'https://mirage-golden-opening-1108-a17.brown-fawn-2850.chatgpt.site/'];
   if(!known.some(b=>u.href.startsWith(b))&&!u.href.startsWith('https://rawcdn.githack.com/hykhxy/mirage-casino-opening/'))return null;
   const i=u.pathname.indexOf('/assets/');if(i<0)return null;assetPath=u.pathname.slice(i+1);
  }
  assetPath=assetPath.split(/[?#]/)[0];
  if(assetPath.includes('..')||!/^assets\/(?:scene(?:-mobile)?|characters(?:-display|-thumb)?|avatars(?:-small)?|media)\//.test(assetPath))return null;
  return assetPath.replace(/^assets\/scene\//,'assets/scene-mobile/').replace(/^assets\/characters\//,'assets/characters-display/').replace(/^assets\/avatars\/(.*)\.(?:png|jpg)$/,'assets/avatars-small/$1.webp');
 }
 function urls(path){
  path=pathOf(path)||path.replace(/^\.\//,'');
  if(!/^(assets\/|[a-z][\w.-]*\.(?:js|css)$)/i.test(path)||path.includes('..'))return [];
  const order=preferred in providers?[providers[preferred],localBase,...Object.values(providers)]:[localBase,...Object.values(providers)];
  const list=[...new Set(order.map(b=>b+path))];
  const hit=cache.get(path);if(hit&&list.includes(hit))list.splice(list.indexOf(hit),1),list.unshift(hit);
  return list;
 }
 function url(path){return urls(path)[0]||path;}
 function remember(path,value){cache.set(pathOf(path)||path,value);}
 function bindImage(img,path){
  const old=images.get(img);path=pathOf(path);
  if(!path){if(old)img.removeEventListener('error',old.fail);images.delete(img);return;}
  if(old?.path===path&&old.current===img.getAttribute('src'))return;
  if(old)img.removeEventListener('error',old.fail);
  const state={path,list:urls(path),index:0,current:'',fail:null};
  state.fail=()=>{if(images.get(img)!==state)return;failures.push({kind:'image',path,url:state.current});if(++state.index<state.list.length)load();else img.dataset.deliveryError='true';};
  const load=()=>{state.current=state.list[state.index];img.setAttribute('src',state.current);};
  images.set(img,state);img.addEventListener('error',state.fail);
  img.addEventListener('load',()=>{if(images.get(img)===state){remember(path,state.current);delete img.dataset.deliveryError;}},{once:true});
  // A source may have been set immediately before the observer noticed it.
  const current=img.getAttribute('src');if(state.list.includes(current)){state.index=state.list.indexOf(current);state.current=current;}else load();
 }
 const images=new WeakMap();
 function bindMedia(media,path,options={}){
  const list=urls(path);let index=0,disposed=false,timer=null,lastTime=0,wantsPlay=!!options.play;
  const old=mediaBindings.get(media);old?.();
  function clear(){clearTimeout(timer);timer=null;}
  function play(){if((options.shouldPlay?.()??wantsPlay)&&!disposed)media.play().catch(e=>{if(e.name==='NotAllowedError')options.onGesture?.();});}
  function arm(){clear();timer=setTimeout(()=>{if(!disposed&&(media.readyState<2||(!media.paused&&media.currentTime===lastTime)))fail();},options.timeout||11000);lastTime=media.currentTime;}
  function load(){clear();media.src=list[index];media.load();arm();play();options.onLine?.(list[index]);}
  function fail(){
   if(disposed)return;clear();failures.push({kind:media.tagName.toLowerCase(),path,url:list[index]});
   if(index+1<list.length){index++;load();}else{options.onError?.();media.dispatchEvent(new Event('mirage-delivery-error'));}
  }
  function ready(){clear();remember(path,list[index]);play();}
  function stalled(){if(!media.paused)arm();}
  function playing(){wantsPlay=true;clear();}
  function paused(){clear();}
  media.addEventListener('error',fail);media.addEventListener('loadeddata',ready);media.addEventListener('waiting',stalled);media.addEventListener('stalled',stalled);media.addEventListener('playing',playing);media.addEventListener('pause',paused);
  function dispose(){disposed=true;clear();for(const [e,fn]of[['error',fail],['loadeddata',ready],['waiting',stalled],['stalled',stalled],['playing',playing],['pause',paused]])media.removeEventListener(e,fn);}
  mediaBindings.set(media,dispose);load();return dispose;
 }
 const mediaBindings=new WeakMap();
 window.MIRAGE_CDN={version,providers,preferred,lowPower,urls,url,pathOf,bindImage,bindMedia,failures,remember};
 document.documentElement.classList.toggle('lite',lowPower);
 function scan(node){if(node.nodeType!==1)return;if(node.matches('img'))bindImage(node,node.getAttribute('src'));for(const i of node.querySelectorAll('img[src]'))bindImage(i,i.getAttribute('src'));}
 const observer=new MutationObserver(records=>{for(const r of records){if(r.type==='attributes')scan(r.target);else for(const n of r.addedNodes)scan(n);}});
 observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['src']});
 document.addEventListener('DOMContentLoaded',()=>{
  scan(document.body);
  if(parent!==window)parent.postMessage({type:'mirage-public-ready',version,nonce:new URLSearchParams(location.search).get('nonce')},'*');
 });
})();
