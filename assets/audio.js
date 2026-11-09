/* Original sound effects and 100 BPM original background music.
   Audio starts after the first genuine user gesture (browser autoplay policy). */
(function(){
'use strict';
const CONFIG_KEY='matter-kitchen-audio-v1';
const DEFAULTS={musicOn:true,effectsOn:true,musicVol:10,effectsVol:45};
let cfg={...DEFAULTS};
try{let saved=JSON.parse(localStorage.getItem(CONFIG_KEY)||'null');if(saved&&typeof saved==='object')cfg={...cfg,...saved};}catch(_){ }
for(const k of ['musicVol','effectsVol'])cfg[k]=Math.max(0,Math.min(100,Number(cfg[k])||0));
const music=new Audio('assets/audio/happy_little_kitchen_loop.mp3');
music.loop=true;music.preload='auto';
let unlocked=false,quickMuted=false,duck=1;
const live=new Set();
const els={musicEnabled:document.getElementById('music-enabled'),effectsEnabled:document.getElementById('effects-enabled'),musicVolume:document.getElementById('music-volume'),effectsVolume:document.getElementById('effects-volume'),musicLabel:document.getElementById('music-volume-label'),effectsLabel:document.getElementById('effects-volume-label'),quick:document.getElementById('audio-quick-toggle')};
function store(){try{localStorage.setItem(CONFIG_KEY,JSON.stringify(cfg));}catch(_){ }}
function syncUI(){
  els.musicEnabled.checked=cfg.musicOn;els.effectsEnabled.checked=cfg.effectsOn;
  els.musicVolume.value=cfg.musicVol;els.effectsVolume.value=cfg.effectsVol;
  els.musicLabel.textContent=cfg.musicVol+'%';els.effectsLabel.textContent=cfg.effectsVol+'%';
  els.musicVolume.disabled=!cfg.musicOn;els.effectsVolume.disabled=!cfg.effectsOn;
  els.quick.textContent=quickMuted?'🔇 MUTED':'🔊 SOUND';
  els.quick.setAttribute('aria-pressed',String(quickMuted));
}
function applyVolumes(){
  const on=cfg.musicOn&&!quickMuted&&cfg.musicVol>0;
  music.volume=on?(cfg.musicVol/100)*duck:0;
  if(!on){if(!music.paused)music.pause();}
  else if(unlocked&&!document.hidden){const p=music.play();if(p&&p.catch)p.catch(()=>{});}
  const ev=cfg.effectsOn&&!quickMuted?cfg.effectsVol/100:0;
  for(const a of live)a.volume=ev*.85;
}
function unlock(){
  if(unlocked)return;
  unlocked=true;applyVolumes();
}
function play(name){
  if(!cfg.effectsOn||quickMuted||cfg.effectsVol<=0)return;
  if(!unlocked)unlock();
  const a=new Audio('assets/audio/'+name+'.mp3');
  a.preload='auto';a.volume=(cfg.effectsVol/100)*.85;
  live.add(a);
  const cleanup=()=>live.delete(a);
  a.addEventListener('ended',cleanup,{once:true});
  a.addEventListener('error',cleanup,{once:true});
  const p=a.play();if(p&&p.catch)p.catch(cleanup);
  return a;
}
function setDuck(factor){duck=Math.max(.08,Math.min(1,factor));applyVolumes();}
function reset(){for(const a of live){a.pause();a.currentTime=0;}live.clear();setDuck(1);}
els.musicEnabled.addEventListener('change',()=>{cfg.musicOn=els.musicEnabled.checked;store();syncUI();applyVolumes();});
els.effectsEnabled.addEventListener('change',()=>{cfg.effectsOn=els.effectsEnabled.checked;store();syncUI();applyVolumes();});
els.musicVolume.addEventListener('input',()=>{cfg.musicVol=Number(els.musicVolume.value);store();syncUI();applyVolumes();});
els.effectsVolume.addEventListener('input',()=>{cfg.effectsVol=Number(els.effectsVolume.value);store();syncUI();applyVolumes();});
els.quick.addEventListener('click',()=>{quickMuted=!quickMuted;syncUI();applyVolumes();});
document.addEventListener('pointerdown',unlock,{capture:true});
document.addEventListener('keydown',unlock,{capture:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden)music.pause();else applyVolumes();});
syncUI();applyVolumes();
window.MatterAudio={play,cooking:(chef,step)=>play(chef+'_step_'+step),surprise:(card)=>play('surprise_'+card.replace(/\.png$/i,'')),celebrate:(chef)=>play('celebration_'+chef),setDuck,reset,unlock,config:cfg};
})();
