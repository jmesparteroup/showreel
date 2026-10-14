// Geometry handed from one bar to the next. Each bar starts from the state
// the previous one ends in; the values here are those boundary states.

export const CX = 960, CY = 540;
export const NAMES = ['DRAFT', 'TYPE', 'CURVE', 'MORPH', 'TILE', 'SOLID', 'GEAR', 'PANEL', 'DATA', 'LIGHT', 'WAVE', 'GLOBE', 'DRUM', 'FORM', 'END'];

export const RAIL = { x0: 150, x1: 1770 };          // frame-0 rail, 1620 wide
export const MASCOT_X = 1560;
export const RAILS = { x0: 300, x1: 1620, gap: 300 }; // bars 1-2 and 14
export const CRUSH = { x0: 222, x1: 1698 };         // 1476 = 2π · 235: the curl in bar 4 closes exactly
export const CIRCLE_R = 235, SHAPE_R = 270;
export const CELL = 96, CELL_DRAW = 90;             // honeycomb pitch radius and drawn radius
export const CUBE_EDGE = 330;                       // corner-on silhouette radius 330 · √(2/3) ≈ 270
export const CORNER_ON = { x: Math.atan(1 / Math.SQRT2), y: Math.PI / 4, z: 0 };
export const GEAR_PITCH = 208;
export const HEIGHTS = [42, 30, 36, 44, 50, 46, 52, 62, 50, 56, 62, 72, 60, 66, 58, 76, 56, 62, 68, 74, 70, 78, 86, 94, 100, 93, 97, 90, 80, 50];
export const PANELS = {
  header: [330, 150, 1260, 90],
  sidebar: [330, 270, 220, 500],
  chart: [580, 270, 1010, 380],
  tileA: [580, 680, 490, 90],
  tileB: [1100, 680, 490, 90],
  timeline: [330, 800, 1260, 130],
};
export const CHART = { x0: 610, x1: 1560, base: 630, max: 320 };
export const RING_R = 110, RING_BIG = 180, RING_BAR = 0.35;
export const GLOBE_R = 270, TILT = (20 * Math.PI) / 180;
export const LATS = [72, 54, 36, 18, 0, -18, -36, -54, -72].map(d => (d * Math.PI) / 180);
export const DRUM = { r: 270, h: 300 };

export const clamp01 = u => Math.min(1, Math.max(0, u));

// First u of a polyline by arc length; draws a line on from its start.
export function partial(pts, u) {
  if (u <= 0) return null;
  if (u >= 1) return pts;
  const seg = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); total += d; }
  let left = total * u;
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (seg[i - 1] >= left) {
      const k = left / seg[i - 1];
      out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k]);
      return out;
    }
    left -= seg[i - 1];
    out.push(pts[i]);
  }
  return out;
}

// The middle u of a polyline; draws a line out from its centre both ways.
export function middle(pts, u) {
  if (u <= 0) return null;
  const n = pts.length - 1;
  const a = Math.floor((n * (1 - u)) / 2), b = Math.ceil((n * (1 + u)) / 2);
  return pts.slice(a, b + 1);
}

export const mapGlyph = (g, fn) => ({ ...g, contours: g.contours.map(c => c.map(fn)) });
export const shiftGlyph = (g, dx, dy) => mapGlyph(g, ([x, y]) => [x + dx, y + dy]);

let titleCache = null;

// Frame 0, laid out from the fonts once. Bars 1, 14 and 15 all draw from this.
export function title(api) {
  if (titleCache?.fonts === api.fonts) return titleCache;
  const { fit, layout, bounds } = api.type;
  const size = fit(api.fonts.black, 'CLAUDE', 1500);
  const b0 = bounds(layout(api.fonts.black, 'CLAUDE', { size, x: CX, y: 0, align: 'center' }).glyphs);
  const baseline = CY - (b0.y0 + b0.y1) / 2;
  const glyphs = layout(api.fonts.black, 'CLAUDE', { size, x: CX, y: baseline, align: 'center' }).glyphs;
  const b = bounds(glyphs);
  const small = (str, x, y, align) => layout(api.fonts.xbold, str, { size: 26, x, y, tracking: 0.3, align });
  const railY = b.y0 - 96;
  titleCache = {
    fonts: api.fonts,
    size, baseline, top: b.y0, bottom: b.y1, glyphs, railY,
    intro: small('INTRODUCING', CX, b.y0 - 30, 'center'),
    sub: small('A MOTION DESIGNER', CX, b.y1 + 64, 'center'),
    director: layout(api.fonts.xbold, 'CREATIVE DIRECTOR', { size: 24, x: 1395, y: railY - 24, tracking: 0.2, align: 'right' }),
  };
  return titleCache;
}

// Solid fill of the first n glyphs of a laid-out string.
export function typed(p, lay, n, { color = 'line', id } = {}) {
  const contours = lay.glyphs.slice(0, Math.max(0, Math.floor(n))).flatMap(g => g.contours);
  if (contours.length) p.fill(contours, { mode: 'solid', color, id });
}

// The opening layout, parameterised by everything that moves out of or into it.
export function drawTitle(p, api, t, s) {
  const T = title(api);
  const railY = s.railY ?? T.railY;
  if (s.mascotX !== undefined && s.mascotX < 2300)
    api.mascot(p, { x: s.mascotX, y: railY - 2, pose: s.pose ?? 'stand', t, facing: 1 });
  p.stroke(api.geom.line(s.railX0 ?? RAIL.x0, railY, s.railX1 ?? RAIL.x1, railY, 64), { width: 3.5, id: 'rail' });
  const f = s.squash ?? 1;
  if (f > 0.01) {
    const yF = T.baseline + 26;
    const glyphs = f === 1 ? T.glyphs : T.glyphs.map(g => mapGlyph(g, ([x, y]) => [x, yF - (yF - y) * f]));
    p.type(glyphs, { progress: s.hatch ?? 1, id: 'claude', color: s.claudeColor ?? 'line' });
  }
  typed(p, T.intro, s.intro ?? 11, { id: 'intro' });
  typed(p, T.sub, s.sub ?? 17, { id: 'sub' });
  typed(p, T.director, s.director ?? 17, { id: 'director' });
  if (s.rest) api.rest({ x: RAIL.x0, y: railY - 200, w: RAIL.x1 - RAIL.x0, h: T.sub.glyphs[0].y - railY + 200 });
}
