export function makeClock({ bpm = 120, bars = 15, beatsPerBar = 4, fps = 60, lead = 0.05 } = {}) {
  const spb = 60 / bpm;
  const barDur = spb * beatsPerBar;
  const duration = barDur * bars;
  const wrap = t => ((t % duration) + duration) % duration;
  // The epsilon keeps t = k * spb on beat k despite float error in k * spb.
  return {
    bpm, bars, beatsPerBar, spb, barDur, duration, fps, lead,
    totalBeats: beatsPerBar * bars,
    frames: Math.round(duration * fps),
    wrap,
    beatAt: t => Math.floor(wrap(t) / spb + 1e-9),
    barAt: t => Math.floor(wrap(t) / barDur + 1e-9),
    cue: beat => Math.round((beat * spb - lead) * 1e6) / 1e6,
    local: (t, start, dur) => Math.min(1, Math.max(0, (t - start) / dur)),
  };
}

export function labelText(clock, t, barNames) {
  const bar = clock.barAt(t);
  return {
    fig: `FIG. ${String(bar + 1).padStart(2, '0')} — ${barNames[bar]}`,
    beat: `BEAT ${clock.beatAt(t) + 1} / ${clock.totalBeats}`,
  };
}
