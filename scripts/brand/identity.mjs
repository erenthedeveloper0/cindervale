// The Cindervale identity in code: colors, typefaces and the mark's geometry.
// brand/README.md explains each decision; scripts/brand/build.mjs turns this
// file into every logo, icon, banner and social image in the repository.

/** Brand colors; brand/README.md gives each one's role. */
export const colors = {
  walnut: '#2B1F1A', // dark grounds, the mono mark on light
  charcoal: '#3B3129', // raised dark surfaces, rules on dark
  ivory: '#F8F6F1', // the mono mark on dark, type on dark
  parchment: '#F1E6D8', // light grounds (sampled from the board's paper)
  copper: '#B8664A', // the mark, the tagline, rules
  terracotta: '#C97B5B',
  wine: '#7A2E3A',
  eucalyptus: '#6F8F7A',
  sage: '#8A9A7B',
  blue: '#6B8FB3',
  berry: '#9B4F7A',
};

/** The brand typefaces, loaded by every rendered asset. */
export const FONTS = [
  '<link rel="preconnect" href="https://fonts.googleapis.com">',
  '<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Cormorant+SC:wght@500;600&family=JetBrains+Mono:wght@400;500&display=block" rel="stylesheet">',
  '<link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=block" rel="stylesheet">',
].join('');
export const DISPLAY = '"Cormorant Garamond", Georgia, serif';
export const WORDMARK = '"Cormorant SC", "Cormorant Garamond", Georgia, serif';
export const SANS = 'Satoshi, -apple-system, "Segoe UI", system-ui, sans-serif';
export const MONO = '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace';

/*
 * The mark: two ridges with a vale between them, and a spark above.
 *
 * Units: the wing tips sit at x = ±500, the spark's top at y = 0,
 * the tips at y = 617. Each wing is a ribbon of nearly constant depth that
 * tapers to a point; the wings cross at the center, and where they overlap
 * the full-color versions show the fold.
 */
const TIP = 617;
const NOTCH = 355.5; // where the ridges meet, on top
const KEEL = 552.7; // where the wings meet, underneath

export const WINGS = [
  `M -500 ${TIP}`,
  'C -402.9 494.8 -281.2 215.3 -191.9 215.3', // outer slope, up to the ridge
  `C -126.2 215.3 -106.4 243.7 0 ${NOTCH}`, // inner slope, down into the vale
  'C 106.4 243.7 126.2 215.3 191.9 215.3',
  `C 281.2 215.3 402.9 494.8 500 ${TIP}`,
  'C 421.3 565.8 275.1 410.5 198.2 410.5', // underside
  `C 116.3 410.5 67.7 474.8 0 ${KEEL}`,
  'C -67.7 474.8 -116.3 410.5 -198.2 410.5',
  `C -275.1 410.5 -421.3 565.8 -500 ${TIP}`,
  'Z',
].join(' ');

/** A four-point spark with concave (astroid) sides, slightly taller than wide. */
export const SPARK = 'M 0 0 Q 20 89.6 100 112 Q 20 134.4 0 224 Q -20 134.4 -100 112 Q -20 89.6 0 0 Z';

/**
 * The fold: each ridge's inner slope continues under the other wing until it
 * meets the underside, and the overlap between them is a diamond.
 */
export const FOLD = `M 0 ${NOTCH} L -93 453.1 C -62.4 478.8 -33.6 514.1 0 ${KEEL} C 33.6 514.1 62.4 478.8 93 453.1 Z`;
const CREASE = `M -93 453.1 L 0 ${NOTCH} L 93 453.1`;

export const MARK_BOX = { x: -500, y: 0, width: 1000, height: TIP };

/** Fills for each version of the mark. Gradients run top to bottom across the whole mark. */
export const finishes = {
  // On light grounds: deep copper at the spark and ridges, terracotta at the tips.
  copper: {
    stops: [[0, '#7A432E'], [0.35, '#8A4E35'], [0.65, '#B0664A'], [1, '#D39A7D']],
    fold: [[0, '#8A4E35'], [1, '#CF8F70']],
    crease: '#6E3B27',
  },
  // On dark grounds: ivory light on the spark and ridges, copper at the tips.
  'on-dark': {
    stops: [[0, '#F6E6D6'], [0.35, '#EFD3BC'], [0.7, '#D9997A'], [1, '#C27556']],
    fold: [[0, '#E2B597'], [1, '#D08B6B']],
    crease: '#A8654A',
  },
  walnut: { solid: colors.walnut },
  ivory: { solid: colors.ivory },
  currentcolor: { solid: 'currentColor' },
};

const stops = (list) => list.map(([offset, color]) => `<stop offset="${offset}" stop-color="${color}"/>`).join('');

/**
 * The mark's SVG elements for a finish, in mark units. `id` keeps gradient
 * ids unique when several marks share one document.
 */
export function markElements(finish, id = 'cv') {
  const f = finishes[finish];
  if (!f) throw new Error(`Unknown finish: ${finish}`);
  if (f.solid) return { defs: '', body: `<path d="${SPARK}" fill="${f.solid}"/><path d="${WINGS}" fill="${f.solid}"/>` };
  const defs = [
    `<linearGradient id="${id}-fill" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${TIP}">${stops(f.stops)}</linearGradient>`,
    `<linearGradient id="${id}-fold" gradientUnits="userSpaceOnUse" x1="0" y1="${NOTCH}" x2="0" y2="${KEEL}">${stops(f.fold)}</linearGradient>`,
  ].join('');
  const body = [
    `<path d="${SPARK}" fill="url(#${id}-fill)"/>`,
    `<path d="${WINGS}" fill="url(#${id}-fill)"/>`,
    `<path d="${FOLD}" fill="url(#${id}-fold)"/>`,
    // The crease: the two upper edges of the fold, drawn as a hairline.
    `<path d="${CREASE}" fill="none" stroke="${f.crease}" stroke-width="3" stroke-opacity="0.45" stroke-linejoin="round"/>`,
  ].join('');
  return { defs, body };
}

/** A standalone mark, cropped to its bounds with a small margin. */
export function markSvg(finish, { title = 'Cindervale' } = {}) {
  const pad = 12;
  const { x, y, width, height } = MARK_BOX;
  const { defs, body } = markElements(finish);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x - pad} ${y - pad} ${width + 2 * pad} ${height + 2 * pad}" role="img" aria-label="${title}">`,
    `<title>${title}</title>`,
    defs ? `<defs>${defs}</defs>` : '',
    body,
    '</svg>',
    '',
  ].join('\n');
}

/**
 * The app icon: the mark on a walnut tile. 512 units
 * square; the Marketplace and VS Code show it from 42 to 128 px.
 */
export function iconSvg() {
  const size = 512;
  const scale = 0.64 * size / MARK_BOX.width; // the mark spans 64% of the tile
  const markHeight = MARK_BOX.height * scale;
  const tx = size / 2;
  // Optical center: the spark is light, so the mark sits a touch above center.
  const ty = (size - markHeight) / 2 - 6;
  const { defs, body } = markElements('on-dark', 'icon');
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="Cindervale">`,
    '<title>Cindervale</title>',
    '<defs>',
    '<linearGradient id="tile" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#33271F"/><stop offset="1" stop-color="#211814"/></linearGradient>',
    '<radialGradient id="glow" cx="0.5" cy="0.36" r="0.55"><stop offset="0" stop-color="#C97B5B" stop-opacity="0.2"/><stop offset="1" stop-color="#C97B5B" stop-opacity="0"/></radialGradient>',
    defs,
    '</defs>',
    `<rect width="${size}" height="${size}" rx="112" fill="url(#tile)"/>`,
    `<rect width="${size}" height="${size}" rx="112" fill="url(#glow)"/>`,
    `<rect x="1.5" y="1.5" width="${size - 3}" height="${size - 3}" rx="110.5" fill="none" stroke="#F8F6F1" stroke-opacity="0.07" stroke-width="3"/>`,
    `<g transform="translate(${tx} ${ty.toFixed(1)}) scale(${scale.toFixed(4)})">${body}</g>`,
    '</svg>',
    '',
  ].join('\n');
}
