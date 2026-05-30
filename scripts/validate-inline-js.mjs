import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);

if (inlineScripts.length === 0) {
  throw new Error('Aucun script inline trouvé dans index.html.');
}

inlineScripts.forEach((script, index) => {
  new vm.Script(script, { filename: `index.html:inline-script-${index + 1}.js` });
});

const forbiddenRuntimePatterns = [
  { name: 'JSX fragment', pattern: /<>|<\/[A-Z]/ },
  { name: 'React runtime', pattern: /\bReact\b|\bReactDOM\b/ },
  { name: 'Babel runtime', pattern: /\bBabel\b|text\/babel/ },
];

for (const { name, pattern } of forbiddenRuntimePatterns) {
  if (pattern.test(html)) {
    throw new Error(`Motif interdit détecté (${name}) : ${pattern}`);
  }
}

console.log(`OK: ${inlineScripts.length} script inline valide, sans React/JSX/Babel.`);
