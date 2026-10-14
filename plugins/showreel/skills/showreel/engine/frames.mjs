import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';

export const ENGINE = path.dirname(fileURLToPath(import.meta.url));
const SKILL = path.dirname(ENGINE);
const require = createRequire(import.meta.url);
const OPENTYPE = path.join(path.dirname(require.resolve('opentype.js/package.json')), 'dist');
const TYPES = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.otf': 'font/otf', '.ttf': 'font/ttf', '.png': 'image/png', '.json': 'application/json' };

function serve(mounts) {
  const server = http.createServer((req, res) => {
    // Only answer to the exact loopback origin, so a page that rebinds its own
    // domain to 127.0.0.1 cannot read the film or engine files.
    if (req.headers.host !== `127.0.0.1:${server.address().port}`) { res.writeHead(403).end(); return; }
    const { pathname } = new URL(req.url, 'http://x');
    for (const [prefix, dir] of mounts) {
      if (!pathname.startsWith(prefix + '/')) continue;
      let rel;
      try { rel = decodeURIComponent(pathname.slice(prefix.length + 1)); } catch { res.writeHead(400).end(); return; }
      const file = path.resolve(dir, rel);
      if (!file.startsWith(dir + path.sep)) { res.writeHead(403).end(); return; }
      fs.readFile(file, (err, body) => {
        if (err) { res.writeHead(404).end(`${pathname} not found`); return; }
        res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' }).end(body);
      });
      return;
    }
    res.writeHead(404).end();
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

export async function serveFilm(filmDir) {
  const film = path.resolve(filmDir);
  if (!fs.existsSync(path.join(film, 'scenes.js'))) throw new Error(`${path.join(film, 'scenes.js')}: scenes.js not found`);
  const server = await serve([['/engine', ENGINE], ['/fonts', path.join(SKILL, 'fonts')], ['/vendor/opentype', OPENTYPE], ['/film', film]]);
  const url = `http://127.0.0.1:${server.address().port}/engine/render.html?film=/film/scenes.js`;
  return { url, close: () => new Promise(r => server.close(r)) };
}

export async function openRenderer(filmDir, { pages = 1 } = {}) {
  const site = await serveFilm(filmDir);
  let browser;
  try {
    browser = await chromium.launch();
  } catch (e) {
    await site.close();
    throw new Error(`Chromium failed to launch. Run: npx --prefix ${ENGINE} playwright install chromium\n${e.message}`);
  }
  const open = async () => {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.goto(site.url + '&headless=1');
    await page.waitForFunction(() => window.__ready || window.__error, null, { timeout: 60000 });
    const err = await page.evaluate(() => window.__error);
    if (err) throw new Error(err);
    return page;
  };
  const list = [];
  try {
    for (let i = 0; i < pages; i++) list.push(await open());
  } catch (e) {
    await browser.close();
    await site.close();
    throw e;
  }

  const meta = await list[0].evaluate(() => {
    const { film, clock } = window.__stage;
    return {
      slug: film.slug, bpm: film.bpm, bars: film.bars, barNames: film.barNames, cues: film.cues, palette: film.palette,
      duration: clock.duration, frames: clock.frames, fps: clock.fps, spb: clock.spb, totalBeats: clock.totalBeats,
    };
  });

  async function frame(t, opts = {}, page = list[0]) {
    const r = await page.evaluate(([t, opts]) => {
      const res = window.__stage.renderAt(t, opts);
      return { png: document.getElementById('c').toDataURL('image/png'), rest: res.rest, labels: res.labels };
    }, [t, opts]);
    return { png: Buffer.from(r.png.split(',')[1], 'base64'), rest: r.rest, labels: r.labels };
  }

  async function pixels(t, opts = {}, page = list[0]) {
    const r = await page.evaluate(([t, opts]) => {
      const res = window.__stage.renderAt(t, opts);
      const c = document.getElementById('c');
      const data = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let bin = '';
      for (let i = 0; i < data.length; i += 0x8000) bin += String.fromCharCode.apply(null, data.subarray(i, i + 0x8000));
      return { b64: btoa(bin), width: c.width, height: c.height, rest: res.rest, labels: res.labels };
    }, [t, opts]);
    return { data: new Uint8Array(Buffer.from(r.b64, 'base64')), width: r.width, height: r.height, rest: r.rest, labels: r.labels };
  }

  return {
    meta, pages: list, frame, pixels,
    close: async () => { await browser.close(); await site.close(); },
  };
}
