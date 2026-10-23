var fullscreenButton=document.getElementById('fullscreen');
var settingsButton=document.getElementById('toggle-controls');
var settingsPanel=document.getElementById('controls');
var fullscreenStatus=document.getElementById('fullscreen-status');
var immersive=false,fullscreenBusy=false;
settingsPanel.hidden=true;
function nativeFullscreen(){return document.fullscreenElement || document.webkitFullscreenElement;}
function refreshMobileLanguage(){
  fullscreenButton.textContent=tr(immersive?'fullscreenExit':'fullscreenEnter');
  fullscreenButton.setAttribute('aria-pressed',String(immersive));
  settingsButton.textContent=tr(settingsPanel.hidden?'settingsOpen':'settingsClose');
  fullscreenStatus.textContent=immersive && !nativeFullscreen()?tr('fullscreenFallback'):'';
}
function fitMobileCanvas(){
  var viewport=window.visualViewport;
  document.documentElement.style.setProperty('--app-height',(viewport?viewport.height:window.innerHeight)+'px');
  var stage=document.getElementById('game-stage');
  var width=Math.min(stage.clientWidth,stage.clientHeight*16/9);
  if(width>0){canvas.style.width=width+'px';canvas.style.height=width*9/16+'px';}
}
function setImmersive(value){
  immersive=value;document.body.classList.toggle('immersive',value);
  refreshMobileLanguage();window.requestAnimationFrame(fitMobileCanvas);
}
async function toggleFullscreen(){
  if(fullscreenBusy) return;
  fullscreenBusy=true;
  try{
    if(immersive || nativeFullscreen()){
      var exit=document.exitFullscreen || document.webkitExitFullscreen;
      if(nativeFullscreen() && exit) await exit.call(document);
      setImmersive(false);
    }else{
      settingsPanel.hidden=true;settingsButton.setAttribute('aria-expanded','false');
      var enter=document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen;
      if(enter){try{await enter.call(document.documentElement);}catch(error){}}
      setImmersive(true);
    }
  }finally{fullscreenBusy=false;}
}
fullscreenButton.addEventListener('click',toggleFullscreen);
settingsButton.addEventListener('click',function(){
  settingsPanel.hidden=!settingsPanel.hidden;
  settingsButton.setAttribute('aria-expanded',String(!settingsPanel.hidden));
  refreshMobileLanguage();window.requestAnimationFrame(fitMobileCanvas);
});
function fullscreenChanged(){setImmersive(!!nativeFullscreen());}
document.addEventListener('fullscreenchange',fullscreenChanged);
document.addEventListener('webkitfullscreenchange',fullscreenChanged);
window.addEventListener('keydown',function(e){if(e.key==='Escape' && immersive && !nativeFullscreen()) setImmersive(false);});
window.addEventListener('resize',fitMobileCanvas);
window.addEventListener('orientationchange',function(){if(typeof tilt!=='undefined') tilt.neutral=null;window.requestAnimationFrame(fitMobileCanvas);});
if(window.visualViewport) window.visualViewport.addEventListener('resize',fitMobileCanvas);
if(window.ResizeObserver) new window.ResizeObserver(fitMobileCanvas).observe(document.getElementById('game-stage'));
refreshMobileLanguage();window.requestAnimationFrame(fitMobileCanvas);
