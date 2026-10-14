// Bar 11, WAVE: the line becomes a sine, stacks into nine out-of-phase waves, and bends into latitude rings.
import { CY, RAILS, LATS, GLOBE_R } from '../shared.js';
import { latitude, drawGlobe } from './12.js';

export const cues = [19.95, 20.45, 20.95, 21.45];

const N = 161;
const KS = [-4, -3, -2, -1, 0, 1, 2, 3, 4];

export function draw(t, api) {
  const { spring, lerp } = api.ease;
  const { local } = api.clock;
  const p = api.pen('hologram');
  p.bg();

  const amp = 92 * spring(t - 19.95, 18);
  const stack = spring(t - 20.45, 20);
  const bend = spring(t - 20.95, 18);
  const close = spring(t - 21.45, 20);
  const phase = (t - 19.95) * 4;
  const arg = s => 2 * Math.PI * 2.75 * s - phase;

  const wave = k => Array.from({ length: N }, (_, i) => {
    const s = i / (N - 1);
    return [lerp(RAILS.x0, RAILS.x1, s), CY + k * 34 * stack + amp * Math.sin(arg(s) + k * 0.25 * stack)];
  });

  if (close >= 1) { drawGlobe(p, api, t); api.labels(p); return; }

  const lines = KS.map(k => {
    const w = wave(k);
    if (bend <= 0) return w;
    const ring = latitude(api, LATS[k + 4]).map(([x, y]) => [960 + x, CY + y]);
    return api.geom.morph(w, ring, bend, { n: N });
  });

  // Bands between neighbouring waves fill with scan lines as thick as the slope is steep.
  const band = local(t, 20.45, 0.4) * (1 - local(t, 20.95, 0.3));
  if (band > 0)
    for (let j = 0; j < KS.length - 1; j++)
      p.fill([...lines[j], ...[...lines[j + 1]].reverse()], {
        progress: band, id: `band${j}`,
        lit: x => Math.abs(Math.cos(arg((x - RAILS.x0) / (RAILS.x1 - RAILS.x0)))) * 0.8,
      });

  lines.forEach((l, j) => { if (KS[j] === 0 || stack > 0) p.stroke(l, { width: 4, id: `w${KS[j]}` }); });

  // The outline circle closes round the rings from their left point.
  if (close > 0) {
    const c = api.geom.circle(960, CY, GLOBE_R, 192);
    const from = c.slice(144).concat(c.slice(0, 145));
    p.stroke(from.slice(0, Math.max(2, Math.round(97 * close))), { width: 4, id: 'oa' });
    p.stroke([...from].reverse().slice(0, Math.max(2, Math.round(97 * close))), { width: 4, id: 'ob' });
  }
  api.labels(p);
}
