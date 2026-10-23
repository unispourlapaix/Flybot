var BUILD_VERSION = '2026.10.23.7';
console.info('Flybot build ' + BUILD_VERSION);
var canvas = document.getElementById('game');
var ctx = canvas.getContext('2d');
var scoreEl = document.getElementById('score');
var bonusEl = document.getElementById('bonus');
var livesEl = document.getElementById('lives');
var levelEl = document.getElementById('level');
var flowerEl = document.getElementById('flower');
var nectarEl = document.getElementById('nectar');
var FLOWER_GOAL=888;
var harvestBar=document.getElementById('harvest-progress');
var harvestText=document.getElementById('harvest-text');
var dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
canvas.width = 960 * dpr;
canvas.height = 540 * dpr;
ctx.setTransform(dpr,0,0,dpr,0,0);

var state = {
  t:0, score:0, flowersCollected:0, flightPoints:0, gameOver:false, lives:3, invulnerable:0, level:1,
  butterfly:{x:200,y:270,vx:0,vy:0,shield:false,agility:1},
  wind:0, heartRobots:[], meadowFlowers:[], fireworks:[], obstacles:[], bonuses:[], touchX:200, touchY:270, megaFlower:null, nextFlowerScore:100, flowerProgress:0, message:'', messageTimer:0
};

var shareButton=document.getElementById('share-score');
var shareStatus=document.getElementById('share-status');
var shareFallback=document.getElementById('share-fallback');
function scoreShareData(){
  if(typeof preparedShare!=='undefined' && preparedShare) return preparedShare.data;
  return {title:tr('Mon vol sur Flybot'),
    text:tr('shareText',{score:Math.floor(state.score),flowers:state.flowersCollected}),
    url:'https://unispourlapaix.github.io/Flybot/'};
}
async function shareScore(){
  var data=scoreShareData(), text=data.text+'\n'+data.url;
  shareFallback.hidden=true;shareStatus.textContent='';
  shareButton.disabled=true;
  try{
    if(window.navigator && typeof window.navigator.share==='function'){
      try{
        var payload=data;
        if(typeof preparedShare!=='undefined' && preparedShare && preparedShare.file && window.navigator.canShare && window.navigator.canShare({files:[preparedShare.file]})){
          payload={title:data.title,text:data.text,url:data.url,files:[preparedShare.file]};
        }
        await window.navigator.share(payload);shareStatus.textContent=tr('Partage terminé.');return;}
      catch(error){if(error.name==='AbortError'){shareStatus.textContent=tr('Partage annulé.');return;}}
    }
    if(window.navigator && window.navigator.clipboard){
      try{await window.navigator.clipboard.writeText(text);shareStatus.textContent=tr('Score et lien copiés !');return;}catch(error){}
    }
    shareFallback.value=text;shareFallback.hidden=false;shareFallback.focus();shareFallback.select();
    shareStatus.textContent=tr('Copie ce texte pour partager ton score.');
  }finally{shareButton.disabled=false;}
}
shareButton.addEventListener('click',function(){
  if(typeof prepareScoreCard==='function') prepareScoreCard();else shareScore();
});

// Lecture activée uniquement après une action volontaire du joueur.
var soundEnabled=false, soundPool={}, soundButton=document.getElementById('sound');
function playSound(name){
  if(!soundEnabled || !window.Audio) return;
  var clip=soundPool[name];
  if(!clip){clip=new window.Audio('audio/'+name+'.wav');clip.volume=0.45;soundPool[name]=clip;}
  clip.currentTime=0;
  var playing=clip.play();if(playing && playing.catch) playing.catch(function(){});
}
soundButton.addEventListener('click',function(){
  soundEnabled=!soundEnabled;
  soundButton.textContent=soundEnabled?tr('Son : activé'):tr('Son : coupé');
  soundButton.setAttribute('aria-pressed',String(soundEnabled));
  if(soundEnabled) playSound('envol');
  else Object.keys(soundPool).forEach(function(key){soundPool[key].pause();});
});

function rand(a,b){ return Math.random()*(b-a)+a; }
// Vue de côté : les coordonnées du jeu correspondent aux pixels du canvas.
var track = {minY:70, maxY:470, height:0};
function projectTrack(x,y,z){ return {x:x,y:y-(z || 0)}; }

function px(x,y,w,h,col){ctx.fillStyle=col;ctx.fillRect(Math.round(x),Math.round(y),w,h)}
function edge(x,y,w,h,col){col = col || '#1f1f1f'; ctx.strokeStyle=col;ctx.lineWidth=1;ctx.strokeRect(Math.round(x)+0.5,Math.round(y)+0.5,w,h)}

function enemyType(roll){
  if(roll<0.002) return 'alien';
  if(roll<0.012) return 'ufo';
  if(roll<0.25) return 'hornet';
  return roll<0.75?'bird':'rock';
}
function resetObstacle(o,index,initial){
  o.type=initial?(index%3===2?'rock':'bird'):enemyType(Math.random());
  o.called=false;o.defeated=false;
  o.x=rand(1020,1400)+index*220;
  o.y=o.type==='rock'?460:rand(150,390);
  o.baseY=o.y;
  o.speed=o.type==='rock'?0.85:(o.type==='hornet'?1.8:(o.type==='ufo'||o.type==='alien'?1.45:rand(1.1,1.6)));
}
for(var i=0;i<3;i++){ var obstacle={}; resetObstacle(obstacle,i,true); state.obstacles.push(obstacle); }
for(var i=0;i<6;i++) state.bonuses.push({x:rand(900,1420),y:rand(100,430),type:['Fleur','Soleil','Abeille'][(Math.random()*3)|0]});

function setY(clientY){
  var r=canvas.getBoundingClientRect();
  var screenY=(clientY-r.top)*(540/r.height);
  state.touchY=Math.max(track.minY,Math.min(track.maxY,screenY));
};
var keys={}, tilt={autoPending:false,enabled:false,neutral:null,x:0,y:0,angle:null};
var tiltSensitivity=100;
var sensitivitySlider=document.getElementById('tilt-sensitivity');
var sensitivityValue=document.getElementById('tilt-sensitivity-value');
function setTiltSensitivity(value,persist){
  var number=Number(value);
  tiltSensitivity=Number.isFinite(number) && number>=50 && number<=200?Math.round(number/10)*10:100;
  sensitivitySlider.value=String(tiltSensitivity);
  sensitivityValue.textContent=tiltSensitivity+' %';
  sensitivitySlider.setAttribute('aria-valuetext',tiltSensitivity+' %');
  if(persist){try{window.localStorage.setItem('flybot-tilt-sensitivity',String(tiltSensitivity));}catch(error){}}
}
try{setTiltSensitivity(window.localStorage.getItem('flybot-tilt-sensitivity'),false);}catch(error){setTiltSensitivity(100,false);}
sensitivitySlider.addEventListener('input',function(e){setTiltSensitivity(e.target.value,true);});
var tiltButton=document.getElementById('tilt');
var controlStatus=document.getElementById('control-status');
function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
function setPointer(e){
  if(tilt.enabled) return;
  var r=canvas.getBoundingClientRect();
  if(typeof portraitCanvas!=='undefined' && portraitCanvas){
    state.touchX=clamp((e.clientY-r.top)*960/r.height,35,925);
    state.touchY=clamp((r.left+r.width-e.clientX)*540/r.width,track.minY,track.maxY);
  }else{
    state.touchX=clamp((e.clientX-r.left)*960/r.width,35,925);
    setY(e.clientY);
  }
}
canvas.addEventListener('pointerdown',function(e){
  if(canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
  setPointer(e);
});
canvas.addEventListener('pointermove',function(e){if(e.pointerType==='mouse' || e.buttons || e.pressure>0) setPointer(e);});
canvas.addEventListener('pointercancel',function(){state.touchX=state.butterfly.x;state.touchY=state.butterfly.y;});
window.addEventListener('keydown',function(e){
  if(e.target && /^(SELECT|INPUT|TEXTAREA|BUTTON|AUDIO)$/.test(e.target.tagName)) return;
  var key=e.key.toLowerCase();
  if(['arrowup','arrowdown','arrowleft','arrowright',' '].indexOf(key)>=0) e.preventDefault();
  keys[key]=true;
  if((key===' ' || key==='enter') && state.gameOver) resetGame();
});
window.addEventListener('keyup',function(e){delete keys[e.key.toLowerCase()];});
window.addEventListener('blur',function(){keys={};tilt.x=0;tilt.y=0;});
function stopTilt(message){
  tilt.autoPending=false;tilt.enabled=false;tilt.neutral=null;tilt.x=0;tilt.y=0;
  state.touchX=state.butterfly.x;state.touchY=state.butterfly.y;
  tiltButton.textContent=tr('Activer l’inclinaison');tiltButton.setAttribute('aria-pressed','false');
  controlStatus.textContent=message || tr('Souris, doigt ou flèches / ZQSD');
}
function startDefaultTilt(){
  var sensor=window.DeviceOrientationEvent;
  tilt.autoPending=!!(window.isSecureContext && sensor && typeof sensor.requestPermission!=='function');
}
function handleOrientation(e){
  if(!Number.isFinite(e.beta) || !Number.isFinite(e.gamma)) return;
  if(tilt.autoPending){
    tilt.autoPending=false;tilt.enabled=true;tilt.neutral=null;tilt.x=0;tilt.y=0;
    tiltButton.textContent=tr('Désactiver l’inclinaison');tiltButton.setAttribute('aria-pressed','true');
  }
  if(!tilt.enabled) return;
  var angle=window.screen && window.screen.orientation?window.screen.orientation.angle:(window.orientation || 0);
  var rad=angle*Math.PI/180;
  var x=e.gamma*Math.cos(rad)+e.beta*Math.sin(rad);
  var y=e.beta*Math.cos(rad)-e.gamma*Math.sin(rad);
  if(!tilt.neutral || tilt.angle!==angle){tilt.neutral={x:x,y:y};tilt.angle=angle;}
  function axis(v){return Math.abs(v)<2?0:clamp((v-Math.sign(v)*2)/20*(tiltSensitivity/100),-1,1);}
  var tiltX=axis(x-tilt.neutral.x),tiltY=axis(y-tilt.neutral.y);
  if(typeof portraitCanvas!=='undefined' && portraitCanvas){tilt.x=tiltY;tilt.y=-tiltX;}
  else{tilt.x=tiltX;tilt.y=tiltY;}
  controlStatus.textContent=tr('Incline pour voler • position de départ calibrée');
}
window.addEventListener('deviceorientation',handleOrientation);
tiltButton.addEventListener('click',async function(){
  tilt.autoPending=false;
  if(tilt.enabled){stopTilt();return;}
  if(!window.isSecureContext){stopTilt(tr('Inclinaison : ouvre le jeu en HTTPS ou localhost.'));return;}
  var sensor=window.DeviceOrientationEvent;
  if(!sensor){stopTilt(tr('Capteurs indisponibles : utilise le doigt ou les flèches.'));return;}
  try{
    if(typeof sensor.requestPermission==='function' && await sensor.requestPermission()!=='granted'){
      stopTilt(tr('Accès aux capteurs refusé : le contrôle tactile reste disponible.'));return;
    }
    tilt.enabled=true;tilt.neutral=null;tilt.x=0;tilt.y=0;
    tiltButton.textContent=tr('Désactiver l’inclinaison');tiltButton.setAttribute('aria-pressed','true');
    controlStatus.textContent=tr('Tiens le téléphone confortablement : calibration…');
    window.setTimeout(function(){if(tilt.enabled && !tilt.neutral) stopTilt(tr('Aucune donnée capteur : utilise le doigt ou les flèches.'));},4000);
  }catch(error){stopTilt(tr('Capteurs indisponibles : utilise le doigt ou les flèches.'));}
});
canvas.addEventListener('click',function(){ if(state.gameOver) resetGame(); });

function updateHud(){
  scoreEl.textContent=Math.floor(state.score);
  levelEl.textContent=state.level;
  livesEl.textContent=state.lives===3?'♥♥♥':(state.lives===2?'♥♥♡':(state.lives===1?'♥♡♡':'♡♡♡'));
  flowerEl.textContent=state.flowersCollected;
  var harvested=Math.min(FLOWER_GOAL,state.flowersCollected);
  harvestBar.max=FLOWER_GOAL;harvestBar.value=harvested;
  harvestBar.setAttribute('aria-label',tr('harvestLabel'));
  harvestText.textContent=tr(state.flowersCollected>=FLOWER_GOAL?'harvestDone':'harvestProgress',
    {count:state.flowersCollected,goal:FLOWER_GOAL,percent:Math.floor(harvested/FLOWER_GOAL*100)});
  bonusEl.textContent=tr(state.bonus || 'AUCUN');
  nectarEl.textContent=state.megaFlower?tr('FLEUR RARE : BUTINAGE {progress} %',{progress:Math.floor(state.flowerProgress)}):tr('FLEUR +100 • RARE +10 000');
};

function resetEntity(entity,minX,maxX,minY,maxY){
  entity.x=rand(minX,maxX); entity.y=rand(minY,maxY);
};

function resetGame(){
  state.t=0; state.heartRobots=[]; state.fireworks=[]; state.score=0; state.flowersCollected=0; state.flightPoints=0; state.gameOver=false; state.lives=3; state.invulnerable=150; state.level=1;
  state.meadowFlowers=[];initMeadowFlowers();
  state.butterfly.color=null;state.butterfly.accent=null;
  state.butterfly.x=200; state.butterfly.y=270; state.butterfly.vx=0; state.butterfly.vy=0; tilt.neutral=null; state.butterfly.shield=false; state.butterfly.agility=1;
  state.touchX=200; state.touchY=270; state.megaFlower=null; state.nextFlowerScore=100; state.flowerProgress=0; state.message='ENVOL !'; state.messageTimer=95;
  for(var oi=0;oi<state.obstacles.length;oi++) resetObstacle(state.obstacles[oi],oi,true);
  for(var bi=0;bi<state.bonuses.length;bi++) resetEntity(state.bonuses[bi],900,1420,100,430);
  slowTimer=0; shieldTimer=0; agileTimer=0; state.bonus='AUCUN'; updateHud();
};

function hitButterfly(obstacle){
  if(state.invulnerable>0) return;
  if(obstacle.defeated) return;
  if(state.butterfly.shield){
    state.butterfly.shield=false;shieldTimer=0;state.invulnerable=45;
    var rewards={bird:250,hornet:400,ufo:1000,alien:2500};
    var reward=rewards[obstacle.type] || 0;
    if(reward){state.score+=reward;flowerFirework(obstacle.x,obstacle.y);playSound('bonus-pok');}
    state.message=reward?'shieldReward':'BOUCLIER !';state.messagePoints=reward;state.messageTimer=95;
    obstacle.defeated=true;obstacle.x=-120;updateHud();return;
  }
  playSound('choc-doux');
  state.lives--; state.invulnerable=150; state.message=state.lives>0?'OUPS !':'FIN DE VOL'; state.messageTimer=95; obstacle.x=-120;
  if(state.lives<=0) state.gameOver=true;
  updateHud();
};

function drawDiamond(x,y,w,h,col){
  ctx.fillStyle=col; ctx.beginPath();
  ctx.moveTo(x,y);ctx.lineTo(x+w,y+h*0.5);ctx.lineTo(x,y+h);ctx.lineTo(x-w,y+h*0.5);
  ctx.closePath();ctx.fill();
};

function drawSkyGarden(){
  var bands=['#16213e','#213a5c','#315d77','#f28f6b','#f7c875','#fff1b6'];
  var heights=[0,58,112,166,214,258];
  for(var i=0;i<bands.length;i++){
    ctx.fillStyle=bands[i];
    ctx.fillRect(0,heights[i],960,(heights[i+1] || 300)-heights[i]);
  }
  ctx.fillStyle='#ffe66d';
  px(735,62,72,12,'#ffe66d');
  px(723,74,96,12,'#ffe66d');
  px(715,86,112,28,'#ffe66d');
  px(723,114,96,12,'#ffe66d');
  px(735,126,72,12,'#ffe66d');
  px(0,138,960,6,'#f7bd68');
  px(0,154,960,4,'#f58b68');

  var cloudShift=Math.floor(Math.sin(state.t*0.004)*8);
  function pixelCloud(x,y,scale){
    px(x+cloudShift,y,52*scale,8*scale,'#fff6d5');
    px(x+10*scale+cloudShift,y-8*scale,38*scale,8*scale,'#fff6d5');
    px(x+18*scale+cloudShift,y-16*scale,18*scale,8*scale,'#fff6d5');
    px(x+6*scale+cloudShift,y+8*scale,62*scale,6*scale,'#e9d8bb');
  }
  pixelCloud(112,74,1);
  pixelCloud(470,106,1);
  pixelCloud(840,164,0.75);
};

function drawMountains(){
  function mountain(x,base,w,h,light,mid,dark,snow){
    ctx.fillStyle=dark; ctx.beginPath();
    ctx.moveTo(x-w,base);ctx.lineTo(x,base-h);ctx.lineTo(x+w,base);ctx.closePath();ctx.fill();
    ctx.fillStyle=mid; ctx.beginPath();
    ctx.moveTo(x-w,base);ctx.lineTo(x,base-h);ctx.lineTo(x-8,base);ctx.closePath();ctx.fill();
    ctx.fillStyle=light; ctx.beginPath();
    ctx.moveTo(x-w*0.42,base-h*0.42);ctx.lineTo(x,base-h);ctx.lineTo(x+w*0.36,base-h*0.38);ctx.lineTo(x+8,base-h*0.25);ctx.closePath();ctx.fill();
    ctx.fillStyle=snow; ctx.beginPath();
    ctx.moveTo(x,base-h);ctx.lineTo(x+w*0.24,base-h*0.66);ctx.lineTo(x+4,base-h*0.74);ctx.lineTo(x-w*0.20,base-h*0.58);ctx.lineTo(x-w*0.34,base-h*0.62);ctx.closePath();ctx.fill();
  }
  mountain(92,260,160,122,'#8ec07c','#527c62','#304d57','#f8f4d8');
  mountain(272,266,220,186,'#91c779','#5a8a64','#355363','#fffbea');
  mountain(520,270,250,210,'#9bd27e','#608e68','#39586b','#fffbea');
  mountain(758,268,210,164,'#91c779','#577e60','#304d57','#f8f4d8');
  mountain(928,268,150,116,'#86b977','#4d765e','#2b4754','#f8f4d8');
  px(0,258,960,16,'#365f54');
};

var meadowKinds=[
  {color:'#e989d5',accent:'#ffd0ee',bonus:'Abeille'},
  {color:'#7abdf5',accent:'#c4edff',bonus:'Soleil'},
  {color:'#b79bf4',accent:'#ebddff',bonus:'Fleur'}
];
function initMeadowFlowers(){
  for(var i=0;i<3;i++) state.meadowFlowers.push({x:650+i*500,y:454+i*4,kind:i});
}
function drawMeadowFlower(f){
  var c=meadowKinds[f.kind].color;
  px(f.x-1,f.y+8,3,40,'#376d44');
  drawDiamond(f.x-8,f.y+26,8,8,'#71b463');
  for(var i=0;i<6;i++){
    var angle=i*Math.PI/3;drawDiamond(f.x+Math.cos(angle)*12,f.y+Math.sin(angle)*10-7,8,14,c);
  }
  drawDiamond(f.x,f.y-4,7,10,'#fff1a1');
}
function collectMeadowFlower(f){
  var kind=meadowKinds[f.kind];
  collectFlower(f,150);state.butterfly.color=kind.color;state.butterfly.accent=kind.accent;
  applyBonus(kind.bonus);f.x=rand(1200,1800);f.kind=(f.kind+1)%meadowKinds.length;
}
function updateMeadowFlowers(){
  state.meadowFlowers.forEach(function(f){
    f.x-=0.55;
    if(f.x<-50) f.x=rand(1100,1700);
    if(Math.abs(f.x-state.butterfly.x)<30 && Math.abs(f.y-state.butterfly.y)<28) collectMeadowFlower(f);
  });
}
initMeadowFlowers();

// Petit robot bienveillant : le cœur est son point de collecte, pas un obstacle.
function heartPosition(robot){return {x:robot.x,y:robot.y+Math.sin(state.t*0.035+robot.phase)*5};}
function drawHeartRobot(robot){
  var p=heartPosition(robot),x=p.x,y=p.y;
  px(x-18,y-31,36,23,'#533c35');px(x-15,y-29,30,18,'#ac7550');
  px(x-13,y-27,8,5,'#d7a16b');px(x+7,y-23,6,8,'#784333');
  px(x-10,y-22,5,5,'#bde8dc');px(x+5,y-22,5,5,'#bde8dc');px(x-5,y-13,10,2,'#3c383c');
  px(x-1,y-40,3,9,'#8a7770');px(x-4,y-43,9,5,'#cf9462');
  px(x-16,y-5,32,27,'#986340');px(x-12,y+1,24,15,'#b58054');
  px(x-23,y-4,7,22,'#b48058');px(x+16,y-4,7,22,'#b48058');
  px(x-15,y+22,10,9,'#76665f');px(x+5,y+22,10,9,'#76665f');
  px(x-15,y+30,12,4,'#493d3b');px(x+3,y+30,12,4,'#493d3b');
  // Cœur rouge tenu devant lui, avec reflet rose.
  px(x-12,y-7,9,7,'#ff4e65');px(x+3,y-7,9,7,'#ff4e65');
  px(x-15,y-1,30,8,'#e72f4f');px(x-11,y+7,22,5,'#e72f4f');
  px(x-6,y+12,12,5,'#d72546');px(x-2,y+17,4,3,'#d72546');
  px(x-9,y-4,5,4,'#ffc4cb');
}
function updateHeartRobots(){
  if(state.gameOver) return;
  state.heartRobots=state.heartRobots.filter(function(robot){
    robot.x-=0.8;
    var p=heartPosition(robot),b=state.butterfly;
    if(Math.abs(p.x-b.x)<33 && Math.abs(p.y-b.y)<33){
      if(state.lives<3){
        state.lives++;state.message='robotLife';state.messageTimer=100;
        playSound('envol');flowerFirework(p.x,p.y);updateHud();return false;
      }
      if(!robot.fullHint){state.message='robotFull';state.messageTimer=80;robot.fullHint=true;}
    }
    return robot.x>-60;
  });
}

function drawSpringFlowers(){
  for(var i=0;i<32;i++){
    var x=((i*37-state.t*0.45)%1184+1184)%1184-60;
    var y=505+(i%3)*9;
    px(x,y,2,12,'#2f824f');
    px(x-3,y-3,8,5,i%3===0?'#ff77a8':(i%3===1?'#ffe66d':'#b99cff'));
    px(x,y-2,2,3,'#fff1b6');
  }
};

function drawForestEdge(){
  for(var i=0;i<14;i++){
    var x=((i*87-state.t*0.12)%1218+1218)%1218-100;
    var y=485, h=40+(i%4)*9;
    px(x-3,y-h,7,h,'#74454d');
    drawDiamond(x,y-h-22,24,28,'#204c4a');
    drawDiamond(x,y-h-7,20,24,'#2d6957');
  }
};

function drawGround(){
  px(0,264,960,276,'#9acb83');
  // Coteaux superposés, puis prairie au premier plan.
  var colors=['#8aba75','#76aa67','#619556'];
  for(var layer=0;layer<3;layer++){
    ctx.fillStyle=colors[layer];ctx.beginPath();ctx.moveTo(0,540);
    for(var x=0;x<=968;x+=8){
      var y=325+layer*60+Math.sin((x+state.t*(0.04+layer*0.025))/160+layer)*17;
      ctx.lineTo(x,y);
    }
    ctx.lineTo(960,540);ctx.closePath();ctx.fill();
  }
  // Sentier de terre irrégulier, sans marquage de route.
  ctx.fillStyle='#b49365';ctx.beginPath();
  for(var x=0;x<=968;x+=8) ctx.lineTo(x,480+Math.sin((x+state.t*0.55)/130)*3);
  for(var x=968;x>=0;x-=8) ctx.lineTo(x,500+Math.sin((x+state.t*0.55)/130+0.4)*4);
  ctx.closePath();ctx.fill();
  for(var i=0;i<55;i++){
    var x=((i*43-state.t*0.55)%1200+1200)%1200-80;
    var y=452+(i*17)%85;
    if(y>479 && y<504){px(x,y,3+i%3,2,'#d4bc8c');continue;}
    px(x,y,2,7,'#426e43');px(x-3,y+2,3,2,'#54884b');
  }
};

function wingOpening(time){return 0.22+0.78*(0.5+0.5*Math.sin(time*0.025));}
function drawButterfly(b){
  var ground={x:b.x,y:487};
  drawDiamond(ground.x,ground.y-3,18,7,'#937044');
  var p=projectTrack(b.x,b.y,track.height);
  ctx.save();
  if(state.invulnerable>0 && Math.floor(state.invulnerable/8)%2===0) ctx.globalAlpha=0.35;
  ctx.translate(p.x,p.y);
  ctx.rotate(Math.PI/2);
  p={x:0,y:0};
  /* monarque pixel-art : contour épais, silhouette arcade */
  // Les ailes se replient autour du corps sans modifier la collision.
  ctx.save();ctx.scale(wingOpening(state.t),1);
  px(p.x-28,p.y-13,22,18,'#171b26');px(p.x+7,p.y-13,22,18,'#171b26');
  px(p.x-23,p.y-9,16,12,b.color || '#f58b3d');px(p.x+8,p.y-9,16,12,b.color || '#f58b3d');
  px(p.x-22,p.y+5,15,13,'#171b26');px(p.x+8,p.y+5,15,13,'#171b26');
  px(p.x-18,p.y+7,11,9,b.accent || '#f7bd4f');px(p.x+8,p.y+7,11,9,b.accent || '#f7bd4f');
  px(p.x-24,p.y-10,3,3,'#fffbea');px(p.x+21,p.y-10,3,3,'#fffbea');
  px(p.x-19,p.y+10,3,3,'#fffbea');px(p.x+17,p.y+10,3,3,'#fffbea');
  ctx.restore();
  px(p.x-5,p.y-15,10,27,'#171b26');
  px(p.x-1,p.y-18,3,5,'#171b26');
  if(b.shield){ctx.strokeStyle='#6df7ff';ctx.lineWidth=4;ctx.strokeRect(p.x-34,p.y-23,68,48);}
  ctx.restore();
};

function drawObstacle(o){
  var x=o.x, y=o.y;
  if(o.type==='rock'){
    // Base posée sur le bord du sentier ; seul le volume du rocher gêne le vol bas.
    px(x-30,481,60,5,'#496744');
    ctx.fillStyle='#59696b';ctx.beginPath();
    ctx.moveTo(x-27,480);ctx.lineTo(x-22,455);ctx.lineTo(x-7,439);
    ctx.lineTo(x+15,444);ctx.lineTo(x+28,465);ctx.lineTo(x+29,482);ctx.closePath();ctx.fill();
    ctx.fillStyle='#91a1a0';ctx.beginPath();ctx.moveTo(x-22,455);ctx.lineTo(x-7,439);ctx.lineTo(x+15,444);ctx.lineTo(x+3,460);ctx.closePath();ctx.fill();
    px(x-19,473,13,4,'#8ca064');
    return;
  }
  if(o.type==='hornet'){
    var wing=Math.sin(state.t*0.7)*5;
    px(x-8,y-17-wing,20,10,'#d4e9eb');px(x+2,y+7+wing,18,8,'#b6d4dd');
    px(x-18,y-8,35,17,'#292933');px(x+4,y-8,7,17,'#ef952c');
    px(x-25,y-6,11,12,'#c56525');px(x-23,y-5,3,3,'#ffdc75');
    px(x+17,y-2,8,3,'#252532');px(x-4,y+10,2,8,'#e7ba65');return;
  }
  if(o.type==='ufo'){
    drawDiamond(x,y-8,19,16,'#83e5dc');drawDiamond(x,y,36,15,'#8e9db7');
    px(x-25,y+8,8,4,'#ff77a8');px(x-4,y+11,8,4,'#ffe66d');px(x+17,y+8,8,4,'#6df7ff');return;
  }
  if(o.type==='alien'){
    drawDiamond(x,y-24,17,28,'#9add8c');px(x-13,y-13,8,5,'#17233b');px(x+5,y-13,8,5,'#17233b');
    px(x-8,y+2,16,19,'#b99cff');px(x-19,y+5,11,4,'#9add8c');px(x+8,y+5,11,4,'#9add8c');
    px(x-10,y+20,5,10,'#9add8c');px(x+5,y+20,5,10,'#9add8c');return;
  }
  // Oiseau vu de profil, bec vers la gauche et ailes animées.
  var flap=Math.sin(state.t*0.14+x*0.01)*12;
  px(x-15,y-6,31,12,'#334858');px(x-24,y-9,13,13,'#334858');
  px(x-30,y-4,7,3,'#d9ad64');px(x-21,y-7,2,2,'#fff1b6');
  ctx.fillStyle='#506a7b';ctx.beginPath();ctx.moveTo(x-5,y);
  ctx.lineTo(x+6,y-14-flap);ctx.lineTo(x+15,y-11-flap);ctx.lineTo(x+8,y+3);ctx.closePath();ctx.fill();
  px(x+15,y-3,11,4,'#334858');
};
function birdCall(o,b){
  if(o.type==='bird' && !o.called && soundEnabled && Math.abs(o.x-b.x)<180 && Math.abs(o.y-b.y)<130){
    o.called=true;playSound('oiseau-wrah');
  }
}
function obstacleTouches(o,b){
  if(o.type==='rock') return Math.abs(o.x-b.x)<37 && b.y+12>441 && b.y-12<482;
  if(o.defeated) return false;
  return Math.abs(o.x-b.x)<(o.type==='hornet'?27:32) && Math.abs(o.y-b.y)<24;
};

function drawBonus(b){
  var p=projectTrack(b.x,b.y,track.height);
  px(p.x-13,p.y-13,26,26,'#17233b');
  px(p.x-10,p.y-10,20,20,'#fff1b6');
  if(b.type==='Fleur'){
    px(p.x-2,p.y-8,4,17,'#2f824f');px(p.x-8,p.y-7,16,7,'#ff5f9e');px(p.x-3,p.y-10,6,13,'#ffe66d');
  }
  if(b.type==='Soleil'){
    px(p.x-7,p.y-7,14,14,'#f7bd4f');px(p.x-3,p.y-10,6,20,'#ffe66d');px(p.x-10,p.y-3,20,6,'#ffe66d');
  }
  if(b.type==='Abeille'){
    px(p.x-9,p.y-5,18,10,'#f7bd4f');px(p.x-3,p.y-5,5,10,'#17233b');px(p.x-8,p.y-9,7,4,'#d7f2d2');px(p.x+2,p.y-9,7,4,'#d7f2d2');
  }
};

function drawMegaFlower(f){
  if(!f) return;
  var p=projectTrack(f.x,f.y,track.height);
  px(p.x-20,p.y-24,40,42,'#17233b');
  px(p.x-3,p.y+2,6,15,'#2f824f');
  px(p.x-16,p.y-12,32,11,'#ff5f9e');
  px(p.x-9,p.y-19,18,25,'#ff77a8');
  px(p.x-5,p.y-8,10,10,'#ffe66d');
};

function flowerFirework(x,y){
  var count=48+Math.floor(rand(0,25));
  var palette=['#ff5f9e','#ffe66d','#6df7ff','#b99cff','#8cff97','#ff944d','#ffffff'];
  for(var i=0;i<count;i++){
    var angle=rand(0,Math.PI*2),speed=rand(1.2,5.2),life=rand(35,65);
    state.fireworks.push({x:x,y:y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,
      life:life,maxLife:life,size:Math.floor(rand(2,5)),color:palette[Math.floor(rand(0,palette.length))]});
  }
  // Limite les particules si plusieurs fleurs sont butinées à la suite.
  if(state.fireworks.length>500) state.fireworks.splice(0,state.fireworks.length-500);
}
function updateFireworks(){
  state.fireworks=state.fireworks.filter(function(p){
    p.x+=p.vx;p.y+=p.vy;p.vx*=0.98;p.vy=p.vy*0.98+0.045;
    return --p.life>0;
  });
}
function drawFireworks(){
  ctx.save();
  state.fireworks.forEach(function(p){
    ctx.globalAlpha=p.life/p.maxLife;
    px(p.x,p.y,p.size,p.size,p.color);
  });
  ctx.restore();
}
function collectFlower(f,points){
  state.score+=points;
  state.flowersCollected++;
  if(state.flowersCollected%50===0){
    state.heartRobots.push({x:1020,y:rand(180,390),phase:rand(0,Math.PI*2),fullHint:false});
  }
  if(state.flowersCollected===FLOWER_GOAL){
    flowerFirework(300,180);flowerFirework(480,140);flowerFirework(660,180);
  }
  playSound(points>=10000?'fleur-rare':'butinage');
  flowerFirework(f.x,f.y);
  state.message=state.flowersCollected===FLOWER_GOAL?'harvestCelebration':'+'+points+' !';state.messageTimer=95;
}

var slowTimer=0, shieldTimer=0, agileTimer=0;
function applyBonus(type){
  if(type==='Soleil' || type==='Abeille') playSound('bonus-pok');
  state.bonus=type;
  if(type==='Fleur'){agileTimer=280; state.butterfly.agility=1.7;}
  if(type==='Soleil'){slowTimer=280;}
  if(type==='Abeille'){shieldTimer=280; state.butterfly.shield=true;}
};


function drawGameplayOverlay(){
  ctx.save();ctx.textAlign="center";
  if(state.megaFlower){
    px(330,474,300,24,'#17233b');
    px(336,480,Math.floor(288*state.flowerProgress/100),12,'#ff77a8');
    ctx.fillStyle='#fff1b6';ctx.font='bold 14px monospace';ctx.fillText(tr('BUTINAGE CALME'),480,470,290);
  }
  if(state.message && state.messageTimer>0){
    ctx.fillStyle='#fff1b6';ctx.font='bold 22px monospace';ctx.fillText(tr(state.message,{points:state.messagePoints || 0}),480,312,900);
  }
  if(state.gameOver){
    ctx.fillStyle='rgba(16,26,43,0.78)';ctx.fillRect(0,0,960,540);
    ctx.fillStyle='#ffe66d';ctx.font='bold 42px monospace';ctx.fillText(tr('FIN DE VOL'),480,240,850);
    ctx.fillStyle='#fff1b6';ctx.font='bold 18px monospace';ctx.fillText(tr('TOUCHE ESPACE OU CLIQUE POUR REJOUER'),480,286,900);
  }
  ctx.restore();
};

function drawScanlines(){
  ctx.fillStyle='rgba(17,25,43,0.10)';
  for(var y=0;y<540;y+=4) px(0,y,960,1,'rgba(17,25,43,0.10)');
};

function update(){
  updateFireworks();
  if(state.gameOver || (typeof shareCardOpen!=='undefined' && shareCardOpen)) return;
  state.t++;
  if(state.invulnerable>0) state.invulnerable--;
  if(state.messageTimer>0) state.messageTimer--;
  state.level=Math.min(8,1+Math.floor(state.flowersCollected/111));
  state.wind=Math.sin(state.t*0.006)*0.024;
  var b=state.butterfly;
  var dx=(keys.arrowright||keys.d?1:0)-(keys.arrowleft||keys.q||keys.a?1:0);
  var dy=(keys.arrowdown||keys.s?1:0)-(keys.arrowup||keys.z||keys.w?1:0);
  if(dx || dy || tilt.enabled){
    var length=Math.max(1,Math.hypot(dx,dy));
    b.vx=((dx?dx/length:tilt.enabled?tilt.x:0)*4.5)*b.agility;
    b.vy=((dy?dy/length:tilt.enabled?tilt.y:0)*4.5)*b.agility;
    state.touchX=b.x;state.touchY=b.y;
  }else{
    b.vx=(state.touchX-b.x)*0.12*b.agility;
    b.vy=(state.touchY-b.y)*0.12*b.agility;
  }
  b.x=clamp(b.x+b.vx,35,925);
  b.y=clamp(b.y+b.vy,track.minY,track.maxY);
  if(slowTimer>0) slowTimer--; else if(state.bonus==='Soleil') state.bonus='AUCUN';
  if(agileTimer>0) agileTimer--; else b.agility=1;
  if(shieldTimer>0) shieldTimer--; else b.shield=false;

  var flowerSlow=state.megaFlower?0.52:1;
  var speedMul=(slowTimer>0?0.45:0.7)*flowerSlow*Math.min(1.45,1+(state.level-1)*0.05);
  for(var oi=0;oi<state.obstacles.length;oi++){ var o=state.obstacles[oi];
    o.x -= o.speed*speedMul;
    if(o.type==='hornet' || o.type==='ufo' || o.type==='alien') o.y=o.baseY+Math.sin(state.t*0.035+oi)*14;
    if(o.x<-90) resetObstacle(o,oi);
    birdCall(o,b);
    if(obstacleTouches(o,b)) hitButterfly(o);
  }
  for(var bi=0;bi<state.bonuses.length;bi++){ var bo=state.bonuses[bi];
    bo.x -= 0.8*flowerSlow;
    if(bo.x<-80){ resetEntity(bo,980,1360,110,440); bo.type=['Fleur','Soleil','Abeille'][(Math.random()*3)|0]; }
    if(Math.abs(bo.x-b.x)<25 && Math.abs(bo.y-b.y)<30){ if(bo.type==='Fleur') collectFlower(bo,100); applyBonus(bo.type); bo.x=-80; }
  }

  updateMeadowFlowers();
  var scoreNow=Math.floor(state.flightPoints/12);
  if(!state.megaFlower && scoreNow>=state.nextFlowerScore){
    state.megaFlower={x:rand(930,1120),y:rand(170,380)}; state.flowerProgress=0; state.nextFlowerScore+=100; state.message='FLEUR RARE !'; state.messageTimer=95;
  }
  if(state.megaFlower){
    state.megaFlower.x-=(0.42/1.5);
    if(Math.abs(state.megaFlower.x-b.x)<42 && Math.abs(state.megaFlower.y-b.y)<46){
      state.flowerProgress=Math.min(100,state.flowerProgress+(1.4/1.5));
      b.vy*=0.88;
      if(state.flowerProgress>=100){ collectFlower(state.megaFlower,10000); state.bonus='FLEUR +10K'; state.message=state.flowersCollected===FLOWER_GOAL?'harvestCelebration':'+10 000 !'; state.messageTimer=95; state.megaFlower=null; state.flowerProgress=0; }
    } else {
      state.flowerProgress=Math.max(0,state.flowerProgress-0.18);
    }
    if(state.megaFlower && state.megaFlower.x<-90){ state.megaFlower=null; state.flowerProgress=0; state.message='FLEUR MANQUEE'; state.messageTimer=95; }
  }
  updateHeartRobots();
  state.flightPoints++;
  updateHud();
};

function render(){
  ctx.clearRect(0,0,960,540);
  drawSkyGarden();
  drawGround();
  drawMountains();
  drawForestEdge();
  state.obstacles.slice().sort(function(a,b){return a.y-b.y;}).forEach(drawObstacle);
  state.bonuses.forEach(drawBonus);
  drawMegaFlower(state.megaFlower);
  state.heartRobots.forEach(drawHeartRobot);
  drawButterfly(state.butterfly);
  drawFireworks();
  drawSpringFlowers();
  state.meadowFlowers.forEach(drawMeadowFlower);
  drawScanlines();
  drawGameplayOverlay();
};

function loop(){
  update();
  render();
  requestAnimationFrame(loop);
};
document.getElementById('language').addEventListener('change',function(e){setLanguage(e.target.value);});
setLanguage(language);
startDefaultTilt();
loop();
