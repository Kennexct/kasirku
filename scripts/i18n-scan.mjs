// Lists string literals that still look like interface text but are not inside t() (ADR-010). Heuristic, for humans.
import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';

const SKIP = [/^src\/i18n\//, /^src\/content\//, /^src\/db\//, /^src\/types\//, /\.test\.tsx?$/, /vite-env/, /^src\/components\/ui\/styles\.ts$/];
const TAILWIND = /(^|\s)(flex|grid|hidden|block|inline|absolute|relative|truncate|shrink-0|min-w-0|w-full|sr-only|num|border|rounded-\w+|(?:p|m|h|w|gap|text|bg|px|py|pl|pr|pt|pb|mt|mb|ml|mr)-[\w[\].%/-]+)(\s|$)/;
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.tsx?$/.test(e.name)) files.push(p); } })('src');

let total = 0;
for (const file of files) {
  if (SKIP.some((re) => re.test(file))) continue;
  const source = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  (function visit(n) {
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 't') return;
    if (ts.isImportDeclaration(n) || ts.isExportDeclaration(n) || ts.isTypeNode(n)) return;
    if (ts.isJsxAttribute(n) && n.name.getText(sf) === 'className') return;
    let text = null;
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) text = n.text;
    else if (ts.isTemplateExpression(n)) text = n.head.text + n.templateSpans.map((s) => `{}${s.literal.text}`).join('');
    else if (ts.isJsxText(n)) text = n.getText(sf).trim();
    if (text !== null && !ts.isJsxAttribute(n.parent) || (text !== null && ts.isJsxAttribute(n.parent))) {
      const looksLikeText = /[A-Za-zÀ-ÿ]{3,}/.test(text) && (/^[A-ZÀ-Ý][a-zà-ÿ]/.test(text.trim()) || /[a-zà-ÿ]{2,}\s+[a-zà-ÿ]{2,}/i.test(text)) && !TAILWIND.test(text) && !/^[A-Za-z]+\/[A-Za-z_]+$/.test(text);
      if (looksLikeText) {
        const { line } = sf.getLineAndCharacterOfPosition(n.getStart(sf));
        console.log(`${file}:${line + 1}: ${text.replace(/\s+/g, ' ').slice(0, 90)}`);
        total += 1;
      }
    }
    ts.forEachChild(n, visit);
  })(sf);
}
console.log(`${total} candidates`);
