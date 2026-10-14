import { labelText } from './clock.js';

// The empty border is 150 x 90 px at 1920 x 1080 and scales with the frame.
export const borderOf = ([W, H]) => ({ x: (W * 150) / 1920, y: (H * 90) / 1080 });

// Labels scale with the frame's short side, so portrait frames keep 26 px labels
// at 1080 wide; boxes never run wider than the space inside the border.
const scaleOf = ([W, H]) => Math.min(W, H) / 1080;

// Both labels sit on the inner edge of the empty border.
export function labelBoxes(size) {
  const [W, H] = size;
  const { x, y } = borderOf(size);
  const k = scaleOf(size);
  const w = Math.min(640 * k, W - 2 * x);
  return [
    { x, y, w, h: 30 * k },
    { x: W - x - w, y: H - y - 24 * k, w, h: 30 * k },
  ];
}

export function drawLabels(pen, { clock, t, barNames, size = [1920, 1080] }) {
  const [W, H] = size;
  const { x, y } = borderOf(size);
  const k = scaleOf(size);
  const room = W - 2 * x;
  const { fig, beat } = labelText(clock, t, barNames);
  // A long bar name shrinks to fit rather than crossing the border.
  for (const [str, ox, oy, align] of [[fig, x, y + 24 * k, 'left'], [beat, W - x, H - y, 'right']]) {
    let px = Math.round(26 * k);
    const lay = pen.measure(str, { size: px, weight: 'label', tracking: 0.2 });
    if (lay.width > room) px = Math.floor((px * room) / lay.width);
    pen.text(str, { x: ox, y: oy, size: px, weight: 'label', tracking: 0.2, align });
  }
}
