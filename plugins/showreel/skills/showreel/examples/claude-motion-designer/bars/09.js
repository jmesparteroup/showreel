// Bar 9, DATA: the chart reads the film's own time, bends into a ring, and the dashboard folds into it.
import { CX, CY, PANELS, HEIGHTS, CHART, RING_R, RING_BIG, RING_BAR, partial } from '../shared.js';
import { drawDashboard, TL } from './08.js';

export const cues = [15.95, 16.45, 16.95, 17.45];
export const sounds = [{ t: 16.0, kind: 'sweep' }, { t: 16.5, kind: 'click' }, { t: 17.0, kind: 'type', count: 4, interval: 0.125 }, { t: 17.5, kind: 'click' }];

const CHART_CX = (CHART.x0 + CHART.x1) / 2;
const RING_C0 = [CHART_CX, CHART.base + RING_R]; // the ring's centre when the baseline first closes
const CURSOR = [[0, 0], [0, 34], [9, 26], [16, 42], [22, 39], [15, 24], [27, 24]];

// The chart's baseline as a curve and the 30 bars standing on it, for any bend, move and bar scale.
// Bars 9 and 10 draw from this; `len(i)` scales bar i's length.
export function ringGeometry(api, { bend, move, len = () => 1 }) {
  const { lerp } = api.ease;
  const L = lerp(CHART.x1 - CHART.x0, 2 * Math.PI * RING_R, bend);
  // Negative curvature bends the ends down, so bars that stood up end up pointing outward.
  const curve = api.geom.curl(CHART_CX, CHART.base, L, -bend / RING_R, 241);
  const sc = lerp(1, RING_BIG / RING_R, move);
  const c = [lerp(RING_C0[0], CX, move), lerp(RING_C0[1], CY, move)];
  const T = ([x, y]) => (move > 0 ? [c[0] + (x - RING_C0[0]) * sc, c[1] + (y - RING_C0[1]) * sc] : [x, y]);
  const base = curve.map(T);
  const pitch = L / 30;
  const bars = HEIGHTS.map((v, i) => {
    const k = Math.round(((i + 0.5) / 30) * 240);
    const a = curve[Math.max(0, k - 1)], b = curve[Math.min(240, k + 1)];
    const tl = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const tx = (b[0] - a[0]) / tl, ty = (b[1] - a[1]) / tl;
    const nx = ty, ny = -tx;
    const hgt = (v / 100) * CHART.max * lerp(1, RING_BAR, bend) * len(i);
    const w = (pitch - 10) / 2;
    const o = curve[k];
    const quad = [[o[0] - tx * w, o[1] - ty * w], [o[0] + tx * w, o[1] + ty * w], [o[0] + tx * w + nx * hgt, o[1] + ty * w + ny * hgt], [o[0] - tx * w + nx * hgt, o[1] - ty * w + ny * hgt]];
    return { quad: quad.map(T), top: T([o[0] + nx * hgt, o[1] + ny * hgt]), v };
  });
  return { base, bars, closed: bend >= 1 };
}

// Bar states for the time of the film: earlier seconds hatched, the current one solid, later ones outlined.
export function drawBars(p, api, t, geo, { later = 0, lit } = {}) {
  const now = Math.floor(api.clock.wrap(t));
  geo.bars.forEach((b, i) => {
    if (lit) p.fill(b.quad, { lit: lit(i), id: `barf${i}` });
    else if (i === now) p.fill(b.quad, { mode: 'solid', color: 'accent', id: `barf${i}` });
    else if (i < now || later > 0) p.fill(b.quad, { color: 'line', spacing: 6, progress: i < now ? 1 : later, id: `barf${i}` });
    p.stroke(b.quad, { closed: true, width: 2.5, id: `bar${i}` });
  });
  p.stroke(geo.base, { closed: geo.closed, width: 3, id: 'base' });
}

export function draw(t, api) {
  const { spring, seq, expoIn, lerp } = api.ease;
  const { local } = api.clock;
  const p = api.pen('blueprint');
  p.bg();

  const bend = spring(t - 16.45, 18);
  const move = spring(t - 17.45, 18);
  const fold = spring(t - 17.45, 20);
  const geo = ringGeometry(api, { bend, move });

  // Panels fold into the ring's centre.
  const centre = [lerp(RING_C0[0], CX, move), lerp(RING_C0[1], CY, move)];
  Object.entries(PANELS).forEach(([name, [x, y, w, h]], i) => {
    if (fold >= 1) return;
    const r = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]].map(([a, b]) => [lerp(a, centre[0], fold), lerp(b, centre[1], fold)]);
    p.stroke(r, { closed: true, width: 3.5, id: `panel${i}` });
  });

  // Panel contents retract one panel every eighth note; the header goes with the fold.
  const out = k => 1 - spring(t - 16.95 - k * 0.125, 22);
  const fill = k => ({ 0: 1 - fold, 1: 1, 2: out(1), 3: out(1), 4: out(0), 5: out(2) })[k];
  drawDashboard(p, api, t, {
    fill, count: 1, ring: t >= 16.45 ? 1 : 0, knob: spring(t - 17.45, 24),
    bars: () => drawBars(p, api, t, geo, { later: 1 - spring(t - 15.95, 20) }),
  });

  // The graph line across the bar tops, drawn on and later retracted.
  const graph = partial(geo.bars.map(b => b.top), local(t, 15.95, 0.45) * (1 - local(t, 16.95, 0.3)));
  if (graph) p.stroke(graph, { color: 'accent', width: 3, id: 'graph' });

  // The playhead lands on the timeline at the real time.
  const tl = out(2);
  if (tl > 0.5) {
    const x = TL.x0 + (api.clock.wrap(t) / 30) * TL.w;
    const dy = -(1 - spring(t - 15.95, 22)) * 80;
    p.stroke([[x, 812 + dy], [x, 858 + dy]], { color: 'accent', width: 3.5, id: 'playhead' });
    p.fill([[x - 8, 806 + dy], [x + 8, 806 + dy], [x, 816 + dy]], { mode: 'solid', color: 'accent', id: 'playtip' });
  }

  // The cursor: in to RING, click, over to LIGHT, click, out.
  const cx = seq(t, 1990, [{ at: 15.95, to: 1312, w: 18 }, { at: 16.95, to: 1520, w: 20 }]) + expoIn(local(t, 17.6, 0.3)) * 600;
  const cy = seq(t, 1120, [{ at: 15.95, to: 198, w: 18 }, { at: 16.95, to: 198, w: 20 }]) + expoIn(local(t, 17.6, 0.3)) * 400;
  const press = (local(t, 16.45, 0.06) > 0 && local(t, 16.45, 0.12) < 1) || (local(t, 17.45, 0.06) > 0 && local(t, 17.45, 0.12) < 1) ? 0.82 : 1;
  const arrow = CURSOR.map(([x, y]) => [cx + x * press, cy + y * press]);
  p.fill(arrow, { mode: 'solid', color: 'line', id: 'cursor' });
  p.stroke(arrow, { closed: true, color: 'accent', width: 2, id: 'cursoredge' });
  api.labels(p);
}
