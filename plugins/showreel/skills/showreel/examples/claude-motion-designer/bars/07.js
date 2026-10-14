// Bar 7 placeholder.
export const cues = [11.95, 12.45, 12.95, 13.45];

export function draw(t, api) {
  const p = api.pen('paper');
  p.bg();
  p.stroke(api.geom.line(330, 540, 1590, 540));
  api.labels(p);
  p.flush();
}
