export default {
  slug: 'fixture-format-hold', bpm: 120, bars: 2, beatsPerBar: 3, fps: 30, size: [1080, 1920],
  barNames: ['TALL', 'WALTZ'],
  cues: [-0.05, 0.45, 0.95, 1.45, 1.95, 2.45],
  draw(ctx, t, api) {
    const p = api.pen('paper');
    p.bg();
    const a = t < 0.6 ? 0 : (2 * Math.PI * (t - 0.6)) / 2.4;
    const c = api.geom.circle(api.CX + 250 * Math.cos(a), api.CY + 400 * Math.sin(a), 120);
    p.fill(c, { color: 'accent' });
    p.stroke(c, { closed: true });
    api.rest({ x: 100, y: 200, w: 880, h: 1500 });
    api.labels(p);
    p.flush();
  },
};
