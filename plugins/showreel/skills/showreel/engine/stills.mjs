#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { openRenderer } from './frames.mjs';

export async function writeStills(filmDir, times) {
  const r = await openRenderer(filmDir);
  try {
    const dir = path.join(filmDir, 'out', 'stills');
    fs.mkdirSync(dir, { recursive: true });
    const paths = [];
    for (const t of times) {
      const file = path.join(dir, `t-${t.toFixed(3).padStart(6, '0')}.png`);
      fs.writeFileSync(file, (await r.frame(t)).png);
      paths.push(file);
    }
    return paths;
  } finally {
    await r.close();
  }
}

export function barTimes({ bars, barDur = 2 }) {
  return Array.from({ length: bars }, (_, b) => [b * barDur + 0.25, b * barDur + barDur / 2]).flat();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [dir, ...rest] = process.argv.slice(2);
  if (!dir) { console.error('usage: stills.mjs <filmDir> (--bars | t1 t2 ...)'); process.exit(2); }
  let times = rest.map(Number);
  if (rest[0] === '--bars') {
    const film = (await import(pathToFileURL(path.resolve(dir, 'scenes.js')).href)).default;
    times = barTimes({ bars: film.bars, barDur: (60 / film.bpm) * 4 });
  }
  for (const p of await writeStills(dir, times)) console.log(p);
}
