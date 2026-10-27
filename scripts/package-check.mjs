// Checks what `vsce` would put in the VSIX: every theme and the files the
// Marketplace needs, and nothing from development. Run with
// `npm run package:check`; it does not build a package.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const vsce = path.join(path.dirname(require.resolve('@vscode/vsce/package.json')), 'vsce');

const result = spawnSync(process.execPath, [vsce, 'ls'], { encoding: 'utf8' });
if (result.status !== 0) {
  console.error(result.stderr || result.stdout);
  process.exit(result.status ?? 1);
}
const files = result.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

const required = [
  'package.json',
  'README.md',
  'CHANGELOG.md',
  'LICENSE',
  manifest.icon,
  ...manifest.contributes.themes.map((theme) => path.posix.normalize(theme.path)),
];
const forbidden = [
  /^src\//, /^scripts\//, /^test\//, /^fixtures\//, /^screenshots\//, /^docs\//, /^reports\//,
  /^node_modules\//, /^\.github\//, /^\.vscode\//, /\.vsix$/, /(^|\/)\.env/, /\.DS_Store$/, /package-lock\.json$/,
];

const missing = required.filter((file) => !files.includes(file));
const unexpected = files.filter((file) => forbidden.some((pattern) => pattern.test(file)));

console.log(`The VSIX for ${manifest.publisher}.${manifest.name} ${manifest.version} would contain ${files.length} files:`);
for (const file of files) console.log(`  ${file}`);
for (const file of missing) console.error(`✗ missing: ${file}`);
for (const file of unexpected) console.error(`✗ should not ship: ${file}`);
if (missing.length || unexpected.length) process.exitCode = 1;
else console.log('Package contents look right.');
