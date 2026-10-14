import { drawGrid, tracePath, toPath, hatchLines } from './common.js';

export const colors = { bg: '#1B3ED2', grid: '255,255,255', line: '#FFFFFF', accent: '#45F0DD', solid: '#FFFFFF' };

export function begin(ctx) {
  return {
    typeSpacing: 6, typeOutline: 3, doubleOutline: false,
    bg() {
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, 1920, 1080);
      drawGrid(ctx, colors.grid);
    },
    stroke(pts, { closed = false, color = 'line', width = 3.5, dashed = false }) {
      if (pts.length < 2) return;
      ctx.save();
      ctx.strokeStyle = colors[color];
      ctx.lineWidth = dashed ? width * 0.6 : width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash(dashed ? [12, 10] : []);
      tracePath(ctx, pts, closed);
      ctx.stroke();
      ctx.restore();
    },
    fill(contours, { color = 'line', mode = 'hatch', progress = 1, spacing = 7, angle = Math.PI / 4, width = 1.2 }) {
      const path = toPath(contours);
      ctx.save();
      ctx.fillStyle = ctx.strokeStyle = colors[color];
      if (mode === 'solid') ctx.fill(path, 'evenodd');
      else {
        ctx.clip(path, 'evenodd');
        ctx.lineWidth = width;
        for (const a of mode === 'cross' ? [angle, -angle] : [angle]) {
          const lines = hatchLines(contours, a, spacing);
          const n = Math.ceil(lines.length * progress);
          ctx.beginPath();
          for (let i = 0; i < n; i++) { ctx.moveTo(...lines[i][0]); ctx.lineTo(...lines[i][1]); }
          ctx.stroke();
        }
      }
      ctx.restore();
    },
    flush() {},
  };
}
