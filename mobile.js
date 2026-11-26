var fullscreenButton=document.getElementById('fullscreen');
var settingsButton=document.getElementById('toggle-controls');
var settingsPanel=document.getElementById('controls');
var fullscreenStatus=document.getElementById('fullscreen-status');
var immersive=false,fullscreenBusy=false,portraitCanvas=false;
settingsPanel.hidden=true;
function nativeFullscreen(){return document.fullscreenElement || document.webkitFullscreenElement;}
function refreshMobileLanguage(){
  var active=!!nativeFullscreen();
  setIconButton(fullscreenButton,active?'↙':'⛶',tr(active?'fullscreenExit':'fullscreenEnter'));
  fullscreenButton.setAttribute('aria-pressed',String(active));
  setIconButton(settingsButton,settingsPanel.hidden?'⚙':'✕',tr(settingsPanel.hidden?'settingsOpen':'settingsClose'));
  fullscreenStatus.textContent=immersive && !nativeFullscreen()?tr('fullscreenFallback'):'';
}
function fitMobileCanvas(){
  var viewport=window.visualViewport;
  document.documentElement.style.setProperty('--app-height',(viewport?viewport.height:window.innerHeight)+'px');
  var stage=document.getElementById('game-stage');
  var wasPortrait=portraitCanvas;
  portraitCanvas=stage.clientHeight>stage.clientWidth;
  if(wasPortrait!==portraitCanvas && typeof tilt!=='undefined'){tilt.neutral=null;tilt.x=0;tilt.y=0;}
  stage.classList.toggle('portrait-game',portraitCanvas);
  var availableWidth=portraitCanvas?stage.clientHeight:stage.clientWidth;
  var availableHeight=portraitCanvas?stage.clientWidth:stage.clientHeight;
  if(availableWidth>0 && availableHeight>0){canvas.style.width=availableWidth+'px';canvas.style.height=availableHeight+'px';}
}
function setImmersive(value){
  immersive=value;document.body.classList.toggle('immersive',true);
  if(!value && typeof gameplayReady!=='undefined') gameplayReady=false;
  refreshMobileLanguage();window.requestAnimationFrame(fitMobileCanvas);
}
async function lockLandscape(){
  try{if(window.screen && window.screen.orientation && window.screen.orientation.lock) await window.screen.orientation.lock('landscape');}catch(error){}
}
async function enterGameFullscreen(){
  var enter=document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen;
  if(!nativeFullscreen() && enter){try{await enter.call(document.documentElement);}catch(error){}}
  setImmersive(true);await lockLandscape();
}
async function toggleFullscreen(){
  if(fullscreenBusy) return;
  fullscreenBusy=true;
  try{
    if(nativeFullscreen()){
      var exit=document.exitFullscreen || document.webkitExitFullscreen;
      if(nativeFullscreen() && exit) await exit.call(document);
      setImmersive(false);
    }else{
      settingsPanel.hidden=true;settingsButton.setAttribute('aria-expanded','false');
      await enterGameFullscreen();
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
