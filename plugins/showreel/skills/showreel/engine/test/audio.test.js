import test from 'node:test';
import assert from 'node:assert/strict';
import { renderScore, SOUND_KINDS } from '../audio/synth.mjs';
import { encodeWav } from '../audio/wav.mjs';

const base = { duration: 4, bpm: 120, beatsPerBar: 4, bars: 2, sounds: [], style: 'electronic', key: { root: 'A', mode: 'minor' }, sampleRate: 16000 };
const rms = (ch, t0, t1, sr) => { let s = 0; const a = Math.round(t0 * sr), b = Math.round(t1 * sr); for (let i = a; i < b; i++) s += ch[i] * ch[i]; return Math.sqrt(s / (b - a)); };

test('the score is exactly the film length and deterministic', () => {
  const a = renderScore(base), b = renderScore(base);
  assert.equal(a[0].length, 4 * 16000);
  assert.ok(a[0].every((v, i) => v === b[0][i]), 'two renders differ');
});

test('the score never clips', () => {
  for (const style of ['minimal', 'electronic', 'organic']) {
    const [l, r] = renderScore({ ...base, style });
    let peak = 0;
    for (let i = 0; i < l.length; i++) peak = Math.max(peak, Math.abs(l[i]), Math.abs(r[i]));
    assert.ok(peak <= 0.9 && peak > 0.3, `${style} peak ${peak}`);
  }
});

test('electronic drums put more energy on the beat than between beats', () => {
  const [l] = renderScore(base);
  let on = 0, off = 0;
  for (let k = 0; k < 8; k++) { on += rms(l, k * 0.5, k * 0.5 + 0.06, 16000); off += rms(l, k * 0.5 + 0.3, k * 0.5 + 0.36, 16000); }
  assert.ok(on > off * 1.5, `on-beat ${on.toFixed(3)} vs off-beat ${off.toFixed(3)}`);
});

test('a sound near the end wraps round to the start of the loop', () => {
  const [l] = renderScore({ ...base, style: 'none', sounds: [{ t: 3.99, kind: 'hit' }] });
  assert.ok(rms(l, 0, 0.05, 16000) > 0.01, 'the hit tail did not wrap to t = 0');
});

test('style none with no sounds is silent; every sound kind renders', () => {
  const [silent] = renderScore({ ...base, style: 'none' });
  assert.ok(silent.every(v => v === 0));
  for (const kind of SOUND_KINDS.filter(k => k !== 'none')) {
    const [l] = renderScore({ ...base, style: 'none', sounds: [{ t: 1, kind, count: 4 }] });
    assert.ok(rms(l, 0.6, 1.6, 16000) > 0.001, `${kind} made no sound`);
  }
});

test('an unknown sound kind names the kinds', () => {
  assert.throws(() => renderScore({ ...base, sounds: [{ t: 1, kind: 'boom' }] }), /sounds\[0\]\.kind: "boom" is not one of hit, whoosh/);
});

test('the WAV header describes 16-bit stereo PCM', () => {
  const buf = encodeWav([new Float32Array([0, 0.5, -0.5]), new Float32Array([0, 0.25, -0.25])], 48000);
  assert.equal(buf.toString('ascii', 0, 4), 'RIFF');
  assert.equal(buf.toString('ascii', 8, 12), 'WAVE');
  assert.equal(buf.readUInt16LE(22), 2);
  assert.equal(buf.readUInt32LE(24), 48000);
  assert.equal(buf.readUInt16LE(34), 16);
  assert.equal(buf.readUInt32LE(40), 3 * 2 * 2);
  assert.equal(buf.readInt16LE(44 + 4), Math.round(0.5 * 32767));
});
