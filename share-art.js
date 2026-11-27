var preparedShare=null,shareCardOpen=false,shareCardUrl=null;
var shareArtNames=['monarch','azure','lavender','golden','rose'];
var cuteFaces=['( ^_^ ) ~*','(o^_^o) <3','(=^.^=) /','(*^▽^*) ♡','(づ｡◕‿‿◕｡)づ'];
var shareDialog=document.getElementById('share-card-dialog');
function loadShareArt(index){
  return new Promise(function(resolve,reject){
    var img=new Image();img.onload=function(){resolve(img);};img.onerror=reject;
    img.src='images/share/butterfly-'+shareArtNames[index]+'.png';
  });
}
async function prepareScoreCard(){
  if(shareCardOpen) return;
  preparedShare=null;
  var data=scoreShareData(),score=Math.floor(state.score),flowers=state.flowersCollected;
  var index=Math.floor(Math.random()*5),face=cuteFaces[Math.floor(Math.random()*cuteFaces.length)];
  data.text+='\n'+tr('cuteFlight')+' '+face+'\n  }i{  ~ ~';
  shareCardOpen=true;keys={};
  document.getElementById('game-stage').setAttribute('inert','');
  document.getElementById('controls').setAttribute('inert','');
  document.getElementById('mobile-toolbar').setAttribute('inert','');
  shareDialog.hidden=false;
  document.getElementById('share-card-caption').textContent=data.text;
  document.getElementById('share-card-send').disabled=true;
  document.getElementById('share-card-download').hidden=true;
  document.getElementById('share-card-image').hidden=true;
  document.getElementById('share-card-status').textContent=tr('cardPreparing');
  try{
    var img=await loadShareArt(index);
    var card=document.createElement('canvas');card.width=1080;card.height=1080;
    var brush=card.getContext('2d');brush.drawImage(img,0,0,1080,1080);
    brush.fillStyle='rgba(16,26,43,0.88)';brush.fillRect(0,790,1080,290);
    brush.textAlign='center';brush.fillStyle='#fff1b6';
    brush.font='bold 32px sans-serif';brush.fillText('FLYBOT  }i{',540,832,1000);
    brush.font='bold 64px sans-serif';brush.fillText(score+' '+tr('POINTS'),540,906,1000);
    brush.font='26px sans-serif';brush.fillText(flowers+' / 888 · '+tr('FLEURS BUTINÉES'),540,952,1000);
    brush.font='25px sans-serif';brush.fillText(tr('cuteFlight')+' '+face,540,1000,1000);
    brush.font='19px sans-serif';brush.fillStyle='#cfdeea';brush.fillText('unispourlapaix.github.io/Flybot/',540,1040);
    var blob=await new Promise(function(resolve){card.toBlob(resolve,'image/png');});
    if(!blob) throw new Error('No image');
    if(shareCardUrl) URL.revokeObjectURL(shareCardUrl);
    shareCardUrl=URL.createObjectURL(blob);
    var preview=document.getElementById('share-card-image');preview.src=shareCardUrl;preview.alt=tr('cardPreview');preview.hidden=false;
    var download=document.getElementById('share-card-download');download.href=shareCardUrl;download.download='flybot-'+score+'-'+shareArtNames[index]+'.png';download.hidden=false;
    preparedShare={data:data,file:typeof File==='function'?new File([blob],download.download,{type:'image/png'}):null};
    document.getElementById('share-card-status').textContent='';
  }catch(error){
    preparedShare={data:data,file:null};
    document.getElementById('share-card-status').textContent=tr('cardError');
  }
  document.getElementById('share-card-send').disabled=false;
  document.getElementById('share-card-send').focus();
}
function closeShareCard(){
  if(document.getElementById('share-card-send').disabled) return;
  shareDialog.hidden=true;shareCardOpen=false;preparedShare=null;
  ['game-stage','controls','mobile-toolbar'].forEach(function(id){document.getElementById(id).removeAttribute('inert');});
  state.touchX=state.butterfly.x;state.touchY=state.butterfly.y;keys={};tilt.neutral=null;
  shareButton.focus();
}
document.getElementById('share-card-send').addEventListener('click',shareScore);
document.getElementById('share-card-close').addEventListener('click',closeShareCard);
window.addEventListener('keydown',function(e){
  if(!shareCardOpen) return;
  if(e.key==='Escape') closeShareCard();
  if(e.key==='Tab'){
    var controls=Array.prototype.slice.call(shareDialog.querySelectorAll('button,a[href],textarea'))
      .filter(function(el){return !el.hidden && !el.disabled;});
    if(!controls.length) return;
    var first=controls[0],last=controls[controls.length-1];
    if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
  }
});
