import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import opentype from 'opentype.js';
import { layout, bounds, fit } from '../type.js';

const load = name => {
  const buf = fs.readFileSync(new URL(`../../fonts/${name}`, import.meta.url));
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
};
const black = load('Geist-Black.otf');

test('layout returns one glyph per character with closed contours', () => {
  const { glyphs } = layout(black, 'CLAUDE', { size: 200 });
  assert.equal(glyphs.length, 6);
  assert.ok(glyphs.every(g => g.contours.length >= 1 && g.contours[0].length > 3));
});

test('fit sizes CLAUDE to 1500 px of ink, centred', () => {
  const size = fit(black, 'CLAUDE', 1500);
  const { glyphs } = layout(black, 'CLAUDE', { size, x: 960, y: 600, align: 'center' });
  const b = bounds(glyphs);
  assert.ok(Math.abs(b.x1 - b.x0 - 1500) < 1, `ink width ${b.x1 - b.x0}`);
  assert.ok(Math.abs((b.x0 + b.x1) / 2 - 960) < 20);
});

test('tracking widens the layout by tracking * size per gap', () => {
  const a = layout(black, 'ABC', { size: 100 }).width;
  const b = layout(black, 'ABC', { size: 100, tracking: 0.2 }).width;
  assert.ok(Math.abs(b - a - 40) < 1e-6);
});
