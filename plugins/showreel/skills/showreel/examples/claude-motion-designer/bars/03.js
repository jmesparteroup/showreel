// Bar 3, CURVE: the crushed line gets pen-tool handles, bends, fans into a leaf, waves, and flattens.
import { CY, RAILS, CRUSH, middle } from '../shared.js';
import { words, squash } from './02.js';

export const cues = [3.95, 4.05, 4.45, 4.95, 5.45];

const N = 128;
const HANDLE = 430;
const COPIES = [-4, -3, -2, -1, 1, 2, 3, 4];

export function draw(t, api) {
  const { spring, expoIn, lerp } = api.ease;
  const { local } = api.clock;
  const { cubic } = api.geom;
  const p = api.pen('paper');
  p.bg();

  if (t < 4.05) {
    // The rails close and crush CLAUDE into one line 1476 px long.
    const W = words(api);
    const u = expoIn(local(t, 3.95, 0.1));
    const gap = W.claude.gap * (1 - u);
    const x0 = lerp(RAILS.x0, CRUSH.x0, u), x1 = lerp(RAILS.x1, CRUSH.x1, u);
    p.stroke(api.geom.line(x0, CY - gap / 2, x1, CY - gap / 2, 64), { width: 3.5, id: 'rail' });
    p.stroke(api.geom.line(x0, CY + gap / 2, x1, CY + gap / 2, 64), { width: 3.5, id: 'rail2' });
    if (gap > 2) p.type(W.claude.glyphs.map(g => squash(g, gap / W.claude.gap)), { id: 'claude', color: 'accent' });
    api.labels(p);
    p.flush();
    return;
  }

  const grow = spring(t - 4.05, 20);
  const swing = spring(t - 4.45, 20);
  const fan = spring(t - 4.5, 22);
  const wave = spring(t - 4.95, 18);
  const gather = spring(t - 5.45, 22);

  const theta = ((58 - 116 * swing) * Math.PI) / 180;
  const h = HANDLE * grow;
  const P0 = [CRUSH.x0, CY], P3 = [CRUSH.x1, CY];
  const dir = [Math.cos(theta), -Math.sin(theta)];
  const P1 = [P0[0] + dir[0] * h, P0[1] + dir[1] * h];
  const P2 = [P3[0] - dir[0] * h, P3[1] - dir[1] * h];

  // Bézier lines (main + leaf copies) morph into travelling sines, then flatten.
  const phase = (t - 4.95) * 5;
  const amp = 92 * (1 - gather);
  const curve = k => {
    const d = (k * 34 * fan) / 0.75; // moving both control points by d moves the middle by 0.75 d
    const bez = cubic(P0, [P1[0], P1[1] + d], [P2[0], P2[1] + d], P3, N);
    return bez.map(([x, y], i) => {
      const s = i / (N - 1);
      const sx = lerp(CRUSH.x0, CRUSH.x1, s);
      const sy = CY + amp * Math.sin(2 * Math.PI * 2.75 * s - phase + k * 0.22);
      const yy = lerp(y, sy, wave);
      return [lerp(x, sx, wave), gather > 0 ? lerp(yy, CY, gather) : yy];
    });
  };

  if (fan > 0) COPIES.forEach(k => {
    const pts = middle(curve(k), 1 - gather);
    if (pts && pts.length > 1) p.stroke(pts, { color: 'accent', width: 2, id: `copy${k}` });
  });
  p.stroke(curve(0), { width: 3.5, id: 'rail' });

  // Pen-tool handles: lines, square anchors, round tips and the EASE label; they retract as the waves start.
  const show = 1 - wave;
  if (show > 0.01 && h > 1) {
    const s = show;
    const tip1 = [P0[0] + (P1[0] - P0[0]) * s, P0[1] + (P1[1] - P0[1]) * s];
    const tip2 = [P3[0] + (P2[0] - P3[0]) * s, P3[1] + (P2[1] - P3[1]) * s];
    p.stroke([P0, tip1], { width: 1.6, id: 'h1' });
    p.stroke([P3, tip2], { width: 1.6, id: 'h2' });
    for (const [[x, y], k] of [[P0, 'a'], [P3, 'b']])
      p.stroke(api.geom.roundRect(x - 7 * s, y - 7 * s, 14 * s, 14 * s, 1, 1), { closed: true, width: 2, id: `sq${k}` });
    for (const [[x, y], k] of [[tip1, 'a'], [tip2, 'b']])
      p.stroke(api.geom.circle(x, y, 8 * s, 24), { closed: true, width: 2, id: `ci${k}` });
    if (s > 0.5) p.text('EASE', { x: tip1[0] + 18, y: tip1[1] - 12, size: 24, weight: 'xbold', tracking: 0.2, color: 'accent' });
  }
  api.labels(p);
  p.flush();
}
