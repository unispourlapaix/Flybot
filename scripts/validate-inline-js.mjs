import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const htmlUrl = new URL('../index.html', import.meta.url);
const html = readFileSync(htmlUrl, 'utf8');
const openingScripts = [...html.matchAll(/<script(?:\s[^>]*)?>/gi)].length;
const closingScripts = [...html.matchAll(/<\/script>/gi)].length;

if (openingScripts !== closingScripts) {
  throw new Error(`Balises script déséquilibrées : ${openingScripts} ouverture(s), ${closingScripts} fermeture(s).`);
}

const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => ({
  filename: 'index.html:inline-script.js',
  source: match[1],
}));
const localScripts = [...html.matchAll(/<script[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi)]
  .map((match) => match[1])
  .filter((src) => !/^(?:https?:)?\/\//i.test(src))
  .map((src) => {
    const filename = src.split('?')[0];
    return { filename, source: readFileSync(new URL(`../${filename}`, import.meta.url), 'utf8') };
  });
const scripts = [...inlineScripts, ...localScripts];

if (scripts.length === 0) {
  throw new Error('Aucun script JavaScript local ou inline trouvé dans index.html.');
}

scripts.forEach(({ filename, source }) => {
  new vm.Script(source, { filename });
});

const forbiddenRuntimePatterns = [
  { name: 'JSX fragment', pattern: /<>|<\/[A-Z]/ },
  { name: 'React runtime', pattern: /\bReact\b|\bReactDOM\b/ },
  { name: 'Babel runtime', pattern: /\bBabel\b|text\/babel/ },
];

for (const { name, pattern } of forbiddenRuntimePatterns) {
  if (pattern.test(html) || scripts.some(({ source }) => pattern.test(source))) {
    throw new Error(`Motif interdit détecté (${name}) : ${pattern}`);
  }
}

console.log(`OK: ${scripts.length} script(s) valide(s), balises équilibrées, sans React/JSX/Babel.`);
