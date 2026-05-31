var BUILD_VERSION = '2026.05.31.1';
console.info('Flybot build ' + BUILD_VERSION);
var canvas = document.getElementById('game');
var ctx = canvas.getContext('2d');
var scoreEl = document.getElementById('score');
var bonusEl = document.getElementById('bonus');
var dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
canvas.width = 960 * dpr;
canvas.height = 540 * dpr;
ctx.setTransform(dpr,0,0,dpr,0,0);

var state = {
  t:0, score:0, gameOver:false,
  butterfly:{x:200,y:270,vy:0,shield:false,agility:1},
  wind:0, obstacles:[], bonuses:[], touchY:270, megaFlower:null, nextFlowerScore:100
};

function rand(a,b){ return Math.random()*(b-a)+a; }
function iso(x,y,z){ z = z || 0; return {x:(x-y)*1.15+480,y:(x+y)*0.58-z+52}; }
function px(x,y,w,h,col){ctx.fillStyle=col;ctx.fillRect(Math.round(x),Math.round(y),w,h)}
function edge(x,y,w,h,col){col = col || '#1f1f1f'; ctx.strokeStyle=col;ctx.lineWidth=1;ctx.strokeRect(Math.round(x)+0.5,Math.round(y)+0.5,w,h)}

for(var i=0;i<3;i++) state.obstacles.push({x:rand(980,1480),y:rand(150,410),speed:rand(0.65,1.25)});
for(var i=0;i<6;i++) state.bonuses.push({x:rand(900,1420),y:rand(100,430),type:['Fleur','Soleil','Abeille'][(Math.random()*3)|0]});

function setY(clientY){
  var r=canvas.getBoundingClientRect();
  state.touchY=(clientY-r.top)*(540/r.height);
};
window.addEventListener('mousemove',function(e){setY(e.clientY)});
window.addEventListener('touchstart',function(e){setY(e.touches[0].clientY)},{passive:true});
window.addEventListener('touchmove',function(e){setY(e.touches[0].clientY)},{passive:true});

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

function drawSpringFlowers(){
  for(var i=0;i<22;i++){
    var gx=-1+i*1.04;
    var gy=10.7+Math.sin(i*0.7)*0.30;
    var p=iso(gx*44,gy*44,0);
    var sway=Math.round(Math.sin(state.t*0.035+i)*1.4);
    px(p.x+sway,p.y+5,2,10,'#2f824f');
    px(p.x-3+sway,p.y+1,8,4,i%3===0?'#ff77a8':(i%3===1?'#ffe66d':'#b99cff'));
    px(p.x-1+sway,p.y-1,4,8,'#fff1b6');
  }
};

function drawForestEdge(side){
  for(var i=0;i<12;i++){
    var gx=side==='left'?-2.2:19.4;
    var gy=i*0.98+0.8;
    var p=iso(gx*44,gy*44,0);
    var h=22+(i%4)*5;
    px(p.x-3,p.y-h+12,7,h,'#74454d');
    drawDiamond(p.x,p.y-h-10,18,15,'#204c4a');
    drawDiamond(p.x,p.y-h,15,13,'#2d6957');
    drawDiamond(p.x,p.y-h+10,11,10,'#4f9a62');
    px(p.x-18,p.y+8,36,4,'#1d3c42');
  }
};

function drawGround(){
  var center=iso(8.5*44,5.5*44,0);
  drawDiamond(center.x,center.y-24,670,332,'#1b3542');
  drawDiamond(center.x,center.y-34,646,314,'#4f9a62');
  drawDiamond(center.x,center.y-42,622,296,'#75c66b');

  ctx.fillStyle='#376c58';ctx.beginPath();
  ctx.moveTo(center.x-622,center.y+106);ctx.lineTo(center.x,center.y+254);ctx.lineTo(center.x,center.y+304);ctx.lineTo(center.x-622,center.y+156);ctx.closePath();ctx.fill();
  ctx.fillStyle='#2b594f';ctx.beginPath();
  ctx.moveTo(center.x+622,center.y+106);ctx.lineTo(center.x,center.y+254);ctx.lineTo(center.x,center.y+304);ctx.lineTo(center.x+622,center.y+156);ctx.closePath();ctx.fill();

  /* piste isométrique lisible façon arcade rétro */
  ctx.fillStyle='#b87850';ctx.beginPath();
  ctx.moveTo(center.x-560,center.y+74);ctx.lineTo(center.x-430,center.y+28);ctx.lineTo(center.x+555,center.y+235);ctx.lineTo(center.x+415,center.y+270);ctx.closePath();ctx.fill();
  ctx.fillStyle='#e1b06e';ctx.beginPath();
  ctx.moveTo(center.x-546,center.y+72);ctx.lineTo(center.x-438,center.y+38);ctx.lineTo(center.x+536,center.y+239);ctx.lineTo(center.x+424,center.y+260);ctx.closePath();ctx.fill();
  for(var i=0;i<12;i++){
    var x=center.x-440+i*82;
    var y=center.y+50+i*17;
    px(x,y,30,4,'#f7d98a');
  }

  drawDiamond(center.x+214,center.y+58,122,46,'#3c8db2');
  drawDiamond(center.x+214,center.y+65,94,29,'#72c7d8');
  px(center.x+178,center.y+81,72,3,'#d7f2d2');

  function flowerPatch(dx,dy,col){
    for(var i=0;i<7;i++){
      px(center.x+dx+i*13,center.y+dy+(i%3)*5,5,5,col);
    }
  }
  flowerPatch(-346,128,'#ff77a8');
  flowerPatch(-56,26,'#ffe66d');
  flowerPatch(248,120,'#b99cff');
};

function drawButterfly(b){
  var p=iso(b.x*0.6,b.y*0.6,62);
  /* monarque pixel-art : contour épais, silhouette arcade */
  px(p.x-5,p.y-15,10,27,'#171b26');
  px(p.x-28,p.y-13,22,18,'#171b26');px(p.x+7,p.y-13,22,18,'#171b26');
  px(p.x-23,p.y-9,16,12,'#f58b3d');px(p.x+8,p.y-9,16,12,'#f58b3d');
  px(p.x-22,p.y+5,15,13,'#171b26');px(p.x+8,p.y+5,15,13,'#171b26');
  px(p.x-18,p.y+7,11,9,'#f7bd4f');px(p.x+8,p.y+7,11,9,'#f7bd4f');
  px(p.x-24,p.y-10,3,3,'#fffbea');px(p.x+21,p.y-10,3,3,'#fffbea');
  px(p.x-19,p.y+10,3,3,'#fffbea');px(p.x+17,p.y+10,3,3,'#fffbea');
  px(p.x-1,p.y-18,3,5,'#171b26');
  if(b.shield){ctx.strokeStyle='#6df7ff';ctx.lineWidth=4;ctx.strokeRect(p.x-34,p.y-23,68,48);}
};

function drawObstacle(o){
  var p=iso(o.x*0.6,o.y*0.6,58);
  px(p.x-16,p.y-40,32,42,'#1d3c42');
  px(p.x-12,p.y-37,24,36,'#74454d');
  px(p.x-8,p.y-33,8,28,'#9b614f');
  drawDiamond(p.x,p.y-50,24,18,'#204c4a');
  drawDiamond(p.x,p.y-42,19,14,'#4f9a62');
  px(p.x-20,p.y+1,40,4,'#1d3c42');
};

function drawBonus(b){
  var p=iso(b.x*0.6,b.y*0.6,52);
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
  var p=iso(f.x*0.6,f.y*0.6,58);
  px(p.x-20,p.y-24,40,42,'#17233b');
  px(p.x-3,p.y+2,6,15,'#2f824f');
  px(p.x-16,p.y-12,32,11,'#ff5f9e');
  px(p.x-9,p.y-19,18,25,'#ff77a8');
  px(p.x-5,p.y-8,10,10,'#ffe66d');
};

var slowTimer=0, shieldTimer=0, agileTimer=0;
function applyBonus(type){
  bonusEl.textContent=type;
  if(type==='Fleur'){agileTimer=280; state.butterfly.agility=1.7;}
  if(type==='Soleil'){slowTimer=280;}
  if(type==='Abeille'){shieldTimer=280; state.butterfly.shield=true;}
};


function drawScanlines(){
  ctx.fillStyle='rgba(17,25,43,0.10)';
  for(var y=0;y<540;y+=4) px(0,y,960,1,'rgba(17,25,43,0.10)');
};

function update(){
  if(state.gameOver) return;
  state.t++;
  state.wind=Math.sin(state.t*0.006)*0.024;
  var b=state.butterfly;
  b.vy += ((state.touchY-b.y)*0.006*b.agility)+state.wind;
  b.vy *= 0.94;
  b.y = Math.max(70,Math.min(470,b.y+b.vy));
  if(slowTimer>0) slowTimer--; else if(bonusEl.textContent==='Soleil') bonusEl.textContent='Aucun';
  if(agileTimer>0) agileTimer--; else b.agility=1;
  if(shieldTimer>0) shieldTimer--; else b.shield=false;
  var speedMul=slowTimer>0?0.45:0.7;
  for(var oi=0;oi<state.obstacles.length;oi++){ var o = state.obstacles[oi];
    o.x -= o.speed*speedMul;
    if(o.x<-90){o.x=rand(980,1360);o.y=rand(120,430);}
    if(Math.abs(o.x-b.x)<38 && Math.abs(o.y-b.y)<44){if(b.shield){b.shield=false;shieldTimer=0;o.x=-120;} else state.gameOver=true;}
  }
  for(var bi=0;bi<state.bonuses.length;bi++){ var bo = state.bonuses[bi];
    bo.x -= 0.8;
    if(bo.x<-80){bo.x=rand(980,1360);bo.y=rand(110,440);bo.type=['Fleur','Soleil','Abeille'][(Math.random()*3)|0];}
    if(Math.abs(bo.x-b.x)<28 && Math.abs(bo.y-b.y)<34){applyBonus(bo.type);bo.x=-80;}
  }
  var scoreNow = Math.floor(state.score/12);
  if(!state.megaFlower && scoreNow >= state.nextFlowerScore){
    state.megaFlower = { x: rand(930,1250), y: rand(170,380) };
    state.nextFlowerScore += 100;
  }
  if(state.megaFlower){
    state.megaFlower.x -= 0.7;
    if(Math.abs(state.megaFlower.x-b.x)<34 && Math.abs(state.megaFlower.y-b.y)<38){
      state.score += 10000;
      bonusEl.textContent='Fleur +10k';
      state.megaFlower = null;
    } else if(state.megaFlower.x < -90){
      state.megaFlower = null;
    }
  }
  state.score++;
  scoreEl.textContent = Math.floor(state.score/12);
};

function render(){
  ctx.clearRect(0,0,960,540);
  drawSkyGarden();
  drawGround();
  drawMountains();
  drawForestEdge('left');
  drawForestEdge('right');
  state.obstacles.slice().sort(function(a,b){return a.y-b.y;}).forEach(drawObstacle);
  state.bonuses.forEach(drawBonus);
  drawMegaFlower(state.megaFlower);
  drawButterfly(state.butterfly);
  drawSpringFlowers();
  drawScanlines();
  if(state.gameOver){ctx.fillStyle='#000a';ctx.fillRect(0,0,960,540);ctx.fillStyle='#fff';ctx.font='bold 48px sans-serif';ctx.fillText('Game Over',370,250);}
};

function loop(){
  update();
  render();
  requestAnimationFrame(loop);
};
loop();
