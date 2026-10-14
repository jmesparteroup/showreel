import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
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

test('preview server rejects requests for another host name', async () => {
  const { serveFilm } = await import('../frames.mjs');
  const site = await serveFilm(fixture('ok'));
  try {
    const { port } = new URL(site.url);
    const res = await new Promise((resolve, reject) => {
      const req = http.get({ host: '127.0.0.1', port, path: '/film/scenes.js', headers: { host: 'evil.example' } }, resolve);
      req.on('error', reject);
    });
    assert.equal(res.statusCode, 403);
  } finally { await site.close(); }
});

test('preview server survives a malformed escape in the path', async () => {
  const { serveFilm } = await import('../frames.mjs');
  const site = await serveFilm(fixture('ok'));
  try {
    const base = new URL(site.url).origin;
    assert.equal((await fetch(`${base}/film/%E0%A4%A`)).status, 400);
    assert.equal((await fetch(`${base}/film/scenes.js`)).status, 200);
  } finally { await site.close(); }
});

test('host page refuses a film from outside /film/', async () => {
  const { serveFilm } = await import('../frames.mjs');
  const { chromium } = await import('playwright');
  const site = await serveFilm(fixture('ok'));
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const url = site.url.replace('film=/film/scenes.js', 'film=' + encodeURIComponent('data:text/javascript,export default 1'));
    await page.goto(url);
    await page.waitForFunction(() => window.__ready || window.__error);
    assert.match(await page.evaluate(() => window.__error), /film must be served from \/film\//);
  } finally { await browser.close(); await site.close(); }
});

test('a film importing a missing module names the missing file', async () => {
  await assert.rejects(openRenderer(fixture('missing-import')), /bars\/02\.js/);
});

test('a syntax error in a film module names the file and line', async () => {
  await assert.rejects(openRenderer(fixture('syntax')), /bars\/01\.js:3/);
});

test('a broken engine module fails fast and names the module', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'engine-copy-'));
  const engine = new URL('..', import.meta.url).pathname;
  fs.cpSync(engine, path.join(root, 'engine'), { recursive: true, filter: src => !src.includes('node_modules') && !src.includes(`${path.sep}test${path.sep}`) });
  fs.symlinkSync(path.join(engine, 'node_modules'), path.join(root, 'engine', 'node_modules'));
  fs.symlinkSync(path.join(engine, '..', 'fonts'), path.join(root, 'fonts'));
  fs.appendFileSync(path.join(root, 'engine', 'ink', 'make.js'), '\nexport const broken = ;\n');
  const { openRenderer: open } = await import(path.join(root, 'engine', 'frames.mjs'));
  const started = Date.now();
  await assert.rejects(open(fixture('ok')).then(r => r.close()), /make\.js/);
  assert.ok(Date.now() - started < 20000, 'took longer than 20 s to report');
});
