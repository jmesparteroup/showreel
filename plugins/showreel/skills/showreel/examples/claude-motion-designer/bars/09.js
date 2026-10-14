// Bar 9 placeholder.
export const cues = [15.95, 16.45, 16.95, 17.45];

export function draw(t, api) {
  const p = api.pen('paper');
  p.bg();
  p.stroke(api.geom.line(330, 540, 1590, 540));
  api.labels(p);
  p.flush();
}
