#!/usr/bin/env node
// Downloads the brand's google:<Family>:<weight> fonts into films/<slug>/fonts/ and
// points brand.json at the local files. The only network step; renders stay offline.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// A non-browser user agent makes the Google Fonts CSS API answer with TTF, which
// opentype.js reads; browser agents get WOFF2 (unreadable) or EOT.
const UA = 'showreel-fetch-fonts';

export async function fetchFonts(filmDir, { fetch: get = fetch } = {}) {
  const file = path.join(filmDir, 'brand.json');
  const brand = JSON.parse(fs.readFileSync(file, 'utf8'));
  const written = [];
  for (const [role, spec] of Object.entries(brand.fonts ?? {})) {
    const m = typeof spec === 'string' && spec.match(/^google:([^:]+):(\d+)$/);
    if (!m) continue;
    const [, family, weight] = m;
    const css = await get(`https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@${weight}`, { headers: { 'user-agent': UA } });
    if (!css.ok) throw new Error(`google font ${family} ${weight}: HTTP ${css.status}`);
    const src = (await css.text()).match(/url\((https:[^)]+\.(?:ttf|otf))\)/);
    if (!src) throw new Error(`google font ${family} ${weight}: no TTF in the CSS response`);
    const res = await get(src[1]);
    if (!res.ok) throw new Error(`google font ${family} ${weight}: download HTTP ${res.status}`);
    const name = `${family.replace(/[^A-Za-z0-9]/g, '')}-${weight}${path.extname(src[1])}`;
    fs.mkdirSync(path.join(filmDir, 'fonts'), { recursive: true });
    fs.writeFileSync(path.join(filmDir, 'fonts', name), Buffer.from(await res.arrayBuffer()));
    brand.fonts[role] = `fonts/${name}`;
    written.push(path.join(filmDir, 'fonts', name));
  }
  fs.writeFileSync(file, JSON.stringify(brand, null, 2) + '\n');
  return written;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = process.argv[2];
  if (!dir) { console.error('usage: fetch-fonts.mjs <filmDir>'); process.exit(2); }
  for (const f of await fetchFonts(dir)) console.log(f);
}
