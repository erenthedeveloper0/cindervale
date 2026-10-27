// Snapshots every workbench color ID registered by a VS Code installation
// into test/vscode-color-ids.json, so tests can reject theme keys VS Code
// does not know. Run with `npm run colors:sync` after a VS Code update.
//   --check  compare the themes against the installation instead of writing
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTheme, variants } from '../src/theme.mjs';
import { findVSCode } from './lib/vscode.mjs';

const vscode = findVSCode();
if (!vscode) {
  console.error('VS Code was not found. Install it or set VSCODE_APP to its resources/app folder.');
  process.exit(2);
}

const bundle = await readFile(path.join(vscode.app, 'out', 'vs', 'workbench', 'workbench.desktop.main.js'), 'utf8');
// registerColor is minified; find its local name from a well-known call.
const fn = /([A-Za-z_$][\w$]*)\("editorWidget\.background",\{dark:/.exec(bundle)?.[1];
if (!fn) {
  console.error('Could not find registerColor in the workbench bundle; the extraction needs updating.');
  process.exit(2);
}
const ids = new Set();
const call = new RegExp(`(?<![\\w$.])${fn.replace(/\$/g, '\\$')}\\("([A-Za-z0-9][\\w.\\-]*)",`, 'g');
for (const m of bundle.matchAll(call)) ids.add(m[1]);
// The 16 ANSI colors are registered in a loop over their names.
for (const name of ['Black', 'Red', 'Green', 'Yellow', 'Blue', 'Magenta', 'Cyan', 'White']) {
  ids.add(`terminal.ansi${name}`);
  ids.add(`terminal.ansiBright${name}`);
}
// Built-in extensions (Git, for example) contribute colors in their manifests.
const extensions = path.join(vscode.app, 'extensions');
for (const dir of await readdir(extensions)) {
  const manifest = path.join(extensions, dir, 'package.json');
  if (!existsSync(manifest)) continue;
  for (const color of JSON.parse(await readFile(manifest, 'utf8')).contributes?.colors ?? []) ids.add(color.id);
}
const version = JSON.parse(await readFile(path.join(vscode.app, 'package.json'), 'utf8')).version;

if (process.argv.includes('--check')) {
  let unknown = 0;
  for (const variant of variants) {
    for (const key of Object.keys(createTheme(variant).colors)) {
      if (!ids.has(key)) {
        unknown += 1;
        console.error(`✗ ${variant.name}: ${key} is not registered in VS Code ${version}`);
      }
    }
  }
  console.log(`Checked ${variants.length} themes against ${ids.size} color IDs from VS Code ${version}.`);
  process.exitCode = unknown ? 1 : 0;
} else {
  const target = fileURLToPath(new URL('../test/vscode-color-ids.json', import.meta.url));
  await writeFile(target, `${JSON.stringify({ vscode: version, ids: [...ids].sort() }, null, 2)}\n`);
  console.log(`Wrote ${ids.size} color IDs from VS Code ${version} to test/vscode-color-ids.json`);
}
