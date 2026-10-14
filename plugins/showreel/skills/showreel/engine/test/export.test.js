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

test('a film directory with % in its name exports at the film frame rate', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), '100% films '));
  fs.copyFileSync(new URL('./fixtures/format/scenes.js', import.meta.url), path.join(dir, 'scenes.js'));
  const mp4 = await exportFilm(dir, { frames: [0, 6] });
  const r = spawnSync(ffmpeg, ['-i', mp4], { encoding: 'utf8' });
  assert.match(r.stderr, /\b30 fps\b/);
  assert.match(r.stderr, /1080x1920/);
});

test('a scaffold at another tempo, meter, rate and size passes the beats check', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'showreel-'));
  const dir = newFilm(root, 'waltz', { bpm: 90, bars: 3, beatsPerBar: 3, fps: 30, size: [1080, 1350] });
  assert.ok(fs.existsSync(path.join(dir, 'brand.json')));
  const { runChecks } = await import('../check.mjs');
  const r = Object.fromEntries((await runChecks(dir, { only: ['beats'] })).map(x => [x.name, x]));
  assert.ok(r.beats.ok, r.beats.detail);
  assert.match(fs.readFileSync(path.join(dir, 'bars', '02.js'), 'utf8'), /Owns film time \[1\.95, 3\.95\)/);
  const [still] = await writeStills(dir, [0.5]);
  assert.equal(fs.readFileSync(still).readUInt32BE(16), 1080);
});

test('the exported MP4 carries an AAC soundtrack as long as the picture', async () => {
  const dir = copyFixture('ok');
  const mp4 = await exportFilm(dir, { frames: [0, 60] });
  const r = spawnSync(ffmpeg, ['-i', mp4], { encoding: 'utf8' });
  assert.match(r.stderr, /Audio: aac/);
  assert.ok(fs.existsSync(path.join(dir, 'out', 'fixture-ok.wav')));
  const d = r.stderr.match(/Duration: 00:00:(\d+\.\d+)/)[1];
  assert.ok(Math.abs(Number(d) - 1) < 0.06, `duration ${d}`);
});

test('a brand sound file replaces the generated score', async () => {
  const { encodeWav } = await import('../audio/wav.mjs');
  const { writeAudio } = await import('../audio/render.mjs');
  const dir = copyFixture('ok');
  const sr = 48000, tone = new Float32Array(sr / 2).map((_, i) => 0.5 * Math.sin((2 * Math.PI * 220 * i) / sr));
  fs.writeFileSync(path.join(dir, 'track.wav'), encodeWav([tone, tone], sr));
  fs.writeFileSync(path.join(dir, 'brand.json'), JSON.stringify({
    name: 'X', palette: { a: '#EDE6D5', b: '#16161A' }, inks: [{ name: 'paper', preset: 'paper' }], sound: { file: 'track.wav' },
  }));
  const meta = { slug: 'fixture-ok', duration: 2, bpm: 120, bars: 1, beatsPerBar: 4, cues: [], sounds: null, brand: { sound: { style: 'minimal', key: { root: 'A', mode: 'minor' }, file: 'track.wav', offset: 0, gain: 1 } } };
  const wav = await writeAudio(dir, meta);
  const buf = fs.readFileSync(wav);
  const data = buf.indexOf('data', 12, 'ascii'); // ffmpeg writes a LIST chunk before the samples
  assert.equal(buf.readUInt32LE(data + 4), 2 * sr * 2 * 2, 'a half-second track should loop to fill the 2 s film');
});
