import * as b02 from './bars/02.js';

export default {
  slug: 'fixture-missing-import', bpm: 120, bars: 1, barNames: ['X'], cues: [], palette: [],
  draw(ctx, t, api) { b02.draw(t, api); },
};
