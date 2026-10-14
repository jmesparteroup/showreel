export default {
  slug: 'fixture-throws', bpm: 120, bars: 1, barNames: ['X'], cues: [], palette: [],
  draw() { throw new Error('bar 1 exploded'); },
};
