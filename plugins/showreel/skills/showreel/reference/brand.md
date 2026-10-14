# brand.json

The film's visual and sonic identity. It lives at `films/<slug>/brand.json`; the engine validates it at load and names the field of any error (`brand.json inks[1].fill.style: "zigzag" is not one of ...`).

```json
{
  "name": "Kiln & Co.",
  "source": "https://kiln.example",
  "tone": "handmade, warm, unhurried",
  "palette": { "clay": "#C8643B", "cream": "#F3E9DC", "ink": "#2B2118", "glaze": "#2F6F73" },
  "fonts": { "display": "google:Space Grotesk:700", "label": "google:Space Grotesk:500" },
  "inks": [
    { "name": "KILN", "bg": { "color": "cream", "grain": 0.06 }, "grid": null,
      "line": { "style": "marker", "color": "ink", "width": 6 },
      "fill": { "style": "dots", "color": "clay", "spacing": 12 },
      "type": { "fill": "dots", "outline": "single" }, "accent": "glaze" },
    { "name": "GLAZE", "bg": { "color": "glaze" }, "grid": { "color": "cream", "step": 90, "opacity": [0.08, 0.16] },
      "line": { "style": "clean", "color": "cream", "width": 5 },
      "fill": { "style": "solid", "color": "clay" },
      "type": { "fill": "solid", "outline": "none" }, "accent": "cream" }
  ],
  "transitions": ["flood"],
  "sound": { "style": "organic", "key": "D major" }
}
```

## Fields

| Field | Values |
|---|---|
| `palette` | 2 to 8 named `#rrggbb` colours. Everything else refers to these names (or a literal `#rrggbb`). The palette check allows only these colours and blends between them. |
| `fonts.display` | Big words. `google:<Family>:<weight>`, a film-relative `.otf`/`.ttf`/`.woff` path, or `geist:<400–900>`. Default `geist:900`. |
| `fonts.label` | Corner labels and small text. Default `geist:800`. |
| `fonts.body` | Anything else. Defaults to the label face. |
| `inks[]` | 1 to 6 stages, in film order. Films draw with `api.pen('<name>')`. |
| `inks[].preset` | `paper`, `blueprint` or `hologram`, recoloured with `colors: { bg, grid, line, fill, accent, solid, core }`. Other fields override the preset's. |
| `inks[].bg` | `{ color, grain?: 0–0.2, image?: "path/in/film.png" }`. The image is drawn cover-fit, under the grain and grid. |
| `inks[].grid` | `null`, or `{ color, step: 20–400, opacity: [minor, major] }`, centred on the frame, every fifth line major. |
| `inks[].line` | `{ style, color, width, core? }`. |
| `inks[].fill` | `{ style, color, spacing?, width? }`. |
| `inks[].type` | `{ fill: <fill style>, outline: none \| single \| double, spacing?, width? }`: how big type is drawn. |
| `inks[].accent` | The colour `color: 'accent'` draws in. Convention: each stage's accent is the next stage's background or line colour; `swatch.mjs` notes where it is not. |
| `inks[].solid` | The colour `color: 'solid'` draws in (eyes, small marks). Defaults to the line colour. |
| `transitions` | Which scene changes the storyboard may use: `flood`, `scan`. |
| `sound` | `{ style, key, file?, offset?, gain? }`, below. |

Run `node ENGINE/fetch-fonts.mjs films/<slug>` after adding `google:` fonts; it downloads TTFs into `films/<slug>/fonts/` and rewrites the entries to those paths. Rendering never touches the network.

## Line treatments

| `line.style` | Look | Draws |
|---|---|---|
| `pencil` | Graphite: two passes, wobble that steps 8 times a second, paper tooth knocked out, multiplied | sketch, hand, drafting |
| `marker` | One thick pass, butt caps, a gentle hand wobble, multiplied | handmade, warm, editorial |
| `clean` | Exact vector line, round caps | engineered, technical, corporate |
| `dashed` | Clean line with dashes three widths long | diagrams, plans, maps |
| `light` | A coloured edge with a core (default white) at 30 % width; no blur | night, tech, screens, neon |

## Fill treatments

| `fill.style` | Look |
|---|---|
| `hatch` | Diagonal lines on a lattice anchored to the frame; `progress` draws them one line at a time. `mode: 'cross'` adds the other diagonal. |
| `cross` | Cross-hatching. |
| `dots` | Halftone dots on a fixed lattice; `lit` (0–1) sets their size. |
| `scan` | Horizontal scan lines on a fixed pitch; `lit` sets their thickness. |
| `solid` | Flat colour. |
| `none` | No fill; shapes and type are outlines. |

Lines and fills sit on lattices tied to the frame, not to each shape, so a growing or moving shape keeps its texture still instead of shimmering.

## Choosing inks from tone

| Brand tone | Line | Fill | Background |
|---|---|---|---|
| handmade, craft, food, warm | `marker` | `dots` or `hatch` | light neutral with grain |
| editorial, literary, archival | `pencil` | `hatch` | paper with grain, maybe a grid |
| engineered, precise, B2B | `clean` | `solid` or `cross` | brand colour, fine grid |
| playful, consumer, bright | `marker` or `clean` | `solid` | saturated brand colour, no grid |
| tech, night, data, gaming | `light` | `scan` | near-black with a faint grid |
| luxury, calm | `clean`, thin | `none` or `solid` | deep neutral, no grid |

Use two or three stages for a film of 15 bars, one or two for a short one. Order them so the film moves somewhere: light to dark, sketch to finished, plan to product.

## Sound

| `sound.style` | Score |
|---|---|
| `minimal` | Kick on each downbeat, soft rim clicks, quiet hats, a root bass note per bar, a low pad |
| `electronic` | Four-on-the-floor kick, claps on the off beats, hats on the eighths, an eighth-note bass |
| `organic` | Soft kick, woody clicks, a plucked arpeggio, warm pad, no hats |
| `none` | No music; only the film's sound effects |

`sound.key` is `"<note> major|minor"`, e.g. `"D minor"`, `"Eb major"`: the bass, pad and plucks follow a four-bar progression in it.

`sound.file` (a path inside the film folder) replaces the score with the brand's own track, looped and trimmed to the film's length from `offset` seconds. The film's BPM should match the track's.

Sound effects come from the film's `sounds` list (see `film-api.md`); without one, every cue gets a soft tick.
