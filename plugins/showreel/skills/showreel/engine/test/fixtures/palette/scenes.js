export default {
  slug: 'fixture-palette',
  bpm: 120, bars: 1, barNames: ['ORBIT'],
  cues: [-0.05, 0.45, 0.95, 1.45],
  palette: ['#EDE6D5', '#1B3ED2', '#16161A', '#45F0DD', '#07080A', '#FFFFFF'],
  draw(ctx, t, api) {
    const p = api.pen('paper');
    p.bg();
    const a = Math.PI * t;
    const c = api.geom.circle(960 + 300 * Math.cos(a), 540 + 150 * Math.sin(a), 120);
    p.fill(c, { color: 'accent' });
    p.stroke(c, { closed: true });
    api.rest({ x: 600, y: 300, w: 720, h: 480 });
    api.labels(p);
    p.flush();
    ctx.fillStyle = '#E0218A';
    ctx.fillRect(300, 300, 600, 400);
  },
};
