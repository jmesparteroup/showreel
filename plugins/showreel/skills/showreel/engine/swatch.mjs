#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openRenderer } from './frames.mjs';

// One PNG per brand ink, for approving the look before any scene code exists.
export async function writeSwatches(filmDir) {
  const r = await openRenderer(filmDir, { entry: '/engine/swatch-film.js' });
  try {
    const dir = path.join(filmDir, 'out', 'swatches');
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    const files = [];
    for (const [k, name] of r.meta.brand.inkNames.entries()) {
      const file = path.join(dir, `${name}.png`);
      fs.writeFileSync(file, (await r.frame(k + 0.5, { frozen: true })).png);
      files.push(file);
    }
    for (const w of r.meta.brand.warnings) console.error(`note: ${w}`);
    return files;
  } finally {
    await r.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = process.argv[2];
  if (!dir) { console.error('usage: swatch.mjs <filmDir>'); process.exit(2); }
  for (const f of await writeSwatches(dir)) console.log(f);
}
