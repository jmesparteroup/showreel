export default {
  slug: 'fixture-offbeat', bpm: 120, bars: 1, barNames: ['FLASH'],
  cues: [-0.05, 0.45, 0.95, 1.45],
  palette: ['#1B3ED2', '#FFFFFF', '#45F0DD'],
  draw(ctx, t, api) {
    const p = api.pen('blueprint');
    p.bg();
    p.stroke(api.geom.circle(960 + 300 * Math.sin(Math.PI * t), 540, 80), { closed: true });
    api.rest({ x: 600, y: 300, w: 720, h: 480 });
    api.labels(p);
    if (t > 0.2 && t < 0.4) { ctx.fillStyle = '#E0218A'; ctx.fillRect(300, 300, 600, 400); }
  },
};
