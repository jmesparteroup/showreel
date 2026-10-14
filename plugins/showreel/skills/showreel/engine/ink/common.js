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

// Grid lines are centred on the frame so the middle lines sit at x = 960 and
// y = 540 and every fifth line from the centre is major.
export function drawGrid(ctx, rgb, minor = 0.13, major = 0.26, step = 60) {
  ctx.save();
  ctx.lineWidth = 1;
  for (let k = -16; k <= 16; k++) {
    const x = 960 + k * step;
    ctx.strokeStyle = `rgba(${rgb},${k % 5 === 0 ? major : minor})`;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1080); ctx.stroke();
  }
  for (let k = -9; k <= 9; k++) {
    const y = 540 + k * step;
    ctx.strokeStyle = `rgba(${rgb},${k % 5 === 0 ? major : minor})`;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1920, y); ctx.stroke();
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

// Lines are anchored to the shape's bbox centre so hatching travels with the shape.
export function hatchLines(contours, angle, spacing) {
  const b = bbox(contours);
  const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
  const R = Math.hypot(b.x1 - b.x0, b.y1 - b.y0) / 2 + spacing;
  const dx = Math.cos(angle), dy = Math.sin(angle), nx = -dy, ny = dx;
  const lines = [];
  for (let d = -R; d <= R; d += spacing)
    lines.push([[cx + nx * d - dx * R, cy + ny * d - dy * R], [cx + nx * d + dx * R, cy + ny * d + dy * R]]);
  return lines;
}
