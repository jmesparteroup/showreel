export default {
  slug: 'fixture-seamhold', bpm: 120, bars: 1, barNames: ['SEAM'],
  cues: [-0.05, 0.45, 0.95, 1.45],
  palette: ['#1B3ED2', '#FFFFFF', '#45F0DD'],
  draw(ctx, t, api) {
    const p = api.pen('blueprint');
    p.bg();
    // Still for t < 0.35 and t > 1.55: 0.8 s of identical frames across the loop point.
    const u = Math.min(1, Math.max(0, (t - 0.35) / 1.2));
    p.stroke(api.geom.circle(960 + 300 * Math.sin(2 * Math.PI * u), 540, 80), { closed: true });
    api.rest({ x: 600, y: 300, w: 720, h: 480 });
    api.labels(p);
  },
};
