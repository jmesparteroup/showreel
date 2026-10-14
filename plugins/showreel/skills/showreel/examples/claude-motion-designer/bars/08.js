// Bar 8 placeholder.
export const cues = [13.95, 14.45, 14.95, 15.45];

export function draw(t, api) {
  const p = api.pen('paper');
  p.bg();
  p.stroke(api.geom.line(330, 540, 1590, 540));
  api.labels(p);
  p.flush();
}
