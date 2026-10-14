// Bar 15, END: the small lines type back on and the last hatching lands on frame 0.
import { title, drawTitle, formRails, mascotForm } from '../shared.js';

export const cues = [27.95, 28.45, 28.95, 29.45];
export const sounds = [{ t: 28.0, kind: 'type', count: 11 }, { t: 28.5, kind: 'type', count: 17 }, { t: 29.0, kind: 'type', count: 17 }, { t: 29.5, kind: 'tick' }];

export function draw(t, api) {
  const { spring, lerp } = api.ease;
  const T = title(api);
  const rails = formRails(t, api);
  const m = mascotForm(t, api);
  const p = api.pen('paper');
  p.bg();
  drawTitle(p, api, t, {
    intro: Math.min(11, (t - 27.95) / 0.05),
    sub: Math.min(17, (t - 28.45) / 0.05),
    director: Math.min(17, (t - 28.95) / 0.05),
    mascotX: m.x, pose: m.pose,
    railY: rails.top, railX0: rails.x0, railX1: rails.x1,
    // w = 18.2 puts the spring's landing exactly on t = 30 (10 / w = 0.55 s after 29.45).
    hatch: lerp(0.85, 1, spring(t - 29.45, 10 / 0.55)),
    rest: t >= 29.5,
  });
  api.labels(p);
  p.flush();
}
