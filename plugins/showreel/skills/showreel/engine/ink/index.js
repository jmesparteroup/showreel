import * as paper from './paper.js';
import * as blueprint from './blueprint.js';
import * as hologram from './hologram.js';
import { toContours } from './common.js';
import { layout } from '../type.js';

export const inks = { paper, blueprint, hologram };

export function makePen(name, ctx, env) {
  const ink = inks[name];
  if (!ink) throw new Error(`unknown ink "${name}"; expected one of ${Object.keys(inks).join(', ')}`);
  const impl = ink.begin(ctx, env);
  let n = 0;
  return {
    name,
    colors: ink.colors,
    bg: () => impl.bg(),
    stroke: (pts, o = {}) => impl.stroke(pts, { id: `s${n++}`, ...o }),
    fill: (shape, o = {}) => impl.fill(toContours(shape), { id: `f${n++}`, ...o }),
    type(glyphs, { color = 'line', progress = 1, id = `t${n++}` } = {}) {
      const contours = glyphs.flatMap(g => g.contours);
      if (!contours.length) return;
      impl.fill(contours, { color, spacing: impl.typeSpacing, progress, id });
      contours.forEach((c, i) => {
        impl.stroke(c, { closed: true, color, width: impl.typeOutline, id: `${id}a${i}` });
        if (impl.doubleOutline) impl.stroke(c, { closed: true, color, width: impl.typeOutline * 0.7, id: `${id}b${i}` });
      });
    },
    text(str, { x, y, size = 26, weight = 'xbold', tracking = 0.2, align = 'left', color = 'line' }) {
      const lay = layout(env.fonts[weight], str, { size, x, y, tracking, align });
      const contours = lay.glyphs.flatMap(g => g.contours);
      if (contours.length) impl.fill(contours, { mode: 'solid', color, id: `x${n++}` });
      return lay;
    },
    flush: () => impl.flush(),
  };
}
