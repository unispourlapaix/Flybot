var musicTracks=['vole-vole-esprit-de-paix','soar-soar-spirit-of-peace','je-leve-mes-yeux-vers-les-montagnes'];
var musicPlayer=document.getElementById('music-player');
var musicSelect=document.getElementById('music-track');
var musicStatus=document.getElementById('music-status');
var musicIndex=0,musicFallback=false,musicErrorKey='';
var musicEnabled=readPreference('music',true)!==false;
var musicButton=document.getElementById('music-toggle');
var savedVolume=readPreference('music-volume',0.35);
musicPlayer.volume=typeof savedVolume==='number' && savedVolume>=0 && savedVolume<=1?savedVolume:0.35;

function refreshMusicLanguage(){
  musicPlayer.setAttribute('aria-label',tr('musicPlayer'));
  document.getElementById('music-panel').setAttribute('aria-label',tr('musicLabel'));
  musicStatus.textContent=musicErrorKey?tr(musicErrorKey):'';
  musicButton.textContent=tr(musicEnabled?'musicOn':'musicOff');
  musicButton.setAttribute('aria-pressed',String(musicEnabled));
}
function playMusic(){
  if(!musicEnabled) return Promise.resolve();
  var result=musicPlayer.play();
  return result && result.catch?result.catch(function(error){
    if(error.name==='AbortError') return;
    musicErrorKey='musicPlayHint';refreshMusicLanguage();
  }):Promise.resolve();
}
function selectMusic(index,resume){
  if(!Number.isInteger(index)) index=0;
  musicIndex=(index+musicTracks.length)%musicTracks.length;
  savePreference('music-track',musicIndex);
  musicFallback=false;musicErrorKey='';
  musicSelect.value=String(musicIndex);
  musicPlayer.pause();
  musicPlayer.src='audio/'+musicTracks[musicIndex]+'.mp4';
  document.getElementById('music-download').href='audio/'+musicTracks[musicIndex]+'.mp3';
  musicPlayer.load();refreshMusicLanguage();
  if(resume) playMusic();
}
musicSelect.addEventListener('change',function(){selectMusic(Number(musicSelect.value),true);});
musicPlayer.addEventListener('ended',function(){selectMusic(musicIndex+1,true);});
musicPlayer.addEventListener('playing',function(){musicErrorKey='';refreshMusicLanguage();});
musicPlayer.addEventListener('error',function(){
  if(!musicFallback){
    musicFallback=true;musicPlayer.src='audio/'+musicTracks[musicIndex]+'.mp3';musicPlayer.load();playMusic();
  }else{musicErrorKey='musicError';refreshMusicLanguage();}
});

musicButton.addEventListener('click',function(){
 musicEnabled=!musicEnabled;savePreference('music',musicEnabled);
 if(musicEnabled) playMusic();else musicPlayer.pause();
 refreshMusicLanguage();
});
musicPlayer.addEventListener('volumechange',function(){savePreference('music-volume',musicPlayer.volume);});
musicPlayer.addEventListener('play',function(){if(!musicEnabled){musicEnabled=true;savePreference('music',true);refreshMusicLanguage();}});
selectMusic(readPreference('music-track',0),false);
