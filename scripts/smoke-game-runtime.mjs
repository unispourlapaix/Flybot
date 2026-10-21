import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const elements = new Map();
const noop = () => {};
const gradient = { addColorStop: noop };
const context = {
  translate: noop, rotate: noop, beginPath: noop, closePath: noop, clearRect: noop, ellipse: noop, fill: noop, fillRect: noop,
  fillText: noop, lineTo: noop, moveTo: noop, restore: noop, save: noop, setTransform: noop,
  stroke: noop, strokeRect: noop, createLinearGradient: () => gradient,
};
const canvas = {
  addEventListener: noop,
  getBoundingClientRect: () => ({ top: 0, left: 0, width: 960, height: 540 }),
  getContext: () => context,
};
for (const id of ['score', 'bonus', 'lives', 'level', 'flower', 'nectar', 'tilt', 'control-status', 'sound', 'share-score', 'share-status', 'share-fallback', 'language']) elements.set(id, { textContent: '', addEventListener: noop, setAttribute: noop, focus: noop, select: noop });
elements.set('game', canvas);
let frame;
const sandbox = {
  console,
  document: { documentElement:{lang:'fr'}, querySelectorAll:()=>[], getElementById: (id) => elements.get(id) },
  Math,
  requestAnimationFrame: (callback) => { frame = callback; },
  window: { addEventListener: noop, devicePixelRatio: 1 },
};
vm.createContext(sandbox);
new vm.Script(readFileSync(new URL('../i18n.js', import.meta.url), 'utf8')).runInContext(sandbox);
new vm.Script(source, { filename: 'game.js' }).runInContext(sandbox);
if (typeof frame !== 'function') throw new Error('La boucle de jeu ne programme aucune frame.');
for (let index = 0; index < 5; index++) frame();
if (elements.get('score').textContent === '') throw new Error('Le HUD score ne se met pas à jour.');
if (elements.get('lives').textContent !== '♥♥♥') throw new Error('Le HUD vies ne se met pas à jour.');

for (const obstacle of sandbox.state.obstacles) obstacle.x = 5000;
for (const bonus of sandbox.state.bonuses) bonus.x = 5000;
sandbox.state.flightPoints = 1200;
sandbox.state.score = 0;
frame();
if (!sandbox.state.megaFlower) throw new Error('La fleur rare ne se déclenche pas au palier de 100 points.');
sandbox.state.megaFlower.x = sandbox.state.butterfly.x;
sandbox.state.megaFlower.y = sandbox.state.butterfly.y;
for (let index = 0; index < 80; index++) frame();
if (sandbox.state.megaFlower) throw new Error('Le butinage calme ne termine pas la collecte.');
if (Number(elements.get('score').textContent) !== 10000) throw new Error('La fleur rare ne crédite pas le bonus +10k.');
frame();
if (sandbox.state.megaFlower) throw new Error('Le bonus +10k déclenche une cascade de fleurs rares.');

sandbox.state.invulnerable = 0;
const obstacle = sandbox.state.obstacles[0];
obstacle.x = sandbox.state.butterfly.x;
obstacle.y = sandbox.state.butterfly.y;
frame();
if (sandbox.state.lives !== 2) throw new Error('Une collision ne retire pas exactement une vie.');
frame();
if (sandbox.state.lives !== 2) throw new Error('Invulnérabilité post-collision absente.');
for (let index = 0; index < 2; index++) {
  sandbox.state.invulnerable = 0;
  obstacle.x = sandbox.state.butterfly.x;
  obstacle.y = sandbox.state.butterfly.y;
  frame();
}
if (!sandbox.state.gameOver || sandbox.state.lives !== 0) throw new Error('La fin de vol après trois collisions ne fonctionne pas.');
sandbox.resetGame();
if (sandbox.state.gameOver || sandbox.state.lives !== 3) throw new Error('La reprise de partie ne restaure pas les trois vies.');

console.log('OK: moteur, HUD, butinage +10k sans cascade, collisions protégées et reprise validés.');

// La commande écran doit retrouver la voie projetée à toute largeur de piste.
for (const lane of [70, 270, 470]) {
  const point = sandbox.projectTrack(sandbox.state.butterfly.x, lane, sandbox.track.height);
  sandbox.setY(point.y);
  if (Math.abs(sandbox.state.touchY - lane) > 0.00001) throw new Error('Commande hors du repère de la piste.');
}
for (const y of [70,270,470]) {
  const start = sandbox.projectTrack(0,y);
  const end = sandbox.projectTrack(100,y);
  if (end.y !== start.y || end.x-start.x !== 100) throw new Error('Défilement horizontal incorrect.');
}
sandbox.setY(-100);
if (sandbox.state.touchY !== 70) throw new Error('Limite haute incorrecte.');
sandbox.setY(700);
if (sandbox.state.touchY !== 470) throw new Error('Limite basse incorrecte.');
console.log('OK: vue horizontale, commande verticale et limites du vol.');

const rock = {type:'rock',x:200,y:460};
if (sandbox.obstacleTouches(rock,{x:200,y:400})) throw new Error('Le rocher touche un papillon au-dessus.');
if (!sandbox.obstacleTouches(rock,{x:200,y:455})) throw new Error('Le rocher ne bloque pas le vol bas.');
for (let i=0;i<3;i++) {
  const o={}; sandbox.resetObstacle(o,i);
  if (o.type==='rock' && o.y!==460) throw new Error('Rocher flottant.');
  if (o.type==='bird' && (o.y<150 || o.y>390)) throw new Error('Oiseau hors du couloir de vol.');
}
console.log('OK: rochers au sol, passage au-dessus et oiseaux en altitude.');

sandbox.resetGame();
sandbox.state.obstacles.forEach(o=>o.x=5000);
sandbox.setPointer({clientX:700,clientY:180});
for(let i=0;i<40;i++) frame();
if(Math.abs(sandbox.state.butterfly.x-700)>5 || Math.abs(sandbox.state.butterfly.y-180)>5) throw new Error('Déplacement libre incorrect.');
sandbox.keys.arrowleft=true; sandbox.keys.arrowdown=true;
const before={...sandbox.state.butterfly}; frame();
if(sandbox.state.butterfly.x>=before.x || sandbox.state.butterfly.y<=before.y) throw new Error('Clavier diagonal incorrect.');
sandbox.keys={}; sandbox.tilt.enabled=true;
sandbox.handleOrientation({beta:30,gamma:5});
if(sandbox.tilt.x!==0 || sandbox.tilt.y!==0) throw new Error('Calibration incorrecte.');
sandbox.handleOrientation({beta:40,gamma:15});
if(sandbox.tilt.x<=0 || sandbox.tilt.y<=0) throw new Error('Inclinaison incorrecte.');
sandbox.stopTilt();
if(sandbox.tilt.enabled) throw new Error('Désactivation incorrecte.');
console.log('OK: vol libre, clavier diagonal et calibration des capteurs.');

sandbox.resetGame();
sandbox.state.obstacles.forEach(o=>o.x=5000);
sandbox.state.bonuses.forEach(o=>o.x=5000);
for(let i=0;i<30;i++) frame();
if(sandbox.state.score!==0) throw new Error('Le vol seul donne encore des points.');
const flower=sandbox.state.bonuses[0];
flower.type='Fleur'; flower.x=sandbox.state.butterfly.x;flower.y=sandbox.state.butterfly.y;
frame();
if(sandbox.state.score!==100 || Number(elements.get('score').textContent)!==100) throw new Error('Butinage normal incorrect.');
if(sandbox.state.fireworks.length<48) throw new Error('Feu d’artifice absent.');
if(new Set(sandbox.state.fireworks.map(p=>p.color)).size<2) throw new Error('Explosion non multicolore.');
frame();
if(sandbox.state.score!==100) throw new Error('Fleur comptée deux fois.');
flower.type='Soleil';flower.x=sandbox.state.butterfly.x;flower.y=sandbox.state.butterfly.y;
frame();
if(sandbox.state.score!==100) throw new Error('Un bonus non floral donne des points.');
for(let i=0;i<80;i++) sandbox.updateFireworks();
if(sandbox.state.fireworks.length) throw new Error('Particules jamais nettoyées.');
sandbox.flowerFirework(200,200);sandbox.resetGame();
if(sandbox.state.fireworks.length || sandbox.state.score) throw new Error('Reprise sans nettoyage.');
console.log('OK: score uniquement au butinage, explosion multicolore et nettoyage.');

let played=0;
sandbox.window.Audio=function(src){this.src=src;this.play=()=>{played++;return Promise.resolve();};this.pause=()=>{};};
sandbox.soundEnabled=false;sandbox.playSound('butinage');
if(played) throw new Error('Son lancé sans activation.');
sandbox.soundEnabled=true;sandbox.playSound('butinage');
if(played!==1 || sandbox.soundPool.butinage.src!=='audio/butinage.wav') throw new Error('Lecture du son incorrecte.');
console.log('OK: sons activés uniquement à la demande.');

sandbox.resetGame();
if(Number(elements.get('flower').textContent)!==0) throw new Error('Compteur de fleurs initial incorrect.');
sandbox.state.obstacles.forEach(o=>o.x=5000);
sandbox.state.bonuses.forEach(o=>o.x=5000);
for(let i=0;i<20;i++) frame();
if(Number(elements.get('flower').textContent)!==0) throw new Error('Le vol modifie les fleurs butinées.');
sandbox.collectFlower({x:200,y:270},100);sandbox.updateHud();
if(Number(elements.get('flower').textContent)!==1 || Number(elements.get('score').textContent)!==100) throw new Error('HUD incohérent après une fleur.');
sandbox.state.megaFlower={x:900,y:270};sandbox.state.flowerProgress=42;sandbox.updateHud();
if(Number(elements.get('flower').textContent)!==1 || !elements.get('nectar').textContent.includes('42 %')) throw new Error('Progression confondue avec le compteur.');
sandbox.collectFlower(sandbox.state.megaFlower,10000);sandbox.state.megaFlower=null;sandbox.updateHud();
if(Number(elements.get('flower').textContent)!==2 || Number(elements.get('score').textContent)!==10100) throw new Error('HUD incohérent après fleur rare.');
sandbox.resetGame();
if(Number(elements.get('flower').textContent)!==0) throw new Error('Compteur non réinitialisé.');
console.log('OK: points, fleurs butinées et pourcentage séparés dans le HUD.');

sandbox.state.score=10100;sandbox.state.flowersCollected=2;
let shared;
sandbox.window.navigator={share:async data=>{shared=data;}};
await sandbox.shareScore();
if(!shared.text.includes('10100 points et 2 fleurs') || !shared.url.endsWith('/Flybot/')) throw new Error('Score partagé incorrect.');
let copied;
sandbox.window.navigator={clipboard:{writeText:async text=>{copied=text;}}};
await sandbox.shareScore();
if(!copied.includes('10100') || !copied.includes('https://')) throw new Error('Copie du score incorrecte.');
sandbox.window.navigator={share:async()=>{throw {name:'AbortError'};},clipboard:{writeText:async()=>{throw new Error('Copie après annulation.');}}};
await sandbox.shareScore();
if(elements.get('share-status').textContent!=='Partage annulé.') throw new Error('Annulation incorrecte.');
sandbox.window.navigator={};await sandbox.shareScore();
if(elements.get('share-fallback').hidden || !elements.get('share-fallback').value.includes('10100')) throw new Error('Copie manuelle indisponible.');
console.log('OK: partage natif, copie, annulation et secours manuel.');

const originalScore=sandbox.state.score;
for(const lang of ['ja','en','es','fr']) {
  sandbox.setLanguage(lang);
  if(sandbox.document.documentElement.lang!==lang || sandbox.state.score!==originalScore) throw new Error('Langue ou partie modifiée.');
  for(const key of Object.keys(sandbox.translations.fr)) {
    if(!sandbox.translations[lang][key]) throw new Error('Traduction absente : '+lang+' '+key);
  }
  const text=sandbox.scoreShareData().text;
  if(!text.includes('10100') || /\{\w+\}/.test(text)) throw new Error('Partage non traduit.');
  sandbox.state.megaFlower={x:900,y:270};sandbox.state.flowerProgress=42;sandbox.updateHud();sandbox.render();
  if(!elements.get('nectar').textContent.includes('42')) throw new Error('Butinage non traduit.');
}
sandbox.setLanguage('invalid');
if(sandbox.language!=='fr') throw new Error('Repli de langue incorrect.');
console.log('OK: français, japonais, anglais et espagnol, partie conservée et messages dynamiques traduits.');
