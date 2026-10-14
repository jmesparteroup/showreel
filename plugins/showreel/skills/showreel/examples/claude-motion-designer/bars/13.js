// Bar 13 placeholder.
export const cues = [23.95, 24.45, 24.95, 25.45];

export function draw(t, api) {
  const p = api.pen('paper');
  p.bg();
  p.stroke(api.geom.line(330, 540, 1590, 540));
  api.labels(p);
  p.flush();
}
