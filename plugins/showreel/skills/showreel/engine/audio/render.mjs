import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import { renderScore } from './synth.mjs';
import { encodeWav } from './wav.mjs';

const SR = 48000;

function run(args) {
  return new Promise((resolve, reject) => {
    const p = spawn(ffmpeg, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    p.stderr.on('data', d => { err += d; });
    p.on('close', code => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}\n${err.slice(-1500)}`))));
  });
}

// Without tagged sounds, every cue gets a soft tick so the moves are still heard.
const defaultSounds = meta => meta.cues.map(t => ({ t: Math.max(0, t + 0.05), kind: 'tick', gain: 0.6 }));

// Writes out/<slug>.wav, one film long: the brand's own track looped and trimmed,
// or the generated score. Returns its path.
export async function writeAudio(filmDir, meta) {
  const out = path.join(filmDir, 'out', `${meta.slug}.wav`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const s = meta.brand.sound;
  if (s.file) {
    const src = path.resolve(filmDir, s.file);
    if (!fs.existsSync(src)) throw new Error(`brand.json sound.file: ${src} not found`);
    await run(['-y', '-stream_loop', '-1', '-ss', String(Math.max(0, s.offset)), '-i', src, '-t', String(meta.duration),
      '-af', `volume=${s.gain}`, '-ar', String(SR), '-ac', '2', '-c:a', 'pcm_s16le', out]);
    return out;
  }
  const channels = renderScore({
    duration: meta.duration, bpm: meta.bpm, beatsPerBar: meta.beatsPerBar, bars: meta.bars,
    sounds: meta.sounds ?? defaultSounds(meta), style: s.style, key: s.key, sampleRate: SR, gain: s.gain,
  });
  fs.writeFileSync(out, encodeWav(channels, SR));
  return out;
}
