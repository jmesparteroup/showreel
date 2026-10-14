import test from 'node:test';
import assert from 'node:assert/strict';
import { loadBrand, DEFAULT_BRAND, fontURL } from '../brand.js';

const base = () => ({
  name: 'Acme',
  palette: { ink: '#111014', paper: '#F4F1EA', primary: '#FF5A1F', secondary: '#2E5BFF' },
  fonts: { display: 'geist:900', label: 'geist:600' },
  inks: [
    { name: 'SKETCH', bg: { color: 'paper', grain: 0.05 }, grid: { color: 'secondary', step: 60, opacity: [0.12, 0.24] },
      line: { style: 'marker', color: 'ink', width: 5 }, fill: { style: 'dots', color: 'primary' },
      type: { fill: 'dots', outline: 'double' }, accent: 'primary' },
    { name: 'SOLID', preset: 'blueprint', colors: { bg: 'primary', line: 'paper', accent: 'secondary' } },
  ],
});

test('resolves palette keys to hex in every ink slot', () => {
  const b = loadBrand(base());
  assert.equal(b.inks.SKETCH.bg.color, '#F4F1EA');
  assert.equal(b.inks.SKETCH.line.color, '#111014');
  assert.equal(b.inks.SKETCH.fill.color, '#FF5A1F');
  assert.equal(b.inks.SKETCH.grid.color, '#2E5BFF');
  assert.deepEqual(b.inkNames, ['SKETCH', 'SOLID']);
});

test('a preset expands and its colour slots take overrides', () => {
  const b = loadBrand(base());
  const s = b.inks.SOLID;
  assert.equal(s.line.style, 'clean');
  assert.equal(s.bg.color, '#FF5A1F');
  assert.equal(s.line.color, '#F4F1EA');
  assert.equal(s.accent, '#2E5BFF');
  assert.equal(s.fill.style, 'hatch');
});

test('missing font roles fall back to Geist', () => {
  const b = loadBrand({ ...base(), fonts: {} });
  assert.deepEqual(b.fonts.display, { kind: 'geist', weight: 900 });
  assert.deepEqual(b.fonts.label, { kind: 'geist', weight: 800 });
  assert.deepEqual(b.fonts.body, { kind: 'geist', weight: 800 });
  assert.equal(fontURL(b.fonts.display), '/fonts/Geist-Black.otf');
  assert.equal(fontURL({ kind: 'file', path: 'fonts/Acme Sans.otf' }), '/film/fonts/Acme%20Sans.otf');
});

for (const [mutate, pattern] of [
  [b => { b.inks[0].fill.style = 'zigzag'; }, /inks\[0\]\.fill\.style: "zigzag" is not one of/],
  [b => { b.inks[0].line.color = 'teal'; }, /inks\[0\]\.line\.color: "teal" is not a palette key or #rrggbb/],
  [b => { b.inks[1].preset = 'neon'; }, /inks\[1\]\.preset: "neon" is not one of paper, blueprint, hologram/],
  [b => { b.inks[1].name = 'SKETCH'; }, /inks\[1\]\.name: "SKETCH" is used twice/],
  [b => { b.palette.bad = 'red'; }, /palette\.bad: "red" is not #rrggbb/],
  [b => { b.fonts.label = 'google:Inter:600'; }, null],
  [b => { b.fonts.label = 'geist:650'; }, /fonts\.label: Geist weight 650 is not one of 400, 500, 600, 700, 800, 900/],
  [b => { b.inks = []; }, /inks: needs 1 to 6 inks/],
  [b => { b.fonts.heading = 'geist:900'; }, /fonts\.heading: unknown font role; use display, label, body/],
  [b => { b.inks[0] = null; }, /inks\[0\]: must be an object/],
  [b => { b.inks[0].grid.opacity = 0.2; }, /inks\[0\]\.grid\.opacity: must be \[minor, major\]/],
  [b => { b.transitions = 'flood'; }, /transitions: must be a list/],
  [b => { b.inks[0].colour = 'ink'; }, /inks\[0\]\.colour: unknown field/],
  [b => { b.inks[0].line.colour = 'ink'; }, /inks\[0\]\.line\.colour: unknown field/],
  [b => { b.sound = { offset: -2 }; }, /sound\.offset: -2 must be a number from 0/],
]) {
  test(`validation: ${pattern ?? 'google font accepted'}`, () => {
    const b = base();
    mutate(b);
    if (pattern) assert.throws(() => loadBrand(b), pattern);
    else assert.doesNotThrow(() => loadBrand(b));
  });
}

test('a google font must be fetched before it can render', () => {
  const b = loadBrand({ ...base(), fonts: { label: 'google:Inter:600' } });
  assert.throws(() => fontURL(b.fonts.label), /fetch-fonts\.mjs/);
});

test('the default brand reproduces the three-ink preset film', () => {
  const b = loadBrand(DEFAULT_BRAND);
  assert.deepEqual(b.inkNames, ['paper', 'blueprint', 'hologram']);
  assert.equal(b.inks.paper.line.style, 'pencil');
  assert.equal(b.inks.hologram.fill.style, 'scan');
  assert.deepEqual(Object.values(b.palette).sort(), ['#07080A', '#16161A', '#1B3ED2', '#45F0DD', '#EDE6D5', '#FFFFFF']);
});

test('sound settings validate', () => {
  assert.equal(loadBrand(base()).sound.style, 'minimal');
  assert.throws(() => loadBrand({ ...base(), sound: { style: 'dubstep' } }), /sound\.style: "dubstep" is not one of/);
  assert.throws(() => loadBrand({ ...base(), sound: { key: 'H minor' } }), /sound\.key/);
});
