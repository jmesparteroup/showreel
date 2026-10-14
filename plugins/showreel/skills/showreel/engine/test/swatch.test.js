import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeSwatches } from '../swatch.mjs';

test('one swatch per brand ink, at the film size, even before scenes.js exists', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'swatch-'));
  fs.copyFileSync(fileURLToPath(new URL('./fixtures/brand/brand.json', import.meta.url)), path.join(dir, 'brand.json'));
  const files = await writeSwatches(dir);
  assert.deepEqual(files.map(f => path.basename(f)), ['SKETCH.png', 'SOLID.png']);
  assert.equal(fs.readFileSync(files[0]).readUInt32BE(16), 1920);
});

test('swatches follow the film size when scenes.js sets one', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'swatch-'));
  fs.copyFileSync(fileURLToPath(new URL('./fixtures/format/scenes.js', import.meta.url)), path.join(dir, 'scenes.js'));
  const files = await writeSwatches(dir);
  assert.deepEqual(files.map(f => path.basename(f)), ['paper.png', 'blueprint.png', 'hologram.png']);
  assert.equal(fs.readFileSync(files[0]).readUInt32BE(16), 1080);
  assert.equal(fs.readFileSync(files[0]).readUInt32BE(20), 1920);
});
