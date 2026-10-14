# Film API

A film is a folder with `scenes.js`, `shared.js`, `brand.json`, `brief.md` and `bars/NN.js` (plus `fonts/` and any images brand.json names). `new-film.mjs` scaffolds it.

## `scenes.js`

```js
import * as b01 from './bars/01.js';
// ...
const BARS = [b01, /* ... */];
const BAR = 2; // seconds per bar: 60 / bpm * beatsPerBar

export default {
  slug: 'my-film',                       // lowercase letters, digits, dashes
  bpm: 120,
  bars: 15,
  beatsPerBar: 4,                        // optional, default 4
  fps: 60,                               // optional: 24, 25, 30, 48, 50, 60
  size: [1920, 1080],                    // optional, even integers
  barNames: ['DRAFT', /* one per bar */],
  cues: BARS.flatMap(b => b.cues),      // seconds; the beats check reads these
  sounds: BARS.flatMap(b => b.sounds ?? []),
  draw(ctx, t, api) {
    BARS[Math.min(BARS.length - 1, Math.floor((t + 0.05) / BAR))].draw(t, api);
  },
};
```

A bar module owns film time `[start - 0.05, end - 0.05)`, so a move that lands on the bar's downbeat starts inside the bar that animates it. The last bar also draws t = duration, the loop frame, which must equal frame 0.

The palette check uses brand.json's palette; a film may override it with its own `palette` list. Set `labels: false` only for a film that must not have corner labels.

## Bar modules

```js
import { CX, CY, title } from '../shared.js';

export const cues = [3.95, 4.45, 4.95, 5.45];   // real move start times
export const sounds = [{ t: 4.0, kind: 'press' }, { t: 4.5, kind: 'pop' }, { t: 5.0, kind: 'type', count: 8, interval: 0.04 }];

export function draw(t, api) {
  const p = api.pen('paper');
  p.bg();
  // ... geometry ...
  api.labels(p);
  p.flush();
}
```

Every bar paints the whole frame: background, its geometry, labels, then `flush()`. Nothing carries over between frames. If a bar does not call `api.labels`, the stage draws the labels in the frame's last ink.

### Sounds

`sounds` entries are `{ t, kind, gain?, count?, interval? }`, with `t` the moment the sound should be heard (usually the beat a move lands on):

| `kind` | Use under |
|---|---|
| `whoosh` | wipes, floods, things flying in (it swells into `t`) |
| `sweep` | scan lines, rising reveals (half a second from `t`) |
| `press` | presses, crushes, things landing hard |
| `hit` | strikes on the beat |
| `pop` | shapes appearing, splitting, morphing |
| `click` | cursor clicks, switches |
| `tick` | single marks, ticks on a ruler |
| `type` | typing on or off: `count` ticks `interval` s apart (default 6 and 0.05) |

### Pens that share the layer

Inks with a `pencil` or `marker` line, or with grain, draw into one shared offscreen layer that `flush()` composites onto the frame, so:

- Finish one such pen (`flush()`) before calling `api.pen()` again; a new pen clears the layer.
- To clip pencil drawing, flush the main pen, then clip `api.ctx` and draw with a second pen, flushing it before `restore()`:

```js
p.flush();
api.ctx.save();
api.ctx.beginPath(); api.ctx.rect(0, top, api.W, bottom - top); api.ctx.clip();
const q = api.pen('paper');
q.type(glyphs, { id: 'word' });
q.flush();
api.ctx.restore();
```

## `api`

| Member | Use |
|---|---|
| `api.t` | Film time in seconds (also the `t` argument). |
| `api.W`, `api.H`, `api.CX`, `api.CY` | The film's size and centre. |
| `api.border` | `{ x, y }`: the empty border in px for this size. |
| `api.brand` | The loaded brand: `name`, `palette` (name → hex), `inkNames`, `inks`, `fonts`, `sound`. |
| `api.ctx` | The raw 2D context. Use it for clips only (`save`, `rect`, `clip`, `restore`); draw through a pen. |
| `api.pen(name)` | A pen in one of the brand's inks, by name (`api.brand.inkNames`). |
| `api.split(clip, outsideInk, insideInk, fn)` | Draws `fn(pen)` in two inks either side of a clip polygon. See `transitions.md`. |
| `api.labels(pen)` | Draws both corner labels in the pen's ink. Call once per frame. |
| `api.mascot(pen, opts)` | Draws the box character and returns its bbox. |
| `api.rest(box)` | Declares `{x, y, w, h}` for something at rest; the border check reads these. |
| `api.clock` | `spb`, `barDur`, `duration`, `beatAt(t)`, `barAt(t)`, `local(t, start, dur)` → 0..1, `wrap(t)`. |
| `api.ease` | `spring(s, w)`, `expoIn(u)`, `expoOut(u)`, `expoInOut(u)`, `seq(t, from, keys)`, `lerp(a, b, u)`. |
| `api.geom` | Shapes and transforms; see below. |
| `api.type` | `layout(font, text, opts)`, `fit(font, text, width)`, `bounds(glyphs)`. |
| `api.fonts` | `display`, `label`, `body` from brand.json; `black`, `xbold`, `semi` are always Geist 900, 800, 600. |
| `api.frozen` | True during checks; the pen handles it, films can ignore it. |

## Pen

```js
p.bg();                                              // background + grid
p.stroke(pts, { closed, color, width, dashed, id }); // color: 'line' | 'accent' | 'solid' | 'fill' | palette name | #hex
p.fill(shape, { color, mode, progress, spacing, angle, lit, id });
p.type(glyphs, { color, progress, id });             // big type in the ink's type treatment
p.text(str, { x, y, size, weight, tracking, align, color }); // small solid labels; weight: 'label' | 'display' | 'body' | 'xbold' ...
p.flush();                                           // once, after drawing
```

- `shape` is one contour `[[x, y], ...]` or an array of contours (filled even-odd, so letter counters stay open).
- A fill uses the ink's fill treatment. `mode: 'solid'` always fills flat; `mode: 'cross'` turns `hatch` into cross-hatching; `style` forces a treatment (`'dots'`, `'scan'`, ...).
- The default fill colour is the ink's `fill.color`.
- `progress` 0..1 draws hatch lines, scan lines or dot rows one at a time.
- `lit` is 0..1 or `(x, y) => 0..1`; it sets scan-line thickness and dot size.
- `id`: pencil and marker wobble is seeded by stroke id and the 1/8 s tick. Ids default to call order, which is stable while the draw order is. If the number of strokes drawn before a stroke changes over time (letters typing on, cells appearing), give that stroke an explicit `id` so it does not jitter every frame.

## Geometry (`api.geom`)

| Function | Returns |
|---|---|
| `line(x0, y0, x1, y1, n = 2)` | Points along a segment. |
| `cubic(p0, p1, p2, p3, n = 64)` | Bézier points. |
| `circle(cx, cy, r, n = 256)` | Closed contour, starting at the top. |
| `polygon(cx, cy, r, sides, rot = -π/2)` | Vertices, point up by default. |
| `roundRect(x, y, w, h, r)` | Closed contour. |
| `gear(cx, cy, teeth, pitchR, rot = 0)` | Closed gear outline. |
| `hexGrid(cx, cy, r, rings)` | `[{x, y, ring}]`, point-up cells. |
| `curl(cx, cy, L, k, n = 256)` | Fixed-length curve with curvature `k`: line at 0, circle at `2π / L`. |
| `resample(pts, n, closed)`, `length(pts, closed)` | Arc-length helpers. |
| `morph(a, b, u, { closed })` | Shape between `a` and `b`, start points aligned. |
| `translate`, `rotate(pts, cx, cy, a)`, `scale(pts, cx, cy, sx, sy)` | 2D transforms. |
| `rotX`, `rotY`, `rotZ`, `project(p3, { cx, cy, f })` | 3D points; `f = Infinity` is orthographic. |
| `cubeLines(edge, rot, cam)` | `{ visible, hidden }` edge segments of a cube. |

## Patterns

```js
// A move that lands on the beat at 4.5 s.
const u = api.ease.spring(t - 4.45, 24);

// A value keyed beat by beat.
const x = api.ease.seq(t, 0, [{ at: 0.95, to: 200, w: 20 }, { at: 1.45, to: 120, w: 30 }]);

// A shape that turns into another.
const pts = api.geom.morph(circle, hexagon, u, { closed: true });

// Letters dropping in one every 0.05 s.
const glyphs = lay.glyphs.map((g, i) => {
  const d = (1 - api.ease.spring(t - 3.45 - i * 0.05, 26)) * -400;
  return { ...g, contours: g.contours.map(c => api.geom.translate(c, 0, d)) };
});
p.type(glyphs, { color: 'accent', id: 'claude' });

// Something at rest.
api.rest({ x: 300, y: 400, w: 1320, h: 300 });
```
