export default {
  slug: 'fixture-dark', bpm: 120, bars: 1, barNames: ['NIGHT'], cues: [], labels: false,
  draw(ctx, t, api) {
    for (const [ink, x] of [['NIGHT', 0], ['GRAIN', 960]]) {
      ctx.save();
      ctx.beginPath(); ctx.rect(x, 0, 960, 1080); ctx.clip();
      const p = api.pen(ink);
      p.bg();
      const sq = [[x + 280, 340], [x + 680, 340], [x + 680, 740], [x + 280, 740]];
      p.fill(sq, {});
      p.stroke(sq, { closed: true });
      p.text('NIGHT', { x: x + 280, y: 900, size: 80 });
      p.flush();
      ctx.restore();
    }
  },
};
