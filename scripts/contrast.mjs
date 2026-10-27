// Contrast audit for every variant. Run with `npm run contrast`.
//   --failures   print only failing pairs
//   --json FILE  also write the full machine-readable report
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createTheme, variants } from '../src/theme.mjs';
import { auditContrast } from '../test/contrast-pairs.mjs';

const args = process.argv.slice(2);
const onlyFailures = args.includes('--failures');
const jsonFlag = args.indexOf('--json');
const jsonFile = jsonFlag >= 0 ? args[jsonFlag + 1] : null;

const report = [];
let failures = 0;
for (const variant of variants) {
  const theme = createTheme(variant);
  const results = auditContrast(theme, variant);
  const counts = { pass: 0, fail: 0, info: 0 };
  for (const r of results) counts[r.status] += 1;
  failures += counts.fail;
  report.push({ theme: variant.name, counts, results });

  console.log(`\n${variant.name} — ${counts.pass} pass, ${counts.fail} fail, ${counts.info} measured without a target`);
  let group = '';
  for (const r of results) {
    if (onlyFailures && r.status !== 'fail') continue;
    if (r.group !== group) console.log(`  ${(group = r.group)}`);
    const mark = { pass: ' ', fail: '✗', info: '·' }[r.status];
    const target = r.required ? `min ${r.required}` : 'info';
    const surface = r.base ? `${r.bg} over ${r.base}` : r.bg;
    console.log(`  ${mark} ${r.name.padEnd(44)} ${r.fg.padEnd(10)} on ${surface.padEnd(22)} ${r.ratio.toFixed(2).padStart(6)}  (${target}${r.kind === 'non-text' ? ', non-text' : ''})`);
  }
}

if (jsonFile) {
  await mkdir(path.dirname(path.resolve(jsonFile)), { recursive: true });
  const rows = report.map(({ theme, counts, results }) => ({
    theme,
    counts,
    pairs: results.map(({ group, name, kind, fg, bg, base, foreground, background, ratio, required, status }) => ({
      group, name, kind, fg, bg, base, composited: { foreground, background }, ratio: Number(ratio.toFixed(3)), required, status,
    })),
  }));
  await writeFile(jsonFile, `${JSON.stringify({ generated: new Date().toISOString(), method: 'WCAG 2 relative luminance; translucent colors composited onto the surface below', themes: rows }, null, 2)}\n`);
  console.log(`\nWrote ${jsonFile}`);
}

const total = report.reduce((n, t) => n + t.results.length, 0);
console.log(`\n${total} pairs measured across ${variants.length} themes.`);
if (failures) {
  console.error(`${failures} pair(s) below their minimum contrast.`);
  process.exitCode = 1;
} else {
  console.log('Every pair with a target meets it.');
}
