export default {
  slug: 'fixture-mascot', bpm: 120, bars: 1, barNames: ['RUN'], cues: [], palette: [],
  draw(ctx, t, api) {
    const ink = t < 1 ? 'paper' : 'hologram';
    const p = api.pen(ink);
    p.bg();
    api.rest(api.mascot(p, { x: 960, y: 760, pose: t < 0.5 || (t >= 1 && t < 1.5) ? 'stand' : 'run', t }));
    p.flush();
  },
};
