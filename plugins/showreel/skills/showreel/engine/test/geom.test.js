import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../geom.js';

const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;

test('resample keeps endpoints and total length', () => {
  const pts = [[0, 0], [100, 0], [100, 50]];
  const r = g.resample(pts, 31);
  assert.equal(r.length, 31);
  assert.deepEqual(r[0], [0, 0]);
  assert.ok(near(r[30][0], 100) && near(r[30][1], 50));
  assert.ok(near(g.length(r), 150, 1e-6));
});

test('closed resample does not repeat the start point', () => {
  const sq = [[0, 0], [10, 0], [10, 10], [0, 10]];
  const r = g.resample(sq, 8, true);
  assert.equal(r.length, 8);
  assert.ok(g.dist(r[7], r[0]) > 1);
  assert.ok(near(g.length(r, true), 40, 1e-6));
});

test('morph returns its inputs at u = 0 and u = 1', () => {
  const a = g.circle(0, 0, 100, 64), b = g.polygon(0, 0, 100, 6);
  const m0 = g.morph(a, b, 0, { closed: true, n: 64 });
  const m1 = g.morph(a, b, 1, { closed: true, n: 64 });
  assert.ok(near(g.length(m0, true), g.length(g.resample(a, 64, true), true), 1e-6));
  assert.ok(near(g.length(m1, true), g.length(g.resample(b, 64, true), true), 1e-6));
});

test('curl keeps length and closes into a circle', () => {
  const L = 2 * Math.PI * 235;
  const flat = g.curl(960, 540, L, 0);
  assert.ok(near(g.length(flat), L, 1e-6));
  const round = g.curl(960, 540, L, 1 / 235);
  assert.ok(near(g.length(round), L, 1));
  assert.ok(g.dist(round[0], round[round.length - 1]) < 1);
});

test('hexGrid with two rings has 19 cells', () => {
  const cells = g.hexGrid(960, 540, 96, 2);
  assert.equal(cells.length, 19);
  assert.equal(cells.filter(c => c.ring === 2).length, 12);
});

test('gear outline has one tooth per period', () => {
  const pts = g.gear(0, 0, 16, 208);
  const radii = pts.map(p => Math.hypot(p[0], p[1]));
  const outer = Math.max(...radii), inner = Math.min(...radii);
  assert.ok(outer > 208 && inner < 208);
  let tips = 0;
  for (let i = 0; i < radii.length; i++) if (radii[i] > 208 && radii[(i + radii.length - 1) % radii.length] <= 208) tips++;
  assert.equal(tips, 16);
});

test('cube corner-on hides three edges; front-on shows four', () => {
  const corner = g.cubeLines(330, { x: Math.atan(1 / Math.SQRT2), y: Math.PI / 4, z: 0 });
  assert.equal(corner.visible.length, 9);
  assert.equal(corner.hidden.length, 3);
  const front = g.cubeLines(330, { x: 0, y: 0, z: 0 });
  assert.equal(front.visible.length, 4);
});
