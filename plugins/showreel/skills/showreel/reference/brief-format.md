# Brief format

A brief has four tagged sections, in this order. Write in short declarative sentences with numbers. Leave out adjectives a renderer cannot act on ("dynamic", "sleek", "engaging").

```
<direction>
Build a {duration}-second looping {width} x {height}, {fps} fps film that introduces {SUBJECT}, {descriptor}.
Concept, in one line: {concept}.
{house rules: direction block}
Typefaces: {display face and weight} for big words, {label face and weight} for labels.
Palette: {named hexes from brand.json}. Each stage's accent is the next stage's colour: {...}.
{N} inks. The same geometry is drawn in whichever ink is on screen:
- {INK}: background, grid, line treatment, fill treatment, big-type treatment.
</direction>

<structure>
{house rules: structure block}
Scene changes: {ink A} to {ink B} by {a shape that floods the frame with a hard edge | one horizontal scan line}; ...
Bar names: {NAME, NAME, ...}.
Sound: {style}, {key}. {Which moves are heard: whooshes on floods, ticks under typing, ...} | The brand's track {file}, from {offset} s.
</structure>

<mascot>
{Optional. Exact unit dimensions of every part, drawn size in px, pose, how it is drawn in each ink. It is never an extra colour.}
</mascot>

<storyboard>
Bar 1, {NAME}, 0-2 s, {ink}.
Frame 0: {exact layout of the opening frame: positions, sizes, text}.
{time}: {what moves, from what geometry, into what geometry, with numbers}.
...
</storyboard>
```

## Storyboard rules

1. Every beat has a cue: four per bar, at bar start + 0, 0.5, 1.0 and 1.5 s at 120 BPM.
2. Every cue names a geometric operation: draw, split, bend, curl, morph, tile, extrude, turn, unfold, fill, retract, press, sweep, type on, un-type. "Appears" and "fades" are not operations.
3. Each bar starts from the geometry the previous bar ended with. State the handoff in the bar's first cue ("the hexagon shrinks...", not "a hexagon appears").
4. Give numbers for everything a renderer must place: px, radii, angles, counts, spacing, durations.
5. Scene changes happen on a downbeat and use the method named in `<structure>`.
6. The last bar rebuilds frame 0 exactly. Say how each element of frame 0 gets back into place.
7. Plan the arc: introduce the subject in bar 1, grow the drawing's dimension or complexity through the middle bars, and return to the opening in the last two bars.
8. Keep each bar's ideas drawable with the engine: lines, curves, polygons, gears, hex grids, cubes, spheres from latitude and meridian lines, type, the mascot. Anything else needs new geometry code; flag it.

## Checklist before showing the brief

- [ ] Every bar has four cues
- [ ] Every bar's first cue continues the previous bar's last state
- [ ] Nothing rests inside the empty border
- [ ] Palette, typefaces, inks and sound match brand.json
- [ ] Each ink is fully specified (background, grid, lines, fills, type)
- [ ] Each stage's accent is the next stage's colour
- [ ] The last bar rebuilds frame 0

See `examples/claude-motion-designer/brief.md` for a complete brief.
