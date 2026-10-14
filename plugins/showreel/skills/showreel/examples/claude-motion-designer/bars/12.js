// Bar 12 placeholder.
export const cues = [21.95, 22.45, 22.95, 23.45];

export function draw(t, api) {
  const p = api.pen('paper');
  p.bg();
  p.stroke(api.geom.line(330, 540, 1590, 540));
  api.labels(p);
  p.flush();
}
