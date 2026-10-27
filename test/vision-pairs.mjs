// Color pairs that must stay distinguishable for people with color vision
// deficiencies. Each pair is simulated under protanopia, deuteranopia and
// tritanopia (Brettel 1997) and compared with CIEDE2000.
//
// The minimum differences are engineering targets chosen for Cindervale, not
// a standard: ΔE00 ≈ 1 is a just-noticeable difference for large patches,
// while thin syntax glyphs need far more to read as different categories at
// a glance. Text roles that sit next to each other aim for 15 in typical
// vision and 10 under each simulated dichromacy (8 when one side is an
// italic comment, which also differs in shape). Large tinted areas (diff
// lines) are easier to tell apart and aim lower.
//
// The accessible variants are held to these targets. The standard themes
// are measured with the same pairs for comparison, and never fail on them.

import { over } from '../src/color.mjs';
import { distance, simulate, visions } from '../src/vision.mjs';

const tokenRule = (theme, name) => theme.tokenColors.find((r) => r.name === name)?.settings.foreground;

export function visionPairs(theme) {
  const c = (key) => theme.colors[key];
  const editor = c('editor.background');
  const onEditor = (key) => over(c(key), editor);
  const pairs = [];
  const add = (group, a, b, min, note) => pairs.push({ group, a, b, min, note });

  // ── Syntax: every pair of roles that can sit side by side ──────────────
  const syntax = {
    Variables: c('editor.foreground'),
    Comments: tokenRule(theme, 'Comments'),
    Keywords: tokenRule(theme, 'Keywords and storage'),
    Functions: tokenRule(theme, 'Functions'),
    Types: tokenRule(theme, 'Types, classes, interfaces'),
    Strings: tokenRule(theme, 'Strings'),
    Numbers: tokenRule(theme, 'Numbers and units'),
  };
  const roles = Object.entries(syntax);
  for (let i = 0; i < roles.length; i++) {
    for (let j = i + 1; j < roles.length; j++) {
      const [na, ca] = roles[i];
      const [nb, cb] = roles[j];
      const italic = na === 'Comments' || nb === 'Comments';
      add('Syntax', { name: na, color: ca }, { name: nb, color: cb }, italic ? { typical: 12, deficient: 8 } : { typical: 15, deficient: 10 });
    }
  }
  // Constants: by color in the standard themes, by weight in the accessible ones.
  const constant = tokenRule(theme, 'Named constants and enum members');
  if (constant !== syntax.Variables) {
    for (const other of ['Keywords', 'Functions', 'Types', 'Strings', 'Numbers']) {
      add('Syntax', { name: 'Constants', color: constant }, { name: other, color: syntax[other] }, { typical: 15, deficient: 10 });
    }
  }

  // ── Diagnostics ────────────────────────────────────────────────────────
  const diag = {
    Errors: onEditor('editorError.foreground'),
    Warnings: onEditor('editorWarning.foreground'),
    Information: onEditor('editorInfo.foreground'),
    Hints: onEditor('editorHint.foreground'),
  };
  add('Diagnostics', { name: 'Errors', color: diag.Errors }, { name: 'Warnings', color: diag.Warnings }, { typical: 20, deficient: 15 });
  add('Diagnostics', { name: 'Errors', color: diag.Errors }, { name: 'Information', color: diag.Information }, { typical: 15, deficient: 10 });
  add('Diagnostics', { name: 'Warnings', color: diag.Warnings }, { name: 'Information', color: diag.Information }, { typical: 15, deficient: 10 });
  add('Diagnostics', { name: 'Information', color: diag.Information }, { name: 'Hints', color: diag.Hints }, { typical: 10, deficient: 8 }, 'hints are drawn as dots, not squiggles');
  add('Diagnostics', { name: 'Errors', color: diag.Errors }, { name: 'Hints', color: diag.Hints }, { typical: 10, deficient: 8 }, 'hints are drawn as dots, not squiggles');

  // ── Source control: explorer labels, gutter bars ───────────────────────
  const git = {
    Added: c('gitDecoration.addedResourceForeground'),
    Modified: c('gitDecoration.modifiedResourceForeground'),
    Deleted: c('gitDecoration.deletedResourceForeground'),
    Renamed: c('gitDecoration.renamedResourceForeground'),
  };
  for (const [a, b] of [['Added', 'Modified'], ['Added', 'Deleted'], ['Modified', 'Deleted']]) {
    add('Source control', { name: `Git ${a.toLowerCase()}`, color: git[a] }, { name: `Git ${b.toLowerCase()}`, color: git[b] }, { typical: 15, deficient: 10 }, 'labels also carry A / M / D letters');
  }
  for (const other of ['Added', 'Modified', 'Deleted']) {
    add('Source control', { name: 'Git renamed', color: git.Renamed }, { name: `Git ${other.toLowerCase()}`, color: git[other] }, { typical: 8, deficient: 6 }, 'labels also carry an R letter');
  }
  const gutter = { Added: c('editorGutter.addedBackground'), Modified: c('editorGutter.modifiedBackground'), Deleted: c('editorGutter.deletedBackground') };
  for (const [a, b] of [['Added', 'Modified'], ['Added', 'Deleted'], ['Modified', 'Deleted']]) {
    add('Source control', { name: `Gutter ${a.toLowerCase()}`, color: gutter[a] }, { name: `Gutter ${b.toLowerCase()}`, color: gutter[b] }, { typical: 15, deficient: 10 }, 'modified bars are hatched, deletions are wedges');
  }

  // ── Diff editor: tints composited on the editor ────────────────────────
  const diff = {
    'Inserted line': onEditor('diffEditor.insertedLineBackground'),
    'Removed line': onEditor('diffEditor.removedLineBackground'),
    'Inserted text': onEditor('diffEditor.insertedTextBackground'),
    'Removed text': onEditor('diffEditor.removedTextBackground'),
  };
  add('Diff', { name: 'Inserted line', color: diff['Inserted line'] }, { name: 'Removed line', color: diff['Removed line'] }, { typical: 6, deficient: 4 }, 'large areas; the diff editor also shows + / − markers');
  add('Diff', { name: 'Inserted text', color: diff['Inserted text'] }, { name: 'Removed text', color: diff['Removed text'] }, { typical: 10, deficient: 7 });
  add('Diff', { name: 'Inserted line', color: diff['Inserted line'] }, { name: 'Editor', color: editor }, { typical: 4, deficient: 3 });
  add('Diff', { name: 'Removed line', color: diff['Removed line'] }, { name: 'Editor', color: editor }, { typical: 4, deficient: 3 });

  // ── Editor overlays ────────────────────────────────────────────────────
  const overlay = {
    Selection: c('editor.selectionBackground'),
    'Current line': c('editor.lineHighlightBackground'),
    'Find match': onEditor('editor.findMatchBackground'),
    'Other matches': onEditor('editor.findMatchHighlightBackground'),
    'Symbol reference': onEditor('editor.wordHighlightStrongBackground'),
  };
  add('Overlays', { name: 'Selection', color: overlay.Selection }, { name: 'Editor', color: editor }, { typical: 10, deficient: 8 });
  add('Overlays', { name: 'Selection', color: overlay.Selection }, { name: 'Current line', color: overlay['Current line'] }, { typical: 8, deficient: 6 });
  add('Overlays', { name: 'Find match', color: overlay['Find match'] }, { name: 'Current line', color: overlay['Current line'] }, { typical: 10, deficient: 8 });
  add('Overlays', { name: 'Find match', color: overlay['Find match'] }, { name: 'Selection', color: overlay.Selection }, { typical: 10, deficient: 8 });
  add('Overlays', { name: 'Find match', color: overlay['Find match'] }, { name: 'Other matches', color: overlay['Other matches'] }, { typical: 5, deficient: 4 }, 'the current match also has a border');
  add('Overlays', { name: 'Symbol reference', color: overlay['Symbol reference'] }, { name: 'Find match', color: overlay['Find match'] }, { typical: 6, deficient: 4 });

  // ── Terminal: the pairs programs rely on ───────────────────────────────
  for (const bright of ['', 'Bright']) {
    const t = (name) => c(`terminal.ansi${bright}${name}`);
    const label = (name) => `ANSI ${bright ? 'bright ' : ''}${name.toLowerCase()}`;
    add('Terminal', { name: label('Red'), color: t('Red') }, { name: label('Green'), color: t('Green') }, { typical: 20, deficient: 12 }, 'failures vs passes, deletions vs additions');
    add('Terminal', { name: label('Red'), color: t('Red') }, { name: label('Yellow'), color: t('Yellow') }, { typical: 15, deficient: 10 }, 'errors vs warnings');
    add('Terminal', { name: label('Green'), color: t('Green') }, { name: label('Yellow'), color: t('Yellow') }, { typical: 15, deficient: 10 });
    add('Terminal', { name: label('Blue'), color: t('Blue') }, { name: label('Magenta'), color: t('Magenta') }, { typical: 12, deficient: 8 });
    add('Terminal', { name: label('Green'), color: t('Green') }, { name: label('Cyan'), color: t('Cyan') }, { typical: 10, deficient: 7 });
    add('Terminal', { name: label('Blue'), color: t('Blue') }, { name: label('Cyan'), color: t('Cyan') }, { typical: 10, deficient: 7 });
    add('Terminal', { name: label('Red'), color: t('Red') }, { name: label('Magenta'), color: t('Magenta') }, { typical: 10, deficient: 7 });
  }

  return pairs;
}

/** Simulate every pair under every vision and compare with its targets. */
export function auditVision(theme, { accessible = false } = {}) {
  return visionPairs(theme).map((pair) => {
    const deltas = Object.fromEntries(visions.map((v) => [v, distance(pair.a.color, pair.b.color, v)]));
    const failures = visions.filter((v) => {
      if (v === 'grayscale') return false;
      const min = v === 'typical' ? pair.min.typical : pair.min.deficient;
      return deltas[v] < min;
    });
    const status = !accessible ? 'info' : failures.length ? 'fail' : 'pass';
    return { ...pair, deltas, failures, status, simulated: { a: Object.fromEntries(visions.map((v) => [v, simulate(pair.a.color, v)])), b: Object.fromEntries(visions.map((v) => [v, simulate(pair.b.color, v)])) } };
  });
}
