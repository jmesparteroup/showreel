// Bar 10, LIGHT: a scan line turns the blueprint into the hologram; the ring lights up, retracts and unrolls.
import { CX, CY, RAILS, HEIGHTS } from '../shared.js';
import { ringGeometry, drawBars } from './09.js';

export const cues = [17.95, 18.45, 18.95, 19.45];
export const sounds = [{ t: 18.0, kind: 'sweep' }, { t: 18.5, kind: 'type', count: 10 }, { t: 19.0, kind: 'press' }, { t: 19.8, kind: 'whoosh' }];

export function draw(t, api) {
  const { spring, expoInOut } = api.ease;
  const { local } = api.clock;
  const unroll = spring(t - 19.45, 18);

  const lit = i => {
    const j = ((t - 18.45) / 0.5) * 30;
    return Math.abs(i - j) < 1.5 ? 1 : HEIGHTS[i] / 100;
  };
  const len = i => 1 - spring(t - 18.95 - i * 0.006, 20);
  const geo = ringGeometry(api, { bend: 1, move: 1, len });
  const drawScene = p => {
    if (unroll > 0) {
      // The circle opens at its left point and unrolls into a 1320 px line.
      const n = 256;
      const circle = api.geom.circle(CX, CY, 180, n);
      const open = [...circle.slice((3 * n) / 4), ...circle.slice(0, (3 * n) / 4 + 1)];
      const line = api.geom.line(RAILS.x0, CY, RAILS.x1, CY, n + 1);
      p.stroke(api.geom.morph(open, line, unroll, { n: n + 1 }), { width: 4, id: 'base' });
    } else if (p.name === 'hologram') {
      drawBars(p, api, t, geo, { lit });
    } else drawBars(p, api, t, geo);
    api.labels(p);
  };

  if (t < 18.45) {
    // One horizontal scan line sweeps down: above it is the hologram.
    const y = 1080 * expoInOut(local(t, 17.95, 0.5));
    api.split([[0, 0], [1920, 0], [1920, y], [0, y]], 'blueprint', 'hologram', drawScene);
    const s = api.pen('hologram');
    s.stroke([[0, y], [1920, y]], { width: 3, id: 'scan' });
    return;
  }
  const p = api.pen('hologram');
  p.bg();
  drawScene(p);
}
