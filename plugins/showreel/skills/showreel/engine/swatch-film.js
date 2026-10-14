// A one-frame film per ink for the brand approval stop: frame t = k + 0.5 shows ink k.
let user = {};
try {
  user = (await import('/film/scenes.js')).default ?? {};
} catch {
  // The swatch can run before scenes.js exists; it then uses the default format.
}

export default {
  slug: 'swatch', bpm: 120, bars: 1, barNames: ['SWATCH'], cues: [], labels: false,
  size: user.size,
  draw(ctx, t, api) {
    const name = api.brand.inkNames[Math.min(api.brand.inkNames.length - 1, Math.floor(t))];
    const { W, H, geom } = api;
    const u = Math.min(W, H) / 1080;
    const p = api.pen(name);
    p.bg();
    const left = api.border.x, top = api.border.y;

    // The ink's name in the display face, with its type treatment.
    const size = Math.min(W * 0.6, 900 * u);
    const fs = api.type.fit(api.fonts.display, name, size);
    p.type(api.type.layout(api.fonts.display, name, { size: Math.min(fs, 260 * u), x: left, y: top + 260 * u }).glyphs, { id: 'name' });

    // Lines: a wave, a dashed run, and the accent.
    const wave = Array.from({ length: 121 }, (_, i) => [left + (i / 120) * W * 0.45, top + 380 * u + 40 * u * Math.sin(i / 9)]);
    p.stroke(wave, { id: 'wave' });
    p.stroke(geom.line(left, top + 470 * u, left + W * 0.45, top + 470 * u, 32), { dashed: true, id: 'dash' });
    p.stroke(geom.line(left, top + 530 * u, left + W * 0.45, top + 530 * u, 32), { color: 'accent', id: 'accent' });

    // Fills: the ink's own fill, its cross variant and a solid.
    const cx = W - left - 170 * u;
    const circle = geom.circle(cx, top + 200 * u, 150 * u, 96);
    p.fill(circle, { lit: 0.6, id: 'fill' });
    p.stroke(circle, { closed: true, id: 'circle' });
    const sq = [[cx - 150 * u, top + 400 * u], [cx + 150 * u, top + 400 * u], [cx + 150 * u, top + 620 * u], [cx - 150 * u, top + 620 * u]];
    p.fill(sq, { mode: 'cross', lit: 0.9, id: 'cross' });
    p.stroke(sq, { closed: true, id: 'square' });

    // The palette as chips with their keys, the mascot, and a label sample.
    const keys = Object.keys(api.brand.palette);
    const chip = Math.min(170 * u, (W - 2 * left - 300 * u) / keys.length - 12 * u);
    keys.forEach((k, i) => {
      const x = left + i * (chip + 12 * u), y = H - top - 140 * u;
      const r = geom.roundRect(x, y, chip, chip * 0.6, 6 * u, 2);
      p.fill(r, { mode: 'solid', color: k, id: `chip${i}` });
      p.stroke(r, { closed: true, width: 2, id: `chipe${i}` });
      p.text(k.toUpperCase(), { x, y: y + chip * 0.6 + 30 * u, size: Math.round(18 * u), weight: 'label', tracking: 0.14 });
    });
    api.mascot(p, { x: W - left - 140 * u, y: H - top - 20 * u, width: 200 * u, t: 0 });
    p.text(`${api.brand.name.toUpperCase()} — ${name} — LABEL FACE`, { x: left, y: top + 28 * u, size: Math.round(26 * u), weight: 'label', tracking: 0.2 });
    p.flush();
  },
};
