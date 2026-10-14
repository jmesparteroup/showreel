import { hash, rand } from '../rng.js';
import { length, resample } from '../geom.js';
import { drawGrid, tracePath, toPath, hatchLines } from './common.js';

export const colors = { bg: '#EDE6D5', grid: '27,62,210', line: '#16161A', accent: '#1B3ED2', solid: '#16161A' };

const W = 1920, H = 1080;
let tooth, grain, layer;

function specks(seed, count, alphaMax, size) {
  const c = new OffscreenCanvas(W, H);
  const g = c.getContext('2d');
  const r = rand('specks', seed);
  g.fillStyle = '#000';
  for (let i = 0; i < count; i++) {
    g.globalAlpha = alphaMax * r();
    g.fillRect(r() * W, r() * H, size * (0.4 + r()), size * (0.4 + r()));
  }
  return c;
}

function wobble(pts, amp, seed) {
  const r = rand(seed);
  const k1 = 0.004 + 0.004 * r(), k2 = 0.02 + 0.015 * r();
  const p1 = Math.PI * 2 * r(), p2 = Math.PI * 2 * r();
  const out = new Array(pts.length);
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    if (i > 0) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let nx = a[1] - b[1], ny = b[0] - a[0];
    const l = Math.hypot(nx, ny) || 1;
    nx /= l; ny /= l;
    const d = amp * (0.6 * Math.sin(k1 * s + p1) + 1.4 * Math.sin(k2 * s + p2));
    out[i] = [pts[i][0] + nx * d, pts[i][1] + ny * d];
  }
  return out;
}

export function begin(ctx, { t, frozen }) {
  tooth ??= specks(1, 260000, 0.55, 1.6);
  grain ??= specks(2, 90000, 0.07, 1.2);
  const { width, height } = ctx.canvas;
  if (!layer || layer.width !== width || layer.height !== height) layer = new OffscreenCanvas(width, height);
  const L = layer.getContext('2d');
  L.setTransform(1, 0, 0, 1, 0, 0);
  L.clearRect(0, 0, width, height);
  L.setTransform(ctx.getTransform());
  // The wobble phase steps 8 times a second, not every frame.
  const tick = frozen ? 0 : Math.floor(t * 8);

  function pencil(pts, { closed = false, color = 'line', width: w = 3, dashed = false, id }) {
    if (pts.length < 2) return;
    const base = resample(pts, Math.max(2, Math.ceil(length(pts, closed) / 3)), closed);
    const seed = hash(id, tick);
    L.strokeStyle = colors[color];
    L.lineCap = 'round';
    L.lineJoin = 'round';
    L.setLineDash(dashed ? [10, 9] : []);
    L.globalAlpha = 0.9; L.lineWidth = w;
    tracePath(L, wobble(base, 1, seed), closed); L.stroke();
    L.globalAlpha = 0.4; L.lineWidth = w / 2;
    tracePath(L, wobble(base, 2, seed + 1), closed); L.stroke();
    L.globalAlpha = 1;
    L.setLineDash([]);
  }

  return {
    typeSpacing: 7, typeOutline: 2.2, doubleOutline: true,
    bg() {
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.drawImage(grain, 0, 0, W, H);
      ctx.restore();
      drawGrid(ctx, colors.grid);
    },
    stroke: pencil,
    fill(contours, { color = 'accent', mode = 'hatch', progress = 1, spacing = 9, angle = Math.PI / 4, width: w = 1.6, id }) {
      const path = toPath(contours);
      if (mode === 'solid') {
        L.fillStyle = colors[color]; L.globalAlpha = 0.9; L.fill(path, 'evenodd'); L.globalAlpha = 1;
        return;
      }
      L.save();
      L.clip(path, 'evenodd');
      const passes = mode === 'cross' ? [angle, -angle] : [angle];
      passes.forEach((a, k) => {
        const lines = hatchLines(contours, a, spacing);
        const n = Math.ceil(lines.length * progress);
        for (let i = 0; i < n; i++) pencil(lines[i], { color, width: w, id: `${id}:${k}:${i}` });
      });
      L.restore();
    },
    flush() {
      L.save();
      L.setTransform(1, 0, 0, 1, 0, 0);
      L.globalCompositeOperation = 'destination-out';
      L.drawImage(tooth, 0, 0, layer.width, layer.height);
      L.restore();
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'multiply';
      ctx.drawImage(layer, 0, 0);
      ctx.restore();
    },
  };
}
