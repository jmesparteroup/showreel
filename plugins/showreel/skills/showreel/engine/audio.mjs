#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { openRenderer } from './frames.mjs';
import { writeAudio } from './audio/render.mjs';

// Writes the film's soundtrack on its own, for listening while the picture is built.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = process.argv[2];
  if (!dir) { console.error('usage: audio.mjs <filmDir>'); process.exit(2); }
  const r = await openRenderer(dir);
  try { console.log(await writeAudio(dir, r.meta)); } finally { await r.close(); }
}
