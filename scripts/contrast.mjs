// Prints the contrast report for every variant. Run with `npm run contrast`.
import { contrast, over } from '../src/color.mjs';
import { createTheme, variants } from '../src/theme.mjs';
import { contrastPairs } from '../test/contrast-pairs.mjs';

let failures = 0;
for (const variant of variants) {
  const theme = createTheme(variant);
  console.log(`\n${variant.name}`);
  for (const { name, fg, bg, min } of contrastPairs(theme)) {
    const ratio = contrast(over(fg, bg), bg);
    const ok = ratio >= min;
    if (!ok) failures += 1;
    console.log(`${ok ? ' ' : '✗'} ${name.padEnd(36)} ${fg.padEnd(10)} on ${bg.padEnd(10)} ${ratio.toFixed(2).padStart(6)}  (min ${min})`);
  }
}
if (failures) {
  console.error(`\n${failures} pair(s) below their minimum contrast.`);
  process.exitCode = 1;
}
