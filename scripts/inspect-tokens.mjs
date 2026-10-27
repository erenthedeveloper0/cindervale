// Tokenizes the fixtures with VS Code's own TextMate engine and grammars and
// checks that real tokens land on the intended syntax roles. Run with
// `npm run tokens`. Requires a local VS Code; set VSCODE_APP to its
// resources/app folder if it is not in a standard location.
//
//   npm run tokens                         check every expectation
//   npm run tokens -- fixtures/x.ts        print the tokens of one file
//   npm run tokens -- fixtures/x.ts --theme "Cindervale Accessible Dark"
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findVSCode } from './lib/vscode.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));

if (!process.versions.electron) {
  const vscode = findVSCode();
  if (!vscode?.binary) {
    console.error('VS Code was not found. Install it or set VSCODE_APP to its resources/app folder.');
    process.exit(2);
  }
  const result = spawnSync(vscode.binary, [fileURLToPath(import.meta.url), ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', VSCODE_APP: vscode.app },
  });
  process.exit(result.status ?? 1);
}

const require = createRequire(import.meta.url);
const { tokenize, vscodeVersion } = require('./lib/textmate.cjs');
const { variants, createTheme } = await import('../src/theme.mjs');
const { createPalette } = await import('../src/palette.mjs');
const { expectations } = await import('../test/token-expectations.mjs');

const args = process.argv.slice(2);
const themeFlag = args.indexOf('--theme');
const themeName = themeFlag >= 0 ? args[themeFlag + 1] : null;
const files = args.filter((a, i) => !a.startsWith('--') && (themeFlag < 0 || i !== themeFlag + 1));

/** Map each syntax color (and style) back to the role names that produce it. */
function roleNames(variant) {
  const palette = createPalette(variant);
  const names = new Map();
  for (const [role, value] of Object.entries(palette.syntax)) {
    if (typeof value !== 'string') continue;
    if (!names.has(value)) names.set(value, []);
    names.get(value).push(role);
  }
  return (fg) => names.get(fg)?.join('|') ?? '?';
}

console.log(`VS Code ${vscodeVersion()} grammars`);

if (files.length) {
  const variant = variants.find((v) => v.name === (themeName ?? 'Cindervale Accessible Light')) ?? variants[0];
  const theme = createTheme(variant);
  const role = roleNames(variant);
  for (const file of files) {
    const { scopeName, tokens } = await tokenize(path.resolve(file), theme);
    console.log(`\n${file} (${scopeName}) — ${variant.name}`);
    for (const t of tokens) {
      const leaf = t.scopes.slice(1).join(' ');
      console.log(`${String(t.line).padStart(4)}  ${JSON.stringify(t.text).padEnd(28)} ${role(t.foreground).padEnd(18)} ${t.fontStyle.padEnd(7)} ${leaf}`);
    }
  }
} else {
  let failures = 0;
  let checks = 0;
  for (const variant of variants) {
    const theme = createTheme(variant);
    const palette = createPalette(variant);
    const cache = new Map();
    for (const { file, text, line, role, fontStyle, only } of expectations) {
      if (only && !only(variant)) continue;
      if (!cache.has(file)) cache.set(file, (await tokenize(path.join(root, file), theme)).tokens);
      const token = cache.get(file).find((t) => t.text === text && (line === undefined || t.line === line));
      checks += 1;
      const expected = role.startsWith('state.') ? palette.state[role.slice(6)] : palette.syntax[role];
      const style = fontStyle === 'constantStyle' ? (palette.syntax.constantStyle ?? '') : fontStyle;
      if (!token) {
        failures += 1;
        console.error(`✗ ${variant.name}: ${file} — token ${JSON.stringify(text)} not found`);
      } else if (token.foreground !== expected || (style !== undefined && token.fontStyle !== style)) {
        failures += 1;
        console.error(
          `✗ ${variant.name}: ${file}:${token.line} ${JSON.stringify(text)} is ${token.foreground} ${token.fontStyle || 'regular'}, ` +
            `expected ${role} ${expected} ${style === undefined ? '' : style || 'regular'}\n    ${token.scopes.join(' ')}`,
        );
      }
    }
  }
  console.log(`${checks - failures}/${checks} token expectations hold across ${variants.length} themes.`);
  if (failures) process.exitCode = 1;
}

