import assert from 'node:assert/strict';
import { test } from 'node:test';
import { deltaE2000, simulate } from '../src/vision.mjs';

// Sharma, Wu & Dalal (2005), "The CIEDE2000 color-difference formula:
// implementation notes, supplementary test data" — selected pairs.
const SHARMA = [
  [[50, 2.6772, -79.7751], [50, 0, -82.7485], 2.0425],
  [[50, 3.1571, -77.2803], [50, 0, -82.7485], 2.8615],
  [[50, 0, 0], [50, -1, 2], 2.3669],
  [[50, 2.49, -0.001], [50, -2.49, 0.0009], 7.1792],
  [[50, 2.5, 0], [73, 25, -18], 27.1492],
  [[50, 2.5, 0], [61, -5, 29], 22.8977],
  [[60.2574, -34.0099, 36.2677], [60.4626, -34.1751, 39.4387], 1.2644],
  [[2.0776, 0.0795, -1.135], [0.9033, -0.0636, -0.5514], 0.9082],
];

test('CIEDE2000 matches the published test data', () => {
  for (const [[l1, a1, b1], [l2, a2, b2], expected] of SHARMA) {
    const actual = deltaE2000({ l: l1, a: a1, b: b1 }, { l: l2, a: a2, b: b2 });
    assert.ok(Math.abs(actual - expected) < 1e-4, `${actual} ≠ ${expected}`);
  }
});

test('simulation keeps neutrals neutral', () => {
  for (const kind of ['protanopia', 'deuteranopia', 'tritanopia', 'grayscale']) {
    for (const gray of ['#000000', '#808080', '#FFFFFF']) assert.equal(simulate(gray, kind), gray, `${kind} ${gray}`);
  }
});

test('simulation reproduces the classic confusions', () => {
  // Red and green collapse toward the same yellow-olive axis for protans and deutans.
  const close = (a, b, kind) => {
    const pa = simulate(a, kind);
    const pb = simulate(b, kind);
    const hue = (hex) => {
      const n = parseInt(hex.slice(1), 16);
      const [r, g, b2] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
      return r >= b2 && g >= b2; // warm side of the blue-yellow axis
    };
    return hue(pa) && hue(pb);
  };
  assert.ok(close('#FF0000', '#00FF00', 'protanopia'));
  assert.ok(close('#FF0000', '#00FF00', 'deuteranopia'));
  // Blue stays blue for protans and deutans.
  for (const kind of ['protanopia', 'deuteranopia']) {
    const n = parseInt(simulate('#0000FF', kind).slice(1), 16);
    assert.ok((n & 255) > ((n >> 16) & 255), kind);
  }
  // Tritans keep red apart from cyan.
  const red = parseInt(simulate('#FF0000', 'tritanopia').slice(1), 16);
  assert.ok(((red >> 16) & 255) > 200);
});
