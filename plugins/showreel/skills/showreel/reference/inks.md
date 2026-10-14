# Presets: paper, blueprint, hologram

The three inks of the CLAUDE reel: one pencil line promoted three times, graphite on paper, wire on a blueprint, light on black. They are presets, not defaults: a brand uses them only when they fit (`"preset": "paper"` in brand.json, recoloured with `colors`). See `brand.md` for the full treatment menu. A brief that uses all three can copy these paragraphs.

```
Palette: paper cream #EDE6D5, blueprint blue #1B3ED2, hologram cyan #45F0DD, plus black #07080A, graphite #16161A and white. Each stage's accent is the next stage's colour: blue pencil on paper, cyan on the blueprint, white on the hologram.
Three inks. The same geometry is drawn in whichever ink is on screen:
- PAPER: a cream paper background with fine drawn grain and a 60 px blue grid at about 13% and every fifth line at 26%. Lines are pencil: resampled and pushed off true by slow sine waves whose phase changes 8 times a second, stroked twice (full width at 90%, half width at 40% with more wobble), with paper tooth knocked out of the strokes, then multiplied onto the paper. Fills are diagonal hatching drawn on one line at a time. Big type is hatching cut to the letter shapes, with a doubled outline.
- BLUEPRINT: flat blue with the same grid in white. Clean white lines 3 to 4 px, hidden edges dashed and thinner, fills are fine clean hatching.
- HOLOGRAM: black with the same grid in cyan. Cyan lines with a white core 30% of the line width. Fills are horizontal scan lines on an 8 px pitch whose thickness follows how lit the surface is. No blur halo anywhere: it reads as light through line density only.
```

## How the pen draws each ink

| | `bg()` | `stroke()` | `fill()` | `type()` | `line` / `accent` / `solid` |
|---|---|---|---|---|---|
| paper | cream, grain, blue grid 13 % / 26 % | pencil, 8 Hz wobble, tooth, multiplied | diagonal pencil hatch; `progress` draws it line by line; `mode: 'cross'` adds the other diagonal | hatch cut to the letters + doubled outline | graphite / blue / graphite |
| blueprint | blue, white grid | white 3.5 px; `dashed` is thinner for hidden edges | fine clean hatch | outline + fine hatch | white / cyan / white |
| hologram | black, cyan grid | cyan with a white core at 30 % | horizontal scan lines on an 8 px pitch, thickness from `lit` | scan-line fill + outline | cyan / white / white |

`fill(shape, { mode: 'solid' })` fills flat in any ink. Use it for small things: eyes, keyframe diamonds, a highlighted bar.

The CLAUDE reel's brand.json (`examples/claude-motion-designer/brand.json`) shows them in use.
