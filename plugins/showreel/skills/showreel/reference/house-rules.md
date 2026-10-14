# House rules

Every film inherits these. Copy the two blocks below into the brief's `<direction>` and `<structure>` sections as written, then add the concept's own lines.

## For `<direction>`

```
Every shot is made out of the previous one: shapes, type and colour transform into the next scene. No cuts, no fades.
Typeface: Geist only. Weight 900 for big words, 600 to 800 for small labels (24 to 28 px, tracked 0.14 to 0.3 em).
Camera: locked and front-on for the whole film, like a drafting table. Objects turn; the camera never moves.
Empty border: nothing at rest within 150 px of the sides or 90 px of the top and bottom. Things travelling through may cross it.
Banned: particle bursts, glows, lens flares, camera shake, RGB split, crossfades, generic gradients, bouncy easing, holds longer than half a second, anything that looks like a template.
```

## For `<structure>`

```
{BPM} BPM, {beats} beats, {bars} bars of {bar seconds} seconds. Something happens on every beat. Moves start 0.05 s before their beat so they land on it.
Easing: a critically damped spring, 1 - (1 + w t) e^(-w t) with w between 12 and 40, so nothing ever passes its target; exponential ease-in and ease-out for wipes, presses and exits.
The last frame is the first frame, so it loops.
Two corner labels stay on all film: top left "FIG. 07 — GEAR" (bar number and name), bottom right "BEAT 27 / 60".
```

## Defaults

| | |
|---|---|
| Frame | 1920 x 1080, 60 fps |
| Tempo | 120 BPM, 4 beats a bar, 2 s bars |
| Length | 15 bars = 30 s = 60 beats = 1800 frames |
| Labels | Geist 800, 26 px, tracked 0.2 em; top left baseline at (150, 114), bottom right right-aligned at (1770, 990) |

Change tempo or length only when the concept asks for it. The engine reads `bpm` and `bars` from `scenes.js`.

## What the checks enforce

| Rule | Check |
|---|---|
| A cue on every beat | `beats`: every beat has a cue in `[beat - 0.05, beat]` |
| Last frame = first frame | `loop`: no 8 x 8 block differs between t = 0 and t = duration |
| Empty border | `border`: no `api.rest()` box enters the margin, and at least one is declared |
| No hold over 0.5 s | `holds`: no run of more than 30 identical frames (labels excluded), counted across the loop point |
| No stray colours | `palette`: ten times a second, pixels stay on blends between palette colours |

Glows and gradients built from palette colours pass the palette check; catch them by eye on the stills.
