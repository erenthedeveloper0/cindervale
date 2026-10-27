// Runs a screenshot through the same color-vision model the audits use
// (src/vision.mjs), pixel by pixel in linear RGB.
//
//   node scripts/screenshots/simulate.mjs screenshots/x.png out/
//   → out/x-protanopia.png, out/x-deuteranopia.png, out/x-tritanopia.png, out/x-grayscale.png
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { simulateLinear } from '../../src/vision.mjs';
import { decode, encode } from './png.mjs';

const toLinear = new Float64Array(256).map((_, i) => {
  const c = i / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
});
const STEPS = 4096;
const fromLinear = new Uint8Array(STEPS + 1).map((_, i) => {
  const c = i / STEPS;
  return Math.round(255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055));
});

export function simulateImage({ width, height, data }, kind) {
  const out = Buffer.alloc(data.length);
  const cache = new Map();
  for (let i = 0; i < data.length; i += 4) {
    const key = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
    let rgb = cache.get(key);
    if (!rgb) {
      const lin = simulateLinear([toLinear[data[i]], toLinear[data[i + 1]], toLinear[data[i + 2]]], kind);
      rgb = lin.map((v) => fromLinear[Math.round(Math.min(1, Math.max(0, v)) * STEPS)]);
      cache.set(key, rgb);
    }
    out[i] = rgb[0];
    out[i + 1] = rgb[1];
    out[i + 2] = rgb[2];
    out[i + 3] = 255;
  }
  return { width, height, data: out };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [input, outDir] = process.argv.slice(2);
  if (!input || !outDir) {
    console.error('Usage: node scripts/screenshots/simulate.mjs <image.png> <output folder>');
    process.exit(2);
  }
  const image = decode(await readFile(input));
  await mkdir(outDir, { recursive: true });
  for (const kind of ['protanopia', 'deuteranopia', 'tritanopia', 'grayscale']) {
    const file = path.join(outDir, `${path.basename(input, '.png')}-${kind}.png`);
    await writeFile(file, encode(simulateImage(image, kind)));
    console.log(`→ ${file}`);
  }
}
