// Tokenizes files with the TextMate engine and grammars bundled in a local
// VS Code installation, then resolves each token's color through a theme the
// same way VS Code does. Must run inside VS Code's Electron in Node mode
// (ELECTRON_RUN_AS_NODE=1), which can read the app's node_modules.asar.
// scripts/inspect-tokens.mjs takes care of that.

const fs = require('node:fs');
const path = require('node:path');

const app = process.env.VSCODE_APP;
const tm = require(path.join(app, 'node_modules.asar', 'vscode-textmate'));
const onig = require(path.join(app, 'node_modules.asar', 'vscode-oniguruma'));

const FONT_STYLE = { 1: 'italic', 2: 'bold', 4: 'underline', 8: 'strikethrough' };

function loadGrammars() {
  const byScope = new Map();
  const byLanguage = new Map();
  const injections = new Map();
  const extensions = path.join(app, 'extensions');
  for (const dir of fs.readdirSync(extensions)) {
    const manifestPath = path.join(extensions, dir, 'package.json');
    if (!fs.existsSync(manifestPath)) continue;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const contributes = manifest.contributes ?? {};
    const extensionsByLanguage = new Map();
    for (const lang of contributes.languages ?? []) {
      for (const ext of lang.extensions ?? []) extensionsByLanguage.set(ext, lang.id);
    }
    for (const g of contributes.grammars ?? []) {
      const file = path.join(extensions, dir, g.path);
      byScope.set(g.scopeName, file);
      if (g.language) byLanguage.set(g.language, g.scopeName);
      for (const target of g.injectTo ?? []) {
        if (!injections.has(target)) injections.set(target, []);
        injections.get(target).push(g.scopeName);
      }
    }
    for (const [ext, id] of extensionsByLanguage) byLanguage.set(`ext:${ext}`, byLanguage.get(`ext:${ext}`) ?? id);
  }
  return { byScope, byLanguage, injections };
}

const grammars = loadGrammars();

const registry = new tm.Registry({
  onigLib: onig
    .loadWASM(fs.readFileSync(path.join(app, 'node_modules.asar.unpacked', 'vscode-oniguruma', 'release', 'onig.wasm')).buffer)
    .then(() => ({ createOnigScanner: (s) => new onig.OnigScanner(s), createOnigString: (s) => new onig.OnigString(s) })),
  loadGrammar: async (scopeName) => {
    const file = grammars.byScope.get(scopeName);
    if (!file) return null;
    return tm.parseRawGrammar(fs.readFileSync(file, 'utf8'), file);
  },
  getInjections: (scopeName) => grammars.injections.get(scopeName),
});

/** Language id → top-level scope, resolved from the file extension. */
function scopeForFile(file) {
  const base = path.basename(file);
  const candidates = [base, path.extname(file)];
  const special = { '.env.example': 'dotenv', 'Dockerfile': 'dockerfile' };
  if (special[base]) return grammars.byLanguage.get(special[base]);
  for (const ext of candidates) {
    const language = grammars.byLanguage.get(`ext:${ext}`);
    if (language && grammars.byLanguage.get(language)) return grammars.byLanguage.get(language);
  }
  return null;
}

/** Tokenize `text` and resolve colors through the given VS Code theme JSON. */
async function tokenize(file, theme) {
  const scopeName = scopeForFile(file);
  if (!scopeName) throw new Error(`No grammar for ${file}`);
  registry.setTheme({
    name: theme.name,
    settings: [
      { settings: { foreground: theme.colors['editor.foreground'], background: theme.colors['editor.background'] } },
      ...theme.tokenColors,
    ],
  });
  const colorMap = registry.getColorMap();
  const grammar = await registry.loadGrammar(scopeName);
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  const out = [];
  let state = tm.INITIAL;
  let colorState = tm.INITIAL;
  lines.forEach((line, index) => {
    const scoped = grammar.tokenizeLine(line, state);
    const colored = grammar.tokenizeLine2(line, colorState);
    state = scoped.ruleStack;
    colorState = colored.ruleStack;
    const metadataAt = (offset) => {
      let meta = colored.tokens[1];
      for (let i = 0; i < colored.tokens.length; i += 2) {
        if (colored.tokens[i] <= offset) meta = colored.tokens[i + 1];
        else break;
      }
      return meta;
    };
    for (const token of scoped.tokens) {
      const text = line.slice(token.startIndex, token.endIndex);
      if (!text.trim()) continue;
      const meta = metadataAt(token.startIndex);
      const fg = colorMap[(meta & 0x00ff8000) >>> 15];
      const styleBits = (meta & 0x00007800) >>> 11;
      const fontStyle = Object.entries(FONT_STYLE).filter(([bit]) => styleBits & Number(bit)).map(([, name]) => name).join(' ');
      out.push({ line: index + 1, text, scopes: token.scopes, foreground: fg.toUpperCase(), fontStyle });
    }
  });
  return { scopeName, tokens: out };
}

module.exports = { tokenize, scopeForFile, vscodeVersion: () => JSON.parse(fs.readFileSync(path.join(app, 'package.json'), 'utf8')).version };
