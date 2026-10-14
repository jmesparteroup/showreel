export function flatten(commands, steps = 8) {
  const contours = [];
  let cur = null, x = 0, y = 0;
  for (const c of commands) {
    if (c.type === 'M') { cur = [[c.x, c.y]]; contours.push(cur); }
    else if (c.type === 'L') cur.push([c.x, c.y]);
    else if (c.type === 'Q')
      for (let i = 1; i <= steps; i++) {
        const t = i / steps, m = 1 - t;
        cur.push([m * m * x + 2 * m * t * c.x1 + t * t * c.x, m * m * y + 2 * m * t * c.y1 + t * t * c.y]);
      }
    else if (c.type === 'C')
      for (let i = 1; i <= steps; i++) {
        const t = i / steps, m = 1 - t;
        cur.push([
          m * m * m * x + 3 * m * m * t * c.x1 + 3 * m * t * t * c.x2 + t * t * t * c.x,
          m * m * m * y + 3 * m * m * t * c.y1 + 3 * m * t * t * c.y2 + t * t * t * c.y,
        ]);
      }
    if (c.type !== 'Z') { x = c.x; y = c.y; }
  }
  return contours.filter(c => c.length > 2);
}

// Glyphs are looked up per character, not through stringToGlyphs, so each
// glyph stays paired with its character for per-letter animation.
export function layout(font, text, { size, x = 0, y = 0, tracking = 0, align = 'left' } = {}) {
  const k = size / font.unitsPerEm;
  const chars = [...text];
  const gl = chars.map(ch => font.charToGlyph(ch));
  const offsets = [];
  let pen = 0;
  gl.forEach((g, i) => {
    offsets.push(pen);
    pen += g.advanceWidth * k;
    if (i < gl.length - 1) pen += tracking * size + font.getKerningValue(g, gl[i + 1]) * k;
  });
  const x0 = align === 'center' ? x - pen / 2 : align === 'right' ? x - pen : x;
  return {
    width: pen,
    size,
    glyphs: gl.map((g, i) => ({
      char: chars[i],
      x: x0 + offsets[i],
      y,
      advance: g.advanceWidth * k,
      contours: flatten(g.getPath(x0 + offsets[i], y, size).commands),
    })),
  };
}

export function bounds(glyphs) {
  const b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  for (const g of glyphs) for (const c of g.contours) for (const [x, y] of c) {
    if (x < b.x0) b.x0 = x; if (x > b.x1) b.x1 = x;
    if (y < b.y0) b.y0 = y; if (y > b.y1) b.y1 = y;
  }
  return b;
}

export function fit(font, text, width, opts = {}) {
  const b = bounds(layout(font, text, { ...opts, size: 100 }).glyphs);
  return (100 * width) / (b.x1 - b.x0);
}
