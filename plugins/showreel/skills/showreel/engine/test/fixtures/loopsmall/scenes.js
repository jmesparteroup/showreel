export default {
  slug: 'fixture-loopsmall', bpm: 120, bars: 1, barNames: ['SEAM'],
  cues: [-0.05, 0.45, 0.95, 1.45],
  palette: ['#1B3ED2', '#FFFFFF', '#45F0DD'],
  draw(ctx, t, api) {
    const p = api.pen('blueprint');
    p.bg();
    const a = Math.PI * t;
    p.stroke(api.geom.circle(960 + 200 * Math.cos(a), 540, 80), { closed: true });
    if (t < 1.9) p.fill([[300, 300], [370, 300], [370, 370], [300, 370]], { mode: 'solid' });
    api.rest({ x: 600, y: 300, w: 720, h: 480 });
    api.labels(p);
  },
};
