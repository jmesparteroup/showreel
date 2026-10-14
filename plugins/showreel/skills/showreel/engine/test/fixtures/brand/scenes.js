export default {
  slug: 'fixture-brand', bpm: 120, bars: 1, barNames: ['ACME'], cues: [-0.05, 0.45, 0.95, 1.45],
  draw(ctx, t, api) {
    for (const [ink, x] of [['SKETCH', 0], ['SOLID', 960]]) {
      ctx.save();
      ctx.beginPath(); ctx.rect(x, 0, 960, 1080); ctx.clip();
      const p = api.pen(ink);
      p.bg();
      const sq = [[x + 280, 340], [x + 680, 340], [x + 680, 740], [x + 280, 740]];
      p.fill(sq, { lit: 0.6 });
      p.stroke(sq, { closed: true });
      p.flush();
      ctx.restore();
    }
    api.rest({ x: 280, y: 340, w: 1360, h: 400 });
  },
};
