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

export function createPalette(type) {
  const s = source[type];
  const dark = type === 'dark';
  const i = inks(s, type);

  // Quiet variants for secondary syntax: same hue, less chroma.
  const coralSoft = adjust(i.coral, { c: 0.78 });
  const amberSoft = adjust(i.amber, { c: 0.7 });

  // Diagnostics red sits between coral and berry, with more chroma than
  // either so errors stay distinct from function names and constants.
  const error = dark ? fromOklch({ l: 0.705, c: 0.15, h: 20 }) : fromOklch({ l: 0.53, c: 0.16, h: 20 });

  const text = {
    primary: s.foreground,
    ui: mix(s.foreground, s.secondary, dark ? 0.12 : 0.15),
    secondary: s.secondary,
    disabled: s.disabled,
    placeholder: mix(s.secondary, s.disabled, dark ? 0.5 : 0.45),
    lineNumber: dark ? mix(s.disabled, s.secondary, 0.12) : mix(s.secondary, s.disabled, 0.55),
    lineNumberActive: mix(s.foreground, s.secondary, 0.3),
    // Text placed on a solid coral / accent fill.
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
    // Selected rows: a warm, quiet blush drawn from the editor selection.
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

  const accent = {
    coral: s.coral,
    peach: s.peach,
    amber: s.amber,
    plum: s.plum,
    berry: s.berry,
    eucalyptus: s.eucalyptus,
    blue: s.blue,
    sage: s.sage,
    // Solid coral fills that carry text (buttons, badges, remote indicator).
    fill: dark ? s.coral : i.coral,
    fillHover: dark ? adjust(s.coral, { l: 0.035 }) : adjust(i.coral, { l: -0.035 }),
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
    // Symbolic operators: a dusty berry — present, never loud.
    operator: dark ? fromOklch({ l: 0.71, c: 0.06, h: 2 }) : fromOklch({ l: 0.55, c: 0.06, h: 2 }),
    // null / undefined / nil: muted plum-berry, quieter than real values.
    nullish: dark ? fromOklch({ l: 0.68, c: 0.055, h: 350 }) : fromOklch({ l: 0.56, c: 0.056, h: 350 }),
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
    source: s,
    ink: i,
    text,
    surface,
    line,
    accent,
    state,
    syntax,
    shadow: dark ? alpha('#0C090A', 0.55) : alpha(s.foreground, 0.14),
  };
}
