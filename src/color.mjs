// Small, dependency-free color toolkit used to derive every Cindervale color
// from the source palette. Mixing happens in sRGB (predictable for UI tints);
// lightness adjustments happen in OKLCH so hue and chroma stay intact.

const clamp01 = (v) => Math.min(1, Math.max(0, v));

export function parse(hex) {
  const m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(hex);
  if (!m) throw new Error(`Invalid color: ${hex}`);
  const n = parseInt(m[1], 16);
  return {
    r: ((n >> 16) & 255) / 255,
    g: ((n >> 8) & 255) / 255,
    b: (n & 255) / 255,
    a: m[2] ? parseInt(m[2], 16) / 255 : 1,
  };
}

const byte = (v) => Math.round(clamp01(v) * 255).toString(16).padStart(2, '0');

export function toHex({ r, g, b, a = 1 }) {
  const rgb = `#${byte(r)}${byte(g)}${byte(b)}`;
  return (a >= 1 ? rgb : rgb + byte(a)).toUpperCase();
}

/** Linear interpolation between two opaque colors. t = 0 → a, t = 1 → b. */
export function mix(a, b, t) {
  const x = parse(a);
  const y = parse(b);
  return toHex({ r: x.r + (y.r - x.r) * t, g: x.g + (y.g - x.g) * t, b: x.b + (y.b - x.b) * t });
}

/** The same color with an alpha channel (0–1). */
export function alpha(hex, a) {
  return toHex({ ...parse(hex), a });
}

/** Composite a (possibly translucent) color over an opaque background. */
export function over(fg, bg) {
  const f = parse(fg);
  const b = parse(bg);
  return toHex({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a) });
}

// --- WCAG 2 contrast -------------------------------------------------------

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function luminance(hex) {
  const { r, g, b } = parse(hex);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// --- OKLCH -----------------------------------------------------------------

export function toOklch(hex) {
  const { r, g, b } = parse(hex);
  const [lr, lg, lb] = [r, g, b].map(toLinear);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { l: L, c: Math.hypot(A, B), h: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360 };
}

function oklchToRgb(L, C, h) {
  const A = C * Math.cos((h * Math.PI) / 180);
  const B = C * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

/** Build a color from OKLCH, reducing chroma until it fits the sRGB gamut. */
export function fromOklch({ l, c, h }) {
  for (let chroma = c; chroma >= 0; chroma -= 0.002) {
    const rgb = oklchToRgb(l, chroma, h);
    if (rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4)) {
      const [r, g, b] = rgb.map((v) => fromLinear(clamp01(v)));
      return toHex({ r, g, b });
    }
  }
  return toHex({ r: l, g: l, b: l });
}

/** Adjust a color in OKLCH. `l` and `h` are offsets, `c` is a chroma multiplier. */
export function adjust(hex, { l = 0, c = 1, h = 0 } = {}) {
  const o = toOklch(hex);
  return fromOklch({ l: o.l + l, c: o.c * c, h: (o.h + h + 360) % 360 });
}

/**
 * Move a color's OKLCH lightness away from `bg` until it reaches the target
 * contrast ratio. Hue and chroma are preserved — this is how the light theme
 * turns bright accent tones into text-safe "ink" tones.
 */
export function ink(hex, bg, target) {
  if (contrast(hex, bg) >= target) return toHex(parse(hex));
  const o = toOklch(hex);
  const direction = luminance(bg) > 0.5 ? -1 : 1;
  for (let step = 0.002; step < 1; step += 0.002) {
    const candidate = fromOklch({ ...o, l: o.l + direction * step });
    if (contrast(candidate, bg) >= target) return candidate;
  }
  throw new Error(`Cannot reach contrast ${target} for ${hex} on ${bg}`);
}
