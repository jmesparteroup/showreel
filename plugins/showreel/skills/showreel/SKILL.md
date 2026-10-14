---
name: showreel
description: Use when the user asks for a motion design showreel, title film, looping motion piece or kinetic type reel, or runs /showreel with a subject and a one-line concept. Expands the concept into a beat-by-beat brief, gets it approved, then renders a looping 1920x1080 MP4 with a deterministic Canvas 2D engine and checks it against the house rules.
---

# showreel

Turns `SUBJECT — one-line concept` into a looping, beat-locked film in which every shot is built out of the previous one.

Paths below are relative to this file's directory:

- `engine/` is the renderer and its command-line tools (written `ENGINE` in commands).
- `reference/` holds the rules and formats you write against.
- `examples/claude-motion-designer/` is a complete film: its `brief.md` is the reference brief and its `bars/` are the reference scene code.

Films are written to `films/<slug>/` in the user's working directory.

## 1. Setup (once per machine)

```bash
npm --prefix ENGINE install
npx --prefix ENGINE playwright install chromium
```

## 2. Write the brief

Input: a subject (who or what the film introduces) and a one-line concept. If either is missing, ask for it and nothing else.

Read `reference/house-rules.md`, `reference/brief-format.md` and `examples/claude-motion-designer/brief.md` before writing. Then scaffold and write the brief:

```bash
node ENGINE/new-film.mjs <slug>        # run from the user's working directory
```

Write `films/<slug>/brief.md`:

- Copy the house rules in, as written.
- Choose the stages and inks. Use the three-ink preset in `reference/inks.md` unless the concept asks for something else. A different ink set needs engine support (`engine/ink/`); say so to the user before committing to it.
- Design the recurring character or object, if the concept has one.
- Write the storyboard: one entry per bar, a cue on each of the four beats, and exact numbers for every move (px, degrees, counts, radii). Bar N starts from bar N-1's last state. The last bar rebuilds frame 0.

Then **stop**. Show the user the storyboard and ask for approval or edits. Write no scene code before approval.

## 3. Build

Read `reference/film-api.md`, `reference/transitions.md` and the reference film's `scenes.js`, `shared.js` and two or three of its bars.

1. Fill in `scenes.js`: `barNames`, `palette`.
2. Write `shared.js`: the geometry at every bar boundary, as constants or functions of `api`.
3. Write one bar module at a time (`bars/NN.js`). Its `cues` list the real move times from the storyboard.

After each bar, render stills and look at every one:

```bash
node ENGINE/stills.mjs films/<slug> <bar start + 0.25> <bar midpoint> <bar end - 0.1>
```

Check by eye: the empty border, overlaps, type too small to read, hatching density, and continuity with the previous bar's last still. Fix what you see before writing the next bar.

For the user, a live preview with a scrubber: `node ENGINE/preview.mjs films/<slug>`.

## 4. Check

```bash
node ENGINE/check.mjs films/<slug>
```

All five checks must pass: `beats`, `loop`, `border`, `holds`, `palette`. Fix the film, never the check. While working on one bar, use `--range t0,t1` (and `--only border,holds,palette`).

## 5. Export

```bash
node ENGINE/export.mjs films/<slug>
node ENGINE/stills.mjs films/<slug> --bars
```

Give the user the MP4 path (`films/<slug>/out/<slug>.mp4`) and the stills folder.

## Never

- `Math.random`, `Date.now` or `performance.now` in a film. Use `t`; noise comes from the engine's seeded stroke ids.
- Opacity fades or crossfades between scenes. Scene changes are geometry: a flood shape or a scan line, through `api.split`.
- Springs with `w` outside [12, 40], or any easing that overshoots.
- Skipping the brief-approval stop.
