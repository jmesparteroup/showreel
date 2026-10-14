export default {
  slug: 'fixture-static', bpm: 120, bars: 1, barNames: ['STILL'], cues: [], palette: [],
  draw(ctx, t, api) {
    const p = api.pen('paper');
    p.bg();
    p.stroke(api.geom.line(400, 540, 1500, 540), { width: 4 });
    p.flush();
  },
};
