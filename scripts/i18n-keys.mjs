// Collects every t('…') key in src (ADR-010) and reports keys missing from, or unused in, src/i18n/en.ts.
// Usage: node scripts/i18n-keys.mjs [--write-missing /tmp/missing.json]
import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';

const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.tsx?$/.test(e.name) && !/\.test\./.test(e.name)) files.push(p); } })('src');
const used = new Set();
for (const file of files) {
  const sf = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  (function visit(n) {
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 't' && n.arguments[0] && ts.isStringLiteralLike(n.arguments[0])) used.add(n.arguments[0].text);
    ts.forEachChild(n, visit);
  })(sf);
}
const enSource = fs.readFileSync('src/i18n/en.ts', 'utf8');
const enFile = ts.createSourceFile('en.ts', enSource, ts.ScriptTarget.Latest, true);
const defined = new Map();
(function visit(n) { if (ts.isPropertyAssignment(n) && ts.isStringLiteralLike(n.name) && ts.isStringLiteralLike(n.initializer)) defined.set(n.name.text, n.initializer.text); ts.forEachChild(n, visit); })(enFile);
const missing = [...used].filter((k) => !defined.has(k)).sort((a, b) => a.localeCompare(b));
const unused = [...defined.keys()].filter((k) => !used.has(k));
const same = [...defined].filter(([k, v]) => k === v).map(([k]) => k);
console.log(`${used.size} keys used · ${missing.length} missing · ${unused.length} unused · ${same.length} identical to Indonesian`);
const out = process.argv.indexOf('--write-missing');
if (out > 0) fs.writeFileSync(process.argv[out + 1], JSON.stringify({ missing, unused, all: [...used].sort((a, b) => a.localeCompare(b)) }));
if (missing.length > 0 || unused.length > 0) {
  if (missing.length) console.error('Missing in en.ts:', missing);
  if (unused.length) console.error('Unused in en.ts:', unused);
  process.exit(1);
}
