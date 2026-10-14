<direction>
Build a 9.6-second looping vertical film (1080 x 1920, 30 fps) that introduces KILN & CO., a ceramics studio.
Concept, in one line: a lump of clay is thrown into a pot, glazed, and fired back into clay.

Every shot is made out of the previous one: shapes, type and colour transform into the next scene. No cuts, no fades.
Typefaces: Space Grotesk 700 for the wordmark and numbers, Space Grotesk 500 for labels (30 to 34 px, tracked 0.2 to 0.3 em).
Palette: clay #C8643B, cream #F3E9DC, ink #2B2118, glaze #2F6F73. Each stage's accent is the next stage's colour: glaze on clay, cream on glaze.
Camera: locked and front-on for the whole film. Objects turn; the camera never moves.
Empty border: nothing at rest within 84 px of the sides or 160 px of the top and bottom. Things travelling through may cross it.

Two inks. The same geometry is drawn in whichever ink is on screen:
- KILN: cream with fine grain, no grid. Lines are a 6 px ink marker with a slight hand wobble, multiplied onto the paper. Fills are clay halftone dots on a fixed 12 px lattice. Big type is dots cut to the letters with a single outline.
- GLAZE: glaze teal with a 90 px cream grid at 8 % and every fifth line at 16 %. Clean 5 px cream lines, solid clay fills, solid type.

Banned: particle bursts, glows, lens flares, camera shake, RGB split, crossfades, generic gradients, bouncy easing, holds longer than half a second, anything that looks like a template.
</direction>

<structure>
100 BPM, 16 beats, 4 bars of 2.4 seconds. Something happens on every beat. Moves start 0.05 s before their beat so they land on it.
Easing: a critically damped spring, 1 - (1 + w t) e^(-w t) with w between 12 and 40, so nothing ever passes its target; exponential ease-in and ease-out for wipes, presses and exits.
Scene changes: KILN to GLAZE and back by a shape that floods the frame with a hard edge.
The last frame is the first frame, so it loops.
Two corner labels stay on all film: top left "FIG. 02 — GLAZE", bottom right "BEAT 6 / 16". Bar names: THROW, GLAZE, STEPS, FIRE.
Sound: organic, D major. Whooshes on the throw and both floods, pops as the pots split, typing ticks under every word.
</structure>

<storyboard>
Bar 1, THROW, 0-2.4 s, KILN.
Frame 0: a clay circle of radius 300 at (540, 820), dotted. KILN & CO. fitted to 780 px wide, baseline 1470. CERAMICS STUDIO small below at 1550.
0.0: the tag line un-types. 0.6: the circle is thrown into a pot (morph to the pot silhouette, 600 px wide, 680 tall). 1.2: the pot spins once on the wheel, narrowing to 55 % and back. 1.8: the wordmark drops out through the bottom edge.

Bar 2, GLAZE, 2.4-4.8 s, KILN to GLAZE.
2.4: the pot's own outline grows past the frame with a hard edge; inside it is GLAZE, the pot solid clay. 3.0: the pot splits into three at x = 250, 540, 830, each 42 % size. 3.6: they settle at 70 %, 100 % and 85 % height. 4.2: WHEEL, GLAZE, FIRE type on beneath them.

Bar 3, STEPS, 4.8-7.2 s, GLAZE.
4.8: the pots square up into bars 200 px wide. 5.4: numbers count up above them: 12, 48, 1240°. 6.0: names and numbers retract. 6.6: the bars fall into one 290 px line at y = 820.

Bar 4, FIRE, 7.2-9.6 s, GLAZE to KILN.
7.2: the line curls into a circle (length kept). 7.8: the circle grows past the frame; inside it is KILN again; the drawn circle settles at radius 300. 8.4: its dots build row by row. 9.0: the wordmark and tag line type back on; the last letter lands at 9.5; the frame is frame 0.
</storyboard>
