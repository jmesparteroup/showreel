import { labelText } from './clock.js';

// The empty border is 150 x 90 px at 1920 x 1080 and scales with the frame.
export const borderOf = ([W, H]) => ({ x: (W * 150) / 1920, y: (H * 90) / 1080 });

// Both labels sit on the inner edge of the empty border.
export function labelBoxes(size) {
  const [W, H] = size;
  const { x, y } = borderOf(size);
  const k = H / 1080;
  return [
    { x, y, w: 640 * k, h: 30 * k },
    { x: W - x - 640 * k, y: H - y - 24 * k, w: 640 * k, h: 30 * k },
  ];
}

export function drawLabels(pen, { clock, t, barNames, size = [1920, 1080] }) {
  const [W, H] = size;
  const { x, y } = borderOf(size);
  const k = H / 1080;
  const px = Math.round(H / 41.5);
  const { fig, beat } = labelText(clock, t, barNames);
  pen.text(fig, { x, y: y + 24 * k, size: px, weight: 'label', tracking: 0.2 });
  pen.text(beat, { x: W - x, y: H - y, size: px, weight: 'label', tracking: 0.2, align: 'right' });
}
