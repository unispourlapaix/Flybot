var gameplayReady=false,landscapeRequired=true;
var launchPanel=document.getElementById('launch-panel');
var launchButton=document.getElementById('launch-game');
var launching=false;
async function launchGame(){
  if(launching) return;
  launching=true;launchButton.disabled=true;
  // Invoke permission-sensitive APIs in the same user gesture, before awaiting.
  var sensors=readPreference('tilt',true)!==false?enableTilt():Promise.resolve();
  if(soundEnabled) playSound('envol');
  var music=playMusic();
  var screen=readPreference('fullscreen',true)!==false?enterGameFullscreen():Promise.resolve();
  try{await Promise.allSettled([sensors,music,screen]);}
  finally{
    gameplayReady=true;launchPanel.hidden=true;launching=false;launchButton.disabled=false;
    keys={};state.touchX=state.butterfly.x;state.touchY=state.butterfly.y;tilt.neutral=null;
  }
}
launchButton.addEventListener('click',launchGame);
// Ungated sensor initialization and best-effort music playback at page load.
startDefaultTilt();
playMusic();
