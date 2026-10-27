import { adjust, alpha, fromOklch, ink, mix } from './color.mjs';

/**
 * Source-of-truth palette. Every other color in Cindervale is derived from
 * these values (tints, overlays, text-safe "ink" tones) or is a deliberately
 * constructed warm neutral. Change these and rebuild — never hand-edit the
 * generated theme files.
 */
export const source = {
  light: {
    editor: '#FFF9F5',
    sidebar: '#F5EDE8',
    panel: '#F8F1EC',
    elevated: '#FFFDFB',
    foreground: '#342C31',
    secondary: '#766A70',
    disabled: '#A99A9B',
    border: '#E6D7CF',
    selection: '#F3C7B8',
    coral: '#D96E5E',
    peach: '#D88768',
    amber: '#B98134',
    plum: '#87506D',
    berry: '#AE536C',
    eucalyptus: '#4F8177',
    blue: '#5E719E',
    sage: '#6F8D68',
  },
  dark: {
    editor: '#191517',
    sidebar: '#211B1E',
    panel: '#251F22',
    elevated: '#2B2427',
    foreground: '#F4E9E2',
    secondary: '#B4A39D',
    disabled: '#75676A',
    border: '#3A3033',
    selection: '#5A393C',
    coral: '#F08A76',
    peach: '#F2A17F',
    amber: '#E5B45C',
    plum: '#C387A8',
    berry: '#E48BA0',
    eucalyptus: '#79B4A8',
    blue: '#91A7D8',
    sage: '#9EB391',
  },
};

/**
 * Text-safe accent tones ("inks").
 *
 * On the dark editor every accent already clears 6:1, so inks equal the
 * source accents. On warm paper, coral, peach, amber, eucalyptus and sage
 * sit between 2.6:1 and 4.3:1 — fine for indicators, too faint for text.
 * Their OKLCH lightness is lowered just enough to read comfortably; hue and
 * chroma are untouched, so the light theme stays recognisably the same
 * palette, only "printed" a little deeper.
 */
function inks(s, type) {
  if (type === 'dark') {
    const { coral, peach, amber, plum, berry, eucalyptus, blue, sage } = s;
    return { coral, peach, amber, plum, berry, eucalyptus, blue, sage };
  }
  return {
    coral: ink(adjust(s.coral, { c: 0.92 }), s.editor, 4.6),
    // Numbers sit one step lighter than functions and lean a few degrees
    // warmer, so coral and peach never collapse into the same terracotta.
    peach: ink(adjust(s.peach, { h: 6 }), s.editor, 4.15),
    amber: ink(s.amber, s.editor, 4.5),
    plum: s.plum,
    berry: s.berry,
    eucalyptus: ink(s.eucalyptus, s.editor, 4.6),
    blue: s.blue,
    sage: ink(s.sage, s.sidebar, 4.5),
  };
}

/**
 * Source-of-truth palette for Cindervale Accessible Light and Dark.
 *
 * Surfaces and neutrals are Cindervale's own (disabled text is raised so it
 * stays legible). The accents are a separate semantic set: violet keywords,
 * blue functions, ochre types, ember strings, teal numbers. Hue alone cannot
 * keep these apart for everyone — violet and blue merge under protanopia
 * and deuteranopia, ochre and orange merge too, blue and teal merge under
 * tritanopia — so each pair that shares a confusion line is also separated
 * by lightness. `npm run vision` measures every pair; docs/accessibility.md
 * records where these values moved from the starting palette and why.
 */
export const accessibleSource = {
  light: {
    editor: '#FFF9F5',
    sidebar: '#F5EDE8',
    panel: '#F8F1EC',
    elevated: '#FFFDFB',
    foreground: '#342C31',
    // Secondary and disabled text sit a step deeper than in the starting
    // palette so every tone mixed from them reaches 4.5:1 on the side bar.
    secondary: '#73676D',
    disabled: '#79686C',
    border: '#E6D7CF',
    // A touch more violet than the starting #E1D2F0, so tritanopes still
    // see the selection against the paper.
    selection: '#DCCAF2',
    // Interface accents: blue for keyboard focus and links, ember for the
    // brand marks Cindervale puts on whatever is active.
    focus: '#235D96',
    ember: '#9A4B1B',
    // Syntax: three dark tones and two mid tones.
    keyword: '#503987',
    function: '#1973B4',
    type: '#93661D',
    string: '#783A15',
    number: '#00595E',
    comment: '#7A6B68',
    error: '#8F0242',
    warning: '#93661D',
    added: '#1973B4',
    // Tints laid behind text lean toward the page, so text stays readable.
    findOverlay: '#D9AB45',
    // Removal tints are vermillion, not berry: under protanopia berry turns
    // slate blue and merges with the blue addition tints.
    removedOverlay: '#C2541A',
    terminal: { red: '#851B20', green: '#406755', yellow: '#845B02', blue: '#194691', magenta: '#73325C', cyan: '#086B86' },
    terminalBright: { red: '#AC2941', green: '#567266', yellow: '#916300', blue: '#4855A3', magenta: '#964A7B', cyan: '#107592' },
  },
  dark: {
    editor: '#191517',
    sidebar: '#211B1E',
    panel: '#251F22',
    elevated: '#2B2427',
    foreground: '#F4E9E2',
    secondary: '#B4A39D',
    disabled: '#A08D93',
    border: '#3A3033',
    selection: '#493A5F',
    focus: '#94BFF4',
    ember: '#F3A56D',
    keyword: '#AF8CE0',
    function: '#B0CDF1',
    type: '#BB901F',
    string: '#FDB786',
    number: '#71A3A9',
    comment: '#9E8379',
    error: '#EA6A9B',
    warning: '#E7C16D',
    added: '#6A96CC',
    findOverlay: '#A07A2A',
    removedOverlay: '#E07A45',
    terminal: { red: '#F27868', green: '#38C7AC', yellow: '#E9B63C', blue: '#9DB6E3', magenta: '#C38FB5', cyan: '#96DDE8' },
  },
};

/** Cindervale's neutrals — text tones, surfaces and lines — shared by every variant. */
function neutrals(s, dark) {
  const text = {
    primary: s.foreground,
    ui: mix(s.foreground, s.secondary, dark ? 0.12 : 0.15),
    secondary: s.secondary,
    disabled: s.disabled,
    placeholder: mix(s.secondary, s.disabled, dark ? 0.5 : 0.45),
    lineNumber: dark ? mix(s.disabled, s.secondary, 0.12) : mix(s.secondary, s.disabled, 0.55),
    lineNumberActive: mix(s.foreground, s.secondary, 0.3),
    // Text placed on a solid accent fill.
    onAccent: dark ? s.editor : s.elevated,
  };

  const surface = {
    editor: s.editor,
    sidebar: s.sidebar,
    panel: s.panel,
    elevated: s.elevated,
    lineHighlight: dark ? mix(s.editor, s.sidebar, 0.6) : mix(s.editor, s.sidebar, 0.5),
    hover: dark ? mix(s.sidebar, s.border, 0.35) : mix(s.sidebar, s.border, 0.3),
    inactiveSelection: dark ? mix(s.sidebar, s.border, 0.62) : mix(s.sidebar, s.border, 0.55),
    // Selected rows: a quiet tint drawn from the editor selection.
    activeSelection: dark ? mix(s.sidebar, s.selection, 0.62) : mix(s.sidebar, s.selection, 0.5),
    pickerSelection: dark ? mix(s.elevated, s.selection, 0.68) : mix(s.elevated, s.selection, 0.55),
    input: dark ? mix(s.editor, s.sidebar, 0.35) : s.elevated,
    // Inline code, code blocks and keybinding chips.
    inset: dark ? mix(s.panel, s.elevated, 0.5) : mix(s.sidebar, s.panel, 0.5),
  };

  const line = {
    border: s.border,
    strong: dark ? mix(s.border, s.secondary, 0.18) : mix(s.border, s.secondary, 0.22),
    guide: dark ? mix(s.editor, s.border, 0.6) : mix(s.editor, s.border, 0.55),
    guideActive: dark ? mix(s.border, s.secondary, 0.25) : mix(s.border, s.secondary, 0.25),
  };
  // Outlines of text inputs and of checkboxes, radios and secondary buttons.
  line.input = line.border;
  line.control = line.strong;

  return { text, surface, line };
}

export function createPalette({ type, accessible = false }) {
  return accessible ? accessiblePalette(type) : standardPalette(type);
}

function standardPalette(type) {
  const s = source[type];
  const dark = type === 'dark';
  const i = inks(s, type);
  const { text, surface, line } = neutrals(s, dark);

  // Quiet variants for secondary syntax: same hue, less chroma.
  const coralSoft = adjust(i.coral, { c: 0.78 });
  const amberSoft = adjust(i.amber, { c: 0.7 });

  // Diagnostics red sits between coral and berry, with more chroma than
  // either so errors stay distinct from function names and constants.
  const error = dark ? fromOklch({ l: 0.705, c: 0.15, h: 20 }) : fromOklch({ l: 0.53, c: 0.16, h: 20 });

  // Interface accents by role. Coral marks focus and whatever is active;
  // find is amber, references are plum, additions sage, removals berry.
  const accent = {
    brand: s.coral,
    focus: s.coral,
    // Solid coral fills that carry text (buttons, badges, remote indicator).
    fill: dark ? s.coral : i.coral,
    fillHover: dark ? adjust(s.coral, { l: 0.035 }) : adjust(i.coral, { l: -0.035 }),
    cursorSecondary: s.peach,
    selection: s.coral,
    find: s.amber,
    findOverlay: s.amber,
    reference: s.plum,
    secondary: s.plum,
    info: s.blue,
    warning: s.amber,
    added: s.sage,
    removed: s.berry,
    removedOverlay: s.berry,
    modified: mix(s.coral, s.peach, 0.55),
    success: s.sage,
    mergeCurrent: s.sage,
    mergeIncoming: s.blue,
    hint: alpha(i.eucalyptus, 0.8),
  };

  // Accents set as text: links, list matches, icons that carry meaning.
  const inked = {
    brand: i.coral,
    match: i.coral,
    link: i.blue,
    info: i.blue,
    find: i.amber,
    secondary: i.plum,
    removed: i.berry,
    success: i.sage,
    hint: i.eucalyptus,
  };

  // In the light theme, state colors also appear as file labels on the side
  // bar, so they are inked against that (slightly darker) surface.
  const onSidebar = (tone) => (dark ? tone : ink(tone, s.sidebar, 4.5));

  const state = {
    error,
    warning: onSidebar(s.amber),
    info: i.blue,
    hint: i.eucalyptus,
    success: i.sage,
    modified: dark ? mix(s.coral, s.peach, 0.55) : ink(mix(s.coral, s.peach, 0.55), s.sidebar, 4.5),
    added: i.sage,
    deleted: onSidebar(s.berry),
    renamed: onSidebar(s.blue),
    conflict: error,
    submodule: i.plum,
    ignored: s.disabled,
  };

  const syntax = {
    text: s.foreground,
    keyword: i.plum,
    function: i.coral,
    method: coralSoft,
    type: i.amber,
    typeSoft: amberSoft,
    string: i.eucalyptus,
    number: i.peach,
    constant: i.berry,
    enum: i.berry,
    // Symbolic operators: a dusty berry — present, never loud.
    operator: dark ? fromOklch({ l: 0.71, c: 0.06, h: 2 }) : fromOklch({ l: 0.55, c: 0.06, h: 2 }),
    // null / undefined / nil: muted plum-berry, quieter than real values.
    nullish: dark ? fromOklch({ l: 0.68, c: 0.055, h: 350 }) : fromOklch({ l: 0.56, c: 0.056, h: 350 }),
    module: i.blue,
    namespace: i.blue,
    // Comments are a warm rosewood taupe, not a dead grey; docs read a step clearer.
    comment: dark ? fromOklch({ l: 0.655, c: 0.028, h: 30 }) : ink(fromOklch({ l: 0.565, c: 0.027, h: 24 }), s.editor, 4.5),
    docComment: s.secondary,
    punctuation: mix(s.secondary, s.disabled, dark ? 0.15 : 0.12),
    tag: i.plum,
    tagPunctuation: mix(i.plum, s.secondary, 0.55),
    attribute: amberSoft,
    component: i.coral,
    key: i.plum,
    cssProperty: i.blue,
    heading: i.coral,
    subheading: i.plum,
    link: i.blue,
  };
  syntax.docTag = mix(syntax.keyword, syntax.comment, 0.45);
  syntax.docType = mix(syntax.type, syntax.comment, 0.5);

  return {
    type,
    accessible: false,
    source: s,
    text,
    surface,
    line,
    accent,
    ink: inked,
    state,
    syntax,
    bracketTones: [s.plum, s.amber, s.blue],
    graphLanes: [s.coral, s.eucalyptus, s.amber, s.plum, s.blue],
    chart: { red: error, blue: i.blue, yellow: s.amber, orange: s.peach, green: s.sage, purple: s.plum },
    terminal: terminal(s, { Red: error, Green: s.sage, Yellow: s.amber, Blue: s.blue, Magenta: s.plum, Cyan: s.eucalyptus }, type),
    shadow: dark ? alpha('#0C090A', 0.55) : alpha(s.foreground, 0.14),
  };
}

function accessiblePalette(type) {
  const s = accessibleSource[type];
  const dark = type === 'dark';
  const { text, surface, line } = neutrals(s, dark);

  // Inputs, checkboxes and radios get a 3:1 outline against every surface
  // they sit on, so their shape never depends on a faint border.
  line.input = ink(line.strong, dark ? s.elevated : s.sidebar, 3.1);
  line.control = line.input;

  const onSidebar = (tone) => (dark ? tone : ink(tone, s.sidebar, 4.5));

  // One meaning per accent across the whole interface: blue is focus,
  // information and additions; ochre is find, warnings and modifications;
  // berry is errors and removals; ember marks what is active.
  const accent = {
    brand: s.ember,
    focus: s.focus,
    fill: s.ember,
    fillHover: adjust(s.ember, { l: dark ? 0.035 : -0.035 }),
    cursorSecondary: s.focus,
    selection: s.keyword,
    find: s.warning,
    findOverlay: s.findOverlay,
    reference: s.number,
    secondary: s.keyword,
    info: s.function,
    warning: s.warning,
    added: s.added,
    removed: s.error,
    removedOverlay: s.removedOverlay,
    modified: s.warning,
    success: s.function,
    mergeCurrent: s.added,
    mergeIncoming: s.number,
    // Hint dots at full strength: translucent teal drifts into info blue.
    hint: s.number,
  };

  const inked = {
    brand: s.ember,
    match: s.focus,
    link: s.focus,
    info: onSidebar(s.function),
    find: onSidebar(s.warning),
    secondary: s.keyword,
    removed: s.error,
    success: onSidebar(s.function),
    hint: s.number,
  };

  const state = {
    error: s.error,
    warning: onSidebar(s.warning),
    info: onSidebar(s.function),
    hint: s.number,
    success: onSidebar(s.function),
    modified: onSidebar(s.warning),
    added: onSidebar(s.function),
    deleted: s.error,
    renamed: s.number,
    conflict: s.error,
    submodule: s.keyword,
    ignored: s.disabled,
  };

  const syntax = {
    text: s.foreground,
    keyword: s.keyword,
    function: s.function,
    method: s.function,
    type: s.type,
    typeSoft: s.type,
    string: s.string,
    number: s.number,
    // Constants keep the text color and are told apart by weight.
    constant: s.foreground,
    constantStyle: 'bold',
    enum: s.type,
    // Operators and punctuation stay neutral so the five accents carry the page.
    operator: s.secondary,
    nullish: s.number,
    module: s.keyword,
    namespace: s.foreground,
    comment: s.comment,
    docComment: s.secondary,
    punctuation: mix(s.secondary, s.disabled, 0.4),
    tag: s.keyword,
    tagPunctuation: mix(s.keyword, s.secondary, 0.55),
    attribute: s.type,
    component: s.function,
    key: s.keyword,
    cssProperty: s.function,
    heading: s.type,
    subheading: s.keyword,
    link: s.function,
  };
  syntax.docTag = mix(syntax.keyword, syntax.comment, 0.45);
  syntax.docType = mix(syntax.type, syntax.comment, 0.5);

  return {
    type,
    accessible: true,
    // Focus outlines are drawn solid instead of translucent.
    solidFocus: true,
    source: s,
    text,
    surface,
    line,
    accent,
    ink: inked,
    state,
    syntax,
    bracketTones: [s.keyword, s.type, s.number],
    graphLanes: [s.ember, s.function, s.type, s.keyword, s.number],
    chart: { red: s.error, blue: s.function, yellow: s.warning, orange: s.ember, green: s.number, purple: s.keyword },
    terminal: terminal(s, ansiHues(s.terminal), type, s.terminalBright && ansiHues(s.terminalBright)),
    shadow: dark ? alpha('#0C090A', 0.55) : alpha(s.foreground, 0.14),
  };
}

/**
 * ANSI palette. In the dark themes the given hues are used as they are and
 * the bright variants are lifted a step. Light-theme colors clear 4.5:1 on
 * the panel so VS Code's minimum-contrast correction never has to repaint
 * them. `brights` replaces the derived bright variants where a palette
 * tunes them by hand.
 */
function terminal(s, hues, type, brights) {
  const colors = {};
  if (type === 'dark') {
    colors.Black = s.border;
    colors.BrightBlack = mix(s.disabled, s.secondary, 0.5);
    for (const [name, tone] of Object.entries(hues)) {
      colors[name] = tone;
      colors[`Bright${name}`] = brights?.[name] ?? adjust(tone, { l: 0.06, c: 1.08 });
    }
    colors.White = mix(s.secondary, s.foreground, 0.5);
    colors.BrightWhite = s.foreground;
  } else {
    colors.Black = s.foreground;
    colors.BrightBlack = s.secondary;
    for (const [name, tone] of Object.entries(hues)) {
      colors[name] = ink(tone, s.panel, 5.4);
      colors[`Bright${name}`] = brights?.[name] ?? ink(adjust(tone, { c: 1.12 }), s.panel, 4.6);
    }
    colors.White = mix(s.secondary, s.disabled, 0.5);
    colors.BrightWhite = mix(s.disabled, s.border, 0.35);
  }
  return colors;
}

const ansiHues = (t) => ({ Red: t.red, Green: t.green, Yellow: t.yellow, Blue: t.blue, Magenta: t.magenta, Cyan: t.cyan });
