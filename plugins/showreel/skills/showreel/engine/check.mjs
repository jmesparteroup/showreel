#!/usr/bin/env node
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { openRenderer } from './frames.mjs';

const MARGIN = { x: 150, y: 90 };
const SWEEP_SCALE = 0.25;
const HOLD_LIMIT = 30; // frames at 60 fps = 0.5 s
const PALETTE_TOL = 48;
const PALETTE_MAX_OUT = 0.005;

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));

export function checkBeats(m) {
  const stray = m.cues.filter(c => c < -0.05 - 1e-6 || c >= m.duration);
  const missing = [];
  for (let k = 0; k < m.totalBeats; k++) {
    const beat = k * m.spb;
    if (!m.cues.some(c => c >= beat - 0.05 - 1e-6 && c <= beat + 1e-6)) missing.push(k + 1);
  }
  const ok = !missing.length && !stray.length;
  const detail = ok
    ? `${m.totalBeats} beats cued`
    : [missing.length && `beats without a cue: ${missing.join(', ')}`, stray.length && `cues outside the film: ${stray.join(', ')}`].filter(Boolean).join('; ');
  return { name: 'beats', ok, detail };
}

function meanDiff(a, b) {
  let d = 0, n = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    d += Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2]);
    n += 3;
  }
  return d / n;
}

function identical(a, b, masks) {
  const s = SWEEP_SCALE;
  for (let y = 0; y < a.height; y++)
    for (let x = 0; x < a.width; x++) {
      if (masks.some(m => x >= m.x * s && x < (m.x + m.w) * s && y >= m.y * s && y < (m.y + m.h) * s)) continue;
      const i = (y * a.width + x) * 4;
      if (Math.abs(a.data[i] - b.data[i]) > 2 || Math.abs(a.data[i + 1] - b.data[i + 1]) > 2 || Math.abs(a.data[i + 2] - b.data[i + 2]) > 2) return false;
    }
  return true;
}

function segDist(p, a, b) {
  const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const ap = [p[0] - a[0], p[1] - a[1], p[2] - a[2]];
  const L = ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2;
  const u = L ? Math.max(0, Math.min(1, (ap[0] * ab[0] + ap[1] * ab[1] + ap[2] * ab[2]) / L)) : 0;
  return Math.hypot(ap[0] - ab[0] * u, ap[1] - ab[1] * u, ap[2] - ab[2] * u);
}

// A pixel is in palette if it lies near the blend line between any two
// palette colours; anti-aliasing and alpha only ever produce such blends.
function outsidePalette(px, palette) {
  const cols = palette.map(hex);
  const pairs = [];
  for (let i = 0; i < cols.length; i++) for (let j = i; j < cols.length; j++) pairs.push([cols[i], cols[j]]);
  const cache = new Map();
  let out = 0;
  for (let i = 0; i < px.data.length; i += 4) {
    const key = (px.data[i] << 16) | (px.data[i + 1] << 8) | px.data[i + 2];
    let bad = cache.get(key);
    if (bad === undefined) {
      const p = [px.data[i], px.data[i + 1], px.data[i + 2]];
      bad = !pairs.some(([a, b]) => segDist(p, a, b) <= PALETTE_TOL);
      cache.set(key, bad);
    }
    if (bad) out++;
  }
  return out / (px.data.length / 4);
}

export async function runChecks(filmDir, { only, range, workers = Math.max(1, Math.min(4, os.cpus().length - 1)) } = {}) {
  const want = name => !only || only.includes(name);
  const r = await openRenderer(filmDir, { pages: workers });
  const results = [];
  try {
    const m = r.meta;
    if (want('beats')) results.push(checkBeats(m));
    if (want('loop')) {
      const a = await r.pixels(0, { frozen: true, scale: 0.5 });
      const b = await r.pixels(m.duration, { frozen: true, scale: 0.5 });
      const d = meanDiff(a, b);
      results.push({ name: 'loop', ok: d < 1, detail: d < 1 ? 'last frame equals the first' : `last frame differs from the first (mean diff ${d.toFixed(2)}/255)` });
    }
    if (want('border') || want('holds') || want('palette')) {
      const f0 = range ? Math.round(range[0] * m.fps) : 0;
      const f1 = range ? Math.round(range[1] * m.fps) : m.frames;
      const same = new Array(f1).fill(false);
      const borderHits = [], paletteHits = [];
      const chunk = Math.ceil((f1 - f0) / r.pages.length);
      await Promise.all(r.pages.map(async (page, w) => {
        const a = f0 + w * chunk, b = Math.min(f1, a + chunk);
        if (a >= b) return;
        let prev = a > f0 ? await r.pixels((a - 1) / m.fps, { frozen: true, scale: SWEEP_SCALE }, page) : null;
        for (let i = a; i < b; i++) {
          const t = i / m.fps;
          const px = await r.pixels(t, { frozen: true, scale: SWEEP_SCALE }, page);
          for (const box of px.rest)
            if (box.x < MARGIN.x - 0.5 || box.y < MARGIN.y - 0.5 || box.x + box.w > 1920 - MARGIN.x + 0.5 || box.y + box.h > 1080 - MARGIN.y + 0.5)
              borderHits.push(`t=${t.toFixed(3)} rest box ${JSON.stringify(box)}`);
          if (prev) same[i] = identical(prev, px, px.labels);
          if (want('palette') && i % Math.round(m.spb * m.fps) === 0) {
            const frac = outsidePalette(px, m.palette);
            if (frac > PALETTE_MAX_OUT) paletteHits.push(`t=${t.toFixed(2)} ${(frac * 100).toFixed(1)}%`);
          }
          prev = px;
        }
      }));
      if (want('border'))
        results.push({ name: 'border', ok: !borderHits.length, detail: borderHits.length ? `${borderHits.length} frames: ${borderHits.slice(0, 5).join('; ')}` : 'border clear' });
      if (want('holds')) {
        const holds = [];
        let run = 1;
        for (let i = f0 + 1; i <= f1; i++) {
          if (i < f1 && same[i]) { run++; continue; }
          if (run > HOLD_LIMIT) holds.push(`hold of ${run} frames ending t=${((i - 1) / m.fps).toFixed(2)}`);
          run = 1;
        }
        results.push({ name: 'holds', ok: !holds.length, detail: holds.length ? holds.join('; ') : 'no hold over 0.5 s' });
      }
      if (want('palette'))
        results.push({ name: 'palette', ok: !paletteHits.length, detail: paletteHits.length ? `pixels outside the palette at ${paletteHits.join(', ')}` : 'palette clean' });
    }
  } finally {
    await r.close();
  }
  return results;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const flagValues = new Set(['--only', '--range'].map(f => args.indexOf(f) + 1).filter(i => i > 0));
  const dir = args.find((a, i) => !a.startsWith('--') && !flagValues.has(i));
  const opt = k => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : undefined; };
  if (!dir) { console.error('usage: check.mjs <filmDir> [--only beats,loop,border,holds,palette] [--range t0,t1]'); process.exit(2); }
  const results = await runChecks(dir, { only: opt('only')?.split(','), range: opt('range')?.split(',').map(Number) });
  for (const r of results) console.log(`${r.ok ? 'pass' : 'FAIL'}  ${r.name.padEnd(8)} ${r.detail}`);
  process.exit(results.every(r => r.ok) ? 0 : 1);
}
