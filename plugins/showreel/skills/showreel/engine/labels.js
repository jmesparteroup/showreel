import { labelText } from './clock.js';

// Both labels sit on the inner edge of the empty border.
export const LABEL_BOXES = [
  { x: 150, y: 90, w: 640, h: 30 },
  { x: 1130, y: 966, w: 640, h: 30 },
];

export function drawLabels(pen, { clock, t, barNames }) {
  const { fig, beat } = labelText(clock, t, barNames);
  pen.text(fig, { x: 150, y: 114, size: 26, weight: 'xbold', tracking: 0.2 });
  pen.text(beat, { x: 1770, y: 990, size: 26, weight: 'xbold', tracking: 0.2, align: 'right' });
}
