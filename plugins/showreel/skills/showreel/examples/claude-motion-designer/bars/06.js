// Bar 6, SOLID: every hexagon becomes a corner-on cube; they merge, turn and face front.
import { CX, CY, CELL_DRAW, CUBE_EDGE, CORNER_ON, cubeEdges } from '../shared.js';
import { cellsAt } from './05.js';

export const cues = [9.95, 10.45, 10.95, 11.45];
export const sounds = [{ t: 10.0, kind: 'type', count: 6 }, { t: 10.5, kind: 'whoosh' }, { t: 11.0, kind: 'sweep' }, { t: 11.5, kind: 'press' }];

const CELL_EDGE = CELL_DRAW / Math.sqrt(2 / 3); // corner-on silhouette radius = edge · √(2/3)

// Rotation and camera of the big cube; bar 7 starts from rot = (0, π, 0), f = 1400.
export function bigCube(t, api) {
  const { spring } = api.ease;
  const turn = spring(t - 10.95, 18), front = spring(t - 11.45, 18);
  const rot = { x: CORNER_ON.x * (1 - front), y: Math.PI / 4 + (Math.PI / 2) * turn + (Math.PI / 4) * front, z: 0 };
  const invF = turn / 1400;
  return { rot, f: invF > 0 ? 1 / invF : Infinity };
}

export function drawEdges(p, edges, ids) {
  edges.forEach((e, i) => p.stroke([e.a, e.b], { dashed: e.hidden, width: e.hidden ? 3 : 3.5, id: `${ids}${i}` }));
}

export function draw(t, api) {
  const { spring, lerp } = api.ease;
  const { local } = api.clock;
  const p = api.pen('blueprint');
  p.bg();
  const cells = cellsAt(t, api);
  const inner = local(t, 9.95, 0.35);
  const grow = spring(t - 10.45, 18);
  const edge = lerp(CELL_EDGE, CUBE_EDGE, grow);
  const { rot, f } = bigCube(t, api);

  // Outer cubes slide into the centre one and match its size; once there they are the same lines.
  for (const c of [...cells].reverse()) {
    if (c.ring === 0) continue;
    const u = spring(t - 10.45 - (2 - c.ring) * 0.06, 20);
    if (u >= 1) continue;
    const e = lerp(CELL_EDGE, edge, u);
    const edges = cubeEdges(api, { edge: e, rot: CORNER_ON, cx: lerp(c.x, CX, u), cy: lerp(c.y, CY, u) });
    drawCubeOn(p, edges, inner, [lerp(c.x, CX, u), lerp(c.y, CY, u)], `c${c.i}_`);
  }
  drawCubeOn(p, cubeEdges(api, { edge, rot, f }), inner, [CX, CY], 'big');
  if (t > 11.75) api.rest({ x: CX - 200, y: CY - 200, w: 400, h: 400 });
  api.labels(p);
}

// Silhouette edges are the hexagon already on screen; the three inner and three
// hidden edges draw out from the centre corner.
function drawCubeOn(p, edges, inner, [cx, cy], ids) {
  edges.forEach((e, i) => {
    const fromCentre = Math.hypot(e.a[0] - cx, e.a[1] - cy) < 1 ? [e.a, e.b] : Math.hypot(e.b[0] - cx, e.b[1] - cy) < 1 ? [e.b, e.a] : null;
    let seg = [e.a, e.b];
    if (fromCentre && inner < 1) {
      if (inner <= 0) return;
      const [s, q] = fromCentre;
      seg = [s, [s[0] + (q[0] - s[0]) * inner, s[1] + (q[1] - s[1]) * inner]];
    }
    p.stroke(seg, { dashed: e.hidden, width: e.hidden ? 3 : 3.5, id: `${ids}${i}` });
  });
}
