// Color-vision audit: simulates protanopia, deuteranopia and tritanopia and
// checks that paired roles stay apart (CIEDE2000). Run with `npm run vision`.
//   --failures   print only pairs that miss a target
//   --json FILE  also write the full machine-readable report
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createTheme, variants } from '../src/theme.mjs';
import { visions } from '../src/vision.mjs';
import { auditVision } from '../test/vision-pairs.mjs';

const args = process.argv.slice(2);
const onlyFailures = args.includes('--failures');
const jsonFlag = args.indexOf('--json');
const jsonFile = jsonFlag >= 0 ? args[jsonFlag + 1] : null;
const short = { typical: 'typical', protanopia: 'protan', deuteranopia: 'deutan', tritanopia: 'tritan', grayscale: 'gray' };

const report = [];
let failures = 0;
for (const variant of variants) {
  const theme = createTheme(variant);
  const results = auditVision(theme, variant);
  const failed = results.filter((r) => r.status === 'fail').length;
  failures += failed;
  report.push({ theme: variant.name, enforced: Boolean(variant.accessible), results });

  const mode = variant.accessible ? `${results.length - failed} pass, ${failed} fail` : 'measured for comparison, not enforced';
  console.log(`\n${variant.name} — ${mode}`);
  console.log(`  ${'pair'.padEnd(46)}${visions.map((v) => short[v].padStart(8)).join('')}   target`);
  let group = '';
  for (const r of results) {
    const missed = r.failures.length > 0;
    if (onlyFailures && !(variant.accessible && missed)) continue;
    if (r.group !== group) console.log(`  ${(group = r.group)}`);
    const mark = r.status === 'fail' ? '✗' : r.status === 'info' && missed ? '·' : ' ';
    const cells = visions.map((v) => {
      const d = r.deltas[v].toFixed(1);
      return (r.failures.includes(v) ? `${d}*` : d).padStart(8);
    });
    console.log(`  ${mark} ${`${r.a.name} / ${r.b.name}`.padEnd(44)}${cells.join('')}   ${r.min.typical} / ${r.min.deficient}`);
  }
  const worst = Object.fromEntries(visions.map((v) => [v, Math.min(...results.filter((r) => r.group === 'Syntax').map((r) => r.deltas[v]))]));
  console.log(`  Closest syntax pair: ${visions.map((v) => `${short[v]} ${worst[v].toFixed(1)}`).join(' · ')}`);
}

if (jsonFile) {
  await mkdir(path.dirname(path.resolve(jsonFile)), { recursive: true });
  const themes = report.map(({ theme, enforced, results }) => ({
    theme,
    enforced,
    pairs: results.map(({ group, a, b, min, note, deltas, failures: missed, status, simulated }) => ({
      group, a, b, min, note, deltaE2000: Object.fromEntries(Object.entries(deltas).map(([k, v]) => [k, Number(v.toFixed(2))])), below: missed, status, simulated,
    })),
  }));
  await writeFile(jsonFile, `${JSON.stringify({ generated: new Date().toISOString(), method: 'Brettel, Viénot & Mollon (1997) dichromacy simulation in linear sRGB; CIEDE2000 color difference', themes }, null, 2)}\n`);
  console.log(`\nWrote ${jsonFile}`);
}

console.log('\n* below target. Grayscale is reported as a stress test only.');
if (failures) {
  console.error(`${failures} pair(s) in the accessible variants are below their target.`);
  process.exitCode = 1;
} else {
  console.log('Every pair in the accessible variants meets its target.');
}
