// Builds every brand asset from scripts/brand/identity.mjs.
//
//   npm run brand            everything: SVG logos, the icon, lockups, banners,
//                            the social preview and the README divider
//   npm run brand -- --svg   the SVG files only (no browser, no network)
//
// Rasters are rendered by a headless Chromium (scripts/screenshots/cdp.mjs
// finds one, or set CHROME) and load the brand typefaces from Google Fonts
// and Fontshare, so they need a network connection. The social preview shows
// real captures from screenshots/; run `npm run screenshots` first if the
// themes changed. brand/README.md lists every file this writes.
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { renderHtml } from '../screenshots/cdp.mjs';
import { colors, DISPLAY, FONTS, iconSvg, markElements, markSvg, MARK_BOX, SANS, SPARK, WORDMARK } from './identity.mjs';

const repo = fileURLToPath(new URL('../../', import.meta.url));
const work = path.join(repo, '.vscode-test', 'brand');
const svgOnly = process.argv.includes('--svg');

async function save(relative, contents) {
  const file = path.join(repo, relative);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, contents);
  console.log(`✓ ${relative}`);
}

/** The mark as inline SVG, `width` CSS pixels wide. */
function inlineMark(finish, width, id) {
  const { defs, body } = markElements(finish, id);
  const { x, y, width: w, height: h } = MARK_BOX;
  return `<svg class="mark" viewBox="${x} ${y} ${w} ${h}" width="${width}" height="${(width * h / w).toFixed(1)}" aria-hidden="true"><defs>${defs}</defs>${body}</svg>`;
}

/**
 * Valley lines: ridgelines that start from the mark's profile (two ridges and
 * the vale between them) and open out like contours as they descend. Lower
 * lines are wider, flatter and further apart, the right ridge sits a little
 * lower than the left, and each line drifts slightly, so the stack reads as
 * terrain rather than as copies of one curve.
 */
function valleyLines({ width, height, count, cx, span, top, gap, relief, color, stroke = 1 }) {
  const bump = (s, center, w) => Math.exp(-(((s - center) / w) ** 2));
  const lines = [];
  for (let i = 0; i < count; i++) {
    const k = i / (count - 1);
    const left = -(0.384 + 0.34 * k);
    const right = 0.384 + 0.26 * k;
    const w = 0.24 + 0.24 * k;
    const amp = relief * (0.1 + 0.9 * (1 - k) ** 1.25);
    const base = top + gap * (i + (0.45 * i * i) / count);
    const points = [];
    for (let x = -10; x <= width + 10; x += 4) {
      const s = (x - cx) / span;
      const drift = Math.sin((x / width) * Math.PI * 1.4 + i * 0.7) * 9 * k;
      const lift = amp * (bump(s, left, w) + 0.86 * bump(s, right, w * 1.08));
      points.push(`${x} ${(base - lift + drift).toFixed(1)}`);
    }
    const alpha = (0.8 - 0.5 * k).toFixed(2);
    lines.push(`<path d="M ${points.join(' L ')}" stroke-opacity="${alpha}"/>`);
  }
  return `<svg class="lines" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" aria-hidden="true"><g fill="none" stroke="${color}" stroke-width="${stroke}">${lines.join('')}</g></svg>`;
}

/** Fine paper grain, laid over a whole composition at low opacity. */
const GRAIN = `<svg class="grain" width="100%" height="100%" aria-hidden="true"><filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 1.1 -0.25"/></filter><rect width="100%" height="100%" filter="url(#grain)"/></svg>`;

const BASE_CSS = `
  * { box-sizing: border-box; margin: 0; }
  html, body { overflow: hidden; }
  body { position: relative; -webkit-font-smoothing: antialiased; font-family: ${SANS}; }
  .grain, .lines, .glow { position: absolute; inset: 0; pointer-events: none; }
  .wordmark { font-family: ${WORDMARK}; font-weight: 500; letter-spacing: 0.035em; line-height: 1; }
  .tagline { font-family: ${DISPLAY}; font-style: italic; font-weight: 500; line-height: 1.1; }
  .label { font-family: ${SANS}; font-weight: 500; text-transform: uppercase; letter-spacing: 0.24em; }
`;

const schemes = {
  dark: {
    ground: `linear-gradient(160deg, #2E231D 0%, ${colors.walnut} 42%, #1D1512 100%)`,
    ink: colors.ivory, muted: '#CDBBAA', accent: '#D99A79', line: '#C98A69', mark: 'on-dark', grain: 0.07,
    glow: 'rgba(201, 123, 91, 0.20)',
  },
  light: {
    ground: `linear-gradient(160deg, #F6EEE3 0%, ${colors.parchment} 50%, #EADCCB 100%)`,
    ink: colors.walnut, muted: '#6F5D52', accent: colors.copper, line: '#B87656', mark: 'copper', grain: 0.05,
    glow: 'rgba(201, 123, 91, 0.16)',
  },
};

/** README header, 2560 × 800: the mark, the wordmark and the tagline over the vale. */
function bannerHtml(mode) {
  const s = schemes[mode];
  const W = 1280, H = 400;
  return `<!doctype html><meta charset="utf-8">${FONTS}<style>${BASE_CSS}
    body { width: ${W}px; height: ${H}px; background: ${s.ground}; color: ${s.ink}; }
    .lines { -webkit-mask-image: linear-gradient(90deg, transparent 40%, #000 72%); }
    .glow { background: radial-gradient(420px 260px at 905px 150px, ${s.glow}, transparent 70%); }
    .grain { opacity: ${s.grain}; mix-blend-mode: ${mode === 'dark' ? 'screen' : 'multiply'}; }
    .copy { position: absolute; left: 104px; top: 50%; transform: translateY(-50%); }
    .mark { display: block; margin: 0 0 26px 2px; }
    .wordmark { font-size: 84px; }
    .tagline { font-size: 32px; color: ${s.accent}; margin-top: 14px; }
    .label { font-size: 15px; color: ${s.muted}; margin-top: 30px; }
    .rule { display: inline-block; width: 36px; height: 1px; background: ${s.accent}; vertical-align: middle; margin-right: 14px; opacity: 0.8; }
  </style><body>
    ${valleyLines({ width: W, height: H, count: 14, cx: 915, span: 360, top: 238, gap: 9, relief: 116, color: s.line })}
    <div class="glow"></div>
    ${GRAIN}
    <div class="copy">
      ${inlineMark(s.mark, 92, `banner-${mode}`)}
      <div class="wordmark">Cindervale</div>
      <div class="tagline">Warm color. Deep focus.</div>
      <div class="label"><span class="rule"></span>A color theme for Visual Studio Code</div>
    </div>
  </body>`;
}

/** GitHub social preview, 1280 × 640: the identity beside real captures of all four variants. */
function socialHtml() {
  const s = schemes.dark;
  const W = 1280, H = 640;
  // The same region of project-board.tsx in each capture (2× pixels): imports,
  // a union type, an interface and two constants, cut between lines.
  const crop = { left: 800, top: 226, width: 1036, height: 682 };
  const tileW = 268;
  const k = tileW / crop.width;
  const tile = (file, label) => `
    <figure><div class="shot" style="background-image:url('${pathToFileURL(path.join(repo, 'screenshots', file)).href}');
      background-size:${(3200 * k).toFixed(1)}px auto;background-position:-${(crop.left * k).toFixed(1)}px -${(crop.top * k).toFixed(1)}px;
      height:${(crop.height * k).toFixed(1)}px"></div><figcaption>${label}</figcaption></figure>`;
  return `<!doctype html><meta charset="utf-8">${FONTS}<style>${BASE_CSS}
    body { width: ${W}px; height: ${H}px; background: ${s.ground}; color: ${s.ink}; }
    .lines { -webkit-mask-image: linear-gradient(180deg, transparent 55%, #000 100%); opacity: 0.55; }
    .glow { background: radial-gradient(520px 340px at 300px 250px, ${s.glow}, transparent 70%); }
    .grain { opacity: ${s.grain}; mix-blend-mode: screen; }
    .copy { position: absolute; left: 80px; top: 50%; transform: translateY(-52%); width: 520px; }
    .mark { display: block; margin: 0 0 24px 2px; }
    .wordmark { font-size: 68px; }
    .tagline { font-size: 30px; color: ${s.accent}; margin-top: 12px; }
    .lede { font-size: 21px; line-height: 1.5; color: ${s.muted}; margin-top: 30px; max-width: 470px; }
    .grid { position: absolute; right: 72px; top: 50%; transform: translateY(-50%); display: grid; grid-template-columns: repeat(2, ${tileW}px); gap: 22px 18px; }
    figure { margin: 0; }
    .shot { border-radius: 10px; box-shadow: 0 0 0 1px rgba(248, 246, 241, 0.12), 0 18px 40px rgba(0, 0, 0, 0.35); background-repeat: no-repeat; }
    figcaption { font: 500 13px ${SANS}; letter-spacing: 0.16em; text-transform: uppercase; color: ${s.muted}; margin-top: 11px; }
  </style><body>
    ${valleyLines({ width: W, height: H, count: 10, cx: 330, span: 300, top: 566, gap: 7, relief: 84, color: s.line })}
    <div class="glow"></div>
    ${GRAIN}
    <div class="copy">
      ${inlineMark('on-dark', 84, 'social')}
      <div class="wordmark">Cindervale</div>
      <div class="tagline">Warm color. Deep focus.</div>
      <p class="lede">A warm color theme for Visual Studio Code in four variants, including two color-vision-aware palettes with measured contrast.</p>
    </div>
    <div class="grid">
      ${tile('cindervale-dark.png', 'Dark')}${tile('cindervale-light.png', 'Light')}
      ${tile('cindervale-accessible-dark.png', 'Accessible Dark')}${tile('cindervale-accessible-light.png', 'Accessible Light')}
    </div>
  </body>`;
}

/** Horizontal lockup on a transparent ground, for the README footer and anywhere a name is needed. */
function lockupHtml(mode) {
  const s = schemes[mode];
  return `<!doctype html><meta charset="utf-8">${FONTS}<style>${BASE_CSS}
    body { width: 560px; height: 120px; display: flex; align-items: center; justify-content: center; gap: 26px; color: ${s.ink}; }
    .wordmark { font-size: 64px; transform: translateY(3px); }
  </style><body>${inlineMark(s.mark, 120, `lockup-${mode}`)}<div class="wordmark">Cindervale</div></body>`;
}

/** The README's section divider: a copper hairline that fades out, with the spark at its center. */
function dividerHtml() {
  return `<!doctype html><meta charset="utf-8"><style>${BASE_CSS}
    body { width: 880px; height: 16px; }
    .line { position: absolute; top: 7.5px; height: 1px; width: 408px; }
    .left { left: 0; background: linear-gradient(90deg, rgba(184, 102, 74, 0), ${colors.copper}); }
    .right { right: 0; background: linear-gradient(270deg, rgba(184, 102, 74, 0), ${colors.copper}); }
    svg { position: absolute; left: 433.75px; top: 0; }
  </style><body><div class="line left"></div><svg viewBox="-100 0 200 224" width="12.5" height="16"><path d="${SPARK}" fill="${colors.copper}"/></svg><div class="line right"></div></body>`;
}

async function render(name, html, size, options = {}) {
  await mkdir(work, { recursive: true });
  const file = path.join(work, `${name}.html`);
  await writeFile(file, html);
  return renderHtml(file, { ...size, profile: path.join(work, 'chromium'), ...options });
}

// ── Vector files ────────────────────────────────────────────────────────
for (const finish of ['copper', 'on-dark', 'walnut', 'ivory', 'currentcolor']) {
  const name = finish === 'copper' ? 'cindervale-mark' : `cindervale-mark-${finish}`;
  await save(`brand/logo/${name}.svg`, markSvg(finish));
}
await save('images/icon.svg', iconSvg());
if (svgOnly) process.exit(0);

// ── Rendered files ──────────────────────────────────────────────────────
const iconPage = `<!doctype html><style>*{margin:0}body{width:256px;height:256px}</style><img src="${pathToFileURL(path.join(repo, 'images/icon.svg')).href}" width="256" height="256">`;
await save('images/icon.png', await render('icon', iconPage, { width: 512, height: 512, scale: 1 }, { transparent: true, clip: { width: 256, height: 256 } }));

for (const mode of ['light', 'dark']) {
  await save(`brand/logo/cindervale-lockup-on-${mode}.png`, await render(`lockup-${mode}`, lockupHtml(mode), { width: 560, height: 120, scale: 2 }, { transparent: true }));
  await save(`brand/social/cindervale-banner-${mode}.jpg`, await render(`banner-${mode}`, bannerHtml(mode), { width: 1280, height: 400, scale: 2 }, { format: 'jpeg', quality: 88 }));
}
await save('brand/social/cindervale-social-preview.jpg', await render('social', socialHtml(), { width: 1280, height: 640, scale: 1 }, { format: 'jpeg', quality: 90 }));
await save('brand/graphics/cindervale-divider.png', await render('divider', dividerHtml(), { width: 880, height: 16, scale: 2 }, { transparent: true }));
