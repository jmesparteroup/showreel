import * as b01 from './bars/01.js';
import * as b02 from './bars/02.js';
import * as b03 from './bars/03.js';
import * as b04 from './bars/04.js';
import * as b05 from './bars/05.js';
import * as b06 from './bars/06.js';
import * as b07 from './bars/07.js';
import * as b08 from './bars/08.js';
import * as b09 from './bars/09.js';
import * as b10 from './bars/10.js';
import * as b11 from './bars/11.js';
import * as b12 from './bars/12.js';
import * as b13 from './bars/13.js';
import * as b14 from './bars/14.js';
import * as b15 from './bars/15.js';
import { NAMES } from './shared.js';

const BARS = [b01, b02, b03, b04, b05, b06, b07, b08, b09, b10, b11, b12, b13, b14, b15];
const BAR = 2;

export default {
  slug: 'claude-motion-designer',
  bpm: 120,
  bars: 15,
  barNames: NAMES,
  palette: ['#EDE6D5', '#1B3ED2', '#45F0DD', '#07080A', '#16161A', '#FFFFFF'],
  cues: BARS.flatMap(b => b.cues),
  sounds: BARS.flatMap(b => b.sounds ?? []),
  // A bar owns the 0.05 s lead-in before its first beat, so moves that land
  // on a downbeat start inside the bar that animates them.
  draw(ctx, t, api) {
    BARS[Math.min(BARS.length - 1, Math.floor((t + 0.05) / BAR))].draw(t, api);
  },
};
