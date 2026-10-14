// Bar 15 placeholder.
export const cues = [27.95, 28.45, 28.95, 29.45];

export function draw(t, api) {
  const p = api.pen('paper');
  p.bg();
  p.stroke(api.geom.line(330, 540, 1590, 540));
  api.labels(p);
  p.flush();
}
