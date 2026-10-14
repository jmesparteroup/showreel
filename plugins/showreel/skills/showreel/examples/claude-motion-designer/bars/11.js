// Bar 11 placeholder.
export const cues = [19.95, 20.45, 20.95, 21.45];

export function draw(t, api) {
  const p = api.pen('paper');
  p.bg();
  p.stroke(api.geom.line(330, 540, 1590, 540));
  api.labels(p);
  p.flush();
}
