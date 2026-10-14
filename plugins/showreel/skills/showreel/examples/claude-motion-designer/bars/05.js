// Bar 5, TILE: the hexagon becomes the centre of a 19-cell honeycomb that floods into blueprint.
import { CX, CY, SHAPE_R, CELL, CELL_DRAW } from '../shared.js';

export const cues = [7.95, 8.45, 8.95, 9.45];
export const sounds = [{ t: 8.0, kind: 'pop' }, { t: 8.5, kind: 'pop' }, { t: 9.0, kind: 'sweep' }, { t: 9.95, kind: 'whoosh' }];

// Cell centres and drawn radii at time t; bar 6 starts from the settled state.
export function cellsAt(t, api) {
  const { spring, lerp } = api.ease;
  const grid = api.geom.hexGrid(CX, CY, CELL, 2);
  const shrink = spring(t - 7.95, 22);
  return grid.map((c, i) => {
    if (c.ring === 0) return { ...c, i, r: lerp(SHAPE_R, CELL_DRAW, shrink), on: true };
    const start = c.ring === 1 ? 7.95 : 8.45;
    const u = spring(t - start - 0.05, 22);
    const from = c.ring === 1 ? 0 : 0.5;
    return { ...c, i, x: lerp(CX + (c.x - CX) * from, c.x, u), y: lerp(CY + (c.y - CY) * from, c.y, u), r: CELL_DRAW, on: t >= start };
  });
}

function drawComb(p, t, api, cells) {
  const { spring } = api.ease;
  const paper = p.name === 'paper';
  // Draw outer rings first so cells slide out from behind the centre one.
  for (const c of [...cells].reverse()) {
    if (!c.on) continue;
    const hex = api.geom.polygon(c.x, c.y, c.r, 6);
    if (paper) {
      const dense = spring(t - 8.95 - ((c.x - CX + 420) / 840) * 0.35, 18);
      p.fill(hex, { color: 'accent', mode: 'cross', spacing: 9 - 7.4 * dense, width: 1.6 + 0.9 * dense, id: `cell${c.i}` });
    }
    p.stroke(hex, { closed: true, width: paper ? 3 : 3.5, id: `edge${c.i}` });
  }
}

export function draw(t, api) {
  const cells = cellsAt(t, api);
  if (t < 9.45) {
    const p = api.pen('paper');
    p.bg();
    drawComb(p, t, api, cells);
    api.labels(p);
    p.flush();
    return;
  }
  // The centre cell's shape grows past the frame with a hard edge; inside it is the blueprint.
  const R = CELL_DRAW + (2400 - CELL_DRAW) * api.ease.expoIn(api.clock.local(t, 9.45, 0.5));
  api.split(api.geom.polygon(CX, CY, R, 6), 'paper', 'blueprint', p => {
    drawComb(p, t, api, cells);
    api.labels(p);
  });
}
