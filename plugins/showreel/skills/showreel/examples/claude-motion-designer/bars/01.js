// Bar 1, DRAFT: the opening frame comes apart into two ruled rails.
import { CY, RAIL, RAILS, MASCOT_X, title, drawTitle, clamp01 } from '../shared.js';

// The first beat's moves start on t = 0, not 0.05 s early, so frame 0 is the still title.
// The rail meets the letters at 0.45 (96 px into its 394 px cubic drop): that is when the press begins.
export const cues = [0, 0.36, 0.45, 0.95, 1.45];
export const sounds = [{ t: 0, kind: 'type', count: 6 }, { t: 0.3, kind: 'whoosh' }, { t: 0.5, kind: 'press' }, { t: 1.0, kind: 'click' }, { t: 1.05, kind: 'type', count: 8 }, { t: 1.5, kind: 'pop' }];

const TICKS = 41;

export function draw(t, api) {
  const { spring, expoIn, lerp } = api.ease;
  const { local } = api.clock;
  const T = title(api);
  const p = api.pen('paper');
  p.bg();
  const yF = T.baseline + 26;

  if (t < 0.5) {
    // Small lines un-type from their ends; the mascot accelerates off the right edge;
    // the rail drops and presses the letters flat into itself.
    const out = local(t, 0, 0.3);
    // Cubic rather than expo-in: the press stays accelerating but is visible for more than two frames.
    const railY = lerp(T.railY, yF, local(t, 0.36, 0.14) ** 3);
    drawTitle(p, api, t, {
      intro: 11 * (1 - out), sub: 17 * (1 - out), director: 17 * (1 - out),
      mascotX: MASCOT_X + 900 * expoIn(local(t, 0, 0.36)),
      pose: t > 0 ? 'run' : 'stand',
      railY,
      squash: clamp01((yF - Math.max(railY, T.top)) / (yF - T.top)),
      rest: t <= 0,
    });
  } else {
    // The pressed line rises, shortens and splits into two rails.
    const rise = spring(t - 0.95, 22);
    const split = spring(t - 1.0, 24);
    const open = spring(t - 1.45, 20);
    const y = lerp(yF, CY, rise);
    const half = lerp(70 * split, RAILS.gap / 2, open);
    const x0 = lerp(RAIL.x0, RAILS.x0, rise), x1 = lerp(RAIL.x1, RAILS.x1, rise);
    const top = y - half, bot = y + half;
    p.stroke(api.geom.line(x0, top, x1, top, 64), { width: 3.5, id: 'rail' });
    if (half > 0.5) p.stroke(api.geom.line(x0, bot, x1, bot, 64), { width: 3.5, id: 'rail2' });
    drawTicks(p, api, x0, x1, top, local(t, 1.0, 0.4));
    drawDimension(p, api, t, top, bot, spring(t - 1.45, 24));
  }
  api.labels(p);
  p.flush();
}

// 41 blue ruler ticks along the top rail; `sweep` 0..1 says how many are drawn.
export function drawTicks(p, api, x0, x1, y, sweep) {
  const n = Math.ceil(TICKS * sweep);
  for (let i = 0; i < n; i++) {
    const x = x0 + ((x1 - x0) * i) / (TICKS - 1);
    const h = i % 5 === 0 ? 22 : 11;
    p.stroke([[x, y - 4], [x, y - 4 - h]], { color: 'accent', width: 2, id: `tick${i}` });
  }
}

// A height dimension at the right of the rails, drawn out from its middle, with a live number.
export function drawDimension(p, api, t, top, bot, u) {
  if (u <= 0 || bot - top < 24) return;
  const x = 1680;
  const half = (bot - top) / 2 * u, mid = (top + bot) / 2;
  p.stroke([[x, mid - half], [x, mid + half]], { color: 'accent', width: 2, id: 'dim' });
  for (const [yy, k] of [[top, 'a'], [bot, 'b']]) {
    p.stroke([[x - 14 * u, yy], [x + 14 * u, yy]], { color: 'accent', width: 2, id: `dimext${k}` });
    p.stroke([[x - 7 * u, yy + 7 * u], [x + 7 * u, yy - 7 * u]], { color: 'accent', width: 2.5, id: `dimtick${k}` });
  }
  if (u > 0.3) p.text(String(Math.round(bot - top)), { x: x + 22, y: mid + 9, size: 24, weight: 'xbold', tracking: 0.14, color: 'accent' });
}
