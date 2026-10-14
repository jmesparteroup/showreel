// Bar 2, TYPE: words pass through the slot between the rails; the rails fit each word.
import { CY, RAILS, shiftGlyph, mapGlyph } from '../shared.js';
import { drawTicks, drawDimension } from './01.js';

export const cues = [1.95, 2.45, 2.95, 3.45];

let cache = null;

// Each word is fitted to a width; its rail gap is its ink height plus 40 px.
export function words(api) {
  if (cache?.fonts === api.fonts) return cache;
  const { fit, layout, bounds } = api.type;
  const word = (text, width) => {
    const size = fit(api.fonts.black, text, width);
    const b = bounds(layout(api.fonts.black, text, { size, x: 960, y: 0, align: 'center' }).glyphs);
    const baseline = CY - (b.y0 + b.y1) / 2;
    return { glyphs: layout(api.fonts.black, text, { size, x: 960, y: baseline, align: 'center' }).glyphs, gap: b.y1 - b.y0 + 40 };
  };
  cache = {
    fonts: api.fonts,
    intro: word('INTRODUCING', 1200),
    motion: word('A MOTION', 1100),
    designer: word('DESIGNER', 1200),
    claude: word('CLAUDE', 1476),
  };
  return cache;
}

export function gapAt(t, api) {
  const { seq, expoIn } = api.ease;
  const W = words(api);
  if (t < 2.95) return seq(t, RAILS.gap, [{ at: 1.95, to: W.intro.gap, w: 24 }, { at: 2.45, to: W.motion.gap, w: 24 }]);
  if (t < 3.05) return W.motion.gap * (1 - expoIn(api.clock.local(t, 2.95, 0.1)));
  return seq(t, 0, [{ at: 3.05, to: W.designer.gap, w: 22 }, { at: 3.45, to: W.claude.gap, w: 24 }]);
}

export const squash = (g, k) => mapGlyph(g, ([x, y]) => [x, CY + (y - CY) * k]);

export function draw(t, api) {
  const { spring, expoIn, expoOut } = api.ease;
  const { local } = api.clock;
  const W = words(api);
  const gap = gapAt(t, api);
  const top = CY - gap / 2, bot = CY + gap / 2;

  const p = api.pen('paper');
  p.bg();
  p.stroke(api.geom.line(RAILS.x0, top, RAILS.x1, top, 64), { width: 3.5, id: 'rail' });
  p.stroke(api.geom.line(RAILS.x0, bot, RAILS.x1, bot, 64), { width: 3.5, id: 'rail2' });
  drawTicks(p, api, RAILS.x0, RAILS.x1, top, 1 - local(t, 3.45, 0.4));
  drawDimension(p, api, t, top, bot, 1);
  api.labels(p);
  p.flush();

  // Words are clipped to the slot, so they get their own pen inside the clip.
  const ctx = api.ctx;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, top + 3, 1920, Math.max(0, gap - 6));
  ctx.clip();
  const q = api.pen('paper');

  if (t < 2.45) {
    // INTRODUCING rises through the baseline letter by letter, then lifts out through the top.
    const lift = expoIn(local(t, 2.28, 0.17)) * 420;
    q.type(W.intro.glyphs.map((g, i) => shiftGlyph(g, 0, (1 - spring(t - 1.95 - i * 0.025, 26)) * 260 - lift)), { id: 'intro' });
  } else if (t < 3.05) {
    // A MOTION whips in from the left, then the rails clap shut on it.
    const dx = -1400 * (1 - expoOut(local(t, 2.45, 0.2)));
    const k = Math.min(1, gap / W.motion.gap);
    q.type(W.motion.glyphs.map(g => squash(shiftGlyph(g, dx, 0), k)), { id: 'motion' });
  } else if (t < 3.45) {
    // DESIGNER stretches out of the line as the rails reopen; its letters then fly out sideways.
    const k = Math.min(1, gap / W.designer.gap);
    const n = W.designer.glyphs.length, c = (n - 1) / 2;
    q.type(W.designer.glyphs.map((g, i) => {
      const fly = expoIn(local(t, 3.22 + Math.abs(i - c) * 0.012, 0.2)) * 1300 * Math.sign(i - c);
      return squash(shiftGlyph(g, fly, 0), k);
    }), { id: 'designer' });
  } else {
    // CLAUDE in blue pencil, letters dropping from above one every 0.05 s.
    q.type(W.claude.glyphs.map((g, i) => shiftGlyph(g, 0, -(1 - spring(t - 3.45 - i * 0.05, 26)) * 420)), { id: 'claude', color: 'accent' });
  }
  q.flush();
  ctx.restore();
}
