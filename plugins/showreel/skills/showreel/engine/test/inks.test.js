import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { openRenderer } from '../frames.mjs';

const fixture = name => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));
const at = (px, x, y) => { const i = (y * px.width + x) * 4; return [...px.data.subarray(i, i + 3)]; };
const close = (rgb, hex, tol = 30) => {
  const want = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  return rgb.every((c, i) => Math.abs(c - want[i]) <= tol);
};
const sameFrames = (a, b) => a.data.every((v, i) => v === b.data[i]);

test('each ink paints its own background and line colours', async () => {
  const r = await openRenderer(fixture('inks'));
  try {
    const px = await r.pixels(0, { frozen: true });
    assert.ok(close(at(px, 40, 1040), '#EDE6D5'), `paper background ${at(px, 40, 1040)}`);
    assert.ok(close(at(px, 680, 1040), '#1B3ED2'), `blueprint background ${at(px, 680, 1040)}`);
    assert.ok(close(at(px, 1320, 1040), '#07080A'), `hologram background ${at(px, 1320, 1040)}`);
    assert.ok(close(at(px, 640 + 470, 490), '#FFFFFF', 40), `blueprint line ${at(px, 640 + 470, 490)}`);
    assert.ok(close(at(px, 1280 + 470, 490), '#FFFFFF', 60), `hologram core ${at(px, 1280 + 470, 490)}`);
    assert.ok(close(at(px, 1280 + 473, 490), '#45F0DD', 60), `hologram edge ${at(px, 1280 + 473, 490)}`);
  } finally { await r.close(); }
});

test('pencil wobble holds within an eighth of a second and changes across it', async () => {
  const r = await openRenderer(fixture('static-paper'));
  try {
    const a = await r.pixels(0.01, { scale: 0.5 });
    const b = await r.pixels(0.11, { scale: 0.5 });
    const c = await r.pixels(0.13, { scale: 0.5 });
    assert.ok(sameFrames(a, b), 'frames in the same 1/8 s tick differ: stroke ids are not stable');
    assert.ok(!sameFrames(a, c), 'frames in different ticks are identical: wobble phase is not stepping');
  } finally { await r.close(); }
});

test('the same t renders identical pixels on every repeat', async () => {
  const r = await openRenderer(fixture('inks'));
  try {
    const first = await r.pixels(0.7, { scale: 0.25 });
    for (let k = 1; k < 6; k++) assert.ok(sameFrames(first, await r.pixels(0.7, { scale: 0.25 })), `render ${k + 1} differs from render 1`);
  } finally { await r.close(); }
});

test('mascot is about 250 px wide and leans while running', async () => {
  const r = await openRenderer(fixture('mascot'));
  try {
    const stand = (await r.frame(0.2)).rest[0];
    const run = (await r.frame(0.6)).rest[0];
    assert.ok(stand.w > 230 && stand.w < 290, `stand width ${stand.w}`);
    assert.ok(Math.abs(run.x - stand.x) > 3, 'run pose did not lean');
  } finally { await r.close(); }
});

test('hatching stays on a fixed lattice while its shape grows', async () => {
  const r = await openRenderer(fixture('grow'));
  try {
    // Both frames fall in the same 1/8 s wobble tick; only the shapes' far edges move.
    const a = await r.pixels(0.01, {}), b = await r.pixels(0.1, {});
    // Pencil hatching must not change at all. Clean lines may shimmer by a few levels
    // of anti-aliasing (Skia trims geometry to the growing clip's bounds), but a line
    // that moved would differ by ~200 levels against the blue.
    for (const [x0, limit] of [[200, 0], [1000, 32]]) {
      let worst = 0;
      for (let y = 250; y < 650; y++) for (let x = x0 + 50; x < x0 + 450; x++) {
        const i = (y * a.width + x) * 4;
        worst = Math.max(worst, Math.abs(a.data[i] - b.data[i]), Math.abs(a.data[i + 1] - b.data[i + 1]));
      }
      assert.ok(worst <= limit, `interior pixels of the shape at x=${x0} changed by ${worst} levels (limit ${limit})`);
    }
  } finally { await r.close(); }
});
