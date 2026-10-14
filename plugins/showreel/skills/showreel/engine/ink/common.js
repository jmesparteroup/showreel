export function tracePath(g, pts, closed) {
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  if (closed) g.closePath();
}

export function toPath(contours) {
  const p = new Path2D();
  for (const c of contours) {
    p.moveTo(c[0][0], c[0][1]);
    for (let i = 1; i < c.length; i++) p.lineTo(c[i][0], c[i][1]);
    p.closePath();
  }
  return p;
}

export const toContours = shape => (typeof shape[0][0] === 'number' ? [shape] : shape);

// Grid lines are centred on the frame so the middle lines cross at its centre
// and every fifth line from the centre is major.
export function drawGrid(ctx, rgb, minor = 0.13, major = 0.26, step = 60, W = 1920, H = 1080) {
  const cx = W / 2, cy = H / 2;
  const kx = Math.ceil(cx / step), ky = Math.ceil(cy / step);
  ctx.save();
  ctx.lineWidth = 1;
  for (let k = -kx; k <= kx; k++) {
    const x = cx + k * step;
    ctx.strokeStyle = `rgba(${rgb},${k % 5 === 0 ? major : minor})`;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let k = -ky; k <= ky; k++) {
    const y = cy + k * step;
    ctx.strokeStyle = `rgba(${rgb},${k % 5 === 0 ? major : minor})`;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  ctx.restore();
}

export function bbox(contours) {
  const b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  for (const c of contours) for (const [x, y] of c) {
    if (x < b.x0) b.x0 = x; if (x > b.x1) b.x1 = x;
    if (y < b.y0) b.y0 = y; if (y > b.y1) b.y1 = y;
  }
  return b;
}

// Lines sit on a lattice anchored to the frame origin: line k is the set of points
// whose distance along the normal is k * spacing. A shape that grows or moves keeps
// the same lines (and ids) under its interior. Each line carries its lattice index
// `k` and `s0`, its start's distance along the hatch direction, so wobble can be
// measured from a fixed origin too.
export function hatchLines(contours, angle, spacing, { fixedEnds = false } = {}) {
  const dx = Math.cos(angle), dy = Math.sin(angle), nx = -dy, ny = dx;
  let n0 = Infinity, n1 = -Infinity, t0 = Infinity, t1 = -Infinity;
  for (const c of contours) for (const [x, y] of c) {
    const pn = x * nx + y * ny, pt = x * dx + y * dy;
    if (pn < n0) n0 = pn; if (pn > n1) n1 = pn;
    if (pt < t0) t0 = pt; if (pt > t1) t1 = pt;
  }
  // Clean lines get fixed frame-wide ends: Skia rasterises a straight line slightly
  // differently when only its length changes. Sketchy lines are resampled, so they
  // stay short and start on the lattice instead.
  const a = fixedEnds ? -8192 : Math.floor(t0 / spacing) * spacing - spacing;
  const b = fixedEnds ? 8192 : Math.ceil(t1 / spacing) * spacing + spacing;
  const lines = [];
  for (let k = Math.floor(n0 / spacing); k * spacing <= n1; k++) {
    const d = k * spacing;
    const line = [[nx * d + dx * a, ny * d + dy * a], [nx * d + dx * b, ny * d + dy * b]];
    line.k = k;
    line.s0 = a;
    lines.push(line);
  }
  return lines;
}
