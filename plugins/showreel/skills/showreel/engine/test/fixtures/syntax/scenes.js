import * as b01 from './bars/01.js';

export default {
  slug: 'fixture-syntax', bpm: 120, bars: 1, barNames: ['X'], cues: [], palette: [],
  draw(ctx, t, api) { b01.draw(t, api); },
};
