# House rules

Every film inherits these. Copy the two blocks below into the brief's `<direction>` and `<structure>` sections as written, then add the concept's own lines.

## For `<direction>`

```
Every shot is made out of the previous one: shapes, type and colour transform into the next scene. No cuts, no fades.
Typefaces: the brand's display face for big words, its label face for small labels (24 to 28 px at 1080 px high, scaled with the frame, tracked 0.14 to 0.3 em). Geist when the brand has none.
Camera: locked and front-on for the whole film, like a drafting table. Objects turn; the camera never moves.
Empty border: nothing at rest within {border x} px of the sides or {border y} px of the top and bottom (7.8 % of the width and 8.3 % of the height: 150 x 90 at 1920 x 1080, 84 x 160 at 1080 x 1920). Things travelling through may cross it.
Banned: particle bursts, glows, lens flares, camera shake, RGB split, crossfades, generic gradients, bouncy easing, holds longer than half a second, anything that looks like a template.
```

## For `<structure>`

```
{width} x {height} at {fps} fps. {BPM} BPM, {beats per bar} beats a bar, {beats} beats, {bars} bars of {bar seconds} seconds. Something happens on every beat. Moves start 0.05 s before their beat so they land on it.
Easing: a critically damped spring, 1 - (1 + w t) e^(-w t) with w between 12 and 40, so nothing ever passes its target; exponential ease-in and ease-out for wipes, presses and exits.
The last frame is the first frame, and the soundtrack loops with it.
Two corner labels stay on all film: top left "FIG. 07 — GEAR" (bar number and name), bottom right "BEAT 27 / 60".
```

## Format

| | Default | Choices |
|---|---|---|
| Frame | 1920 x 1080 | 1080 x 1920 (stories, reels), 1080 x 1080, 1080 x 1350, or any even size |
| Frame rate | 60 fps | 24, 25, 30, 48, 50, 60 |
| Meter | 4 beats a bar | 1 to 12 |
| Tempo | 120 BPM | any; match the brand's track if it has one |
| Length | 15 bars | any; 4 to 8 bars for social cuts |

Labels and the border scale with the frame; the hold limit is half a second at the film's frame rate.

## What the checks enforce

| Rule | Check |
|---|---|
| A cue on every beat | `beats`: every beat has a cue in `[beat - 0.05, beat]` |
| Last frame = first frame | `loop`: no 8 x 8 block differs between t = 0 and t = duration |
| Empty border | `border`: no `api.rest()` box enters the margin, and at least one is declared |
| No hold over 0.5 s | `holds`: no run of more than 30 identical frames (labels excluded), counted across the loop point |
| No stray colours | `palette`: ten times a second, pixels stay on blends between palette colours |

Glows and gradients built from palette colours pass the palette check; catch them by eye on the stills.
