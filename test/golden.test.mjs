import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { openRenderer } from '../plugins/showreel/skills/showreel/engine/frames.mjs';

const FILM = fileURLToPath(new URL('../plugins/showreel/skills/showreel/examples/claude-motion-designer', import.meta.url));
const GOLDEN = fileURLToPath(new URL('./golden', import.meta.url));
const TIMES = [1.0, 9.75, 18.25, 27.25];

// Goldens are gzipped raw RGBA at quarter scale with the wobble frozen, so the
// comparison is per pixel and independent of any PNG encoder. They live outside
// the plugin folder so installs do not carry them.
test('reference film matches its golden frames', async () => {
  const r = await openRenderer(FILM);
  try {
    for (const t of TIMES) {
      const file = `${GOLDEN}/t-${t.toFixed(3).padStart(6, '0')}.rgba.gz`;
      const px = await r.pixels(t, { frozen: true, scale: 0.25 });
      if (process.env.UPDATE_GOLDEN) {
        fs.mkdirSync(GOLDEN, { recursive: true });
        fs.writeFileSync(file, zlib.gzipSync(px.data));
        continue;
      }
      const want = zlib.gunzipSync(fs.readFileSync(file));
      // Worst 8 x 8 block, so a change to one small element fails instead of averaging away.
      let worst = 0;
      for (let by = 0; by < px.height; by += 8)
        for (let bx = 0; bx < px.width; bx += 8) {
          let d = 0, n = 0;
          for (let y = by; y < Math.min(by + 8, px.height); y++)
            for (let x = bx; x < Math.min(bx + 8, px.width); x++)
              for (let c = 0; c < 3; c++) { const i = (y * px.width + x) * 4 + c; d += Math.abs(want[i] - px.data[i]); n++; }
          worst = Math.max(worst, d / n);
        }
      assert.ok(worst <= 12, `t=${t}: an 8 x 8 block differs by ${worst.toFixed(1)}/255 (limit 12)`);
    }
  } finally { await r.close(); }
});
