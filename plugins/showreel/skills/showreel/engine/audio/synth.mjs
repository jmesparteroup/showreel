// A deterministic score for a film: drums on the beat grid, a bass and pad in the
// brand's key, and sound effects on the film's cues. Every event writes into a
// buffer exactly one film long with its index taken modulo that length, so tails
// that run past the end come back in at the start and the audio loops like the picture.
import { rand } from '../rng.js';

export const SOUND_KINDS = ['hit', 'whoosh', 'click', 'tick', 'press', 'sweep', 'type', 'pop', 'none'];
const SEMITONE = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
const hz = midi => 440 * 2 ** ((midi - 69) / 12);

// Four-bar progressions as [offset from the key root, chord intervals].
const PROGRESSIONS = {
  minor: [[0, [0, 3, 7]], [8, [0, 4, 7]], [3, [0, 4, 7]], [10, [0, 4, 7]]],
  major: [[0, [0, 4, 7]], [7, [0, 4, 7]], [9, [0, 3, 7]], [5, [0, 4, 7]]],
};

const STYLES = {
  minimal: { kick: 'downbeat', kickGain: 0.7, rim: 0.25, hats: 0.07, clap: 0, bass: 'downbeat', bassGain: 0.35, pad: 0.12, pluck: 0 },
  electronic: { kick: 'beat', kickGain: 0.85, rim: 0, hats: 0.16, clap: 0.4, bass: 'eighths', bassGain: 0.3, pad: 0.09, pluck: 0 },
  organic: { kick: 'downbeat', kickGain: 0.5, rim: 0.3, hats: 0, clap: 0, bass: 'downbeat', bassGain: 0.3, pad: 0.14, pluck: 0.18 },
  none: null,
};

export function renderScore({ duration, bpm, beatsPerBar, bars, sounds = [], style = 'minimal', key = { root: 'A', mode: 'minor' }, sampleRate = 48000, gain = 1 }) {
  const SR = sampleRate;
  const N = Math.round(duration * SR);
  const L = new Float32Array(N), R = new Float32Array(N);
  const noise = rand('audio-noise', 1);

  // Writes voice(x) for x in [0, len) seconds starting at t, panned, wrapping at the loop point.
  const add = (t, len, pan, voice) => {
    const i0 = Math.round(t * SR), n = Math.round(len * SR);
    const gl = Math.cos((pan + 1) * Math.PI / 4), gr = Math.sin((pan + 1) * Math.PI / 4);
    for (let j = 0; j < n; j++) {
      const v = voice(j / SR);
      const i = (((i0 + j) % N) + N) % N;
      L[i] += v * gl; R[i] += v * gr;
    }
  };

  const kick = (t, g) => {
    let ph = 0;
    add(t, 0.4, 0, x => { ph += (2 * Math.PI * (48 + 110 * Math.exp(-x * 32))) / SR; return Math.sin(ph) * Math.exp(-x * 8) * g; });
  };
  const hpNoise = (t, len, decay, g, pan) => {
    let prev = 0;
    add(t, len, pan, x => { const n = noise() * 2 - 1; const v = n - prev; prev = n; return v * Math.exp(-x * decay) * g; });
  };
  const clap = (t, g) => { for (const d of [0, 0.011, 0.023]) hpNoise(t + d, 0.18, 22, g * 0.6, 0.1); };
  const rim = (t, g, pan = -0.2) => add(t, 0.06, pan, x => (Math.sin(2 * Math.PI * 1750 * x) + 0.4 * (noise() * 2 - 1)) * Math.exp(-x * 110) * g);
  const tone = (t, len, f, g, pan, { attack = 0.005, release = 0.08, harmonics = [1], decay = 0 } = {}) => {
    let y = 0;
    add(t, len + release, pan, x => {
      const env = Math.min(1, x / attack) * (x > len ? Math.max(0, 1 - (x - len) / release) : 1) * (decay ? Math.exp(-x * decay) : 1);
      let v = 0;
      harmonics.forEach((h, k) => { v += (h * Math.sin(2 * Math.PI * f * (k + 1) * x)); });
      y += (v - y) * 0.25; // gentle low-pass so the bass sits under the drums
      return y * env * g;
    });
  };

  const sfx = {
    hit: (s, g) => { kick(s.t, 0.6 * g); hpNoise(s.t, 0.2, 18, 0.25 * g, 0); },
    // A noise swell that lands on its cue time.
    whoosh: (s, g) => {
      let y = 0;
      add(s.t - 0.3, 0.42, 0.3, x => {
        const env = x < 0.3 ? (x / 0.3) ** 2 : Math.exp(-(x - 0.3) * 30);
        const k = 0.02 + 0.3 * Math.min(1, x / 0.3);
        y += ((noise() * 2 - 1) - y) * k;
        return y * env * 0.9 * g;
      });
    },
    click: (s, g) => add(s.t, 0.04, 0.2, x => (Math.sin(2 * Math.PI * 2600 * x) * 0.8 + (noise() * 2 - 1) * 0.3) * Math.exp(-x * 180) * 0.6 * g),
    tick: (s, g) => add(s.t, 0.02, 0.35, x => Math.sin(2 * Math.PI * 4200 * x) * Math.exp(-x * 350) * 0.35 * g),
    press: (s, g) => { let ph = 0; add(s.t, 0.3, 0, x => { ph += (2 * Math.PI * (70 + 40 * Math.exp(-x * 40))) / SR; return Math.sin(ph) * Math.exp(-x * 14) * 0.7 * g; }); },
    // A rising glide across the half second of a scan-line sweep.
    sweep: (s, g) => { let ph = 0; add(s.t, 0.5, -0.3, x => { ph += (2 * Math.PI * (300 * 4 ** (x / 0.5))) / SR; return Math.sin(ph) * Math.sin(Math.PI * x / 0.5) * 0.3 * g; }); },
    type: (s, g) => {
      const r = rand('type', s.t);
      for (let k = 0; k < (s.count ?? 6); k++) {
        const f = 3000 + 1500 * r();
        add(s.t + k * (s.interval ?? 0.05), 0.02, -0.4 + 0.8 * r(), x => Math.sin(2 * Math.PI * f * x) * Math.exp(-x * 300) * 0.3 * g);
      }
    },
    pop: (s, g) => { let ph = 0; add(s.t, 0.14, 0.15, x => { ph += (2 * Math.PI * (650 - 300 * x / 0.14)) / SR; return Math.sin(ph) * Math.exp(-x * 28) * 0.5 * g; }); },
    none: () => {},
  };

  sounds.forEach((s, i) => {
    if (!SOUND_KINDS.includes(s.kind)) throw new Error(`sounds[${i}].kind: "${s.kind}" is not one of ${SOUND_KINDS.join(', ')}`);
    if (typeof s.t !== 'number') throw new Error(`sounds[${i}].t must be a number of seconds`);
    sfx[s.kind](s, s.gain ?? 1);
  });

  const st = STYLES[style];
  if (st === undefined) throw new Error(`sound style "${style}" is not one of ${Object.keys(STYLES).join(', ')}`);
  if (st) {
    const spb = 60 / bpm, barDur = spb * beatsPerBar;
    const root = 45 + SEMITONE[key.root]; // around A2
    const prog = PROGRESSIONS[key.mode];
    for (let b = 0; b < bars; b++) {
      const t0 = b * barDur;
      const [off, chord] = prog[b % prog.length];
      for (let k = 0; k < beatsPerBar; k++) {
        const t = t0 + k * spb;
        if (st.kick === 'beat' || k === 0) kick(t, st.kickGain);
        if (st.rim && k > 0) rim(t, st.rim);
        if (st.clap && k % 2 === 1) clap(t, st.clap);
        if (st.hats) { hpNoise(t + spb / 2, 0.06, 70, st.hats, 0.4); hpNoise(t, 0.04, 90, st.hats * 0.5, -0.4); }
      }
      const bassHz = hz(root + off);
      if (st.bass === 'eighths') for (let e = 0; e < beatsPerBar * 2; e++) tone(t0 + e * spb / 2, spb / 2 * 0.8, bassHz, st.bassGain, 0, { harmonics: [1, 0.5, 0.25, 0.12] });
      else tone(t0, barDur * 0.9, bassHz, st.bassGain, 0, { harmonics: [1, 0.5, 0.25], release: 0.2 });
      for (const [n, iv] of chord.entries())
        tone(t0, barDur, hz(root + 24 + off + iv), st.pad / 3, (n - 1) * 0.5, { attack: 0.35, release: 0.35, harmonics: [1, 0.3] });
      if (st.pluck)
        for (let e = 0; e < beatsPerBar * 2; e++)
          tone(t0 + e * spb / 2, 0.3, hz(root + 36 + off + chord[e % chord.length]), st.pluck, e % 2 ? 0.3 : -0.3, { decay: 7, harmonics: [1, 0.4, 0.15] });
    }
  }

  // Levelled by loudness, not by the single loudest hit: gain to a fixed RMS, then a
  // tanh limiter so peaks round off under 0.89 instead of clipping. Silence stays silent.
  let sum = 0;
  for (let i = 0; i < N; i++) sum += L[i] * L[i] + R[i] * R[i];
  const level = Math.sqrt(sum / (2 * N));
  if (level > 0) {
    const k = (0.16 * Math.min(1, gain)) / level;
    for (let i = 0; i < N; i++) { L[i] = 0.89 * Math.tanh((L[i] * k) / 0.89); R[i] = 0.89 * Math.tanh((R[i] * k) / 0.89); }
  }
  return [L, R];
}
