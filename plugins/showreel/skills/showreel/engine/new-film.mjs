#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const pad = n => String(n).padStart(2, '0');

const barModule = n => `// Bar ${n}. Owns film time [${(n - 1) * 2 - 0.05}, ${n * 2 - 0.05}).
export const cues = [${[0, 1, 2, 3].map(k => Math.round((((n - 1) * 4 + k) * 0.5 - 0.05) * 100) / 100).join(', ')}];

export function draw(t, api) {
  const p = api.pen('paper');
  p.bg();
  p.stroke(api.geom.line(330, 540, 1590, 540));
  api.labels(p);
  p.flush();
}
`;

export function newFilm(root, slug, { bpm = 120, bars = 15 } = {}) {
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`slug "${slug}" must be lowercase letters, digits and dashes`);
  const dir = path.join(root, 'films', slug);
  if (fs.existsSync(dir)) throw new Error(`${dir} already exists`);
  fs.mkdirSync(path.join(dir, 'bars'), { recursive: true });
  const nums = Array.from({ length: bars }, (_, i) => i + 1);
  for (const n of nums) fs.writeFileSync(path.join(dir, 'bars', `${pad(n)}.js`), barModule(n));
  fs.writeFileSync(path.join(dir, 'shared.js'), '// Geometry handed from one bar to the next. Each bar starts from the state the previous one ends in.\n');
  fs.writeFileSync(path.join(dir, 'brief.md'), `# ${slug}\n`);
  fs.writeFileSync(path.join(dir, 'scenes.js'), `${nums.map(n => `import * as b${pad(n)} from './bars/${pad(n)}.js';`).join('\n')}

const BARS = [${nums.map(n => `b${pad(n)}`).join(', ')}];
const BAR = ${(60 / bpm) * 4};

export default {
  slug: '${slug}',
  bpm: ${bpm},
  bars: ${bars},
  barNames: [${nums.map(n => `'BAR ${n}'`).join(', ')}],
  palette: ['#EDE6D5', '#1B3ED2', '#45F0DD', '#07080A', '#16161A', '#FFFFFF'],
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
  const [slug, bars] = process.argv.slice(2);
  if (!slug) { console.error('usage: new-film.mjs <slug> [bars]'); process.exit(2); }
  console.log(newFilm(process.cwd(), slug, { bars: bars ? Number(bars) : 15 }));
}
