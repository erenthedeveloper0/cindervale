// Generates themes/*.json from src/. Run with `npm run build`.
// Pass --check to verify the committed files are up to date instead.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createTheme, variants } from '../src/theme.mjs';

const check = process.argv.includes('--check');
let stale = 0;

for (const variant of variants) {
  const target = fileURLToPath(new URL(`../themes/${variant.file}`, import.meta.url));
  const json = `${JSON.stringify(createTheme(variant), null, 2)}\n`;
  if (check) {
    const current = await readFile(target, 'utf8').catch(() => '');
    if (current !== json) {
      console.error(`✗ themes/${variant.file} is out of date — run npm run build`);
      stale += 1;
    } else {
      console.log(`✓ themes/${variant.file}`);
    }
  } else {
    await writeFile(target, json);
    console.log(`→ themes/${variant.file}`);
  }
}

process.exitCode = stale ? 1 : 0;
