import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { createTheme, variants } from '../src/theme.mjs';
import { auditContrast } from './contrast-pairs.mjs';
import { auditVision } from './vision-pairs.mjs';

const HEX = /^#[0-9A-F]{6}([0-9A-F]{2})?$/;
const root = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
const registry = JSON.parse(await readFile(new URL('vscode-color-ids.json', import.meta.url), 'utf8'));
const registered = new Set(registry.ids);

// Semantic token types and modifiers from VS Code's standard classification,
// plus the language-server specific ones the themes deliberately style.
const SEMANTIC_TYPES = new Set([
  'namespace', 'class', 'enum', 'interface', 'struct', 'typeParameter', 'type', 'parameter', 'variable', 'property',
  'enumMember', 'decorator', 'event', 'function', 'method', 'macro', 'label', 'comment', 'string', 'keyword', 'number',
  'regexp', 'operator', '*',
  'selfParameter', 'clsParameter', // Pylance
  'selfKeyword', // rust-analyzer
]);
const SEMANTIC_MODIFIERS = new Set([
  'declaration', 'definition', 'readonly', 'static', 'deprecated', 'abstract', 'async', 'modification', 'documentation',
  'defaultLibrary',
  'constant', // rust-analyzer, clangd
  'keywordArgument', // Pylance
]);
const FONT_STYLES = /^(?:(?:italic|bold|underline|strikethrough)(?: (?:italic|bold|underline|strikethrough))*)?$/;

// When a semantic token's style leaves a property unset, VS Code fills it by
// probing TextMate rules with these bare scopes (tokenClassificationRegistry,
// VS Code 1.143.1). A rule that matches a probe styles every such token.
const SEMANTIC_PROBES = [
  'comment', 'string', 'keyword.control', 'constant.numeric', 'constant.regexp', 'keyword.operator',
  'entity.name.namespace', 'entity.name.type', 'support.type', 'entity.name.type.struct', 'entity.name.type.class',
  'support.class', 'entity.name.type.interface', 'entity.name.type.enum', 'entity.name.type.parameter',
  'entity.name.function', 'support.function', 'entity.name.function.member', 'entity.name.function.preprocessor',
  'variable.other.readwrite', 'entity.name.variable', 'variable.parameter', 'variable.other.property',
  'variable.other.enummember', 'variable.other.event', 'entity.name.decorator',
  'variable.other.constant', 'variable.other.constant.property', 'support.variable', 'support.other.variable',
  'support.constant', 'support.variable.property', 'support.constant.property',
];

/** The font style a bare probe scope resolves to: the most specific single-scope selector wins. */
function probeFontStyle(theme, probe) {
  let best = { length: -1, fontStyle: undefined };
  for (const rule of theme.tokenColors) {
    for (const selector of rule.scope) {
      if (selector.includes(' ')) continue; // needs a parent scope a probe never has
      const matches = probe === selector || probe.startsWith(`${selector}.`);
      if (matches && selector.length > best.length) best = { length: selector.length, fontStyle: rule.settings.fontStyle };
    }
  }
  return best.fontStyle;
}

test('every contributed theme has a variant, a file and the right base theme', () => {
  const labels = manifest.contributes.themes.map((t) => t.label);
  assert.equal(new Set(labels).size, labels.length, 'theme labels must be unique');
  assert.equal(labels.length, variants.length);
  for (const entry of manifest.contributes.themes) {
    const variant = variants.find((v) => v.name === entry.label);
    assert.ok(variant, `${entry.label} has no variant in src/theme.mjs`);
    assert.ok(existsSync(new URL(entry.path, root)), `${entry.path} does not exist`);
  }
});

test('the original Cindervale themes keep their published registrations', () => {
  const expected = [
    { label: 'Cindervale Dark', uiTheme: 'vs-dark', path: './themes/cindervale-dark-color-theme.json' },
    { label: 'Cindervale Light', uiTheme: 'vs', path: './themes/cindervale-light-color-theme.json' },
  ];
  for (const entry of expected) assert.deepEqual(manifest.contributes.themes.find((t) => t.label === entry.label), entry);
});

test('the manifest is complete and keeps the extension identity', () => {
  assert.equal(manifest.name, 'cindervale-theme');
  assert.equal(manifest.publisher, 'erenthedeveloper0');
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
  assert.match(manifest.engines.vscode, /^\^\d+\.\d+\.\d+$/);
  assert.deepEqual(manifest.categories, ['Themes']);
  assert.equal(manifest.license, 'MIT');
  assert.ok(existsSync(new URL(manifest.icon, root)), 'icon file is missing');
  assert.match(manifest.repository.url, /^https:\/\/github\.com\//);
  assert.ok(manifest.description.length <= 200, 'description is too long for the Marketplace card');
  assert.ok(manifest.keywords.length <= 30, 'the Marketplace accepts at most 30 keywords');
  assert.equal(new Set(manifest.keywords).size, manifest.keywords.length, 'duplicate keywords');
  assert.ok(!manifest.dependencies, 'a color theme needs no runtime dependencies');
  assert.ok(!manifest.main && !manifest.browser, 'a color theme needs no activation code');
});

test('the color ID snapshot comes from a real VS Code release', () => {
  assert.match(registry.vscode, /^\d+\.\d+\.\d+$/);
  assert.ok(registered.size > 900);
});

const names = variants.map((v) => v.name);
test('variant names are unique', () => assert.equal(new Set(names).size, names.length));

for (const variant of variants) {
  const theme = createTheme(variant);

  test(`${variant.name}: generated file is up to date`, async () => {
    const file = await readFile(new URL(`themes/${variant.file}`, root), 'utf8');
    assert.equal(file, `${JSON.stringify(theme, null, 2)}\n`, 'run `npm run build`');
    const parsed = JSON.parse(file);
    assert.equal(parsed.name, variant.name);
    assert.equal(parsed.type, variant.type);
  });

  test(`${variant.name}: is contributed by package.json`, () => {
    const entry = manifest.contributes.themes.find((t) => t.label === variant.name);
    assert.ok(entry, 'missing contribution');
    assert.equal(entry.path, `./themes/${variant.file}`);
    assert.equal(entry.uiTheme, variant.type === 'dark' ? 'vs-dark' : 'vs');
  });

  test(`${variant.name}: every workbench color is registered by VS Code`, () => {
    const unknown = Object.keys(theme.colors).filter((key) => !registered.has(key));
    assert.deepEqual(unknown, [], `not registered in VS Code ${registry.vscode}`);
  });

  test(`${variant.name}: every color is a valid hex value`, () => {
    for (const [key, value] of Object.entries(theme.colors)) assert.match(value, HEX, key);
    for (const rule of theme.tokenColors) {
      if (rule.settings.foreground) assert.match(rule.settings.foreground, HEX, rule.name);
      if (rule.settings.fontStyle !== undefined) assert.match(rule.settings.fontStyle, FONT_STYLES, rule.name);
    }
    for (const [selector, value] of Object.entries(theme.semanticTokenColors)) {
      if (typeof value === 'string') assert.match(value, HEX, selector);
      else {
        assert.match(value.foreground, HEX, selector);
        assert.deepEqual(Object.keys(value).filter((k) => !['foreground', 'bold', 'italic', 'underline', 'strikethrough'].includes(k)), [], selector);
      }
    }
  });

  test(`${variant.name}: token rules are named, scoped and never contradict each other`, () => {
    const seen = new Map();
    for (const rule of theme.tokenColors) {
      assert.ok(rule.name, 'every rule has a name');
      assert.ok(rule.scope.length > 0, `${rule.name} has no scope`);
      assert.ok(rule.settings.foreground || rule.settings.fontStyle !== undefined, `${rule.name} sets nothing`);
      for (const scope of rule.scope) {
        assert.ok(!seen.has(scope), `"${scope}" is in both "${seen.get(scope)}" and "${rule.name}"`);
        seen.set(scope, rule.name);
      }
    }
    const ruleNames = theme.tokenColors.map((r) => r.name);
    assert.equal(new Set(ruleNames).size, ruleNames.length, 'rule names are unique');
  });

  test(`${variant.name}: semantic selectors use known token types and modifiers`, () => {
    for (const selector of Object.keys(theme.semanticTokenColors)) {
      const [type, ...modifiers] = selector.split(/[.:]/);
      assert.ok(SEMANTIC_TYPES.has(type), `${selector}: unknown token type "${type}"`);
      for (const modifier of modifiers) assert.ok(SEMANTIC_MODIFIERS.has(modifier), `${selector}: unknown modifier "${modifier}"`);
    }
  });

  test(`${variant.name}: semantic tokens cannot inherit weight from TextMate probes`, () => {
    // TypeScript marks every const binding readonly; if `variable.readonly`
    // picked up bold through its probe, most names would turn bold.
    for (const probe of SEMANTIC_PROBES) {
      assert.ok(!/bold/.test(probeFontStyle(theme, probe) ?? ''), `${probe} resolves to bold`);
    }
  });

  test(`${variant.name}: defines all sixteen ANSI colors`, () => {
    for (const name of ['Black', 'Red', 'Green', 'Yellow', 'Blue', 'Magenta', 'Cyan', 'White']) {
      assert.match(theme.colors[`terminal.ansi${name}`] ?? '', HEX, `terminal.ansi${name}`);
      assert.match(theme.colors[`terminal.ansiBright${name}`] ?? '', HEX, `terminal.ansiBright${name}`);
    }
  });

  test(`${variant.name}: no pure black or pure white surfaces`, () => {
    for (const key of ['editor.background', 'sideBar.background', 'panel.background', 'editorWidget.background', 'editor.foreground']) {
      assert.ok(!['#000000', '#FFFFFF'].includes(theme.colors[key]), key);
    }
  });

  test(`${variant.name}: readable contrast`, () => {
    const failures = auditContrast(theme, variant).filter((r) => r.status === 'fail');
    assert.deepEqual(
      failures.map((r) => `${r.name}: ${r.ratio.toFixed(2)} < ${r.required}`),
      [],
    );
  });

  if (variant.accessible) {
    test(`${variant.name}: paired roles stay apart under simulated color vision deficiencies`, () => {
      const failures = auditVision(theme, variant).filter((r) => r.status === 'fail');
      assert.deepEqual(
        failures.map((r) => `${r.a.name} / ${r.b.name}: ${r.failures.map((v) => `${v} ${r.deltas[v].toFixed(1)}`).join(', ')}`),
        [],
      );
    });
  }

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
