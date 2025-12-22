import fs from 'node:fs';
import path from 'node:path';

function walk(dir) {
  /** @type {string[]} */
  let out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === '.next' || ent.name === 'out' || ent.name === '.git') continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out = out.concat(walk(p));
    else out.push(p);
  }
  return out;
}

function keysBetween(source, startMarker, endMarker) {
  const a = source.indexOf(startMarker);
  const b = source.indexOf(endMarker, a + startMarker.length);
  if (a < 0 || b < 0) return new Set();
  const chunk = source.slice(a + startMarker.length, b);
  const ks = new Set();
  const kr = /\n\s*'([^']+)'\s*:/g;
  let m;
  while ((m = kr.exec(chunk))) ks.add(m[1]);
  return ks;
}

const root = process.cwd();
const files = walk(root).filter((f) => /\.(ts|tsx)$/.test(f));

const used = new Set();
const re = /\bt\(\s*'([^']+)'\s*,\s*lang\s*\)/g;
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  let m;
  while ((m = re.exec(s))) used.add(m[1]);
}

const i18nPath = path.join(root, 'lib', 'i18n.ts');
const i18n = fs.readFileSync(i18nPath, 'utf8');
const enKeys = keysBetween(i18n, 'en: {', 'cs: {');
const csKeys = keysBetween(i18n, 'cs: {', '};');

const missingCs = [...used].filter((k) => !csKeys.has(k)).sort();
const missingEn = [...used].filter((k) => !enKeys.has(k)).sort();

console.log(`[i18n] Used keys: ${used.size}`);
console.log(`[i18n] Missing in cs: ${missingCs.length}`);
if (missingCs.length) console.log(missingCs.join('\n'));
console.log(`[i18n] Missing in en: ${missingEn.length}`);
if (missingEn.length) console.log(missingEn.join('\n'));


