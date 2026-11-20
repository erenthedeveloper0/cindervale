// The palette sheets and the color-vision boards that accompany the
// screenshots. Both are plain HTML rendered by a headless Chromium, set in the
// brand typefaces (scripts/brand/identity.mjs).
//
//   node scripts/screenshots/boards.mjs   rebuild them from src/palette.mjs and
//                                         the captures in screenshots/, without VS Code
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DISPLAY, FONTS, MONO, SANS } from '../brand/identity.mjs';
import { accessibleSource, source } from '../../src/palette.mjs';
import { renderHtml } from './cdp.mjs';
import { crop, decode, encode, shrink } from './png.mjs';
import { simulateImage } from './simulate.mjs';

const SHEETS = [
  {
    file: 'palette.png',
    palette: source,
    title: { dark: 'Cindervale Dark', light: 'Cindervale Light' },
    subtitle: { dark: 'Warm charcoal, walnut, copper and burgundy light.', light: 'Warm ivory paper, terracotta, soft wine and sage.' },
    swatches: [
      ['Editor', 'editor'], ['Side bar', 'sidebar'], ['Panel', 'panel'], ['Elevated', 'elevated'],
      ['Text', 'foreground'], ['Secondary', 'secondary'], ['Border', 'border'], ['Selection', 'selection'],
      ['Coral', 'coral'], ['Peach', 'peach'], ['Amber', 'amber'], ['Plum', 'plum'],
      ['Berry', 'berry'], ['Eucalyptus', 'eucalyptus'], ['Blue', 'blue'], ['Sage', 'sage'],
    ],
  },
  {
    file: 'cindervale-accessible-palette.png',
    palette: accessibleSource,
    title: { dark: 'Cindervale Accessible Dark', light: 'Cindervale Accessible Light' },
    subtitle: { dark: 'Warm charcoal with violet, sky blue, bronze, peach and teal.', light: 'Warm paper with deep violet, cobalt, ochre, rust and teal.' },
    swatches: [
      ['Editor', 'editor'], ['Side bar', 'sidebar'], ['Panel', 'panel'], ['Selection', 'selection'],
      ['Text', 'foreground'], ['Secondary', 'secondary'], ['Comments', 'comment'], ['Border', 'border'],
      ['Keywords', 'keyword'], ['Functions', 'function'], ['Types', 'type'], ['Strings', 'string'],
      ['Numbers', 'number'], ['Errors', 'error'], ['Focus', 'focus'], ['Ember', 'ember'],
    ],
  },
];

function half(sheet, mode) {
  const s = sheet.palette[mode];
  const swatches = sheet.swatches.map(([label, key]) => `
    <div class="swatch"><span style="background:${s[key]}"></span><div><b>${label}</b><code>${s[key]}</code></div></div>`).join('');
  return `<section style="--bg:${s.editor};--fg:${s.foreground};--muted:${s.secondary};--edge:${s.border}">
    <h1>${sheet.title[mode]}</h1><p>${sheet.subtitle[mode]}</p><div class="grid">${swatches}</div></section>`;
}

/** Both palette sheets: the standard and the accessible palette, dark beside light. */
export async function buildPalette(repo, work) {
  for (const sheet of SHEETS) {
    const html = `<!doctype html><meta charset="utf-8">${FONTS}<style>
      * { box-sizing: border-box; margin: 0; }
      body { display: flex; width: 1600px; font-family: ${SANS}; -webkit-font-smoothing: antialiased; }
      section { flex: 1; padding: 46px 48px 52px; background: var(--bg); color: var(--fg); }
      h1 { font: 600 44px/1.05 ${DISPLAY}; }
      p { margin: 10px 0 34px; color: var(--muted); font-size: 16px; }
      .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 22px 18px; }
      .swatch { display: flex; align-items: center; gap: 13px; }
      .swatch span { width: 44px; height: 44px; border-radius: 11px; box-shadow: inset 0 0 0 1px var(--edge); flex: none; }
      b { display: block; font-size: 15px; font-weight: 700; }
      code { font: 13px ${MONO}; color: var(--muted); }
    </style><body>${half(sheet, 'dark')}${half(sheet, 'light')}</body>`;
    const file = path.join(work, sheet.file.replace('.png', '.html'));
    await mkdir(work, { recursive: true });
    await writeFile(file, html);
    const png = await renderHtml(file, { width: 1600, height: 400, scale: 2, profile: path.join(work, 'chromium') });
    await writeFile(path.join(repo, 'screenshots', sheet.file), png);
    console.log(`✓ palette → screenshots/${sheet.file}`);
  }
}

// The same stretch of project-board.tsx in every capture (2× pixels):
// imports, a union type, an interface, constants and a record literal.
const TILE = { left: 816, top: 243, width: 1020, height: 730 };
const VISIONS = [
  ['typical', 'Typical color vision'],
  ['protanopia', 'Protanopia'],
  ['deuteranopia', 'Deuteranopia'],
  ['tritanopia', 'Tritanopia'],
  ['grayscale', 'Grayscale'],
];

export async function buildBoards(repo, work) {
  const tiles = path.join(work, 'tiles');
  await mkdir(tiles, { recursive: true });
  for (const mode of ['light', 'dark']) {
    const sources = [
      [`Cindervale ${mode === 'light' ? 'Light' : 'Dark'}`, path.join(repo, 'screenshots', `cindervale-${mode}.png`)],
      [`Cindervale Accessible ${mode === 'light' ? 'Light' : 'Dark'}`, path.join(repo, 'screenshots', `cindervale-accessible-${mode}.png`)],
    ];
    const columns = [];
    for (const [title, file] of sources) {
      const image = shrink(crop(decode(await readFile(file)), TILE.left, TILE.top, TILE.width, TILE.height), 2);
      const cells = [];
      for (const [kind] of VISIONS) {
        const name = `${path.basename(file, '.png')}-${kind}.png`;
        await writeFile(path.join(tiles, name), encode(simulateImage(image, kind)));
        cells.push(name);
      }
      columns.push({ title, cells });
    }
    const dark = mode === 'dark';
    const html = `<!doctype html><meta charset="utf-8">${FONTS}<style>
      * { margin: 0; box-sizing: border-box; }
      body { width: ${200 + 2 * (TILE.width / 2) + 72}px; padding: 36px 36px 28px; background: ${dark ? '#141012' : '#EFE7E2'}; color: ${dark ? '#F4E9E2' : '#342C31'};
             font-family: ${SANS}; -webkit-font-smoothing: antialiased; }
      h1 { font: 600 34px ${DISPLAY}; margin-bottom: 6px; }
      .lede { color: ${dark ? '#B4A39D' : '#73676D'}; font-size: 14px; margin-bottom: 22px; }
      table { border-spacing: 12px 10px; margin: -10px -12px; }
      th { font-size: 14px; font-weight: 600; text-align: left; }
      td.label { width: 176px; font-size: 14px; font-weight: 600; vertical-align: middle; }
      img { display: block; width: ${TILE.width / 2}px; border-radius: 8px; box-shadow: 0 0 0 1px ${dark ? '#3A3033' : '#D8C9C1'}; }
      .foot { margin-top: 20px; font-size: 12.5px; color: ${dark ? '#B4A39D' : '#73676D'}; }
    </style><body>
      <h1>${dark ? 'Dark' : 'Light'} themes under simulated color vision</h1>
      <p class="lede">The same lines of a React component in the standard and the accessible palette.</p>
      <table><tr><th></th>${columns.map((c) => `<th>${c.title}</th>`).join('')}</tr>
      ${VISIONS.map(([, label], row) => `<tr><td class="label">${label}</td>${columns.map((c) => `<td><img src="tiles/${c.cells[row]}"></td>`).join('')}</tr>`).join('')}
      </table>
      <p class="foot">Simulated with Brettel, Viénot &amp; Mollon (1997) for full dichromacy, the far end of each deficiency. A simulation is a model, not a person: see docs/accessibility.md.</p>
    </body>`;
    const file = path.join(work, `board-${mode}.html`);
    await writeFile(file, html);
    const height = 36 + 40 + 36 + 5 * (TILE.height / 2 + 20) + 60 + 28;
    const png = await renderHtml(file, { width: 200 + TILE.width + 72, height, scale: 1, profile: path.join(work, 'chromium') });
    await writeFile(path.join(repo, 'screenshots', `color-vision-${mode}.png`), png);
    console.log(`✓ board → screenshots/color-vision-${mode}.png`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const repo = fileURLToPath(new URL('../../', import.meta.url));
  const work = path.join(repo, '.vscode-test', 'screenshots');
  await buildPalette(repo, work);
  await buildBoards(repo, work);
}
