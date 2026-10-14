// Bar 7, GEAR: the cube flattens, its front square grows teeth, and a gear train turns on the eighth notes.
import { CX, CY, CUBE_EDGE, GEAR_PITCH, cubeEdges, FRONT_SCALE } from '../shared.js';
import { drawEdges } from './06.js';

export const cues = [11.95, 12.2, 12.45, 12.95, 13.45];

const F = 1400;
const FRONT = { x: 0, y: Math.PI, z: 0 };
const HALF = (CUBE_EDGE / 2) * FRONT_SCALE(F); // projected half-side of the front face

// Gear-train rotation: 45 degrees on every eighth note from 12.25 to 13.75.
export function trainRot(t, api) {
  let r = 0;
  for (let k = 0; k < 7; k++) r += (Math.PI / 4) * api.ease.spring(t - (12.2 + 0.25 * k), 40);
  return r;
}

function mesh(rotA, phi, teeth) {
  // Gear A has a tooth centred on phi at rotA = phi - π/16; the partner shows a gap there.
  return phi + Math.PI - (rotA - (phi - Math.PI / 16)) * (16 / teeth);
}

function drawGear(p, api, { cx, cy, teeth, pitch, rot, label, s, id }) {
  if (s <= 0.01) return;
  const g = api.geom;
  p.stroke(g.gear(cx, cy, teeth, pitch * s, rot), { closed: true, id: `${id}g` });
  p.stroke(g.circle(cx, cy, pitch * s, 128), { closed: true, dashed: true, width: 3, id: `${id}p` });
  p.stroke(g.circle(cx, cy, pitch * 0.18 * s, 48), { closed: true, id: `${id}h` });
  if (s > 0.6) p.text(label, { x: cx, y: cy + pitch * 0.42 * s + 9, size: 24, weight: 'xbold', tracking: 0.2, align: 'center', color: 'accent' });
}

export function draw(t, api) {
  const { spring } = api.ease;
  const g = api.geom;
  const p = api.pen('blueprint');
  p.bg();

  const flat = spring(t - 11.95, 22);
  const teeth = spring(t - 12.05, 20);
  const back = spring(t - 13.45, 28);
  const depth = t < 13.45 ? 1 - flat : back;
  const rot = trainRot(t, api);

  if (depth > 0.01) drawEdges(p, cubeEdges(api, { edge: CUBE_EDGE, rot: FRONT, f: F, depth }).filter(e => !isFront(e)), 'cube');

  const square = g.polygon(CX, CY, HALF * Math.SQRT2, 4, -Math.PI / 4);
  const big = g.gear(CX, CY, 16, GEAR_PITCH, rot);
  const shape = t < 13.45 ? g.morph(square, big, teeth, { closed: true }) : g.morph(big, square, back, { closed: true });
  p.stroke(shape, { closed: true, id: 'front' });
  const gearOn = t < 13.45 ? teeth : 1 - back;
  if (gearOn > 0.5) {
    p.stroke(g.circle(CX, CY, GEAR_PITCH, 160), { closed: true, dashed: true, width: 3, id: 'bigp' });
    p.stroke(g.circle(CX, CY, GEAR_PITCH * 0.18, 48), { closed: true, id: 'bigh' });
    p.text('16T', { x: CX, y: CY + GEAR_PITCH * 0.42 + 9, size: 24, weight: 'xbold', tracking: 0.2, align: 'center', color: 'accent' });
  }

  const retract = 1 - spring(t - 13.45, 22);
  for (const [teethN, deg, start, label] of [[10, -40, 12.45, '10T'], [12, -140, 12.95, '12T']]) {
    const phi = (deg * Math.PI) / 180;
    const pitch = (GEAR_PITCH * teethN) / 16;
    const d = GEAR_PITCH + pitch;
    const s = spring(t - start, 20) * retract;
    drawGear(p, api, { cx: CX + d * s * Math.cos(phi), cy: CY + d * s * Math.sin(phi), teeth: teethN, pitch, rot: mesh(rot, phi, teethN), label, s, id: label });
  }
  api.labels(p);
}

// The front face's four edges are drawn as the morphing square/gear instead.
function isFront(e) {
  const near = ([x, y]) => Math.abs(Math.abs(x - CX) - HALF) < 0.5 && Math.abs(Math.abs(y - CY) - HALF) < 0.5;
  return near(e.a) && near(e.b) && !e.hidden;
}
