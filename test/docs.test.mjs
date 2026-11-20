// The documentation stays true to the repository: every relative link,
// image and anchor resolves, the customization recipes repeat the generated
// themes' own selectors, and the README's palette table matches src/.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { accessibleSource } from '../src/palette.mjs';
import { variants } from '../src/theme.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (file) => readFileSync(path.join(root, file), 'utf8');
const DOCS = ['README.md', 'CHANGELOG.md', 'CONTRIBUTING.md', 'docs/accessibility.md', 'docs/customization.md', 'brand/README.md'];
// Absolute links into this repository's default branch must name a file that exists here.
const OWN = /^https:\/\/(?:raw\.githubusercontent\.com\/erenthedeveloper0\/cindervale\/main|github\.com\/erenthedeveloper0\/cindervale\/(?:blob|tree)\/main)\/(.+)$/;

/** GitHub's heading anchors: lowercase, punctuation dropped, spaces to hyphens, repeats numbered. */
function anchors(markdown) {
  const seen = new Map();
  const result = new Set();
  const body = markdown.replace(/^(```|~~~)[\s\S]*?^\1/gm, '');
  for (const [, heading] of body.matchAll(/^#{1,6}\s+(.+?)\s*#*\s*$/gm)) {
    const base = heading.replace(/`/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s/g, '-');
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    result.add(count ? `${base}-${count}` : base);
  }
  return result;
}

/** Every link target in a Markdown file: Markdown links and images, and HTML src, srcset and href. */
function targets(markdown) {
  const body = markdown.replace(/^(```|~~~)[\s\S]*?^\1/gm, '').replace(/`[^`\n]*`/g, '');
  const found = [];
  for (const [, target] of body.matchAll(/\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)) found.push(target);
  for (const [, , target] of body.matchAll(/\b(src|srcset|href)="([^"]+)"/g)) found.push(target);
  return found;
}

for (const doc of DOCS) {
  test(`${doc}: every relative link, image and anchor resolves`, () => {
    const text = read(doc);
    const broken = [];
    for (const target of targets(text)) {
      if (/^(mailto:|#$)/.test(target)) continue;
      const own = OWN.exec(target);
      if (/^https?:\/\//.test(target) && !own) continue;
      const [file, anchor] = (own ? own[1] : target).split('#');
      const resolved = own ? path.join(root, file) : file ? path.resolve(path.dirname(path.join(root, doc)), decodeURI(file)) : path.join(root, doc);
      if (!existsSync(resolved)) {
        broken.push(`${target} (no such file)`);
        continue;
      }
      if (anchor && resolved.endsWith('.md') && !anchors(readFileSync(resolved, 'utf8')).has(anchor)) broken.push(`${target} (no such heading)`);
    }
    assert.deepEqual(broken, []);
  });
}

/** The JSONC recipe that follows a heading in docs/customization.md, parsed. */
function recipe(heading) {
  const text = read('docs/customization.md');
  const section = text.slice(text.indexOf(`## ${heading}\n`));
  const block = /```jsonc\n([\s\S]*?)```/.exec(section)?.[1];
  assert.ok(block, `no recipe under "${heading}"`);
  return JSON.parse(block.replace(/\s\/\/.*$/gm, ''));
}

const themes = Object.fromEntries(variants.map((v) => [v.name, JSON.parse(read(`themes/${v.file}`))]));
/** Selectors of the theme's rules whose font style includes `style`, skipping text the author styled (Markdown emphasis, headings). */
function styledSelectors(theme, style) {
  const authored = /^(markup\.(bold|italic|heading)|heading\.\d\.markdown)/;
  return theme.tokenColors
    .filter((rule) => (rule.settings.fontStyle ?? '').includes(style))
    .flatMap((rule) => rule.scope)
    .filter((scope) => !authored.test(scope));
}

test('customization: "Turn off italics" repeats every italic selector of all four themes', () => {
  const settings = recipe('Turn off italics')['editor.tokenColorCustomizations'];
  const [[key, { textMateRules }]] = Object.entries(settings);
  assert.deepEqual(key.match(/\[([^\]]+)\]/g).map((k) => k.slice(1, -1)).sort(), Object.keys(themes).sort());
  const listed = new Set(textMateRules.flatMap((r) => r.scope));
  assert.ok(textMateRules.every((r) => r.settings.fontStyle === ''));
  for (const [name, theme] of Object.entries(themes)) {
    assert.deepEqual([...new Set(styledSelectors(theme, 'italic'))].sort(), [...listed].sort(), name);
  }
});

test('customization: "Turn off bold constants" repeats every bold constant selector of the accessible themes', () => {
  const settings = recipe('Turn off bold constants');
  const [[key, { textMateRules }]] = Object.entries(settings['editor.tokenColorCustomizations']);
  const names = key.match(/\[([^\]]+)\]/g).map((k) => k.slice(1, -1));
  assert.deepEqual(names.sort(), variants.filter((v) => v.accessible).map((v) => v.name).sort());
  const listed = new Set(textMateRules.flatMap((r) => r.scope));
  const [[, { rules }]] = Object.entries(settings['editor.semanticTokenColorCustomizations']);
  for (const name of names) {
    const theme = themes[name];
    assert.deepEqual([...new Set(styledSelectors(theme, 'bold'))].sort(), [...listed].sort(), name);
    const boldSemantic = Object.entries(theme.semanticTokenColors).filter(([, style]) => typeof style === 'object' && style.bold).map(([selector]) => selector);
    assert.deepEqual(boldSemantic.sort(), Object.keys(rules).filter((selector) => rules[selector].bold === false).sort(), name);
  }
});

test('README: every color in the accessible palette table comes from src/palette.mjs', () => {
  const text = read('README.md');
  const table = text.slice(text.indexOf('| Role | Accessible Light | Accessible Dark |'));
  const rows = table.slice(0, table.indexOf('\n\n'));
  const values = new Set([...Object.values(accessibleSource.light), ...Object.values(accessibleSource.dark)].filter((v) => typeof v === 'string'));
  const hexes = rows.match(/#[0-9A-F]{6}/g);
  assert.ok(hexes.length >= 16);
  assert.deepEqual(hexes.filter((hex) => !values.has(hex)), []);
});
