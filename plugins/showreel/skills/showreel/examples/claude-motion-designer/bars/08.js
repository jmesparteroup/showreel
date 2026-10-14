// Bar 8, PANEL: the cube unfolds on its hinges into a cross, and the six squares become a dashboard.
import { CX, CY, CUBE_EDGE, PANELS, HEIGHTS, CHART, NAMES, typed } from '../shared.js';

export const cues = [13.95, 14.45, 14.95, 15.45];

const F = 1400;
// Face order matches the panel each square becomes.
const FACES = ['top', 'left', 'front', 'right', 'bottom', 'back'];
// Timeline track; names alternate between two rows so neighbours never collide.
export const TL = { x0: 410, w: 1100 };
const PANEL_OF = { top: 'header', left: 'sidebar', front: 'chart', right: 'tileB', bottom: 'tileA', back: 'timeline' };

function quad3(face, E, phi, phi2) {
  const h = E / 2, s = Math.sin(phi), c = Math.cos(phi);
  const z0 = -h;
  switch (face) {
    case 'front': return [[-h, -h, z0], [h, -h, z0], [h, h, z0], [-h, h, z0]];
    case 'top': return [[-h, -h, z0], [h, -h, z0], [h, -h - E * s, z0 + E * c], [-h, -h - E * s, z0 + E * c]];
    case 'bottom': return [[-h, h, z0], [h, h, z0], [h, h + E * s, z0 + E * c], [-h, h + E * s, z0 + E * c]];
    case 'left': return [[-h, -h, z0], [-h, h, z0], [-h - E * s, h, z0 + E * c], [-h - E * s, -h, z0 + E * c]];
    case 'right': return [[h, -h, z0], [h, h, z0], [h + E * s, h, z0 + E * c], [h + E * s, -h, z0 + E * c]];
    case 'back': {
      // Hinged to the bottom face's far edge; folded, it runs back up the cube's rear.
      const th = phi - Math.PI / 2 + phi2;
      const ey = h + E * s, ez = z0 + E * c;
      return [[-h, ey, ez], [h, ey, ez], [h, ey + E * Math.sin(th), ez + E * Math.cos(th)], [-h, ey + E * Math.sin(th), ez + E * Math.cos(th)]];
    }
  }
}

const area = q => q.reduce((a, p, i) => { const n = q[(i + 1) % q.length]; return a + p[0] * n[1] - n[0] * p[1]; }, 0) / 2;

// Corners in a fixed order (top-left, top-right, bottom-right, bottom-left) so squares map onto rects.
function corners(q) {
  const cx = q.reduce((a, p) => a + p[0], 0) / 4, cy = q.reduce((a, p) => a + p[1], 0) / 4;
  const by = k => q.reduce((best, p) => (k(p, cx, cy) > k(best, cx, cy) ? p : best));
  return [by((p, x, y) => -(p[0] - x) - (p[1] - y)), by((p, x, y) => (p[0] - x) - (p[1] - y)), by((p, x, y) => (p[0] - x) + (p[1] - y)), by((p, x, y) => -(p[0] - x) + (p[1] - y))];
}
const rect = ([x, y, w, h]) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

export function panelQuads(t, api) {
  const { spring, lerp } = api.ease;
  const g = api.geom;
  const unfold = spring(t - 13.95, 18);
  const E = CUBE_EDGE * lerp(1, 0.55, unfold);
  const shift = (E / 2) * unfold; // keeps the cross centred: its column runs from -1.5E to 2.5E
  return FACES.map((face, i) => {
    const phi = (Math.PI / 2) * spring(t - 13.95 - 0.04 * i, 18);
    const phi2 = (Math.PI / 2) * spring(t - 14.1, 18);
    const project = q => q.map(v => g.project(v, { cx: CX, cy: CY - shift, f: F }));
    const q = project(quad3(face, E, phi, phi2));
    const flat = project(quad3(face, E, Math.PI / 2, Math.PI / 2));
    const hidden = face !== 'front' && Math.sign(area(q)) !== Math.sign(area(flat));
    const u = spring(t - 14.45 - 0.03 * i, 18);
    const target = rect(PANELS[PANEL_OF[face]]);
    const from = corners(q);
    const pts = u > 0 ? from.map((p, k) => [lerp(p[0], target[k][0], u), lerp(p[1], target[k][1], u)]) : q;
    return { face, panel: PANEL_OF[face], pts, hidden: hidden && u === 0 };
  });
}

export function draw(t, api) {
  const p = api.pen('blueprint');
  p.bg();
  panelQuads(t, api).forEach((q, i) => p.stroke(q.pts, { closed: true, dashed: q.hidden, width: q.hidden ? 3 : 3.5, id: `panel${i}` }));
  const fill = k => api.ease.spring(t - 14.95 - k * 0.06, 18);
  drawDashboard(p, api, t, { fill, count: api.ease.spring(t - 15.45, 14) });
  if (t > 15.5) api.rest({ x: 330, y: 150, w: 1260, h: 780 });
  api.labels(p);
}

// Dashboard contents. `fill(k)` reveals panel k (0..5); `count` rolls the counters;
// `bars(i)` overrides how chart bar i is drawn (bar 9 uses it).
export function drawDashboard(p, api, t, { fill, count, bars, knob = 0, ring = 0 }) {
  const font = api.fonts;
  const L = (str, x, y, o = {}) => api.type.layout(o.font ?? font.xbold, str, { size: o.size ?? 24, x, y, tracking: o.tracking ?? 0.2, align: o.align ?? 'left' });
  const show = (lay, u, color = 'line', id) => typed(p, lay, lay.glyphs.length * u, { color, id });

  // Header: title, BARS / RING switch, LIGHT toggle.
  const h = fill(0);
  if (h > 0.3) {
    show(L('CLAUDE — MOTION REEL', 362, 205, { size: 28 }), h, 'line', 'title');
    const seg = [[1150, 172, 110, 46, 'BARS'], [1260, 172, 110, 46, 'RING']];
    seg.forEach(([x, y, w, hh, s], k) => {
      const box = api.geom.roundRect(x, y, w * h, hh, 6, 2);
      if ((k === 1) === (ring > 0.5)) p.fill(box, { color: 'accent', spacing: 5, id: `seg${k}f` });
      p.stroke(box, { closed: true, width: 2.5, id: `seg${k}` });
      show(L(s, x + w / 2, y + 32, { align: 'center', tracking: 0.14 }), h, 'line', `segt${k}`);
    });
    show(L('LIGHT', 1392, 205, { tracking: 0.14 }), h, 'line', 'lightt');
    const pill = api.geom.roundRect(1480, 175, 80 * h, 40, 20, 6);
    p.stroke(pill, { closed: true, width: 2.5, id: 'pill' });
    if (h > 0.9) p.fill(api.geom.circle(1500 + 40 * knob, 195, 13, 32), { mode: 'solid', color: knob > 0.5 ? 'accent' : 'line', id: 'knob' });
  }

  // Chart: 30 bars, one per second of the film.
  const c = fill(1);
  if (c > 0) {
    const pitch = (CHART.x1 - CHART.x0) / 30;
    if (!bars) {
      p.stroke([[CHART.x0, CHART.base], [CHART.x0 + (CHART.x1 - CHART.x0) * c, CHART.base]], { width: 3, id: 'base' });
      HEIGHTS.forEach((v, i) => {
        const grow = api.ease.spring(t - 14.95 - 0.06 - i * 0.008, 20);
        if (grow <= 0) return;
        const hgt = (v / 100) * CHART.max * grow;
        const r = api.geom.roundRect(CHART.x0 + i * pitch + 5, CHART.base - hgt, pitch - 10, hgt, 0.01, 1);
        p.fill(r, { color: 'line', spacing: 6, id: `barf${i}` });
        p.stroke(r, { closed: true, width: 2.5, id: `bar${i}` });
      });
    } else bars(pitch);
  }

  // Tiles and sidebar: counters.
  const nums = [[fill(2), 120, 'BPM', 610, 748], [fill(3), 60, 'BEATS', 1130, 748], [fill(4), 1800, 'FRAMES', 358, 345], [fill(4), 0, 'CUTS', 358, 475]];
  nums.forEach(([u, target, label, x, y], k) => {
    if (u <= 0) return;
    const side = k >= 2;
    show(L(String(Math.round(target * count)), x, y, { font: font.black, size: 48, tracking: 0.02 }), u, 'line', `num${k}`);
    show(L(label, side ? x : x + 150, side ? y + 36 : y, { tracking: 0.2 }), u, 'accent', `lab${k}`);
  });

  // Timeline: the 15 bar names with a keyframe diamond on each.
  const tl = fill(5);
  if (tl > 0) {
    p.stroke([[TL.x0, 835], [TL.x0 + TL.w * tl, 835]], { width: 2.5, id: 'track' });
    NAMES.forEach((n, i) => {
      const x = TL.x0 + (i * TL.w) / 14;
      if ((x - TL.x0) / TL.w > tl) return;
      p.fill([[x, 826], [x + 9, 835], [x, 844], [x - 9, 835]], { mode: 'solid', color: 'accent', id: `dia${i}` });
      show(L(n, x, i % 2 ? 908 : 875, { font: font.semi, align: 'center', tracking: 0.14 }), 1, 'line', `name${i}`);
    });
  }
}
