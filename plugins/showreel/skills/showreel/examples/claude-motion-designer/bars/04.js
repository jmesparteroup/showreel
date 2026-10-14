// Bar 4, MORPH: the line curls into a circle, then becomes triangle, square and hexagon.
import { CX, CY, CRUSH, CIRCLE_R, SHAPE_R } from '../shared.js';

export const cues = [5.95, 6.45, 6.95, 7.45];

const L = CRUSH.x1 - CRUSH.x0; // 1476 = 2π · 235

export function shapeAt(t, api) {
  const { spring } = api.ease;
  const g = api.geom;
  const curlU = spring(t - 5.95, 16);
  const a = spring(t - 6.45, 20), b = spring(t - 6.95, 20), c = spring(t - 7.45, 20);
  const circle = g.circle(CX, CY, CIRCLE_R);
  const tri = g.polygon(CX, CY, 300, 3);
  const sq = g.polygon(CX, CY, SHAPE_R, 4, -Math.PI / 4);
  const hex = g.polygon(CX, CY, SHAPE_R, 6);
  if (c > 0) return { pts: g.morph(sq, hex, c, { closed: true }), closed: true };
  if (b > 0) return { pts: g.morph(tri, sq, b, { closed: true }), closed: true };
  // The triangle turns 120 degrees as it forms, which lands it back on its own symmetry.
  if (a > 0) return { pts: g.rotate(g.morph(circle, tri, a, { closed: true }), CX, CY, (2 * Math.PI / 3) * a), closed: true };
  // Curvature grows while the length stays 1476, so the line closes exactly into the circle.
  const k = (curlU * 2 * Math.PI) / L;
  return { pts: g.curl(CX, CY + CIRCLE_R * curlU, L, k), closed: curlU >= 1 };
}

export function draw(t, api) {
  const { local } = api.clock;
  const p = api.pen('paper');
  p.bg();
  const { pts, closed } = shapeAt(t, api);
  if (closed) {
    p.fill(pts, { color: 'accent', progress: local(t, 6.45, 1.0), id: 'hatch' });
    p.fill(pts, { color: 'accent', angle: -Math.PI / 4, progress: local(t, 7.45, 0.45), id: 'cross' });
  }
  p.stroke(pts, { closed, width: 3.5, id: 'rail' });
  if (t > 7.75) api.rest({ x: CX - SHAPE_R, y: CY - SHAPE_R, w: 2 * SHAPE_R, h: 2 * SHAPE_R });
  api.labels(p);
  p.flush();
}
