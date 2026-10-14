#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import ffmpeg from 'ffmpeg-static';
import { openRenderer } from './frames.mjs';

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    p.stderr.on('data', d => { err += d; });
    p.on('close', code => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}\n${err.slice(-2000)}`))));
  });
}

export async function exportFilm(filmDir, { out, workers = Math.max(1, Math.min(6, os.cpus().length - 1)), frames } = {}) {
  const r = await openRenderer(filmDir, { pages: workers });
  try {
    const { fps, slug } = r.meta;
    const [from, to] = frames ?? [0, r.meta.frames];
    const dir = path.join(filmDir, 'out', 'frames');
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    let next = from, done = 0;
    await Promise.all(r.pages.map(async page => {
      while (next < to) {
        const i = next++;
        const { png } = await r.frame(i / fps, {}, page);
        fs.writeFileSync(path.join(dir, `${String(i - from).padStart(5, '0')}.png`), png);
        if (++done % 60 === 0) process.stderr.write(`\r${done}/${to - from} frames`);
      }
    }));
    if (done >= 60) process.stderr.write('\n');
    const mp4 = out ?? path.join(filmDir, 'out', `${slug}.mp4`);
    await run(ffmpeg, ['-y', '-framerate', String(fps), '-i', path.join(dir, '%05d.png'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-movflags', '+faststart', mp4]);
    // A full film is about a gigabyte of PNGs; the MP4 is the deliverable.
    fs.rmSync(dir, { recursive: true, force: true });
    return mp4;
  } finally {
    await r.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [dir, out] = process.argv.slice(2);
  if (!dir) { console.error('usage: export.mjs <filmDir> [out.mp4]'); process.exit(2); }
  console.log(await exportFilm(dir, { out }));
}
