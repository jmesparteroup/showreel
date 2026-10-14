---
name: showreel
description: Use when the user asks for a motion design showreel, brand film, title sequence, looping motion piece or kinetic type reel, or runs /showreel with a subject and a one-line concept. Builds the film's look and sound from the subject's brand identity, writes a beat-by-beat brief for approval, then renders a looping MP4 with a soundtrack using a deterministic Canvas 2D engine, checked against the house rules.
---

# showreel

Turns `SUBJECT — one-line concept` into a looping, beat-locked film with sound, in the subject's own brand, in which every shot is built out of the previous one.

Paths below are relative to this file's directory:

- `engine/` is the renderer and its command-line tools (written `ENGINE` in commands).
- `reference/` holds the rules and formats you write against.
- `examples/claude-motion-designer/`: 16:9, 60 fps, three preset inks, electronic score.
- `examples/kiln-and-co/`: 9:16, 30 fps, two brand inks, a Google font, organic score.

Films are written to `films/<slug>/` in the user's working directory.

## 1. Setup (once per machine, and again after a plugin update)

```bash
npm --prefix ENGINE install
npx --prefix ENGINE playwright install chromium
```

## 2. Brand

The film's look and sound come from the subject's brand, never from a default. Find the brand input, in this order:

1. A brand folder or file the user names (tokens, guidelines PDF, font files, logo).
2. A website URL. Fetch it and read colours from CSS custom properties, `theme-color` and the logo; typefaces from `@font-face` rules and Google Fonts links; tone from the copy.
3. A few words typed inline ("warm, handmade, terracotta and teal").

If there is none, ask once for a URL or a folder, and offer inline words as the fallback. Then:

```bash
node ENGINE/new-film.mjs <slug> --size 1920x1080 --fps 60 --bpm 120 --bars 15
```

Choose the format from where the film will be shown: 1080x1920 at 30 fps for stories and reels, 1080x1080 or 1080x1350 for feeds, 1920x1080 at 60 fps for sites and decks. Ask only if that matters and is unknown.

Write `films/<slug>/brand.json` following `reference/brand.md`:

- `palette`: the brand's colours, 2 to 8, named.
- `fonts`: the brand's display and label faces. Use `google:<Family>:<weight>` for Google fonts, a path for files the user gave you, `geist:<weight>` only when the brand has no typeface.
- `inks`: one to six stages, each a background, a line treatment and a fill treatment chosen to fit the brand's tone. `reference/brand.md` maps tones to treatments. Paper, blueprint and hologram are presets, not defaults; use them only if they fit the brand.
- `sound`: a style and key that fit the tone, or the brand's own track.

```bash
node ENGINE/fetch-fonts.mjs films/<slug>     # downloads google: fonts into films/<slug>/fonts/
node ENGINE/swatch.mjs films/<slug>          # one PNG per ink in films/<slug>/out/swatches/
```

Read every swatch. Fix the brand.json if an ink does not look like the brand.

## 3. Brief

Read `reference/house-rules.md`, `reference/brief-format.md` and both example briefs, then write `films/<slug>/brief.md`:

- Copy the house rules in, as written, with the border sizes for this film's frame.
- The palette, inks, typefaces and sound come from brand.json.
- Write the storyboard: one entry per bar, a cue on every beat, and exact numbers for every move (px, degrees, counts, radii). Bar N starts from bar N-1's last state. The last bar rebuilds frame 0.

Then **stop**. Show the user the swatches, the brand summary (palette, fonts, inks, sound) and the storyboard, and ask for approval or edits. Write no scene code before approval.

## 4. Build

Read `reference/film-api.md`, `reference/transitions.md`, and the example closest to this film's format.

1. Fill in `scenes.js`: `barNames`.
2. Write `shared.js`: the geometry at every bar boundary, in terms of `api.W`, `api.H`, `api.CX`, `api.CY`.
3. Write one bar module at a time (`bars/NN.js`). Its `cues` list the real move times; its `sounds` tag the moves that should be heard.
4. Call `api.rest({ x, y, w, h })` for every element once it settles. The border check only sees what is declared, and fails a film that declares nothing.

After each bar, render stills and look at every one:

```bash
node ENGINE/stills.mjs films/<slug> <bar start + 0.25> <bar midpoint> <bar end - 0.1>
```

Check by eye: the empty border, overlaps, type too small to read, fill density, smooth gradients or glow-like fills (the palette check cannot tell a gradient between two palette colours from anti-aliasing), and continuity with the previous bar's last still. Fix what you see before writing the next bar.

If the film fails to load, the error lists failed requests and any module with a syntax error, by file and line.

For the user: a live preview with a scrubber (`node ENGINE/preview.mjs films/<slug>`), and the soundtrack alone (`node ENGINE/audio.mjs films/<slug>`).

## 5. Check

```bash
node ENGINE/check.mjs films/<slug>
```

All five checks must pass: `beats`, `loop`, `border`, `holds`, `palette`. Fix the film, never the check. While working on one bar, use `--range t0,t1` (and `--only border,holds,palette`).

## 6. Export

```bash
node ENGINE/export.mjs films/<slug>
node ENGINE/stills.mjs films/<slug> --bars
```

The MP4 (`films/<slug>/out/<slug>.mp4`) carries the soundtrack as AAC; the WAV sits next to it. Give the user both paths and the stills folder.

## Never

- `Math.random`, `Date.now` or `performance.now` in a film. Use `t`; noise comes from the engine's seeded stroke ids.
- Opacity fades or crossfades between scenes. Scene changes are geometry: a flood shape or a scan line, through `api.split`.
- Springs with `w` outside [12, 40], or any easing that overshoots.
- The three preset inks for a brand they do not fit.
- Skipping the approval stop.
