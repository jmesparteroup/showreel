// Bar 5 placeholder.
export const cues = [7.95, 8.45, 8.95, 9.45];

export function draw(t, api) {
  const p = api.pen('paper');
  p.bg();
  p.stroke(api.geom.line(330, 540, 1590, 540));
  api.labels(p);
  p.flush();
}
