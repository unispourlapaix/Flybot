var musicTracks=['vole-vole-esprit-de-paix','soar-soar-spirit-of-peace','je-leve-mes-yeux-vers-les-montagnes'];
var musicPlayer=document.getElementById('music-player');
var musicSelect=document.getElementById('music-track');
var musicStatus=document.getElementById('music-status');
var musicIndex=0,musicFallback=false,musicErrorKey='';
musicPlayer.volume=0.35;
function refreshMusicLanguage(){
  musicPlayer.setAttribute('aria-label',tr('musicPlayer'));
  document.getElementById('music-panel').setAttribute('aria-label',tr('musicLabel'));
  musicStatus.textContent=musicErrorKey?tr(musicErrorKey):'';
}
function playMusic(){
  var result=musicPlayer.play();
  if(result && result.catch) result.catch(function(error){
    if(error.name==='AbortError') return;
    musicErrorKey='musicPlayHint';refreshMusicLanguage();
  });
}
function selectMusic(index,resume){
  musicIndex=(index+musicTracks.length)%musicTracks.length;
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
