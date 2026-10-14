// brand.json: the palette, fonts, inks and sound a film draws with. Pure, so it
// runs in the page (stage.js) and in Node (tests, swatches, the audio score).

export const LINE_STYLES = ['pencil', 'clean', 'light', 'marker', 'dashed'];
export const FILL_STYLES = ['hatch', 'cross', 'scan', 'dots', 'solid', 'none'];
export const OUTLINES = ['none', 'single', 'double'];
export const TRANSITIONS = ['flood', 'scan'];
export const SOUND_STYLES = ['minimal', 'electronic', 'organic', 'none'];
export const SOUND_KINDS = ['hit', 'whoosh', 'click', 'tick', 'press', 'sweep', 'type', 'pop', 'none'];
const FONT_ROLES = ['display', 'label', 'body'];
const INK_FIELDS = ['name', 'preset', 'colors', 'bg', 'grid', 'line', 'fill', 'type', 'accent', 'solid'];
const SUB_FIELDS = { bg: ['color', 'grain', 'image'], grid: ['color', 'step', 'opacity'], line: ['style', 'color', 'width', 'core'], fill: ['style', 'color', 'spacing', 'width'], type: ['fill', 'outline', 'spacing', 'width'], colors: ['bg', 'grid', 'line', 'fill', 'accent', 'solid', 'core'] };
export const GEIST_WEIGHTS = { 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold', 900: 'Black' };
const NOTES = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];

// The three inks of the original reel, in hex, with every parameter the renderer uses.
export const PRESETS = {
  paper: {
    bg: { color: '#EDE6D5', grain: 0.07 },
    grid: { color: '#1B3ED2', step: 60, opacity: [0.13, 0.26] },
    line: { style: 'pencil', color: '#16161A', width: 3 },
    fill: { style: 'hatch', color: '#1B3ED2', spacing: 9, width: 1.6 },
    type: { fill: 'hatch', outline: 'double', spacing: 7, width: 2.2 },
    accent: '#1B3ED2', solid: '#16161A',
  },
  blueprint: {
    bg: { color: '#1B3ED2', grain: 0 },
    grid: { color: '#FFFFFF', step: 60, opacity: [0.13, 0.26] },
    line: { style: 'clean', color: '#FFFFFF', width: 3.5 },
    fill: { style: 'hatch', color: '#FFFFFF', spacing: 7, width: 1.2 },
    type: { fill: 'hatch', outline: 'single', spacing: 6, width: 3 },
    accent: '#45F0DD', solid: '#FFFFFF',
  },
  hologram: {
    bg: { color: '#07080A', grain: 0 },
    grid: { color: '#45F0DD', step: 60, opacity: [0.13, 0.26] },
    line: { style: 'light', color: '#45F0DD', width: 4, core: '#FFFFFF' },
    fill: { style: 'scan', color: '#45F0DD', spacing: 8, width: 1 },
    type: { fill: 'scan', outline: 'single', spacing: 8, width: 3 },
    accent: '#FFFFFF', solid: '#FFFFFF',
  },
};

// Defaults for a hand-written ink, per line style, so a short spec still renders well.
const LINE_DEFAULTS = { pencil: 3, clean: 3.5, light: 4, marker: 5, dashed: 3 };
const FILL_DEFAULTS = { hatch: [9, 1.6], cross: [9, 1.6], scan: [8, 1], dots: [10, 1], solid: [8, 1], none: [8, 1] };

export const DEFAULT_BRAND = {
  name: 'showreel',
  palette: { paper: '#EDE6D5', blue: '#1B3ED2', cyan: '#45F0DD', black: '#07080A', graphite: '#16161A', white: '#FFFFFF' },
  fonts: { display: 'geist:900', label: 'geist:800', body: 'geist:600' },
  inks: [{ name: 'paper', preset: 'paper' }, { name: 'blueprint', preset: 'blueprint' }, { name: 'hologram', preset: 'hologram' }],
  transitions: ['flood', 'scan'],
  sound: { style: 'minimal', key: 'A minor' },
};

const fail = (path, msg) => { throw new Error(`brand.json ${path}: ${msg}`); };
const isHex = v => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);
const oneOf = (path, v, list) => { if (!list.includes(v)) fail(path, `"${v}" is not one of ${list.join(', ')}`); return v; };
const num = (path, v, lo, hi, dflt) => {
  if (v === undefined) return dflt;
  if (typeof v !== 'number' || v < lo || v > hi) fail(path, `${JSON.stringify(v)} must be a number from ${lo} to ${hi}`);
  return v;
};

function parseFont(path, v, dflt) {
  if (v === undefined) return dflt;
  if (typeof v !== 'string') fail(path, 'must be a string');
  let m;
  if ((m = v.match(/^geist:(\d+)$/))) {
    const w = Number(m[1]);
    if (!GEIST_WEIGHTS[w]) fail(path, `Geist weight ${w} is not one of ${Object.keys(GEIST_WEIGHTS).join(', ')}`);
    return { kind: 'geist', weight: w };
  }
  if ((m = v.match(/^google:([^:]+):(\d+)$/))) return { kind: 'google', family: m[1], weight: Number(m[2]) };
  if (/\.(otf|ttf|woff)$/i.test(v) && !v.startsWith('/') && !v.split('/').includes('..')) return { kind: 'file', path: v };
  fail(path, `"${v}" must be a film-relative .otf/.ttf/.woff path, google:<Family>:<weight> or geist:<weight>`);
}

export function fontURL(f) {
  if (f.kind === 'geist') return `/fonts/Geist-${GEIST_WEIGHTS[f.weight]}.otf`;
  if (f.kind === 'file') return '/film/' + f.path.split('/').map(encodeURIComponent).join('/');
  throw new Error(`font google:${f.family}:${f.weight} is not downloaded yet; run node ENGINE/fetch-fonts.mjs films/<slug>`);
}

export function loadBrand(json) {
  if (!json || typeof json !== 'object') fail('', 'must be a JSON object');
  const palette = {};
  const pal = json.palette ?? {};
  const keys = Object.keys(pal);
  if (keys.length < 2 || keys.length > 8) fail('palette', 'needs 2 to 8 named colours');
  for (const k of keys) { if (!isHex(pal[k])) fail(`palette.${k}`, `"${pal[k]}" is not #rrggbb`); palette[k] = pal[k].toUpperCase(); }

  const color = (path, v) => {
    if (isHex(v)) return v.toUpperCase();
    if (typeof v === 'string' && palette[v]) return palette[v];
    fail(path, `"${v}" is not a palette key or #rrggbb`);
  };

  const list = json.inks;
  if (!Array.isArray(list) || list.length < 1 || list.length > 6) fail('inks', 'needs 1 to 6 inks');
  const inks = {}, inkNames = [];
  list.forEach((raw, i) => {
    const p = `inks[${i}]`;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) fail(p, 'must be an object');
    // Unknown fields are almost always typos ("colour"); silently ignoring them renders the wrong look.
    for (const k of Object.keys(raw)) if (!INK_FIELDS.includes(k)) fail(`${p}.${k}`, `unknown field; use ${INK_FIELDS.join(', ')}`);
    for (const [sub, keys] of Object.entries(SUB_FIELDS)) {
      if (raw[sub] === undefined || raw[sub] === null) continue;
      if (typeof raw[sub] !== 'object' || Array.isArray(raw[sub])) fail(`${p}.${sub}`, 'must be an object');
      for (const k of Object.keys(raw[sub])) if (!keys.includes(k)) fail(`${p}.${sub}.${k}`, `unknown field; use ${keys.join(', ')}`);
    }
    if (typeof raw.name !== 'string' || !/^[A-Za-z][\w-]*$/.test(raw.name)) fail(`${p}.name`, 'must be a word starting with a letter');
    if (inks[raw.name]) fail(`${p}.name`, `"${raw.name}" is used twice`);
    let base = {};
    if (raw.preset !== undefined) base = structuredClone(PRESETS[oneOf(`${p}.preset`, raw.preset, Object.keys(PRESETS))]);
    const ink = { name: raw.name };
    const bg = { ...base.bg, ...raw.bg };
    ink.bg = { color: color(`${p}.bg.color`, raw.colors?.bg ?? bg.color), grain: num(`${p}.bg.grain`, bg.grain, 0, 0.2, 0), image: bg.image ?? null };
    if (ink.bg.image !== null && (typeof ink.bg.image !== 'string' || ink.bg.image.startsWith('/') || ink.bg.image.split('/').includes('..')))
      fail(`${p}.bg.image`, 'must be a path inside the film folder');
    const grid = raw.grid === null ? null : raw.grid ?? base.grid ?? null;
    ink.grid = grid && {
      color: color(`${p}.grid.color`, raw.colors?.grid ?? grid.color),
      step: num(`${p}.grid.step`, grid.step, 20, 400, 60),
      opacity: (() => {
        const o = grid.opacity ?? [0.13, 0.26];
        if (!Array.isArray(o) || o.length !== 2) fail(`${p}.grid.opacity`, 'must be [minor, major], two numbers from 0 to 1');
        return o.map((v, k) => num(`${p}.grid.opacity[${k}]`, v, 0, 1));
      })(),
    };
    const line = { ...base.line, ...raw.line };
    const ls = oneOf(`${p}.line.style`, line.style, LINE_STYLES);
    ink.line = {
      style: ls,
      color: color(`${p}.line.color`, raw.colors?.line ?? line.color),
      width: num(`${p}.line.width`, line.width, 0.5, 40, LINE_DEFAULTS[ls]),
      core: color(`${p}.line.core`, raw.colors?.core ?? line.core ?? '#FFFFFF'),
    };
    const fill = { ...base.fill, ...raw.fill };
    const fs = oneOf(`${p}.fill.style`, fill.style ?? 'hatch', FILL_STYLES);
    ink.fill = {
      style: fs,
      color: color(`${p}.fill.color`, raw.colors?.fill ?? fill.color ?? raw.accent ?? ink.line.color),
      spacing: num(`${p}.fill.spacing`, fill.spacing, 2, 60, FILL_DEFAULTS[fs][0]),
      width: num(`${p}.fill.width`, fill.width, 0.3, 10, FILL_DEFAULTS[fs][1]),
    };
    const type = { ...base.type, ...raw.type };
    ink.type = {
      fill: oneOf(`${p}.type.fill`, type.fill ?? fs, FILL_STYLES),
      outline: oneOf(`${p}.type.outline`, type.outline ?? 'single', OUTLINES),
      spacing: num(`${p}.type.spacing`, type.spacing, 2, 60, Math.max(4, ink.fill.spacing * 0.8)),
      width: num(`${p}.type.width`, type.width, 0.5, 20, Math.max(2, ink.line.width * 0.75)),
    };
    ink.accent = color(`${p}.accent`, raw.colors?.accent ?? raw.accent ?? base.accent ?? ink.fill.color);
    ink.solid = color(`${p}.solid`, raw.colors?.solid ?? raw.solid ?? base.solid ?? ink.line.color);
    inks[raw.name] = ink;
    inkNames.push(raw.name);
  });

  const f = json.fonts ?? {};
  for (const k of Object.keys(f)) if (!FONT_ROLES.includes(k)) fail(`fonts.${k}`, `unknown font role; use ${FONT_ROLES.join(', ')}`);
  const label = parseFont('fonts.label', f.label, { kind: 'geist', weight: 800 });
  const fonts = {
    display: parseFont('fonts.display', f.display, { kind: 'geist', weight: 900 }),
    label,
    body: parseFont('fonts.body', f.body, label),
  };

  const tr = json.transitions ?? TRANSITIONS;
  if (!Array.isArray(tr)) fail('transitions', `must be a list of ${TRANSITIONS.join(', ')}`);
  const transitions = tr.map((t, i) => oneOf(`transitions[${i}]`, t, TRANSITIONS));

  const s = json.sound ?? {};
  const key = s.key ?? 'A minor';
  const km = typeof key === 'string' && key.match(/^([A-G][#b]?) (major|minor)$/);
  if (!km || !NOTES.includes(km[1])) fail('sound.key', `"${key}" must look like "A minor" or "Eb major"`);
  const sound = {
    style: oneOf('sound.style', s.style ?? 'minimal', SOUND_STYLES),
    key: { root: km[1], mode: km[2] },
    file: s.file ?? null,
    offset: num('sound.offset', s.offset, 0, 600, 0),
    gain: num('sound.gain', s.gain, 0, 2, 1),
  };
  if (sound.file !== null && (typeof sound.file !== 'string' || sound.file.startsWith('/') || sound.file.split('/').includes('..')))
    fail('sound.file', 'must be a path inside the film folder');

  // Each stage's accent is meant to be the next stage's colour; a soft rule, so a warning.
  const warnings = [];
  for (let i = 0; i + 1 < inkNames.length; i++) {
    const a = inks[inkNames[i]], b = inks[inkNames[i + 1]];
    if (![b.bg.color, b.line.color].includes(a.accent)) warnings.push(`${a.name}'s accent ${a.accent} is not ${b.name}'s background or line colour`);
  }

  return { name: json.name ?? 'untitled', palette, inks, inkNames, fonts, transitions, sound, warnings };
}

// A film's `sounds` list, checked when the film loads so a typo fails before any frame renders.
export function checkSounds(sounds, duration) {
  if (sounds === undefined || sounds === null) return;
  if (!Array.isArray(sounds)) throw new Error('sounds must be a list of { t, kind }');
  sounds.forEach((s, i) => {
    if (!s || typeof s !== 'object') throw new Error(`sounds[${i}] must be an object`);
    if (!SOUND_KINDS.includes(s.kind)) throw new Error(`sounds[${i}].kind: "${s.kind}" is not one of ${SOUND_KINDS.join(', ')}`);
    if (typeof s.t !== 'number' || s.t < -1 || s.t > duration + 1) throw new Error(`sounds[${i}].t must be a time in seconds within the film`);
  });
}
