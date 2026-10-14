# showreel

A Claude Code skill that turns a subject and a one-line concept into a looping, beat-locked motion design film, with sound, in the subject's own brand.

```
/showreel CLAUDE, a motion designer — one pencil line gets promoted three times
```

Point it at a brand (a website, a brand folder, or a few words) and Claude builds a `brand.json` from it: palette, typefaces, how lines and fills are drawn, and how the score sounds. It shows you a swatch per ink and a beat-by-beat brief, and stops for your approval. Then it writes the scenes, renders checkpoint stills and reads them, runs the rule checks, and exports an MP4 with its soundtrack, in whatever size and frame rate the film is for, whose last frame is its first.

![Filmstrip of the reference film, one frame every two seconds](docs/filmstrip.png)

Two examples ship with the skill:

- `claude-motion-designer`: 1920 x 1080 at 60 fps, 15 bars at 120 BPM. One pencil line drawn on paper, then as wire on a blueprint, then as light on black, over an electronic score.
- `kiln-and-co`: 1080 x 1920 at 30 fps, 4 bars at 100 BPM, for an invented ceramics studio. Marker and halftone dots on cream, flooding into a teal glaze; Space Grotesk; an organic score.

## Install

```
/plugin marketplace add jmesparteroup/showreel
/plugin install showreel@showreel
```

On first use the skill has Claude install the renderer's dependencies (Playwright with Chromium, opentype.js, a bundled ffmpeg) into its `engine/` folder. A plugin update replaces that folder, so the install runs again after updates.

## What you get

```
films/<slug>/
  brand.json      palette, fonts, inks and sound
  brief.md        the brief you approved
  scenes.js       film settings and bar dispatch
  shared.js       geometry handed from one bar to the next
  bars/NN.js      one module per bar
  fonts/          the brand's fonts
  out/<slug>.mp4  picture and AAC soundtrack
  out/<slug>.wav  the soundtrack alone
  out/swatches/   one still per ink
  out/stills/     checkpoint PNGs
```

## House rules

Every film follows them, and `check.mjs` enforces the ones a machine can measure:

- The look and sound come from the brand; the three preset inks are only used when they fit.
- A cue on every beat; moves start 0.05 s early so they land on it.
- Critically damped springs (w 12 to 40) and exponential in/out. Nothing overshoots.
- Locked camera. No cuts and no fades: each shot is built from the previous one's geometry.
- Nothing at rest in the empty border (150 x 90 px at 1920 x 1080, scaled for other sizes).
- No glows, gradients, particles, shake or holds longer than half a second.
- The last frame is the first, and the soundtrack loops with it.

The full text is in [`house-rules.md`](plugins/showreel/skills/showreel/reference/house-rules.md); the brand format and treatment menu are in [`brand.md`](plugins/showreel/skills/showreel/reference/brand.md).

## Engine commands

Run from your project, with `ENGINE` set to the skill's `engine/` folder:

| Command | Does |
|---|---|
| `node ENGINE/new-film.mjs <slug> [--size 1080x1920 --fps 30 --bpm 100 --bars 4]` | Scaffold `films/<slug>/` |
| `node ENGINE/fetch-fonts.mjs films/<slug>` | Download the brand's Google fonts into the film |
| `node ENGINE/swatch.mjs films/<slug>` | One still per ink, for approving the look |
| `node ENGINE/preview.mjs films/<slug>` | Serve a live preview with a scrubber |
| `node ENGINE/stills.mjs films/<slug> 1.0 2.5` | Write PNG stills at those times (`--bars` for two per bar) |
| `node ENGINE/check.mjs films/<slug>` | Check beats, loop, border, holds and palette |
| `node ENGINE/audio.mjs films/<slug>` | Write the soundtrack WAV |
| `node ENGINE/export.mjs films/<slug>` | Render every frame, render the soundtrack, encode the MP4 |

Each frame is a pure function of its time: no randomness, no wall clock. That makes stills, checks and parallel export agree exactly.

## Working on this repo

```
npm run setup            # engine dependencies + Chromium
npm test                 # engine unit and pixel tests, reference golden frames
npm run check:example    # rule checks on the reference film
npm run export:example   # render the reference film
```

## Licence

Code is MIT. Geist is by Vercel under the SIL Open Font License (`plugins/showreel/skills/showreel/fonts/OFL.txt`). Space Grotesk, used by the Kiln & Co. example, is under the same licence (`examples/kiln-and-co/fonts/OFL.txt`).
