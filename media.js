(() => {
 'use strict';
 const CDN=window.MIRAGE_CDN;
 const tracks=[{name:'松原みき · 真夜中のドア〜stay with me',path:'assets/media/track-1.mp3'},{name:'草蜢 · 半点心',path:'assets/media/track-2.mp3'},{name:'bluesky · 相思遥（DJ降调版）',path:'assets/media/track-3.mp3'}];
 const audio=document.createElement('audio');audio.id='backgroundMusic';audio.preload='none';audio.volume=.88;document.body.appendChild(audio);
 const dock=document.createElement('div');dock.id='musicDock';dock.innerHTML='<button id="musicToggle" aria-label="播放或暂停背景音乐">♫</button><select id="musicTrack" aria-label="选择背景音乐">'+tracks.map((t,i)=>'<option value="'+i+'">'+t.name+'</option>').join('')+'</select><label title="背景音乐音量"><span>音乐</span><input id="musicVolume" type="range" min="0" max="1" step=".01" value=".88" aria-label="背景音乐音量"></label><label title="游戏音效音量"><span>音效</span><input id="sfxVolume" type="range" min="0" max=".3" step=".01" value=".12" aria-label="游戏音效音量"></label><select id="assetLine" aria-label="资源线路" title="切换资源线路会重新打开开端"><option value="auto">自动线路</option><option value="pages">Pages</option><option value="gcore">Gcore CDN</option><option value="jsdelivr">jsDelivr</option><option value="fastly">Fastly CDN</option></select>';app.appendChild(dock);
 const line=dock.querySelector('#assetLine');line.value=CDN.preferred;
 line.onchange=()=>{try{localStorage.setItem('mirage-cdn-line',line.value);}catch(_){}const u=new URL(location.href);u.searchParams.set('line',line.value);location.replace(u);};
 const badge=document.createElement('button');badge.id='backgroundLoad';badge.hidden=true;app.appendChild(badge);
 for(const event of ['pointerdown','click','keydown'])dock.addEventListener(event,e=>e.stopPropagation());
 const button=dock.querySelector('#musicToggle'),select=dock.querySelector('#musicTrack');let track=0,welcomed=false,wantMusic=false;
 const play=()=>{wantMusic=true;audio.play().then(()=>{button.textContent='Ⅱ';button.title='暂停音乐';},()=>{button.textContent='▶';button.title='轻触播放音乐';});};
 function pick(i,start=true){track=i;select.value=String(i);wantMusic=start;CDN.bindMedia(audio,tracks[i].path,{play:start,shouldPlay:()=>wantMusic,onGesture:()=>{button.textContent='▶';button.title='轻触播放音乐';},onLine:u=>button.title='音乐线路：'+new URL(u).hostname,onError:()=>{button.textContent='↻';button.title='所有音乐线路暂未连通，轻触重试或切换线路';}});}
 button.onclick=e=>{e.stopPropagation();if(!audio.src||audio.error||button.textContent==='↻')pick(track);else if(audio.paused)play();else{wantMusic=false;audio.pause();}};
 select.onchange=e=>{e.stopPropagation();pick(Number(select.value));};
 dock.querySelector('#musicVolume').oninput=e=>{audio.volume=Number(e.target.value);};
 dock.querySelector('#sfxVolume').oninput=e=>{audioInit();window.USER_SFX_VOLUME=Number(e.target.value);muted=false;if(master)master.gain.value=window.USER_SFX_VOLUME;};
 audio.addEventListener('pause',()=>button.textContent='▶');audio.addEventListener('playing',()=>button.textContent='Ⅱ');audio.addEventListener('ended',()=>pick((track+1)%tracks.length));
 window.MIRAGE_MEDIA={tracks,audio,
  initWelcome(start){
   const video=document.getElementById('welcomeVideo'),screen=document.getElementById('welcomeScreen'),sound=document.getElementById('videoSound'),note=document.getElementById('videoNote');
   video.volume=.9;video.poster=CDN.url('assets/media/welcome-poster.jpg');
   const disposeWelcome=CDN.bindMedia(video,'assets/media/'+(CDN.lowPower?'welcome-mobile.mp4':'welcome-desktop.mp4'),{play:true,shouldPlay:()=>!welcomed,onGesture:()=>note.textContent='轻触视频声音按钮播放影片',onError:()=>note.textContent='视频线路暂未连通 · 可直接进入，或切换资源线路'});
   sound.onclick=e=>{e.stopPropagation();video.muted=!video.muted;video.play().catch(()=>{});sound.textContent=video.muted?'视频声音 · 开启':'视频声音 · 已开启';};
   document.getElementById('welcomeEnter').onclick=e=>{e.stopPropagation();if(welcomed)return;welcomed=true;audioInit();disposeWelcome();video.pause();video.muted=true;video.removeAttribute('src');video.load();screen.hidden=true;pick(0);start();};
   badge.onclick=()=>{if(window.LOAD_STATE?.failed.length)window.retryBackgroundLoad?.();};
  },
  updateLoad(s){badge.hidden=!s.entered||s.done>=s.total;if(s.entered){badge.textContent=s.failed.length?'首屏 '+s.failed.length+' 项待补载 · 重试':'首屏补载 '+s.done+' / '+s.total;badge.classList.toggle('warn',!!s.failed.length);}}
 };
})();
