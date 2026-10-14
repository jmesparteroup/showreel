import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { openRenderer } from '../frames.mjs';
import { runChecks } from '../check.mjs';

const fixture = name => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));
const at = (px, x, y) => { const i = (y * px.width + x) * 4; return [...px.data.subarray(i, i + 3)]; };
const near = (rgb, hex, tol = 30) => rgb.every((c, i) => Math.abs(c - parseInt(hex.slice(1 + 2 * i, 3 + 2 * i), 16)) <= tol);

test('a film sets its own size, frame rate and meter', async () => {
  const r = await openRenderer(fixture('format'));
  try {
    assert.deepEqual(r.meta.size, [1080, 1920]);
    assert.equal(r.meta.fps, 30);
    assert.equal(r.meta.frames, 90);
    assert.equal(r.meta.totalBeats, 6);
    const px = await r.pixels(0.2, { scale: 0.25 });
    assert.equal(px.width, 270);
    assert.equal(px.height, 480);
    assert.deepEqual(px.labels[1].x + px.labels[1].w, 1080 - (1080 * 150) / 1920);
  } finally { await r.close(); }
});

test('format fixture passes every check at its own size and rate', async () => {
  const r = Object.fromEntries((await runChecks(fixture('format'))).map(x => [x.name, x]));
  for (const n of ['beats', 'loop', 'border', 'holds', 'palette']) assert.ok(r[n].ok, `${n}: ${r[n].detail}`);
});

test('the hold limit is half a second at the film frame rate', async () => {
  const r = Object.fromEntries((await runChecks(fixture('format-hold'), { only: ['holds'] })).map(x => [x.name, x]));
  assert.equal(r.holds.ok, false);
  assert.match(r.holds.detail, /hold of 1[89] frames/);
});

test('the stage draws the corner labels when a film does not', async () => {
  const r = await openRenderer(fixture('nolabels'));
  try {
    const px = await r.pixels(0.3, { frozen: true });
    let dark = 0;
    for (let y = 90; y < 120; y++) for (let x = 150; x < 420; x++) if (at(px, x, y)[0] < 80) dark++;
    assert.ok(dark > 200, `only ${dark} label pixels in the top-left label box`);
  } finally { await r.close(); }
});

test('a corrupt brand font names its file', async () => {
  await assert.rejects(openRenderer(fixture('badfont')), /\/film\/fonts\/bad\.otf/);
});

test('brand inks draw with brand colours and treatments', async () => {
  const r = await openRenderer(fixture('brand'));
  try {
    assert.deepEqual(r.meta.brand.inkNames, ['SKETCH', 'SOLID']);
    const px = await r.pixels(0, { frozen: true });
    assert.ok(near(at(px, 60, 1000), '#F4F1EA', 20), `sketch background ${at(px, 60, 1000)}`);
    assert.ok(near(at(px, 1020, 1000), '#FF5A1F', 20), `solid background ${at(px, 1020, 1000)}`);
    assert.ok(near(at(px, 1440, 540), '#111014', 20), `solid fill ${at(px, 1440, 540)}`);
    let dots = 0, gaps = 0;
    for (let x = 400; x < 560; x++) { const c = at(px, x, 540); if (near(c, '#FF5A1F', 60)) dots++; else if (near(c, '#F4F1EA', 30)) gaps++; }
    assert.ok(dots > 20 && gaps > 20, `dots fill should alternate colour and paper (dots ${dots}, gaps ${gaps})`);
    assert.deepEqual([...r.meta.palette].sort(), ['#111014', '#2E5BFF', '#F4F1EA', '#FF5A1F']);
  } finally { await r.close(); }
});
