// Bar 13, DRUM: the globe becomes a drum; its head presses on the beat; the mascot runs in and strikes it.
import { CX, CY, LATS, DRUM, GLOBE_R, TILT, MASCOT_DRUM_X, NAMES, typed } from '../shared.js';
import { drawGlobe, spinAt, strokeDepth } from './12.js';

export const cues = [23.95, 24.45, 24.95, 25.45];
export const sounds = [{ t: 24.0, kind: 'press' }, { t: 24.5, kind: 'hit' }, { t: 24.95, kind: 'type', count: 6, interval: 0.083 }, { t: 25.0, kind: 'hit' }, { t: 25.5, kind: 'hit' }];

const N = 160;
const HITS = [24.5, 25.0, 25.5];
const LIGHT = (() => { const v = [-0.45, -0.55, -0.7]; const l = Math.hypot(...v); return v.map(c => c / l); })();

export function pressAt(t, api) {
  const { spring, expoIn } = api.ease;
  return HITS.reduce((a, h) => a + expoIn(api.clock.local(t, h - 0.05, 0.05)) * (1 - spring(t - h, 30)), 0);
}

// Ring k of the drum: latitude k of the globe pulled to the drum's radius and height.
export function drumRing(api, k, { dr = 1, press = 0, rx = null, tilt = TILT, shrink = 0 }) {
  const { lerp } = api.ease;
  const lat = LATS[k];
  const r = lerp(GLOBE_R * Math.cos(lat), DRUM.r, dr) * (1 - shrink);
  let y = lerp(-GLOBE_R * Math.sin(lat), (-DRUM.h / 2) * (Math.sin(lat) / Math.sin(LATS[0])), dr);
  if (k === 0) y += 18 * press;
  return Array.from({ length: N + 1 }, (_, i) => {
    const a = Math.PI + (i / N) * 2 * Math.PI;
    return api.geom.rotX([(rx ?? r) * Math.cos(a), y, r * Math.sin(a)], tilt);
  });
}

export const MASCOT_Y = CY + DRUM.h / 2 * Math.cos(TILT) + DRUM.r * Math.sin(TILT);

export function draw(t, api) {
  const { spring, seq, expoOut, lerp } = api.ease;
  const { local } = api.clock;
  const p = api.pen('hologram');
  p.bg();
  const dr = spring(t - 23.95, 18);
  const press = pressAt(t, api);

  if (dr < 1) {
    // Meridians and the globe's shading retract while the latitudes become drum hoops.
    drawGlobe(p, api, t, { spin: spinAt(t, api), meridians: 1 - spring(t - 23.95, 22), shade: 1 - local(t, 23.95, 0.3), outline: 1 - dr, lats: [] });
  }
  LATS.forEach((_, k) => strokeDepth(p, drumRing(api, k, { dr, press }), `lat${k}`));

  // The drum's sides and their scan-line shading.
  const topY = CY + api.geom.rotX([DRUM.r, -DRUM.h / 2 + 18 * press, 0], TILT)[1];
  const botY = CY + api.geom.rotX([DRUM.r, DRUM.h / 2, 0], TILT)[1];
  const side = local(t, 24.1, 0.35);
  if (side > 0) {
    p.stroke([[CX - DRUM.r, topY], [CX - DRUM.r, topY + (botY - topY) * side]], { width: 4, id: 'sideL' });
    p.stroke([[CX + DRUM.r, topY], [CX + DRUM.r, topY + (botY - topY) * side]], { width: 4, id: 'sideR' });
    const bottomFront = drumRing(api, 8, {}).slice(0, N / 2 + 1).map(([x, y]) => [CX + x, CY + y]).reverse();
    p.fill([[CX - DRUM.r, topY], [CX + DRUM.r, topY], ...bottomFront], {
      progress: side, id: 'sideshade',
      lit: x => { const nx = (x - CX) / DRUM.r; return Math.max(0.1, nx * LIGHT[0] - Math.sqrt(Math.max(0, 1 - nx * nx)) * LIGHT[2]) * 0.7; },
    });
  }

  // A ring spreads across the head on each hit.
  for (const h of HITS) {
    const u = local(t, h, 0.4);
    if (u <= 0 || u >= 1) continue;
    const r = DRUM.r * expoOut(u);
    const ring = Array.from({ length: 97 }, (_, i) => { const a = (i / 96) * 2 * Math.PI; return api.geom.rotX([r * Math.cos(a), -DRUM.h / 2 + 18 * press, r * Math.sin(a)], TILT); });
    p.stroke(ring.map(([x, y]) => [CX + x, CY + y]), { color: 'accent', width: 3, id: `hit${h}` });
  }

  // The mascot runs in from the left edge and strikes the head on 25.5.
  if (t >= 24.95) {
    const x = seq(t, -200, [{ at: 24.95, to: MASCOT_DRUM_X, w: 16 }]) + 30 * (spring(t - 25.42, 40) - spring(t - 25.55, 30));
    api.mascot(p, { x, y: MASCOT_Y, pose: MASCOT_DRUM_X - x > 3 ? 'run' : 'stand', t });
  }

  // The 15 bar names print round the drum's side, turning with it.
  drawNames(p, api, t, local(t, 25.45, 0.3), 0);
  api.labels(p);
}

export function drawNames(p, api, t, u, retract) {
  const n = Math.floor(15 * u);
  const spin = (t - 25.45) * 0.8;
  for (let i = 0; i < n; i++) {
    const a = (i / 15) * 2 * Math.PI + spin;
    const [x, , z] = api.geom.rotX([DRUM.r * Math.sin(a), 0, -DRUM.r * Math.cos(a)], TILT);
    const k = Math.cos(a);
    if (z > -40 || k < 0.15) continue;
    const lay = api.type.layout(api.fonts.xbold, NAMES[i], { size: 24, x: CX + x, y: CY + 30, tracking: 0.2, align: 'center' });
    const squeezed = { glyphs: lay.glyphs.map(g => ({ ...g, contours: g.contours.map(c => c.map(([px, py]) => [CX + x + (px - CX - x) * k, py])) })) };
    typed(p, squeezed, squeezed.glyphs.length * (1 - retract), { id: `name${i}` });
  }
}
