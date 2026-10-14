// Kiln & Co.: a clay circle becomes a pot, the pot floods the frame with glaze,
// splits into the studio's three steps, and comes back round to the circle.
// 9:16, 30 fps, 100 BPM, 4 bars of 2.4 s.

const CX = 540, POT_Y = 820, R = 300;
const STEPS = [['WHEEL', 12], ['GLAZE', 48], ['FIRE', 1240]];
const XS = [250, 540, 830];
const HEIGHTS = [0.7, 1, 0.85];

// Pot silhouette: half-widths down its height, from the rim to the foot.
const PROFILE = [[-1, 0.42], [-0.86, 0.33], [-0.62, 0.38], [-0.2, 0.84], [0.3, 0.96], [0.74, 0.7], [1, 0.5]];
function pot(cx, cy, s, sx = 1, sy = 1) {
  const h = 340 * s * sy, w = 300 * s * sx;
  const right = PROFILE.map(([y, k]) => [cx + k * w, cy + y * h]);
  const left = PROFILE.map(([y, k]) => [cx - k * w, cy + y * h]).reverse();
  return [...right, ...left];
}
const rect = (cx, base, w, h) => [[cx - w / 2, base - h], [cx + w / 2, base - h], [cx + w / 2, base], [cx - w / 2, base]];

let cache;
function words(api) {
  if (cache?.fonts === api.fonts) return cache;
  const { layout, fit } = api.type;
  const size = fit(api.fonts.display, 'KILN & CO.', 780);
  cache = {
    fonts: api.fonts,
    mark: layout(api.fonts.display, 'KILN & CO.', { size, x: CX, y: 1470, align: 'center' }),
    tag: layout(api.fonts.label, 'CERAMICS STUDIO', { size: 30, x: CX, y: 1550, tracking: 0.3, align: 'center' }),
    steps: STEPS.map(([s], i) => layout(api.fonts.label, s, { size: 34, x: XS[i], y: 1330, tracking: 0.2, align: 'center' })),
  };
  return cache;
}

const typed = (p, lay, n, o) => {
  const c = lay.glyphs.slice(0, Math.max(0, Math.floor(n))).flatMap(g => g.contours);
  if (c.length) p.fill(c, { mode: 'solid', ...o });
};

// The opening frame, also the closing one: dotted circle, wordmark, tag line.
function opening(p, api, { r = R, dots = 1, mark = 10, tag = 15 }) {
  const W = words(api);
  const c = api.geom.circle(CX, POT_Y, r, 160);
  p.fill(c, { progress: dots, id: 'dots' });
  p.stroke(c, { closed: true, id: 'rim' });
  const n = Math.floor(mark);
  if (n > 0) p.type(W.mark.glyphs.slice(0, n), { id: 'mark' });
  typed(p, W.tag, tag, { color: 'line', id: 'tag' });
}

function bar1(t, api) {
  const { spring, expoIn } = api.ease;
  const { local } = api.clock;
  const p = api.pen('KILN');
  p.bg();
  const W = words(api);
  // 0.0 the tag line un-types; 0.6 the circle throws into a pot; 1.2 it spins on the wheel; 1.8 the wordmark drops away.
  const throwU = spring(t - 0.55, 16);
  const spin = spring(t - 1.15, 14);
  const sx = 1 - 0.45 * Math.sin(Math.PI * spin);
  const circle = api.geom.circle(CX, POT_Y, R, 160);
  const shape = throwU > 0 ? api.geom.morph(circle, pot(CX, POT_Y, 1, sx), throwU, { closed: true }) : circle;
  p.fill(shape, { id: 'dots' });
  p.stroke(shape, { closed: true, id: 'rim' });
  const drop = expoIn(local(t, 1.75, 0.35)) * 700;
  p.type(W.mark.glyphs.map(g => ({ ...g, contours: g.contours.map(k => k.map(([x, y]) => [x, y + drop])) })), { id: 'mark' });
  typed(p, W.tag, 15 * (1 - local(t, 0, 0.4)), { color: 'line', id: 'tag' });
  if (t <= 0) api.rest({ x: 150, y: 480, w: 780, h: 1100 });
  api.labels(p);
  p.flush();
}

function vases(t, api) {
  const { spring, lerp } = api.ease;
  const split = spring(t - 2.95, 16);
  const grow = spring(t - 3.55, 16);
  return XS.map((x, i) => {
    const u = spring(t - 2.95 - i * 0.05, 16);
    const s = lerp(1, 0.42, split);
    const sy = lerp(1, HEIGHTS[i], grow);
    const base = POT_Y + 340;
    return { cx: lerp(CX, x, u), cy: lerp(POT_Y, base - 340 * s * sy, split), s, sy };
  });
}

function bar2(t, api) {
  const { expoIn } = api.ease;
  const { local } = api.clock;
  const W = words(api);
  // 2.4 the pot floods the frame with glaze; 3.0 it splits into three; 3.6 they find their heights; 4.2 their names type on.
  const draw = p => {
    for (const [i, v] of vases(t, api).entries()) {
      const shape = pot(v.cx, v.cy, v.s, 1, v.sy);
      p.fill(shape, { id: `vf${i}` });
      p.stroke(shape, { closed: true, id: `v${i}` });
    }
    W.steps.forEach((lay, i) => typed(p, lay, lay.glyphs.length * local(t, 4.15 + i * 0.08, 0.3), { color: 'line', id: `step${i}` }));
    api.labels(p);
  };
  if (t < 2.85) {
    const k = 1 + 6 * expoIn(local(t, 2.35, 0.5));
    api.split(pot(CX, POT_Y, k), 'KILN', 'GLAZE', draw);
  } else {
    const p = api.pen('GLAZE');
    p.bg();
    draw(p);
    p.flush();
  }
  if (t > 4.5) api.rest({ x: 150, y: 600, w: 780, h: 760 });
}

function bar3(t, api) {
  const { spring, lerp } = api.ease;
  const { local } = api.clock;
  const W = words(api);
  const p = api.pen('GLAZE');
  p.bg();
  // 4.8 the pots square up into bars; 5.4 their numbers count up; 6.0 names and numbers retract; 6.6 the bars fall into one line.
  const square = spring(t - 4.75, 16);
  const count = spring(t - 5.35, 14);
  const out = local(t, 5.95, 0.4);
  const flat = spring(t - 6.55, 16);
  const base = POT_Y + 340;
  vases(9, api).forEach((v, i) => {
    const hgt = 340 * 2 * v.s * v.sy;
    const bar = rect(XS[i], base, 200, hgt);
    const line = rect(lerp(XS[i], CX, flat), lerp(base, POT_Y, flat), lerp(200, 290, flat), lerp(hgt, 4, flat));
    const shape = flat > 0 ? api.geom.morph(bar, line, flat, { closed: true }) : api.geom.morph(pot(v.cx, v.cy, v.s, 1, v.sy), bar, square, { closed: true });
    p.fill(shape, { id: `vf${i}` });
    p.stroke(shape, { closed: true, id: `v${i}` });
    const lay = W.steps[i];
    typed(p, lay, lay.glyphs.length * (1 - out), { color: 'line', id: `step${i}` });
    if (count > 0 && out < 1) {
      const num = String(Math.round(STEPS[i][1] * count)) + (i === 2 ? '°' : '');
      const nl = api.type.layout(api.fonts.display, num, { size: 64, x: XS[i], y: base - hgt - 30, align: 'center' });
      typed(p, nl, nl.glyphs.length * (1 - out), { color: 'accent', id: `num${i}` });
    }
  });
  api.labels(p);
  p.flush();
}

function bar4(t, api) {
  const { spring, expoIn } = api.ease;
  const { local } = api.clock;
  // 7.2 the line curls into a circle; 7.8 the circle floods back to clay; 8.4 its dots build; 9.0 the wordmark types back on.
  const L = 3 * 290;
  const curlU = spring(t - 7.15, 16);
  const grow = spring(t - 7.75, 16);
  const r0 = L / (2 * Math.PI);
  const r = r0 + (R - r0) * grow;
  const shape = curlU < 1
    ? api.geom.curl(CX, POT_Y + r0 * curlU, L, (curlU * 2 * Math.PI) / L)
    : api.geom.circle(CX, POT_Y, r, 160);
  const draw = p => {
    if (p.name === 'KILN') opening(p, api, { r, dots: local(t, 8.35, 0.5), mark: 10 * local(t, 8.95, 0.4), tag: 15 * local(t, 9.2, 0.3) });
    else p.stroke(shape, { closed: curlU >= 1, id: 'rim' });
    api.labels(p);
  };
  if (t < 7.75) { const p = api.pen('GLAZE'); p.bg(); draw(p); p.flush(); return; }
  if (t < 8.3) {
    const k = R + 1700 * expoIn(local(t, 7.75, 0.5));
    api.split(api.geom.circle(CX, POT_Y, k, 96), 'GLAZE', 'KILN', draw);
    return;
  }
  const p = api.pen('KILN');
  p.bg();
  draw(p);
  if (t >= 9.5) api.rest({ x: 150, y: 480, w: 780, h: 1100 });
  p.flush();
}

const BAR = 2.4;
const BARS = [bar1, bar2, bar3, bar4];

export default {
  slug: 'kiln-and-co',
  bpm: 100,
  bars: 4,
  beatsPerBar: 4,
  fps: 30,
  size: [1080, 1920],
  barNames: ['THROW', 'GLAZE', 'STEPS', 'FIRE'],
  // The first beat's moves start on t = 0 so frame 0 is the still opening.
  cues: [0, ...Array.from({ length: 15 }, (_, k) => (k + 1) * 0.6 - 0.05)],
  sounds: [
    { t: 0, kind: 'type', count: 6, interval: 0.06 }, { t: 0.6, kind: 'whoosh' }, { t: 1.2, kind: 'sweep' }, { t: 1.9, kind: 'whoosh', gain: 0.6 },
    { t: 2.75, kind: 'whoosh' }, { t: 3.0, kind: 'pop' }, { t: 3.6, kind: 'pop' }, { t: 4.2, kind: 'type', count: 12, interval: 0.04 },
    { t: 4.8, kind: 'press' }, { t: 5.4, kind: 'type', count: 10, interval: 0.05 }, { t: 6.0, kind: 'click' }, { t: 6.6, kind: 'press' },
    { t: 7.2, kind: 'sweep' }, { t: 8.2, kind: 'whoosh' }, { t: 8.4, kind: 'type', count: 8, interval: 0.06 }, { t: 9.0, kind: 'type', count: 10, interval: 0.04 },
  ],
  draw(ctx, t, api) {
    BARS[Math.min(BARS.length - 1, Math.floor((t + 0.05) / BAR))](t, api);
  },
};
