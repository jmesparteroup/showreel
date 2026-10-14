export default {
  slug: 'fixture-grow', bpm: 120, bars: 1, barNames: ['GROW'], cues: [], labels: false,
  draw(ctx, t, api) {
    for (const [ink, x0] of [['paper', 200], ['blueprint', 1000]]) {
      ctx.save();
      ctx.beginPath(); ctx.rect(x0 - 200, 0, 800, 1080); ctx.clip();
      const p = api.pen(ink);
      p.bg();
      const e = 500 + 300 * t;
      p.fill([[x0, 200], [x0 + e, 200], [x0 + e, 200 + e], [x0, 200 + e]], { mode: 'cross' });
      p.flush();
      ctx.restore();
    }
  },
};
