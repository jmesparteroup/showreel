import { drawGrid, tracePath, toPath, bbox } from './common.js';

export const colors = { bg: '#07080A', grid: '69,240,221', line: '#45F0DD', accent: '#FFFFFF', solid: '#FFFFFF' };

const PITCH = 8;

export function begin(ctx) {
  return {
    typeSpacing: PITCH, typeOutline: 3, doubleOutline: false,
    bg() {
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, 1920, 1080);
      drawGrid(ctx, colors.grid);
    },
    // A cyan line with a white core at 30 % of its width; no blur, no halo.
    stroke(pts, { closed = false, color = 'line', width = 4, dashed = false }) {
      if (pts.length < 2) return;
      const w = dashed ? width * 0.6 : width;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash(dashed ? [12, 10] : []);
      tracePath(ctx, pts, closed);
      ctx.strokeStyle = colors[color]; ctx.lineWidth = w; ctx.stroke();
      if (color === 'line') { ctx.strokeStyle = colors.accent; ctx.lineWidth = w * 0.3; ctx.stroke(); }
      ctx.restore();
    },
    // Scan lines sit on an absolute 8 px pitch so they never swim as shapes move.
    fill(contours, { color = 'line', mode = 'scan', progress = 1, lit = 1 }) {
      const path = toPath(contours);
      ctx.save();
      ctx.fillStyle = colors[color];
      if (mode === 'solid') { ctx.fill(path, 'evenodd'); ctx.restore(); return; }
      ctx.clip(path, 'evenodd');
      const b = bbox(contours);
      const rows = [];
      for (let y = Math.floor(b.y0 / PITCH) * PITCH + PITCH / 2; y <= b.y1; y += PITCH) rows.push(y);
      const n = Math.ceil(rows.length * progress);
      for (let i = 0; i < n; i++) {
        const y = rows[i];
        if (typeof lit === 'function') {
          for (let x = b.x0; x < b.x1; x += 12) {
            const th = Math.max(0.6, lit(x + 6, y) * PITCH * 0.7);
            ctx.fillRect(x, y - th / 2, 12, th);
          }
        } else {
          const th = Math.max(0.6, lit * PITCH * 0.7);
          ctx.fillRect(b.x0, y - th / 2, b.x1 - b.x0, th);
        }
      }
      ctx.restore();
    },
    flush() {},
  };
}
