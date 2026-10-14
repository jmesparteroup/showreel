export const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);

export function length(pts, closed = false) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += dist(pts[i - 1], pts[i]);
  if (closed && pts.length > 1) L += dist(pts[pts.length - 1], pts[0]);
  return L;
}

export function resample(pts, n, closed = false) {
  const src = closed ? [...pts, pts[0]] : pts;
  const cum = [0];
  for (let i = 1; i < src.length; i++) cum.push(cum[i - 1] + dist(src[i - 1], src[i]));
  const total = cum[cum.length - 1];
  const steps = closed ? n : n - 1;
  const out = [];
  let j = 0;
  for (let i = 0; i < n; i++) {
    const s = (total * i) / steps;
    while (j < cum.length - 2 && cum[j + 1] < s) j++;
    const seg = cum[j + 1] - cum[j] || 1;
    const u = Math.min(1, Math.max(0, (s - cum[j]) / seg));
    out.push([src[j][0] + (src[j + 1][0] - src[j][0]) * u, src[j][1] + (src[j + 1][1] - src[j][1]) * u]);
  }
  return out;
}

// Closed shapes are aligned by the rotation (and direction) of b that is
// nearest to a, so a circle turns into a hexagon without twisting through itself.
export function morph(a, b, u, { closed = false, n = 256 } = {}) {
  const A = resample(a, n, closed);
  let B = resample(b, n, closed);
  if (closed) {
    let best = Infinity, bestB = B;
    for (const cand of [B, [...B].reverse()]) {
      for (let k = 0; k < n; k += 2) {
        let d = 0;
        for (let i = 0; i < n; i += 4) {
          const p = cand[(i + k) % n];
          d += (p[0] - A[i][0]) ** 2 + (p[1] - A[i][1]) ** 2;
        }
        if (d < best) { best = d; bestB = cand.map((_, i) => cand[(i + k) % n]); }
      }
    }
    B = bestB;
  }
  return A.map((p, i) => [p[0] + (B[i][0] - p[0]) * u, p[1] + (B[i][1] - p[1]) * u]);
}

// A curve of fixed length L and constant curvature k, midpoint at (cx, cy)
// with a horizontal tangent, bending upward. k = 0 is a straight line;
// k = 2π / L closes it into a circle centred at (cx, cy - 1 / k).
export function curl(cx, cy, L, k, n = 256) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const s = (i / (n - 1) - 0.5) * L;
    if (Math.abs(k) < 1e-9) out.push([cx + s, cy]);
    else out.push([cx + Math.sin(s * k) / k, cy - (1 - Math.cos(s * k)) / k]);
  }
  return out;
}

export function line(x0, y0, x1, y1, n = 2) {
  return Array.from({ length: n }, (_, i) => [x0 + ((x1 - x0) * i) / (n - 1), y0 + ((y1 - y0) * i) / (n - 1)]);
}

export function cubic(p0, p1, p2, p3, n = 64) {
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1), m = 1 - t;
    const a = m * m * m, b = 3 * m * m * t, c = 3 * m * t * t, d = t * t * t;
    return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
  });
}

export function circle(cx, cy, r, n = 256) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
}

export function polygon(cx, cy, r, sides, rot = -Math.PI / 2) {
  return Array.from({ length: sides }, (_, i) => {
    const a = rot + (i / sides) * Math.PI * 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
}

export function roundRect(x, y, w, h, r, segs = 4) {
  const out = [];
  const corners = [[x + w - r, y + r, -Math.PI / 2], [x + w - r, y + h - r, 0], [x + r, y + h - r, Math.PI / 2], [x + r, y + r, Math.PI]];
  for (const [cx, cy, a0] of corners)
    for (let i = 0; i <= segs; i++) {
      const a = a0 + (i / segs) * (Math.PI / 2);
      out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  return out;
}

export function gear(cx, cy, teeth, pitchR, rot = 0) {
  const m = (2 * pitchR) / teeth;
  const outer = pitchR + m, root = pitchR - 1.25 * m;
  const profile = [[0, root], [0.2, root], [0.35, outer], [0.65, outer], [0.8, root]];
  const out = [];
  for (let k = 0; k < teeth; k++)
    for (const [f, r] of profile) {
      const a = rot + ((k + f) / teeth) * Math.PI * 2;
      out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  return out;
}

// Point-up hexagons of circumradius r, in rings around the centre cell.
export function hexGrid(cx, cy, r, rings) {
  const cells = [];
  for (let q = -rings; q <= rings; q++)
    for (let s = -rings; s <= rings; s++) {
      const ring = Math.max(Math.abs(q), Math.abs(s), Math.abs(q + s));
      if (ring > rings) continue;
      cells.push({ x: cx + Math.sqrt(3) * r * (q + s / 2), y: cy + 1.5 * r * s, ring });
    }
  return cells.sort((a, b) => a.ring - b.ring);
}

export const translate = (pts, dx, dy) => pts.map(p => [p[0] + dx, p[1] + dy]);
export const rotate = (pts, cx, cy, a) => {
  const c = Math.cos(a), s = Math.sin(a);
  return pts.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]);
};
export const scale = (pts, cx, cy, sx, sy = sx) => pts.map(([x, y]) => [cx + (x - cx) * sx, cy + (y - cy) * sy]);

export const rotX = ([x, y, z], a) => [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];
export const rotY = ([x, y, z], a) => [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)];
export const rotZ = ([x, y, z], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a), z];

// Camera sits at z = -f looking along +z; f = Infinity is orthographic.
export function project([x, y, z], { cx = 960, cy = 540, f = Infinity } = {}) {
  const s = Number.isFinite(f) ? f / (f + z) : 1;
  return [cx + x * s, cy + y * s];
}

export function cube(edge) {
  const h = edge / 2;
  const verts = [[-h, -h, -h], [h, -h, -h], [h, h, -h], [-h, h, -h], [-h, -h, h], [h, -h, h], [h, h, h], [-h, h, h]];
  const faces = [[0, 1, 2, 3], [5, 4, 7, 6], [4, 0, 3, 7], [1, 5, 6, 2], [4, 5, 1, 0], [3, 2, 6, 7]];
  const edges = [];
  for (const f of faces)
    for (let i = 0; i < 4; i++) {
      const a = f[i], b = f[(i + 1) % 4];
      if (!edges.some(([p, q]) => (p === a && q === b) || (p === b && q === a))) edges.push([a, b]);
    }
  return { verts, edges, faces };
}

export function cubeLines(edge, rot = { x: 0, y: 0, z: 0 }, cam = {}) {
  const { verts, edges, faces } = cube(edge);
  const tv = verts.map(v => rotZ(rotX(rotY(v, rot.y), rot.x), rot.z));
  const facing = faces.map(([a, b, c]) => {
    const u = tv[b].map((v, i) => v - tv[a][i]), w = tv[c].map((v, i) => v - tv[a][i]);
    return u[0] * w[1] - u[1] * w[0] < -1e-6; // normal z toward the camera
  });
  const out = { visible: [], hidden: [] };
  for (const [a, b] of edges) {
    const seen = faces.some((f, i) => facing[i] && f.includes(a) && f.includes(b));
    (seen ? out.visible : out.hidden).push([project(tv[a], cam), project(tv[b], cam)]);
  }
  return out;
}
