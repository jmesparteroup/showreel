// Bar 12, GLOBE: meridians draw in, the globe turns on the beat, scan-line shading builds, a beat ring ticks.
import { CX, CY, GLOBE_R, TILT, LATS } from '../shared.js';

export const cues = [21.95, 22.45, 22.95, 23.45];
export const sounds = [{ t: 22.0, kind: 'type', count: 4, interval: 0.5 }, { t: 22.5, kind: 'sweep' }, { t: 23.0, kind: 'type', count: 12, interval: 0.03 }, { t: 23.5, kind: 'press' }];

const N = 160;
const LIGHT = (() => { const v = [-0.45, -0.55, -0.7]; const l = Math.hypot(...v); return v.map(c => c / l); })();

// A point on the globe; `squash` (bar 13) pulls latitudes towards the drum's shape.
export function spherePoint(api, lat, lon, { spin = 0, r = GLOBE_R, tilt = TILT } = {}) {
  const g = api.geom;
  const p = [r * Math.cos(lat) * Math.cos(lon), -r * Math.sin(lat), r * Math.cos(lat) * Math.sin(lon)];
  return g.rotX(g.rotY(p, spin), tilt);
}

// Draws a 3D polyline: front runs solid, back runs dashed and thinner.
export function strokeDepth(p, pts3, id, { width = 4, from = [CX, CY] } = {}) {
  let run = [], back = null, k = 0;
  const flush = () => {
    if (run.length > 1) p.stroke(run, { dashed: back, width: back ? width * 0.75 : width, id: `${id}_${k++}` });
    run = [];
  };
  for (const [x, y, z] of pts3) {
    const b = z > 0;
    if (back !== null && b !== back) { const last = run[run.length - 1]; flush(); run.push(last); }
    back = b;
    run.push([from[0] + x, from[1] + y]);
  }
  flush();
}

export function latitude(api, lat, opts = {}) {
  return Array.from({ length: N + 1 }, (_, i) => spherePoint(api, lat, Math.PI + (i / N) * 2 * Math.PI, opts));
}

export function drawGlobe(p, api, t, { spin = 0, meridians = 0, shade = 0, outline = 1, lats = LATS } = {}) {
  lats.forEach((lat, k) => strokeDepth(p, latitude(api, lat), `lat${k}`));
  if (meridians > 0)
    for (let m = 0; m < 12; m++) {
      const lon = (m / 12) * 2 * Math.PI;
      const pts = Array.from({ length: Math.round(N * meridians / 2) + 1 }, (_, i) => spherePoint(api, Math.PI / 2 - (i / (N / 2)) * Math.PI, lon, { spin }));
      strokeDepth(p, pts, `mer${m}`, { width: 3 });
    }
  if (shade > 0) {
    p.fill(api.geom.circle(CX, CY, GLOBE_R - 4, 128), {
      progress: shade, id: 'shade',
      lit: (x, y) => {
        const nx = (x - CX) / GLOBE_R, ny = (y - CY) / GLOBE_R;
        const nz = -Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
        return Math.max(0.1, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) * 0.85;
      },
    });
  }
  if (outline > 0) p.stroke(api.geom.circle(CX, CY, GLOBE_R, 192), { closed: true, width: 4, id: 'outline' });
}

export function spinAt(t, api) {
  let s = 0;
  for (let k = 0; k < 8; k++) s += (Math.PI / 6) * api.ease.spring(t - (21.95 + 0.5 * k), 30);
  return s;
}

export function drawTicks(p, api, t, u, retract = 0) {
  const now = api.clock.beatAt(t);
  const n = Math.ceil(60 * u);
  for (let i = 0; i < n; i++) {
    const a = (i / 60) * 2 * Math.PI - Math.PI / 2;
    const len = (i % 4 === 0 ? 26 : 14) * (1 - retract);
    if (len < 0.5) continue;
    p.stroke([[CX + 330 * Math.cos(a), CY + 330 * Math.sin(a)], [CX + (330 + len) * Math.cos(a), CY + (330 + len) * Math.sin(a)]], { color: i <= now ? 'accent' : 'line', width: 3, id: `tick${i}` });
  }
}

export function draw(t, api) {
  const { spring } = api.ease;
  const { local } = api.clock;
  const p = api.pen('hologram');
  p.bg();
  drawGlobe(p, api, t, { spin: spinAt(t, api), meridians: spring(t - 21.95, 16), shade: local(t, 22.45, 0.5) });
  drawTicks(p, api, t, local(t, 22.95, 0.4), spring(t - 23.45, 22));
  api.labels(p);
}
