// Bar 4 placeholder.
export const cues = [5.95, 6.45, 6.95, 7.45];

export function draw(t, api) {
  const p = api.pen('paper');
  p.bg();
  p.stroke(api.geom.line(330, 540, 1590, 540));
  api.labels(p);
  p.flush();
}
