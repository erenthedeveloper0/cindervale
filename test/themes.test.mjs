import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { contrast, over } from '../src/color.mjs';
import { createTheme, variants } from '../src/theme.mjs';
import { contrastPairs } from './contrast-pairs.mjs';

const HEX = /^#[0-9A-F]{6}([0-9A-F]{2})?$/;
const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

for (const variant of variants) {
  const theme = createTheme(variant);

  test(`${variant.name}: generated file is up to date`, async () => {
    const file = await readFile(new URL(`../themes/${variant.file}`, import.meta.url), 'utf8');
    assert.equal(file, `${JSON.stringify(theme, null, 2)}\n`, 'run `npm run build`');
  });

  test(`${variant.name}: is contributed by package.json`, () => {
    const entry = manifest.contributes.themes.find((t) => t.label === variant.name);
    assert.ok(entry, 'missing contribution');
    assert.equal(entry.path, `./themes/${variant.file}`);
    assert.equal(entry.uiTheme, variant.type === 'dark' ? 'vs-dark' : 'vs');
  });

  test(`${variant.name}: every color is a valid hex value`, () => {
    for (const [key, value] of Object.entries(theme.colors)) assert.match(value, HEX, key);
    for (const rule of theme.tokenColors) {
      assert.ok(rule.scope.length > 0, `${rule.name} has no scope`);
      if (rule.settings.foreground) assert.match(rule.settings.foreground, HEX, rule.name);
    }
    for (const [selector, value] of Object.entries(theme.semanticTokenColors)) assert.match(value, HEX, selector);
  });

  test(`${variant.name}: no pure black or pure white surfaces`, () => {
    for (const key of ['editor.background', 'sideBar.background', 'panel.background', 'editorWidget.background', 'editor.foreground']) {
      assert.ok(!['#000000', '#FFFFFF'].includes(theme.colors[key]), key);
    }
  });

  test(`${variant.name}: readable contrast`, () => {
    for (const { name, fg, bg, min } of contrastPairs(theme)) {
      const ratio = contrast(over(fg, bg), bg);
      assert.ok(ratio >= min, `${name}: ${ratio.toFixed(2)} < ${min}`);
    }
  });

  test(`${variant.name}: overlays that must stay translucent are translucent`, () => {
    const translucent = [
      'editor.inactiveSelectionBackground',
      'editor.selectionHighlightBackground',
      'editor.wordHighlightBackground',
      'editor.wordHighlightStrongBackground',
      'editor.findMatchHighlightBackground',
      'editor.findRangeHighlightBackground',
      'editor.hoverHighlightBackground',
      'editor.rangeHighlightBackground',
      'editor.foldBackground',
      'diffEditor.insertedTextBackground',
      'diffEditor.removedTextBackground',
      'diffEditor.insertedLineBackground',
      'diffEditor.removedLineBackground',
      'merge.currentContentBackground',
      'merge.incomingContentBackground',
      'terminal.findMatchBackground',
      'terminal.findMatchHighlightBackground',
    ];
    for (const key of translucent) assert.equal(theme.colors[key].length, 9, `${key} must have an alpha channel`);
  });
}
