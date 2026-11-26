var gameplayReady=false,landscapeRequired=true;
var launching=false;
async function launchGame(){
  if(launching || gameplayReady) return;
  launching=true;
  // Invoke permission-sensitive APIs in the same user gesture, before awaiting.
  var sensors=readPreference('tilt',true)!==false?enableTilt():Promise.resolve();
  if(soundEnabled) playSound('envol');
  var music=playMusic();
  var screen=enterGameFullscreen();
  try{await Promise.allSettled([sensors,music,screen]);}
  finally{
    gameplayReady=true;launching=false;
    keys={};state.touchX=state.butterfly.x;state.touchY=state.butterfly.y;tilt.neutral=null;
  }
}
canvas.addEventListener('click',launchGame);
// Ungated sensor initialization and best-effort music playback at page load.
startDefaultTilt();
playMusic();

// Keep the full-window landscape layout visible before the first gesture.
setImmersive(true);
