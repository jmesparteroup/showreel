// Normalised so the spring lands exactly on 1 at s = 10 / w and holds there;
// the raw curve only approaches 1, which would break the first == last frame rule.
export function spring(s, w = 20) {
  if (s <= 0) return 0;
  const end = 10 / w;
  if (s >= end) return 1;
  const f = x => 1 - (1 + w * x) * Math.exp(-w * x);
  return f(s) / f(end);
}

export const expoIn = u => (u <= 0 ? 0 : u >= 1 ? 1 : (Math.pow(2, 10 * u) - 1) / 1023);
export const expoOut = u => 1 - expoIn(1 - u);
export const expoInOut = u => (u < 0.5 ? expoIn(u * 2) / 2 : 0.5 + expoOut(u * 2 - 1) / 2);
export const lerp = (a, b, u) => a + (b - a) * u;

// Each key springs from the previous key's target, so a value can be keyed
// beat by beat without tracking where the last move left it.
export function seq(t, from, keys) {
  let v = from, prev = from;
  for (const { at, to, w = 20 } of keys) {
    v += (to - prev) * spring(t - at, w);
    prev = to;
  }
  return v;
}
