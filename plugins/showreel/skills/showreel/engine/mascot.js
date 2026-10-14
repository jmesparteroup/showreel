import { roundRect } from './geom.js';

// Units from the character sheet: body 76 x 54, arms 24 x 16, legs 11 x 33,
// eyes 8 x 14. 124 units = body plus both arm stubs; origin between the feet.
const UNITS_WIDE = 124;
const LEGS = [-27, -9, 9, 27];
const ARM_UP = (-58 * Math.PI) / 180;

export function mascot(pen, { x, y, width = 250, pose = 'stand', t = 0, facing = 1 } = {}) {
  const s = width / UNITS_WIDE;
  const run = pose === 'run';
  const phase = Math.sin(2 * Math.PI * 3 * t); // 6 steps a second, alternating pairs
  const lift = i => (run ? Math.max(0, i % 2 === 0 ? phase : -phase) * 9 : 0);
  const tilt = run ? ((7 * Math.PI) / 180) * facing : 0;
  const c = Math.cos(tilt), sn = Math.sin(tilt);
  const T = pts => pts.map(([u, v]) => {
    const xu = u * facing;
    return [x + s * (xu * c - v * sn), y + s * (xu * sn + v * c)];
  });

  const legs = LEGS.map((lx, i) => T(roundRect(lx - 5.5, -33 - lift(i), 11, 33, 3, 2)));
  const body = T(roundRect(-38, -87, 76, 54, 9));
  const armL = T(roundRect(-62, -68, 24, 16, 5, 2));
  const d = [Math.cos(ARM_UP), Math.sin(ARM_UP)], n = [-d[1], d[0]];
  const p0 = [38, -60];
  const at = (a, b) => [p0[0] + d[0] * a + n[0] * b, p0[1] + d[1] * a + n[1] * b];
  const armR = T([at(0, -8), at(24, -8), at(24, 8), at(0, 8)]);
  const pencil = T([at(22, -3), at(52, -3), at(60, 0), at(52, 3), at(22, 3)]);
  const eyes = [T(roundRect(-17, -73, 8, 14, 4, 3)), T(roundRect(9, -73, 8, 14, 4, 3))];

  for (const leg of legs) pen.stroke(leg, { closed: true, width: 3 });
  // Hologram fills in its line colour so the white eyes stay readable.
  pen.fill(body, { color: pen.name === 'hologram' ? 'line' : 'accent', spacing: 14, lit: 0.55 });
  pen.stroke(body, { closed: true, width: 3.5 });
  pen.stroke(armL, { closed: true, width: 3 });
  pen.stroke(armR, { closed: true, width: 3 });
  pen.stroke(pencil, { closed: true, width: 2.5 });
  for (const e of eyes) pen.fill(e, { mode: 'solid', color: 'solid' });

  const all = [...legs.flat(), ...body, ...armL, ...armR, ...pencil];
  const xs = all.map(p => p[0]), ys = all.map(p => p[1]);
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
}
