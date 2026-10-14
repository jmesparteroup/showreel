// Bar 14 placeholder.
export const cues = [25.95, 26.45, 26.95, 27.45];

export function draw(t, api) {
  const p = api.pen('paper');
  p.bg();
  p.stroke(api.geom.line(330, 540, 1590, 540));
  api.labels(p);
  p.flush();
}
