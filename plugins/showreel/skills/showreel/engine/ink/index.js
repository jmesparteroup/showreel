import { makeInk } from './make.js';
import { toContours } from './common.js';
import { layout } from '../type.js';

// A pen draws one ink from the film's brand. `env.inks` maps ink names to resolved specs.
export function makePen(name, ctx, env) {
  const spec = env.inks[name];
  if (!spec) throw new Error(`unknown ink "${name}"; this film's brand has ${Object.keys(env.inks).join(', ')}`);
  const impl = makeInk(spec, ctx, env);
  let n = 0;
  return {
    name,
    spec,
    colors: { bg: spec.bg.color, line: spec.line.color, accent: spec.accent, solid: spec.solid, fill: spec.fill.color },
    bg: () => impl.bg(),
    stroke: (pts, o = {}) => impl.stroke(pts, { id: `s${n++}`, ...o }),
    fill: (shape, o = {}) => impl.fill(toContours(shape), { id: `f${n++}`, ...o }),
    type(glyphs, { color = 'line', progress = 1, id = `t${n++}` } = {}) {
      const contours = glyphs.flatMap(g => g.contours);
      if (!contours.length) return;
      const { fill, outline, spacing, width } = impl.type;
      impl.fill(contours, { style: fill, color, spacing, progress, id });
      if (outline === 'none') return;
      contours.forEach((c, i) => {
        impl.stroke(c, { closed: true, color, width, id: `${id}a${i}` });
        if (outline === 'double') impl.stroke(c, { closed: true, color, width: width * 0.7, id: `${id}b${i}` });
      });
    },
    text(str, { x, y, size = 26, weight = 'label', tracking = 0.2, align = 'left', color = 'line' }) {
      const font = env.fonts[weight];
      if (!font) throw new Error(`unknown font "${weight}"; use display, label, body or black, xbold, semi`);
      const lay = layout(font, str, { size, x, y, tracking, align });
      const contours = lay.glyphs.flatMap(g => g.contours);
      if (contours.length) impl.fill(contours, { mode: 'solid', color, id: `x${n++}` });
      return lay;
    },
    measure: (str, { size = 26, weight = 'label', tracking = 0.2 } = {}) => layout(env.fonts[weight], str, { size, tracking }),
    flush: () => impl.flush(),
  };
}
