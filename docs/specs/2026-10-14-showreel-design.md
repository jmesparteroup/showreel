# showreel: design

## Goal

A Claude Code skill, published as a public GitHub repo, that turns a subject and a one-line concept into a looping motion design film.

```
/showreel CLAUDE, a motion designer — one pencil line gets promoted three times
```

Claude expands the line into a full brief (direction, structure, mascot, storyboard), stops for approval, then writes the scene code, renders it, checks it against the house rules and exports an MP4.

Success means:

- A new concept produces a brief in the same format and density as the reference brief, with no extra prompting.
- The rendered film obeys the house rules, and the checks prove it (loop, border, holds, beat coverage).
- The reference film `claude-motion-designer` renders end to end from a clean clone with `npm install` and one command.

## Distribution

The repo is a Claude Code plugin marketplace with one plugin.

```
showreel/
  .claude-plugin/marketplace.json
  plugins/showreel/
    .claude-plugin/plugin.json
    skills/showreel/
      SKILL.md
      reference/
        house-rules.md
        brief-format.md
        inks.md
        transitions.md
        reference-brief.md      # the CLAUDE brief, bars 9-15 completed
      engine/                   # see Engine
      fonts/                    # Geist (OFL), Geist-Black / ExtraBold / SemiBold
  examples/claude-motion-designer/
    brief.md
    scenes.js
  package.json                  # engine deps for working on the repo itself
  README.md
  LICENSE                       # MIT; fonts/OFL.txt alongside the fonts
```

Install: `/plugin marketplace add jmesparteroup/showreel`, then `/plugin install showreel@showreel`.

## Skill workflow (SKILL.md)

1. **Parse** the subject and concept. If either is missing, ask for it.
2. **Write the brief** to `films/<slug>/brief.md` in the user's working directory, following `brief-format.md`. The brief carries the house rules forward verbatim, then adds the concept-specific parts: stages and inks, palette, mascot, and a storyboard with a cue on every beat of every bar.
3. **Stop.** Show the brief and wait for approval or edits. No scene code before that.
4. **Scaffold** `films/<slug>/` (copies `package.json`, links the engine), `npm install`.
5. **Write `scenes.js`** bar by bar against the engine API.
6. **Checkpoint stills.** Render one PNG per bar at the bar's midpoint and at each scene change. Claude reads them and fixes what it sees before rendering motion.
7. **Check.** `node engine/check.mjs films/<slug>` must pass.
8. **Export** `films/<slug>/out/<slug>.mp4`.

## House rules (fixed for every film)

Written once in `house-rules.md` and copied into each brief:

- 1920 x 1080, 60 fps. Default 120 BPM, 15 bars of 2 s, 60 beats, 1800 frames. BPM and bar count are brief parameters.
- A cue on every beat. Moves start 0.05 s before their beat.
- Easing: critically damped spring `1 - (1 + w t) e^(-w t)` with w in [12, 40], plus exponential in/out for wipes, presses and exits. Nothing overshoots.
- Locked front-on camera. No cuts, no fades, no crossfades. Every shot is built from the previous one's geometry.
- Empty border: nothing at rest within 150 px of the sides or 90 px of the top and bottom.
- Two corner labels for the whole film: top left `FIG. NN — NAME`, bottom right `BEAT n / total`.
- Geist only: 900 for big words, 600 to 800 for labels (24 to 28 px, tracked 0.14 to 0.3 em).
- The last frame equals the first.
- Banned: particle bursts, glows, lens flares, camera shake, RGB split, crossfades, generic gradients, bouncy easing, holds longer than 0.5 s, template looks.

Concept-specific choices (inks, palette, mascot, storyboard) live in the brief. The three-ink paper / blueprint / hologram set ships as a preset in `inks.md` that a brief can adopt or replace.

## Engine

Plain ES modules, Canvas 2D, no build step. Every frame is a pure function of `t`: there is no `Math.random`, and all noise comes from a seeded PRNG (mulberry32) keyed by element id and time tick. Scrubbing to any time is therefore exact, and frames can render in parallel.

| Module | Responsibility |
|---|---|
| `clock.js` | `beat(t)`, `bar(t)`, `at(beat, lead=0.05)`, `local(t, start, dur)` → 0..1; label strings |
| `ease.js` | `spring(u, w)`, `expoIn`, `expoOut`, `seq()` helper for chaining keyed moves |
| `geom.js` | Polyline resample by arc length, morph between shapes by arc length with best start alignment, polygon/circle/S-curve builders, gear outline, cube wireframe with hidden edges, perspective projection |
| `type.js` | Load Geist with opentype.js; text → `Path2D` and flattened contours; per-glyph layout with tracking |
| `ink/paper.js` | Pencil stroke, hatching fill, hatched type with doubled outline, paper grain and grid |
| `ink/blueprint.js` | Clean white lines 3 to 4 px, dashed hidden edges, fine clean hatching, white grid |
| `ink/hologram.js` | Cyan line with a white core at 30 % width, scan-line fill on an 8 px pitch with thickness from a `lit` value, cyan grid |
| `ink/index.js` | Common interface: `ink.bg(ctx)`, `ink.stroke(ctx, pts, opts)`, `ink.fill(ctx, path, opts)`, `ink.type(ctx, glyphs, opts)`, `ink.accent` |
| `mascot.js` | Box character rig: `draw(ctx, ink, {x, y, scale, pose, t})`, with poses `stand` and `run` (alternate leg pairs, 6 steps/s, 7° lean) and a pencil arm at 58° |
| `labels.js` | Corner labels, fixed position inside the border |
| `stage.js` | `render(ctx, t, film)`: background ink, then `film.draw(ctx, t, api)`, then labels; records a rest-box registry for the checks |
| `render.html` | Preview: canvas, play/pause, scrubber, bar/beat readout, still-export button |
| `export.mjs` | Playwright headless Chromium renders frames to PNG in parallel workers; `ffmpeg-static` encodes H.264 yuv420p CRF 16 |
| `check.mjs` | Rule checks (below) |

### Pencil algorithm (paper ink)

1. Resample the polyline every 3 px.
2. Offset each point along its normal by the sum of two sines over arc length. Amplitudes are 0.6 px and 1.4 px; the phase comes from the PRNG at `floor(t * 8)`, so it changes 8 times a second.
3. Stroke twice: full width at 90 % alpha, then half width at 40 % alpha with double the wobble amplitude.
4. Knock out paper tooth with `destination-out` using a pre-rendered seeded tooth texture, on an offscreen layer.
5. Composite the layer onto the paper with `multiply`.

Hatching is drawn as parallel diagonal lines clipped to the shape, each one a pencil stroke. A `progress` value reveals them one line at a time. Big type is hatching clipped to the glyph paths, plus a pencil outline drawn twice with different seeds.

### Scene handoff

Scene changes are geometry, not compositing:

- **Flood**: a shape grows past the frame with a hard edge. Inside its path the next ink is drawn; outside it, the current ink.
- **Scan line**: a horizontal line sweeps the frame. Above it is one ink, below it the other.

The stage supports both with a `split(clipPath, inkA, inkB, drawFn)` helper that runs the same draw function twice under complementary clips. That is how "the same geometry in whichever ink is on screen" works.

### Film module contract

```js
export default {
  slug: 'claude-motion-designer',
  bpm: 120, bars: 15,
  barNames: ['DRAFT', 'TYPE', ...],
  cues: [0, 0.36, 1.0, ...],          // seconds; checked against the beat grid
  draw(ctx, t, api) { ... },          // api = { clock, ease, geom, type, inks, mascot, split, rest }
}
```

`api.rest(box)` declares an object's bounding box while it is at rest. The border check uses these.

## Checks (`check.mjs`)

| Check | Method | Pass |
|---|---|---|
| Loop | Render t = 0 and t = duration with wobble frozen, compare pixels | mean abs diff < 1/255 |
| Border | Sample every frame's rest-box registry | No rest box intersects the margin band |
| Holds | Render all frames with wobble frozen at 1/4 scale; find runs of identical consecutive frames, ignoring the labels | No run > 30 frames |
| Beats | Every beat k has a cue in `[k*spb - 0.05, k*spb]` | All beats covered |
| Palette | Histogram of frame pixels against brief palette plus blend tolerance | No pixel cluster outside the palette (this catches stray gradients and glows) |

`--frozen` (wobble phase pinned) exists only for checks; the export always renders with live wobble.

## Reference film

`examples/claude-motion-designer` implements the user's brief. Bars 1 to 8 and the first half of bar 9 follow it exactly. Bars 9.5 to 15 (DATA to END) are written during implementation under the same rules: hologram arrives at bar 10 (LIGHT) by scan line, paper returns by scan line in bar 14 or 15, and END rebuilds frame 0. The completed brief is saved as `reference-brief.md`, which also serves as the skill's worked example of the brief format.

## Testing

- Unit tests (`node --test`) for `ease` (no overshoot, endpoints), `clock` (beat/bar maths, lead-in), `geom` (resample length conserved, morph endpoints equal the inputs), and PRNG determinism.
- A golden-frame test: render 4 fixed frames of the reference film and compare against committed PNGs within tolerance.
- `check.mjs` passes on the reference film in CI (GitHub Actions, ubuntu, Playwright Chromium).

## Out of scope

- Audio. 120 BPM is the timing grid; no soundtrack is generated.
- Non-16:9 formats.
- A GUI timeline editor. The preview page scrubs only.
- Fonts other than Geist.
