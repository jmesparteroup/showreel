import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import zlib from 'node:zlib';
import { openRenderer } from '../plugins/showreel/skills/showreel/engine/frames.mjs';

const FILM = new URL('../plugins/showreel/skills/showreel/examples/claude-motion-designer', import.meta.url).pathname;
const GOLDEN = new URL('./golden', import.meta.url).pathname;
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
      let d = 0;
      for (let i = 0; i < want.length; i++) d += Math.abs(want[i] - px.data[i]);
      assert.ok(d / want.length < 2, `t=${t}: mean diff ${(d / want.length).toFixed(2)} exceeds 2/255`);
    }
  } finally { await r.close(); }
});
