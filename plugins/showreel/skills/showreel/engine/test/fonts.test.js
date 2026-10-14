import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchFonts } from '../fetch-fonts.mjs';

const GEIST = fs.readFileSync(fileURLToPath(new URL('../../fonts/Geist-SemiBold.otf', import.meta.url)));

test('google fonts are downloaded into the film and brand.json points at them', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fonts-'));
  fs.writeFileSync(path.join(dir, 'brand.json'), JSON.stringify({
    name: 'X', palette: { a: '#000000', b: '#FFFFFF' },
    fonts: { display: 'google:Space Grotesk:700', label: 'google:Inter:600', body: 'geist:600' },
    inks: [{ name: 'paper', preset: 'paper' }],
  }));
  const asked = [];
  const fakeFetch = async url => {
    asked.push(url);
    if (url.startsWith('https://fonts.googleapis.com/css2')) {
      return new Response(`@font-face { font-family: 'X'; src: url(https://fonts.gstatic.com/s/x/v1/file.ttf) format('truetype'); }`);
    }
    return new Response(GEIST);
  };
  const written = await fetchFonts(dir, { fetch: fakeFetch });
  const brand = JSON.parse(fs.readFileSync(path.join(dir, 'brand.json'), 'utf8'));
  assert.equal(brand.fonts.display, 'fonts/SpaceGrotesk-700.ttf');
  assert.equal(brand.fonts.label, 'fonts/Inter-600.ttf');
  assert.equal(brand.fonts.body, 'geist:600');
  assert.equal(written.length, 2);
  assert.ok(fs.statSync(path.join(dir, 'fonts', 'Inter-600.ttf')).size > 1000);
  assert.ok(asked.some(u => u.includes('family=Space+Grotesk:wght@700')));
});

test('a font Google does not have fails with the family name', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fonts-'));
  fs.writeFileSync(path.join(dir, 'brand.json'), JSON.stringify({
    name: 'X', palette: { a: '#000000', b: '#FFFFFF' }, fonts: { label: 'google:Nope Sans:600' }, inks: [{ name: 'paper', preset: 'paper' }],
  }));
  const fakeFetch = async () => new Response('Not found', { status: 400 });
  await assert.rejects(fetchFonts(dir, { fetch: fakeFetch }), /Nope Sans 600: HTTP 400/);
});
