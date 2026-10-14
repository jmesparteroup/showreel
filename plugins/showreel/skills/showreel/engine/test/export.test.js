import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import { exportFilm } from '../export.mjs';
import { writeStills, writeBarStills } from '../stills.mjs';
import { newFilm } from '../new-film.mjs';

const copyFixture = name => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'showreel-'));
  fs.copyFileSync(new URL(`./fixtures/${name}/scenes.js`, import.meta.url), path.join(dir, 'scenes.js'));
  return dir;
};
const frameCount = mp4 => {
  const r = spawnSync(ffmpeg, ['-i', mp4, '-map', '0:v', '-c', 'copy', '-f', 'null', '-'], { encoding: 'utf8' });
  return Number(r.stderr.match(/frame=\s*(\d+)/g).pop().match(/\d+/)[0]);
};

test('exports an MP4 with one frame per 1/60 s and clears stale frames', async () => {
  const dir = copyFixture('ok');
  fs.mkdirSync(path.join(dir, 'out', 'frames'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'out', 'frames', '99999.png'), 'stale');
  const mp4 = await exportFilm(dir, { frames: [0, 12] });
  assert.equal(frameCount(mp4), 12);
  assert.ok(!fs.existsSync(path.join(dir, 'out', 'frames')), 'frame PNGs left on disk after encoding');
});

test('writes stills named by time', async () => {
  const dir = copyFixture('ok');
  const paths = await writeStills(dir, [0.5, 1.25]);
  assert.deepEqual(paths.map(p => path.basename(p)), ['t-00.500.png', 't-01.250.png']);
  assert.ok(paths.every(p => fs.statSync(p).size > 1000));
});

test('scaffolds a film that renders and refuses to overwrite it', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'showreel-'));
  const dir = newFilm(root, 'test-film', { bars: 2 });
  assert.ok(fs.existsSync(path.join(dir, 'bars', '02.js')));
  assert.equal((await writeStills(dir, [1])).length, 1);
  assert.throws(() => newFilm(root, 'test-film'), /already exists/);
});

test('a slug with path parts is refused before anything is written', async () => {
  const dir = copyFixture('bad-slug');
  await assert.rejects(exportFilm(dir, { frames: [0, 2] }), /slug/);
  assert.ok(!fs.existsSync(path.join(dir, '..', 'escape.mp4')));
});

test('bar stills come from the renderer, not a node import of the film', async () => {
  const dir = copyFixture('ok');
  fs.writeFileSync(path.join(dir, 'scenes.js'), fs.readFileSync(path.join(dir, 'scenes.js'), 'utf8') + "\nif (typeof process !== 'undefined') process.exit(7);\n");
  const paths = await writeBarStills(dir);
  assert.deepEqual(paths.map(p => path.basename(p)), ['t-00.250.png', 't-01.000.png']);
});
