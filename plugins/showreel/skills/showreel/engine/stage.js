import * as opentype from '/vendor/opentype/opentype.module.js';
import { makeClock } from './clock.js';
import * as ease from './ease.js';
import * as geom from './geom.js';
import * as type from './type.js';
import { makePen } from './ink/index.js';
import { drawLabels, labelBoxes, borderOf } from './labels.js';
import { mascot } from './mascot.js';
import { loadBrand, DEFAULT_BRAND, fontURL } from './brand.js';

const parse = opentype.parse ?? opentype.default.parse;
const FPS = [24, 25, 30, 48, 50, 60];

async function loadFont(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`font ${url}: HTTP ${res.status}`);
  try {
    return parse(await res.arrayBuffer());
  } catch (e) {
    throw new Error(`font ${url}: ${e.message}`);
  }
}

async function loadBrandFile() {
  const res = await fetch('/film/brand.json');
  if (res.status === 404) return DEFAULT_BRAND;
  if (!res.ok) throw new Error(`brand.json: HTTP ${res.status}`);
  try {
    return await res.json();
  } catch (e) {
    throw new Error(`brand.json is not valid JSON: ${e.message}`);
  }
}

async function loadImage(path) {
  const url = '/film/' + path.split('/').map(encodeURIComponent).join('/');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`image ${url}: HTTP ${res.status}`);
  return createImageBitmap(await res.blob());
}

const REQUIRED = ['slug', 'bpm', 'bars', 'barNames', 'cues', 'draw'];

export async function boot(canvas, filmUrl) {
  if ((!/^\/film\/[\w./-]+\.js$/.test(filmUrl ?? '') && filmUrl !== '/engine/swatch-film.js') || filmUrl.includes('..')) throw new Error(`film must be served from /film/, got ${filmUrl}`);
  const [mod, brandJson] = await Promise.all([import(filmUrl), loadBrandFile()]);
  const film = mod.default;
  const missing = REQUIRED.filter(k => film?.[k] === undefined);
  if (missing.length) throw new Error(`${filmUrl} default export is missing: ${missing.join(', ')}`);
  // The slug names output files, so it must not carry path parts.
  if (!/^[a-z0-9-]+$/.test(film.slug)) throw new Error(`slug "${film.slug}" must be lowercase letters, digits and dashes`);
  if (film.barNames.length !== film.bars) throw new Error(`barNames has ${film.barNames.length} names for ${film.bars} bars`);
  const [W, H] = film.size ?? [1920, 1080];
  if (![W, H].every(v => Number.isInteger(v) && v >= 64 && v <= 4096 && v % 2 === 0)) throw new Error(`size ${JSON.stringify(film.size)} must be two even integers from 64 to 4096`);
  const fps = film.fps ?? 60;
  if (!FPS.includes(fps)) throw new Error(`fps ${fps} is not one of ${FPS.join(', ')}`);
  const beatsPerBar = film.beatsPerBar ?? 4;
  if (!Number.isInteger(beatsPerBar) || beatsPerBar < 1 || beatsPerBar > 12) throw new Error(`beatsPerBar ${beatsPerBar} must be an integer from 1 to 12`);

  const brand = loadBrand(brandJson);
  const urls = {
    black: '/fonts/Geist-Black.otf', xbold: '/fonts/Geist-ExtraBold.otf', semi: '/fonts/Geist-SemiBold.otf',
    display: fontURL(brand.fonts.display), label: fontURL(brand.fonts.label), body: fontURL(brand.fonts.body),
  };
  const byUrl = new Map();
  for (const u of new Set(Object.values(urls))) byUrl.set(u, loadFont(u));
  const fonts = {};
  for (const [k, u] of Object.entries(urls)) fonts[k] = await byUrl.get(u);
  const images = {};
  for (const ink of Object.values(brand.inks)) if (ink.bg.image) images[ink.bg.image] ??= await loadImage(ink.bg.image);

  const size = [W, H];
  const clock = makeClock({ bpm: film.bpm, bars: film.bars, beatsPerBar, fps });
  const palette = film.palette ?? Object.values(brand.palette);
  const border = borderOf(size);

  function renderAt(t, { frozen = false, scale = 1 } = {}) {
    const w = Math.round(W * scale), h = Math.round(H * scale);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    const rest = [];
    const env = { t, frozen, fonts, inks: brand.inks, palette: brand.palette, size, images };
    let lastInk = null, labelsDrawn = false;
    const pen = name => { lastInk = name; return makePen(name, ctx, env); };
    // Draws the same geometry twice: in `outside` ink beyond the clip, in `inside` ink within it.
    const split = (clip, outside, inside, fn) => {
      const inner = new Path2D();
      inner.moveTo(...clip[0]);
      for (let i = 1; i < clip.length; i++) inner.lineTo(...clip[i]);
      inner.closePath();
      const outer = new Path2D();
      outer.rect(0, 0, W, H);
      outer.addPath(inner);
      for (const [path, rule, name] of [[outer, 'evenodd', outside], [inner, 'nonzero', inside]]) {
        ctx.save();
        ctx.clip(path, rule);
        const p = pen(name);
        p.bg();
        fn(p);
        p.flush();
        ctx.restore();
      }
    };
    const labels = p => { labelsDrawn = true; drawLabels(p, { clock, t, barNames: film.barNames, size }); };
    const api = {
      t, W, H, CX: W / 2, CY: H / 2, border, ctx, clock, ease, geom, type, fonts, frozen, pen, split, mascot, brand,
      labels, rest: box => rest.push(box),
    };
    film.draw(ctx, t, api);
    // Labels stay on all film: drawn here in the frame's last ink when a bar did not draw them.
    if (!labelsDrawn && film.labels !== false && lastInk) {
      const p = pen(lastInk);
      labels(p);
      p.flush();
    }
    return { rest, labels: labelBoxes(size) };
  }

  return { film, clock, brand, size, palette, renderAt };
}
