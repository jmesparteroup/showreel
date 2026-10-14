// Bar 14, FORM: the drum turns front-on into two rails, CLAUDE assembles in light, and a scan line brings the paper back.
import { CX, CY, RAILS, DRUM, LATS, title, shiftGlyph, formRails, mascotForm } from '../shared.js';
import { drumRing, MASCOT_Y, drawNames } from './13.js';
import { strokeDepth } from './12.js';

export const cues = [25.95, 26.45, 26.95, 27.45];
export const sounds = [{ t: 26.0, kind: 'whoosh' }, { t: 26.5, kind: 'type', count: 6 }, { t: 27.0, kind: 'sweep' }, { t: 27.5, kind: 'whoosh' }];

export function draw(t, api) {
  const { spring, expoInOut, lerp } = api.ease;
  const { local } = api.clock;
  const T = title(api);
  const front = spring(t - 25.95, 20);
  const stretch = spring(t - 26.05, 20);
  const tilt = (20 * Math.PI / 180) * (1 - front);

  const scene = p => {
    const rails = formRails(t, api);
    if (t < 26.45) {
      // Hoops flatten into the rim nearest them; the rims become the rails.
      LATS.forEach((_, k) => {
        if (k === 0 || k === 8) return;
        const toY = k < 4 ? -DRUM.h / 2 : DRUM.h / 2;
        strokeDepth(p, drumRing(api, k, { tilt, rx: lerp(DRUM.r, (RAILS.x1 - RAILS.x0) / 2, stretch) }).map(([x, y, z]) => [x, lerp(y, toY, front), z]), `lat${k}`);
      });
      drawNames(p, api, t, 1, front);
      const side = 1 - stretch;
      if (side > 0.01) for (const sx of [-1, 1]) {
        const x = CX + sx * lerp(DRUM.r, 660, stretch);
        p.stroke([[x, CY - DRUM.h / 2 * side], [x, CY + DRUM.h / 2 * side]], { width: 4, id: `side${sx}` });
      }
    }
    const rx = lerp(DRUM.r, (RAILS.x1 - RAILS.x0) / 2, stretch);
    if (t < 26.45) {
      strokeDepth(p, drumRing(api, 0, { tilt, rx }).map(([x, y, z]) => [x, lerp(y, -DRUM.h / 2, front), z]), 'rail');
      strokeDepth(p, drumRing(api, 8, { tilt, rx }).map(([x, y, z]) => [x, lerp(y, DRUM.h / 2, front), z]), 'rail2');
    } else {
      p.stroke(api.geom.line(rails.x0, rails.top, rails.x1, rails.top, 64), { width: 3.5, id: 'rail' });
      if (rails.bot - rails.top > 0.5) p.stroke(api.geom.line(rails.x0, rails.bot, rails.x1, rails.bot, 64), { width: 3.5, id: 'rail2' });
    }

    // CLAUDE assembles between the rails, letters arriving from the right.
    if (t >= 26.45) {
      const glyphs = T.glyphs.map((g, i) => shiftGlyph(g, (1 - spring(t - 26.45 - (5 - i) * 0.05, 24)) * 1500, 0));
      p.type(glyphs, { id: 'claude', progress: p.name === 'paper' ? 0.85 : 1 });
    }

    // The mascot steps up onto the top rail, then runs along it.
    const hop = spring(t - 26.05, 16);
    const m = mascotForm(t, api);
    const y = t < 27.45 ? lerp(MASCOT_Y, CY - DRUM.h / 2, hop) - 70 * Math.sin(Math.PI * hop) : rails.top;
    api.mascot(p, { x: m.x, y: y - 2, pose: m.pose, t });
    api.labels(p);
  };

  if (t < 26.95) {
    const p = api.pen('hologram');
    p.bg();
    scene(p);
    return;
  }
  if (t < 27.45) {
    // One scan line sweeps up: below it is paper again.
    const y = 1080 * (1 - expoInOut(local(t, 26.95, 0.5)));
    api.split([[0, y], [1920, y], [1920, 1080], [0, 1080]], 'hologram', 'paper', scene);
    api.pen('hologram').stroke([[0, y], [1920, y]], { width: 3, id: 'scan' });
    return;
  }
  const p = api.pen('paper');
  p.bg();
  scene(p);
  p.flush();
}
