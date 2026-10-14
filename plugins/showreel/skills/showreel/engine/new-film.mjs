#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_BRAND } from './brand.js';

const pad = n => String(n).padStart(2, '0');
const r2 = v => Math.round(v * 1000) / 1000;

const barModule = (n, spb, beatsPerBar) => {
  const bar = spb * beatsPerBar, start = (n - 1) * bar;
  // Cues keep full precision: at tempos like 90 BPM a rounded cue can fall just outside its beat's window.
  const cues = Array.from({ length: beatsPerBar }, (_, k) => start + k * spb - 0.05);
  return `// Bar ${n}. Owns film time [${r2(start - 0.05)}, ${r2(start + bar - 0.05)}).
export const cues = [${cues.join(', ')}];

export function draw(t, api) {
  const p = api.pen(api.brand.inkNames[0]);
  p.bg();
  p.stroke(api.geom.line(api.W * 0.2, api.CY, api.W * 0.8, api.CY));
  api.labels(p);
  p.flush();
}
`;
};

export function newFilm(root, slug, { bpm = 120, bars = 15, beatsPerBar = 4, fps = 60, size = [1920, 1080] } = {}) {
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`slug "${slug}" must be lowercase letters, digits and dashes`);
  const dir = path.join(root, 'films', slug);
  if (fs.existsSync(dir)) throw new Error(`${dir} already exists`);
  fs.mkdirSync(path.join(dir, 'bars'), { recursive: true });
  const spb = 60 / bpm;
  const nums = Array.from({ length: bars }, (_, i) => i + 1);
  for (const n of nums) fs.writeFileSync(path.join(dir, 'bars', `${pad(n)}.js`), barModule(n, spb, beatsPerBar));
  fs.writeFileSync(path.join(dir, 'shared.js'), '// Geometry handed from one bar to the next. Each bar starts from the state the previous one ends in.\n');
  fs.writeFileSync(path.join(dir, 'brief.md'), `# ${slug}\n`);
  fs.writeFileSync(path.join(dir, 'brand.json'), JSON.stringify(DEFAULT_BRAND, null, 2) + '\n');
  fs.writeFileSync(path.join(dir, 'scenes.js'), `${nums.map(n => `import * as b${pad(n)} from './bars/${pad(n)}.js';`).join('\n')}

const BARS = [${nums.map(n => `b${pad(n)}`).join(', ')}];
const BAR = ${r2(spb * beatsPerBar)};

export default {
  slug: '${slug}',
  bpm: ${bpm},
  bars: ${bars},
  beatsPerBar: ${beatsPerBar},
  fps: ${fps},
  size: [${size[0]}, ${size[1]}],
  barNames: [${nums.map(n => `'BAR ${n}'`).join(', ')}],
  cues: BARS.flatMap(b => b.cues),
  // A bar owns the 0.05 s lead-in before its first beat, so moves that land
  // on a downbeat start inside the bar that animates them.
  draw(ctx, t, api) {
    BARS[Math.min(BARS.length - 1, Math.floor((t + 0.05) / BAR))].draw(t, api);
  },
};
`);
  return dir;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const opt = k => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : undefined; };
  const values = new Set(['--bpm', '--bars', '--beats-per-bar', '--fps', '--size'].map(f => args.indexOf(f) + 1).filter(i => i > 0));
  const slug = args.find((a, i) => !a.startsWith('--') && !values.has(i));
  if (!slug) { console.error('usage: new-film.mjs <slug> [--bpm 120] [--bars 15] [--beats-per-bar 4] [--fps 60] [--size 1920x1080]'); process.exit(2); }
  const size = opt('size')?.split('x').map(Number);
  console.log(newFilm(process.cwd(), slug, {
    bpm: Number(opt('bpm') ?? 120), bars: Number(opt('bars') ?? 15), beatsPerBar: Number(opt('beats-per-bar') ?? 4),
    fps: Number(opt('fps') ?? 60), size: size ?? [1920, 1080],
  }));
}
