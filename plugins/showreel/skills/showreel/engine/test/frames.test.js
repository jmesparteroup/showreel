import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { openRenderer } from '../frames.mjs';

const fixture = name => new URL(`./fixtures/${name}`, import.meta.url).pathname;

test('renders a PNG frame and reports meta', async () => {
  const r = await openRenderer(fixture('ok'));
  try {
    assert.equal(r.meta.duration, 2);
    assert.equal(r.meta.frames, 120);
    const { png } = await r.frame(0.5);
    assert.equal(png.subarray(1, 4).toString('ascii'), 'PNG');
    const px = await r.pixels(0.5, { scale: 0.25 });
    assert.equal(px.width, 480);
    assert.equal(px.data.length, 480 * 270 * 4);
  } finally { await r.close(); }
});

test('paints the paper colour away from the drawing', async () => {
  const r = await openRenderer(fixture('ok'));
  try {
    const px = await r.pixels(0, { scale: 0.25, frozen: true });
    const i = (10 * px.width + 470) * 4;
    const [R, G, B] = px.data.subarray(i, i + 3);
    assert.ok(Math.abs(R - 0xed) < 14 && Math.abs(G - 0xe6) < 14 && Math.abs(B - 0xd5) < 14, `got ${R},${G},${B}`);
  } finally { await r.close(); }
});

test('film directory with spaces outside the repo renders', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'show reel '));
  fs.copyFileSync(path.join(fixture('ok'), 'scenes.js'), path.join(dir, 'scenes.js'));
  const r = await openRenderer(dir);
  try { assert.ok((await r.frame(1)).png.length > 1000); } finally { await r.close(); }
});

test('missing scenes.js rejects with the path', async () => {
  await assert.rejects(openRenderer('/nonexistent/film'), /scenes\.js not found/);
});

test('a film that throws surfaces its own message', async () => {
  const r = await openRenderer(fixture('throws'));
  try { await assert.rejects(r.frame(0), /bar 1 exploded/); } finally { await r.close(); }
});

test('t = duration renders and wraps the labels', async () => {
  const r = await openRenderer(fixture('ok'));
  try {
    const a = await r.pixels(0, { frozen: true, scale: 0.5 });
    const b = await r.pixels(2, { frozen: true, scale: 0.5 });
    let diff = 0;
    for (let i = 0; i < a.data.length; i++) diff += Math.abs(a.data[i] - b.data[i]);
    assert.ok(diff / a.data.length < 1, 'frame at t = duration differs from frame 0');
  } finally { await r.close(); }
});
