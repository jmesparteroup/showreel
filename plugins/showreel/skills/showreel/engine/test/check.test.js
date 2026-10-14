import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { runChecks } from '../check.mjs';

const fixture = name => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));
const byName = rs => Object.fromEntries(rs.map(r => [r.name, r]));

test('a clean film passes every check', async () => {
  const r = byName(await runChecks(fixture('ok')));
  for (const name of ['beats', 'loop', 'border', 'holds', 'palette']) assert.ok(r[name].ok, `${name}: ${r[name].detail}`);
});

for (const [fx, name, pattern] of [
  ['hold', 'holds', /hold of \d+ frames/],
  ['border', 'border', /rest box/],
  ['beats', 'beats', /beats without a cue: 3/],
  ['loop', 'loop', /last frame differs/],
  ['palette', 'palette', /outside the palette/],
]) {
  test(`${fx} fixture fails the ${name} check`, async () => {
    const r = byName(await runChecks(fixture(fx), { only: [name] }));
    assert.equal(r[name].ok, false);
    assert.match(r[name].detail, pattern);
  });
}

for (const [fx, name, pattern] of [
  ['loopsmall', 'loop', /last frame differs/],
  ['seamhold', 'holds', /across the loop/],
  ['norest', 'border', /no rest boxes/],
  ['offbeat', 'palette', /outside the palette/],
]) {
  test(`${fx} fixture fails the ${name} check`, async () => {
    const r = byName(await runChecks(fixture(fx), { only: [name] }));
    assert.equal(r[name].ok, false, r[name].detail);
    assert.match(r[name].detail, pattern);
  });
}
