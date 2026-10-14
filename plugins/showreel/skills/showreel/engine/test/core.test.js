import test from 'node:test';
import assert from 'node:assert/strict';
import { hash, rand } from '../rng.js';
import { makeClock, labelText } from '../clock.js';
import { spring, expoIn, expoOut, seq } from '../ease.js';

test('rand is deterministic per key and differs across keys', () => {
  const a = rand('x', 1), b = rand('x', 1), c = rand('x', 2);
  const va = [a(), a(), a()];
  assert.deepEqual(va, [b(), b(), b()]);
  assert.notDeepEqual(va, [c(), c(), c()]);
  assert.ok(va.every(v => v >= 0 && v < 1));
  assert.equal(hash('a', 1), hash('a', 1));
});

test('clock maps the 120 BPM, 15 bar grid', () => {
  const c = makeClock();
  assert.equal(c.duration, 30);
  assert.equal(c.totalBeats, 60);
  assert.equal(c.frames, 1800);
  assert.equal(c.beatAt(13.0), 26);
  assert.equal(c.barAt(13.0), 6);
  assert.equal(c.cue(2), 0.95);
  assert.equal(c.wrap(30), 0);
  assert.equal(c.local(1.5, 1, 1), 0.5);
  assert.equal(c.local(5, 1, 1), 1);
});

test('labels wrap at the loop point', () => {
  const c = makeClock();
  const names = 'DRAFT TYPE CURVE MORPH TILE SOLID GEAR PANEL DATA LIGHT WAVE GLOBE DRUM FORM END'.split(' ');
  assert.deepEqual(labelText(c, 13.0, names), { fig: 'FIG. 07 — GEAR', beat: 'BEAT 27 / 60' });
  assert.deepEqual(labelText(c, 30, names), { fig: 'FIG. 01 — DRAFT', beat: 'BEAT 1 / 60' });
});

test('spring starts at 0, ends exactly at 1 and never overshoots', () => {
  for (const w of [12, 20, 40]) {
    assert.equal(spring(0, w), 0);
    assert.equal(spring(10 / w, w), 1);
    let prev = 0;
    for (let s = 0; s <= 1; s += 0.001) {
      const v = spring(s, w);
      assert.ok(v >= prev - 1e-12 && v <= 1, `spring(${s}, ${w}) = ${v} is not monotone in [0, 1]`);
      prev = v;
    }
  }
});

test('expo eases hit their endpoints', () => {
  assert.equal(expoIn(0), 0); assert.equal(expoIn(1), 1);
  assert.equal(expoOut(0), 0); assert.equal(expoOut(1), 1);
  assert.ok(expoIn(0.5) < 0.5 && expoOut(0.5) > 0.5);
});

test('seq chains keyed springs from a start value', () => {
  const keys = [{ at: 1, to: 10, w: 20 }, { at: 2, to: 4, w: 20 }];
  assert.equal(seq(0.5, 0, keys), 0);
  assert.equal(seq(1.9, 0, keys), 10);
  assert.equal(seq(5, 0, keys), 4);
});
