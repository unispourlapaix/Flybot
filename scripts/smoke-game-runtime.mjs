import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const elements = new Map();
const noop = () => {};
const gradient = { addColorStop: noop };
const context = {
  beginPath: noop, closePath: noop, clearRect: noop, ellipse: noop, fill: noop, fillRect: noop,
  fillText: noop, lineTo: noop, moveTo: noop, restore: noop, save: noop, setTransform: noop,
  stroke: noop, strokeRect: noop, createLinearGradient: () => gradient,
};
const canvas = {
  addEventListener: noop,
  getBoundingClientRect: () => ({ top: 0, height: 540 }),
  getContext: () => context,
};
for (const id of ['score', 'bonus', 'lives', 'level', 'flower']) elements.set(id, { textContent: '' });
elements.set('game', canvas);
let frame;
const sandbox = {
  console,
  document: { getElementById: (id) => elements.get(id) },
  Math,
  requestAnimationFrame: (callback) => { frame = callback; },
  window: { addEventListener: noop, devicePixelRatio: 1 },
};
vm.createContext(sandbox);
new vm.Script(source, { filename: 'game.js' }).runInContext(sandbox);
if (typeof frame !== 'function') throw new Error('La boucle de jeu ne programme aucune frame.');
for (let index = 0; index < 5; index++) frame();
if (elements.get('score').textContent === '') throw new Error('Le HUD score ne se met pas à jour.');
if (elements.get('lives').textContent !== '♥♥♥') throw new Error('Le HUD vies ne se met pas à jour.');

for (const obstacle of sandbox.state.obstacles) obstacle.x = 5000;
for (const bonus of sandbox.state.bonuses) bonus.x = 5000;
sandbox.state.flightPoints = 1200;
sandbox.state.score = 1200;
frame();
if (!sandbox.state.megaFlower) throw new Error('La fleur rare ne se déclenche pas au palier de 100 points.');
sandbox.state.megaFlower.x = sandbox.state.butterfly.x;
sandbox.state.megaFlower.y = sandbox.state.butterfly.y;
for (let index = 0; index < 80; index++) frame();
if (sandbox.state.megaFlower) throw new Error('Le butinage calme ne termine pas la collecte.');
if (Number(elements.get('score').textContent) < 10000) throw new Error('La fleur rare ne crédite pas le bonus +10k.');
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
