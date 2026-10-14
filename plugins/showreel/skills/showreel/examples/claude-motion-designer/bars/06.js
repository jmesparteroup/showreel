// Bar 6 placeholder.
export const cues = [9.95, 10.45, 10.95, 11.45];

export function draw(t, api) {
  const p = api.pen('paper');
  p.bg();
  p.stroke(api.geom.line(330, 540, 1590, 540));
  api.labels(p);
  p.flush();
}
