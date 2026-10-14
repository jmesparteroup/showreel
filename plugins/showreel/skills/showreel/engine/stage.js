import * as opentype from '/vendor/opentype/opentype.module.js';
import { makeClock } from './clock.js';
import * as ease from './ease.js';
import * as geom from './geom.js';
import * as type from './type.js';
import { makePen } from './ink/index.js';
import { drawLabels, LABEL_BOXES } from './labels.js';
import { mascot } from './mascot.js';

const W = 1920, H = 1080;
const parse = opentype.parse ?? opentype.default.parse;

async function loadFont(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`font ${url}: HTTP ${res.status}`);
  return parse(await res.arrayBuffer());
}

const REQUIRED = ['slug', 'bpm', 'bars', 'barNames', 'cues', 'palette', 'draw'];

export async function boot(canvas, filmUrl) {
  if (!/^\/film\/[\w./-]+\.js$/.test(filmUrl ?? '') || filmUrl.includes('..')) throw new Error(`film must be served from /film/, got ${filmUrl}`);
  const [mod, black, xbold, semi] = await Promise.all([
    import(filmUrl),
    loadFont('/fonts/Geist-Black.otf'),
    loadFont('/fonts/Geist-ExtraBold.otf'),
    loadFont('/fonts/Geist-SemiBold.otf'),
  ]);
  const film = mod.default;
  const missing = REQUIRED.filter(k => film?.[k] === undefined);
  if (missing.length) throw new Error(`${filmUrl} default export is missing: ${missing.join(', ')}`);
  if (film.barNames.length !== film.bars) throw new Error(`barNames has ${film.barNames.length} names for ${film.bars} bars`);
  const clock = makeClock({ bpm: film.bpm, bars: film.bars });
  const fonts = { black, xbold, semi };

  function renderAt(t, { frozen = false, scale = 1 } = {}) {
    const w = Math.round(W * scale), h = Math.round(H * scale);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    const rest = [];
    const env = { t, frozen, fonts };
    const pen = name => makePen(name, ctx, env);
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
    const api = {
      t, W, H, ctx, clock, ease, geom, type, fonts, frozen, pen, split, mascot,
      labels: p => drawLabels(p, { clock, t, barNames: film.barNames }),
      rest: box => rest.push(box),
    };
    film.draw(ctx, t, api);
    return { rest, labels: LABEL_BOXES };
  }

  return { film, clock, renderAt };
}
