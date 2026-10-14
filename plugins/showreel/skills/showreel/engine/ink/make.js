// One renderer for every ink. A resolved ink spec (see brand.js) picks a line
// treatment, a fill treatment and a background; everything is seeded, so a frame
// is a pure function of t.
import { hash, rand } from '../rng.js';
import { length, resample } from '../geom.js';
import { drawGrid, tracePath, toPath, hatchLines, bbox } from './common.js';

const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(',');

const textures = new Map();
let layer;

// Speck density is set for 1920 x 1080 and scales with frame area.
function specks(seed, count, alphaMax, size, W, H) {
  const key = `${seed}:${alphaMax}:${W}x${H}`;
  if (textures.has(key)) return textures.get(key);
  const c = new OffscreenCanvas(W, H);
  const g = c.getContext('2d');
  const r = rand('specks', seed);
  g.fillStyle = '#000';
  const n = Math.round((count * W * H) / (1920 * 1080));
  for (let i = 0; i < n; i++) {
    g.globalAlpha = alphaMax * r();
    g.fillRect(r() * W, r() * H, size * (0.4 + r()), size * (0.4 + r()));
  }
  textures.set(key, c);
  return c;
}

function wobble(pts, amp, seed, s0 = 0) {
  const r = rand(seed);
  const k1 = 0.004 + 0.004 * r(), k2 = 0.02 + 0.015 * r();
  const p1 = Math.PI * 2 * r(), p2 = Math.PI * 2 * r();
  const out = new Array(pts.length);
  let s = s0;
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

export function makeInk(spec, ctx, { t, frozen, size, palette = {}, images = {} }) {
  const [W, H] = size;
  // Sketchy lines and grain draw on an offscreen layer that gets paper tooth
  // knocked out and is multiplied onto the background at flush.
  const layered = spec.line.style === 'pencil' || spec.line.style === 'marker' || spec.bg.grain > 0;
  let L = ctx;
  if (layered) {
    const { width, height } = ctx.canvas;
    if (!layer || layer.width !== width || layer.height !== height) layer = new OffscreenCanvas(width, height);
    L = layer.getContext('2d');
    L.setTransform(1, 0, 0, 1, 0, 0);
    L.clearRect(0, 0, width, height);
    L.setTransform(ctx.getTransform());
  }
  // The wobble phase steps 8 times a second, not every frame.
  const tick = frozen ? 0 : Math.floor(t * 8);

  const slots = { line: spec.line.color, accent: spec.accent, solid: spec.solid, fill: spec.fill.color, bg: spec.bg.color, grid: spec.grid?.color, core: spec.line.core };
  const colorOf = c => slots[c] ?? palette[c] ?? (/^#[0-9a-f]{6}$/i.test(c) ? c : (() => { throw new Error(`ink ${spec.name}: unknown colour "${c}"; use line, accent, solid, fill, a palette key or #rrggbb`); })());

  function sketch(pts, { closed = false, color = 'line', width: w = spec.line.width, dashed = false, id, s0 = 0 }) {
    if (pts.length < 2) return;
    const marker = spec.line.style === 'marker';
    // Resampling every 3 px from a lattice-aligned start keeps hatch points fixed in the frame.
    const base = resample(pts, Math.max(2, Math.round(length(pts, closed) / 3) + 1), closed);
    const seed = hash(id, tick);
    L.strokeStyle = colorOf(color);
    L.lineCap = marker ? 'butt' : 'round';
    L.lineJoin = 'round';
    L.setLineDash(dashed ? (marker ? [w * 3, w * 2] : [10, 9]) : []);
    if (marker) {
      L.globalAlpha = 0.95; L.lineWidth = w;
      tracePath(L, wobble(base, 0.35, seed, s0), closed); L.stroke();
    } else {
      L.globalAlpha = 0.9; L.lineWidth = w;
      tracePath(L, wobble(base, 1, seed, s0), closed); L.stroke();
      L.globalAlpha = 0.4; L.lineWidth = w / 2;
      tracePath(L, wobble(base, 2, seed + 1, s0), closed); L.stroke();
    }
    L.globalAlpha = 1;
    L.setLineDash([]);
  }

  function clean(pts, { closed = false, color = 'line', width = spec.line.width, dashed = false }) {
    if (pts.length < 2) return;
    const dash = spec.line.style === 'dashed';
    ctx.save();
    ctx.strokeStyle = colorOf(color);
    ctx.lineWidth = dashed ? width * 0.6 : width;
    ctx.lineCap = dash ? 'butt' : 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash(dash ? [width * 3, width * 2] : dashed ? [12, 10] : []);
    tracePath(ctx, pts, closed);
    ctx.stroke();
    ctx.restore();
  }

  // A colour edge with a core at 30 % of its width; no blur, no halo.
  function light(pts, { closed = false, color = 'line', width = spec.line.width, dashed = false }) {
    if (pts.length < 2) return;
    const w = dashed ? width * 0.6 : width;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash(dashed ? [12, 10] : []);
    tracePath(ctx, pts, closed);
    ctx.strokeStyle = colorOf(color); ctx.lineWidth = w; ctx.stroke();
    if (color === 'line') { ctx.strokeStyle = spec.line.core; ctx.lineWidth = w * 0.3; ctx.stroke(); }
    ctx.restore();
  }

  const stroke = { pencil: sketch, marker: sketch, clean, dashed: clean, light }[spec.line.style];

  function fill(contours, o) {
    const { color = 'fill', mode, progress = 1, angle = Math.PI / 4, lit = 0.5, id } = o;
    const style = o.style ?? (mode === 'solid' ? 'solid' : mode === 'cross' && spec.fill.style === 'hatch' ? 'cross' : spec.fill.style);
    const spacing = o.spacing ?? spec.fill.spacing;
    const w = o.width ?? spec.fill.width;
    const hex = colorOf(color);
    const path = toPath(contours);
    if (style === 'none') return;
    if (style === 'solid') {
      L.save();
      L.fillStyle = hex;
      if (layered) L.globalAlpha = 0.9;
      L.fill(path, 'evenodd');
      L.restore();
      return;
    }
    L.save();
    L.clip(path, 'evenodd');
    if (style === 'hatch' || style === 'cross') {
      const passes = style === 'cross' ? [angle, -angle] : [angle];
      passes.forEach((a, k) => {
        const lines = hatchLines(contours, a, spacing, { fixedEnds: !layered });
        const n = Math.ceil(lines.length * progress);
        if (layered) {
          for (let i = 0; i < n; i++) sketch(lines[i], { color, width: w, id: `${id}:${k}:${lines[i].k}`, s0: lines[i].s0 });
        } else {
          // One stroke per line: a shared path changes how every line rasterises as lines are added.
          L.strokeStyle = hex;
          L.lineWidth = w;
          for (let i = 0; i < n; i++) { L.beginPath(); L.moveTo(...lines[i][0]); L.lineTo(...lines[i][1]); L.stroke(); }
        }
      });
    } else if (style === 'scan') {
      // Scan lines sit on an absolute pitch so they never swim as shapes move.
      const pitch = spec.fill.spacing;
      const b = bbox(contours);
      const rows = [];
      for (let y = Math.floor(b.y0 / pitch) * pitch + pitch / 2; y <= b.y1; y += pitch) rows.push(y);
      const n = Math.ceil(rows.length * progress);
      L.fillStyle = hex;
      const scanLit = o.lit ?? 1;
      for (let i = 0; i < n; i++) {
        const y = rows[i];
        if (typeof scanLit === 'function') {
          for (let x = b.x0; x < b.x1; x += 12) {
            const th = Math.max(0.6, scanLit(x + 6, y) * pitch * 0.7);
            L.fillRect(x, y - th / 2, 12, th);
          }
        } else {
          const th = Math.max(0.6, scanLit * pitch * 0.7);
          L.fillRect(b.x0, y - th / 2, b.x1 - b.x0, th);
        }
      }
    } else if (style === 'dots') {
      // Halftone on a lattice anchored to the frame, so dots stay put as shapes move.
      const b = bbox(contours);
      L.fillStyle = hex;
      const rows = [];
      for (let y = Math.floor(b.y0 / spacing) * spacing; y <= b.y1 + spacing; y += spacing) rows.push(y);
      const n = Math.ceil(rows.length * progress);
      for (let i = 0; i < n; i++) {
        const y = rows[i];
        const shift = (Math.round(y / spacing) % 2) * spacing / 2;
        L.beginPath();
        for (let x = Math.floor(b.x0 / spacing) * spacing - shift; x <= b.x1 + spacing; x += spacing) {
          const v = typeof lit === 'function' ? lit(x, y) : lit;
          const r = Math.max(0, v) * spacing * 0.5;
          if (r < 0.3) continue;
          L.moveTo(x + r, y);
          L.arc(x, y, r, 0, Math.PI * 2);
        }
        L.fill();
      }
    }
    L.restore();
  }

  return {
    layered,
    type: spec.type,
    bg() {
      ctx.fillStyle = spec.bg.color;
      ctx.fillRect(0, 0, W, H);
      const img = spec.bg.image && images[spec.bg.image];
      if (img) {
        const k = Math.max(W / img.width, H / img.height);
        ctx.drawImage(img, (W - img.width * k) / 2, (H - img.height * k) / 2, img.width * k, img.height * k);
      }
      if (spec.bg.grain > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(specks(2, 90000, spec.bg.grain, 1.2, W, H), 0, 0, W, H);
        ctx.restore();
      }
      if (spec.grid) drawGrid(ctx, rgb(spec.grid.color), spec.grid.opacity[0], spec.grid.opacity[1], spec.grid.step, W, H);
    },
    stroke,
    fill,
    flush() {
      if (!layered) return;
      L.save();
      L.setTransform(1, 0, 0, 1, 0, 0);
      L.globalCompositeOperation = 'destination-out';
      L.drawImage(specks(1, 260000, 0.55, 1.6, W, H), 0, 0, layer.width, layer.height);
      L.restore();
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'multiply';
      ctx.drawImage(layer, 0, 0);
      ctx.restore();
    },
  };
}
