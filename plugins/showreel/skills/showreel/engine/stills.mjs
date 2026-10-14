#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openRenderer } from './frames.mjs';

export async function writeStills(filmDir, times) {
  const r = await openRenderer(filmDir);
  try {
    return await render(r, filmDir, times);
  } finally {
    await r.close();
  }
}

// Bar timing comes from the page, so the film's code only ever runs inside the browser.
export async function writeBarStills(filmDir) {
  const r = await openRenderer(filmDir);
  try {
    return await render(r, filmDir, barTimes({ bars: r.meta.bars, barDur: r.meta.duration / r.meta.bars }));
  } finally {
    await r.close();
  }
}

async function render(r, filmDir, times) {
  const dir = path.join(filmDir, 'out', 'stills');
  fs.mkdirSync(dir, { recursive: true });
  const paths = [];
  for (const t of times) {
    const file = path.join(dir, `t-${t.toFixed(3).padStart(6, '0')}.png`);
    fs.writeFileSync(file, (await r.frame(t)).png);
    paths.push(file);
  }
  return paths;
}

export function barTimes({ bars, barDur = 2 }) {
  return Array.from({ length: bars }, (_, b) => [b * barDur + 0.25, b * barDur + barDur / 2]).flat();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [dir, ...rest] = process.argv.slice(2);
  if (!dir) { console.error('usage: stills.mjs <filmDir> (--bars | t1 t2 ...)'); process.exit(2); }
  const paths = rest[0] === '--bars' ? await writeBarStills(dir) : await writeStills(dir, rest.map(Number));
  for (const p of paths) console.log(p);
}
