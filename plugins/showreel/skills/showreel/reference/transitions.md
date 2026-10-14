# Scene handoffs

There are no opacity transitions. The new ink arrives as geometry. Ink names below are the CLAUDE reel's; use your brand's (`api.brand.inkNames`), and only the transitions brand.json lists.

`api.split(clip, outsideInk, insideInk, draw)` runs `draw(pen)` twice: once with the first ink everywhere outside the clip polygon, once with the second ink inside it. Each pass paints its own background, so the clip edge is a hard edge between two inks.

## Flood shape

A shape from the current scene grows past the frame with a hard edge. Inside it, the next ink; outside it, the current one. Both sides draw the same geometry.

```js
const u = api.ease.expoIn(api.clock.local(t, 9.55, 0.45));
const r = 96 + (2400 - 96) * u;
api.split(api.geom.polygon(api.CX, api.CY, r, 6), 'paper', 'blueprint', p => {
  drawHoneycomb(p, t, api);
  api.labels(p);
});
```

## Scan line

One horizontal line sweeps the frame. One ink above it, the other below. Draw the line itself, full width and 3 px, in the incoming ink's `line` colour.

```js
// Downward sweep from blueprint to hologram: the area above y is hologram.
const y = api.H * api.ease.expoInOut(api.clock.local(t, 17.95, 0.5));
api.split([[0, 0], [api.W, 0], [api.W, y], [0, y]], 'blueprint', 'hologram', p => {
  drawRing(p, t, api);
  api.labels(p);
});
```

## Rules

- Call `api.labels(p)` inside the split callback, so the labels change ink with everything else.
- Geometry functions take the pen as an argument and never pick an ink themselves.
- A sweep lasts 0.4 to 0.5 s and starts 0.05 s before its beat.
- Once the sweep has passed the frame edge, stop splitting and draw with the new pen alone.
