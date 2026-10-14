// Bar 10 placeholder.
export const cues = [17.95, 18.45, 18.95, 19.45];

export function draw(t, api) {
  const p = api.pen('paper');
  p.bg();
  p.stroke(api.geom.line(330, 540, 1590, 540));
  api.labels(p);
  p.flush();
}
