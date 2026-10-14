export default {
  slug: 'fixture-inks', bpm: 120, bars: 1, barNames: ['INKS'], cues: [-0.05, 0.45, 0.95, 1.45],
  palette: ['#EDE6D5', '#1B3ED2', '#16161A', '#45F0DD', '#07080A', '#FFFFFF'],
  draw(ctx, t, api) {
    const bands = [['paper', 0], ['blueprint', 640], ['hologram', 1280]];
    for (const [ink, x] of bands) {
      ctx.save();
      ctx.beginPath(); ctx.rect(x, 0, 640, 1080); ctx.clip();
      const p = api.pen(ink);
      p.bg();
      const sq = [[x + 170, 340], [x + 470, 340], [x + 470, 640], [x + 170, 640]];
      p.fill(sq, { color: 'accent', lit: 0.6 });
      p.stroke(sq, { closed: true, width: 10 });
      p.flush();
      ctx.restore();
    }
  },
};
