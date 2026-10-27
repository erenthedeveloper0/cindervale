// Color-vision tooling: dichromacy simulation, grayscale and CIEDE2000.
// Used by the accessibility audit to check that roles which must stay apart
// (keywords vs functions, added vs deleted…) are still apart for people with
// protanopia, deuteranopia or tritanopia. Dependency-free on purpose.

import { parse, toHex } from './color.mjs';

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const clamp01 = (v) => Math.min(1, Math.max(0, v));

/**
 * Brettel, Viénot & Mollon (1997), expressed in linear sRGB as in the
 * DaltonLens reference implementation (libDaltonLens). Each deficiency
 * projects onto one of two half-planes; `normal` picks the half-plane.
 * These simulate full dichromacy, the far end of each confusion axis.
 */
const BRETTEL = {
  protanopia: {
    normal: [0.00048, 0.00393, -0.00441],
    h1: [0.1498, 1.19548, -0.34528, 0.10764, 0.84864, 0.04372, 0.00384, -0.0054, 1.00156],
    h2: [0.1457, 1.16172, -0.30742, 0.10816, 0.85291, 0.03892, 0.00386, -0.00524, 1.00139],
  },
  deuteranopia: {
    normal: [-0.00281, -0.00611, 0.00892],
    h1: [0.36477, 0.86381, -0.22858, 0.26294, 0.64245, 0.09462, -0.02006, 0.02728, 0.99278],
    h2: [0.37298, 0.88166, -0.25464, 0.25954, 0.63506, 0.1054, -0.0198, 0.02784, 0.99196],
  },
  tritanopia: {
    normal: [0.03901, -0.02788, -0.01113],
    h1: [1.01277, 0.13548, -0.14826, -0.01243, 0.86812, 0.14431, 0.07589, 0.805, 0.11911],
    h2: [0.93678, 0.18979, -0.12657, 0.06154, 0.81526, 0.1232, -0.37562, 1.12767, 0.24796],
  },
};

export const deficiencies = Object.keys(BRETTEL);

/** Every way the audit looks at a color: typical vision, three dichromacies, luminance only. */
export const visions = ['typical', ...deficiencies, 'grayscale'];

/** Simulate a deficiency on linear RGB. `severity` < 1 approximates the anomalous trichromacies. */
export function simulateLinear([r, g, b], kind, severity = 1) {
  if (kind === 'typical') return [r, g, b];
  if (kind === 'grayscale') {
    const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return [y, y, y];
  }
  const { normal, h1, h2 } = BRETTEL[kind];
  const m = r * normal[0] + g * normal[1] + b * normal[2] >= 0 ? h1 : h2;
  const sim = [
    m[0] * r + m[1] * g + m[2] * b,
    m[3] * r + m[4] * g + m[5] * b,
    m[6] * r + m[7] * g + m[8] * b,
  ].map(clamp01);
  return [r, g, b].map((v, i) => v + (sim[i] - v) * severity);
}

/** How a color appears under the given vision ('typical', 'protanopia', …, 'grayscale'). */
export function simulate(hex, kind, severity = 1) {
  const { r, g, b } = parse(hex);
  const [lr, lg, lb] = simulateLinear([r, g, b].map(toLinear), kind, severity);
  return toHex({ r: fromLinear(lr), g: fromLinear(lg), b: fromLinear(lb) });
}

// --- CIELAB and CIEDE2000 --------------------------------------------------

export function toLab(hex) {
  const { r, g, b } = parse(hex);
  const [lr, lg, lb] = [r, g, b].map(toLinear);
  const x = (0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb) / 0.95047;
  const y = 0.2126729 * lr + 0.7151522 * lg + 0.072175 * lb;
  const z = (0.0193339 * lr + 0.119192 * lg + 0.9503041 * lb) / 1.08883;
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  return { l: 116 * f(y) - 16, a: 500 * (f(x) - f(y)), b: 200 * (f(y) - f(z)) };
}

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

/** CIEDE2000 color difference between two Lab colors (Sharma, Wu & Dalal 2005). */
export function deltaE2000(lab1, lab2) {
  const { l: L1, a: a1, b: b1 } = lab1;
  const { l: L2, a: a2, b: b2 } = lab2;
  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const Cbar7 = ((C1 + C2) / 2) ** 7;
  const G = 0.5 * (1 - Math.sqrt(Cbar7 / (Cbar7 + 25 ** 7)));
  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);
  const hue = (b, a) => (a === 0 && b === 0 ? 0 : (deg(Math.atan2(b, a)) + 360) % 360);
  const h1p = hue(b1, a1p);
  const h2p = hue(b2, a2p);

  const dLp = L2 - L1;
  const dCp = C2p - C1p;
  let dhp = 0;
  if (C1p * C2p !== 0) {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360;
    else if (dhp < -180) dhp += 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(rad(dhp / 2));

  const Lbp = (L1 + L2) / 2;
  const Cbp = (C1p + C2p) / 2;
  let hbp = h1p + h2p;
  if (C1p * C2p !== 0) {
    if (Math.abs(h1p - h2p) <= 180) hbp = (h1p + h2p) / 2;
    else hbp = h1p + h2p < 360 ? (h1p + h2p + 360) / 2 : (h1p + h2p - 360) / 2;
  }
  const T = 1 - 0.17 * Math.cos(rad(hbp - 30)) + 0.24 * Math.cos(rad(2 * hbp)) + 0.32 * Math.cos(rad(3 * hbp + 6)) - 0.2 * Math.cos(rad(4 * hbp - 63));
  const dTheta = 30 * Math.exp(-(((hbp - 275) / 25) ** 2));
  const Cbp7 = Cbp ** 7;
  const Rc = 2 * Math.sqrt(Cbp7 / (Cbp7 + 25 ** 7));
  const Sl = 1 + (0.015 * (Lbp - 50) ** 2) / Math.sqrt(20 + (Lbp - 50) ** 2);
  const Sc = 1 + 0.045 * Cbp;
  const Sh = 1 + 0.015 * Cbp * T;
  const Rt = -Math.sin(rad(2 * dTheta)) * Rc;
  return Math.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh));
}

/** CIEDE2000 distance between two hex colors as seen under the given vision. */
export function distance(a, b, kind = 'typical') {
  return deltaE2000(toLab(simulate(a, kind)), toLab(simulate(b, kind)));
}
