// Foreground/background pairs that must stay readable, with minimum WCAG
// contrast ratios. Each pair names the real surface it appears on; when that
// surface is a translucent overlay (diff lines, find matches) it is first
// composited onto the editor it covers.
//
// Text a person reads for meaning targets 4.5:1. Secondary labels, hints and
// line numbers in the standard themes have lower, deliberate floors.
// Interface boundaries and indicators (focus rings, input outlines, active
// tab marks, gutter bars) target 3:1, WCAG's non-text contrast level.
//
// Pairs marked `accessible` hold the accessible variants to a stricter
// target. The standard themes were not designed against those targets: their
// ratios are still measured and reported, but not enforced.

import { contrast, over } from '../src/color.mjs';

const tokenRule = (theme, name) => {
  const rule = theme.tokenColors.find((r) => r.name === name);
  if (!rule) throw new Error(`${theme.name}: no token rule named "${name}"`);
  return rule.settings.foreground;
};

/** Syntax roles that must read on every editor surface, keyed by token rule name. */
const SYNTAX = {
  Comments: 'Comments',
  'Doc comments': 'Documentation comments and docstrings',
  Keywords: 'Keywords and storage',
  Functions: 'Functions',
  Methods: 'Methods',
  Types: 'Types, classes, interfaces',
  'Primitive types': 'Primitive and built-in types',
  Strings: 'Strings',
  Numbers: 'Numbers and units',
  Constants: 'Named constants and enum members',
  Operators: 'Operators',
  'null and undefined': 'null, undefined, nil, None',
  Namespaces: 'Namespaces and modules',
  Tags: 'Tags',
  Attributes: 'Attributes',
  'Tag punctuation': 'Tag punctuation',
  Punctuation: 'Punctuation',
};

// Floors the standard themes were designed to (see the 1.0.0 audit).
const STANDARD_SYNTAX_FLOORS = {
  'Primitive types': 4.4,
  Numbers: 4,
  Attributes: 4.4,
  'Tag punctuation': 3.5,
  Punctuation: 4,
};

export function contrastPairs(theme) {
  const c = (key) => {
    const value = theme.colors[key];
    if (!value) throw new Error(`${theme.name}: missing color ${key}`);
    return value;
  };
  const token = (name) => tokenRule(theme, name);
  const editor = c('editor.background');
  const sidebar = c('sideBar.background');
  const panel = c('panel.background');
  const terminal = theme.colors['terminal.background'] ?? panel;
  const pairs = [];

  /** add(group, name, fg, bg, min, { base, accessible, kind }) */
  const add = (group, name, fg, bg, min, options = {}) => pairs.push({ group, name, fg, bg, min, kind: 'text', ...options });
  const boundary = (group, name, fg, bg, min = 3, options = {}) => add(group, name, fg, bg, min, { kind: 'non-text', ...options });

  // ── Editor ───────────────────────────────────────────────────────────
  add('Editor', 'Editor text', c('editor.foreground'), editor, 7);
  add('Editor', 'Editor text on current line', c('editor.foreground'), c('editor.lineHighlightBackground'), 7);
  add('Editor', 'Line numbers', c('editorLineNumber.foreground'), editor, 3, { accessible: 4.5 });
  add('Editor', 'Active line number', c('editorLineNumber.activeForeground'), editor, 7);
  add('Editor', 'Code lens', c('editorCodeLens.foreground'), editor, 3, { accessible: 4.5 });
  add('Editor', 'Ghost text', c('editorGhostText.foreground'), editor, 2.5, { accessible: 3 });
  add('Editor', 'Placeholder', c('editor.placeholder.foreground'), editor, 3, { accessible: 4.5 });
  add('Editor', 'Inlay hints', c('editorInlayHint.foreground'), c('editorInlayHint.background'), 3, { base: editor, accessible: 4.5 });
  add('Editor', 'Inline values (debugging)', c('editor.inlineValuesForeground'), c('editor.inlineValuesBackground'), 4.4, { base: editor, accessible: 4.5 });
  add('Editor', 'Folded range placeholder', c('editor.foldPlaceholderForeground'), editor, 4.5);
  boundary('Editor', 'Cursor', c('editorCursor.foreground'), editor);
  boundary('Editor', 'Cursor on current line', c('editorCursor.foreground'), c('editor.lineHighlightBackground'));

  for (const [label, rule] of Object.entries(SYNTAX)) {
    const fg = token(rule);
    add('Syntax', `${label}`, fg, editor, STANDARD_SYNTAX_FLOORS[label] ?? 4.5, { accessible: 4.5 });
    add('Syntax', `${label} on current line`, fg, c('editor.lineHighlightBackground'), 0, { accessible: 4.5 });
    const quiet = label === 'Comments' || label === 'Punctuation';
    add('Syntax', `${label} on selection`, fg, c('editor.selectionBackground'), label === 'Comments' ? 2.8 : 0, { accessible: quiet ? 2.8 : 3 });
  }
  add('Syntax', 'Text on selection', c('editor.foreground'), c('editor.selectionBackground'), 7);

  // Overlays the eye reads through: text must survive them.
  const overlays = {
    'Find match': 'editor.findMatchBackground',
    'Other find matches': 'editor.findMatchHighlightBackground',
    'Selection highlight': 'editor.selectionHighlightBackground',
    'Symbol reference': 'editor.wordHighlightStrongBackground',
    'Inactive selection': 'editor.inactiveSelectionBackground',
    'Inserted line': 'diffEditor.insertedLineBackground',
    'Inserted text': 'diffEditor.insertedTextBackground',
    'Removed line': 'diffEditor.removedLineBackground',
    'Removed text': 'diffEditor.removedTextBackground',
    'Merge: current change': 'merge.currentContentBackground',
    'Merge: incoming change': 'merge.incomingContentBackground',
    'Paused stack frame': 'editor.stackFrameHighlightBackground',
  };
  for (const [label, key] of Object.entries(overlays)) {
    add('Overlays', `Text on ${label.toLowerCase()}`, c('editor.foreground'), c(key), 4.5, { base: editor, accessible: 7 });
    add('Overlays', `Strings on ${label.toLowerCase()}`, token('Strings'), c(key), 0, { base: editor, accessible: 3.5 });
    add('Overlays', `Comments on ${label.toLowerCase()}`, token('Comments'), c(key), 0, { base: editor, accessible: 3 });
  }

  // ── Diagnostics and change markers (indicators: 3:1) ────────────────
  boundary('Diagnostics', 'Error squiggle', c('editorError.foreground'), editor);
  boundary('Diagnostics', 'Warning squiggle', c('editorWarning.foreground'), editor);
  boundary('Diagnostics', 'Info squiggle', c('editorInfo.foreground'), editor);
  boundary('Diagnostics', 'Hint dots', c('editorHint.foreground'), editor, 0, { accessible: 3 });
  boundary('Diagnostics', 'Problems: error icon', c('problemsErrorIcon.foreground'), panel);
  boundary('Diagnostics', 'Problems: warning icon', c('problemsWarningIcon.foreground'), panel);
  boundary('Diagnostics', 'Problems: info icon', c('problemsInfoIcon.foreground'), panel);
  boundary('Diagnostics', 'Gutter: added', c('editorGutter.addedBackground'), editor, 0, { accessible: 3 });
  boundary('Diagnostics', 'Gutter: modified', c('editorGutter.modifiedBackground'), editor, 0, { accessible: 3 });
  boundary('Diagnostics', 'Gutter: deleted', c('editorGutter.deletedBackground'), editor, 0, { accessible: 3 });
  boundary('Diagnostics', 'Breakpoint', c('debugIcon.breakpointForeground'), editor);

  // ── Chrome ───────────────────────────────────────────────────────────
  add('Chrome', 'Side bar text', c('sideBar.foreground'), sidebar, 7);
  add('Chrome', 'Side bar title', c('sideBarTitle.foreground'), sidebar, 4.4, { accessible: 4.5 });
  add('Chrome', 'Active tab', c('tab.activeForeground'), c('tab.activeBackground'), 7);
  add('Chrome', 'Inactive tab', c('tab.inactiveForeground'), c('tab.inactiveBackground'), 4.4, { accessible: 4.5 });
  add('Chrome', 'Unfocused active tab', c('tab.unfocusedActiveForeground'), c('tab.unfocusedActiveBackground'), 4.5);
  add('Chrome', 'Unfocused inactive tab', c('tab.unfocusedInactiveForeground'), c('tab.unfocusedInactiveBackground'), 3, { accessible: 4.5 });
  add('Chrome', 'Hovered tab', c('tab.hoverForeground'), c('tab.hoverBackground'), 7);
  add('Chrome', 'Breadcrumbs', c('breadcrumb.foreground'), c('breadcrumb.background'), 4.5);
  add('Chrome', 'Activity bar (inactive)', c('activityBar.inactiveForeground'), c('activityBar.background'), 4.4, { accessible: 4.5 });
  add('Chrome', 'Title bar', c('titleBar.activeForeground'), c('titleBar.activeBackground'), 7);
  add('Chrome', 'Command center', c('commandCenter.foreground'), c('commandCenter.background'), 7);
  add('Chrome', 'Status bar', c('statusBar.foreground'), c('statusBar.background'), 4.5);
  add('Chrome', 'Status bar remote', c('statusBarItem.remoteForeground'), c('statusBarItem.remoteBackground'), 4.5);
  add('Chrome', 'Status bar debugging', c('statusBar.debuggingForeground'), c('statusBar.debuggingBackground'), 4.5);
  add('Chrome', 'Status bar error item', c('statusBarItem.errorForeground'), c('statusBarItem.errorBackground'), 4.5);
  add('Chrome', 'Status bar warning item', c('statusBarItem.warningForeground'), c('statusBarItem.warningBackground'), 4.5);
  add('Chrome', 'Status bar offline item', c('statusBarItem.offlineForeground'), c('statusBarItem.offlineBackground'), 4.5);
  add('Chrome', 'Panel title', c('panelTitle.activeForeground'), panel, 7);
  add('Chrome', 'Inactive panel title', c('panelTitle.inactiveForeground'), panel, 4.4, { accessible: 4.5 });
  add('Chrome', 'Description text', c('descriptionForeground'), sidebar, 4.4, { accessible: 4.5 });
  add('Chrome', 'Disabled text', c('disabledForeground'), sidebar, 0, { accessible: 3 });
  boundary('Chrome', 'Active tab mark', c('tab.activeBorderTop'), c('editorGroupHeader.tabsBackground'), 0, { accessible: 3 });
  boundary('Chrome', 'Active activity bar item mark', c('activityBar.activeBorder'), c('activityBar.background'), 0, { accessible: 3 });
  boundary('Chrome', 'Active panel title mark', c('panelTitle.activeBorder'), panel, 0, { accessible: 3 });

  // ── Controls ─────────────────────────────────────────────────────────
  add('Controls', 'Primary button', c('button.foreground'), c('button.background'), 4.5);
  add('Controls', 'Primary button hover', c('button.foreground'), c('button.hoverBackground'), 4.5);
  add('Controls', 'Secondary button', c('button.secondaryForeground'), c('button.secondaryBackground'), 7);
  add('Controls', 'Extension button', c('extensionButton.foreground'), c('extensionButton.background'), 4.5);
  add('Controls', 'Activity badge', c('activityBarBadge.foreground'), c('activityBarBadge.background'), 4.5);
  add('Controls', 'Warning badge', c('activityWarningBadge.foreground'), c('activityWarningBadge.background'), 4.5);
  add('Controls', 'Error badge', c('activityErrorBadge.foreground'), c('activityErrorBadge.background'), 4.5);
  add('Controls', 'Badge', c('badge.foreground'), c('badge.background'), 7);
  add('Controls', 'Input text', c('input.foreground'), c('input.background'), 7);
  add('Controls', 'Input placeholder', c('input.placeholderForeground'), c('input.background'), 3, { accessible: 4.5 });
  add('Controls', 'Input validation: error', c('inputValidation.errorForeground'), c('inputValidation.errorBackground'), 7);
  add('Controls', 'Input validation: warning', c('inputValidation.warningForeground'), c('inputValidation.warningBackground'), 7);
  add('Controls', 'Input validation: info', c('inputValidation.infoForeground'), c('inputValidation.infoBackground'), 7);
  add('Controls', 'Dropdown', c('dropdown.foreground'), c('dropdown.background'), 7);
  add('Controls', 'Keybinding label', c('keybindingLabel.foreground'), c('keybindingLabel.background'), 4.5);
  boundary('Controls', 'Focus ring on side bar', c('focusBorder'), sidebar, 0, { accessible: 3 });
  boundary('Controls', 'Focus ring on editor', c('focusBorder'), editor, 0, { accessible: 3 });
  boundary('Controls', 'Focus ring on widgets', c('focusBorder'), c('editorWidget.background'), 0, { accessible: 3 });
  boundary('Controls', 'List focus outline', c('list.focusOutline'), sidebar, 0, { accessible: 3 });
  boundary('Controls', 'Input outline on input', c('input.border'), c('input.background'), 0, { accessible: 3 });
  boundary('Controls', 'Input outline on side bar', c('input.border'), sidebar, 0, { accessible: 3 });
  boundary('Controls', 'Input outline on widgets', c('input.border'), c('quickInput.background'), 0, { accessible: 3 });
  boundary('Controls', 'Checkbox outline', c('checkbox.border'), c('checkbox.background'), 0, { accessible: 3 });
  boundary('Controls', 'Checkbox outline on side bar', c('checkbox.border'), sidebar, 0, { accessible: 3 });
  boundary('Controls', 'Dropdown outline', c('dropdown.border'), c('dropdown.background'), 0, { accessible: 3 });
  boundary('Controls', 'Toggled input option', c('inputOption.activeBorder'), c('input.background'), 0, { accessible: 3 });

  // ── Lists, pickers and widgets ───────────────────────────────────────
  add('Lists', 'Selected list row', c('list.activeSelectionForeground'), c('list.activeSelectionBackground'), 7);
  add('Lists', 'Inactive selected row', c('list.inactiveSelectionForeground'), c('list.inactiveSelectionBackground'), 7);
  add('Lists', 'Hovered row', c('list.hoverForeground'), c('list.hoverBackground'), 7);
  add('Lists', 'Match highlight in list', c('list.highlightForeground'), sidebar, 4, { accessible: 4.5 });
  add('Lists', 'Match highlight on selected row', c('list.highlightForeground'), c('list.activeSelectionBackground'), 3, { accessible: 4.5 });
  add('Lists', 'Quick input', c('quickInput.foreground'), c('quickInput.background'), 7);
  add('Lists', 'Quick input focused row', c('quickInputList.focusForeground'), c('quickInputList.focusBackground'), 7);
  add('Lists', 'Quick input description', c('descriptionForeground'), c('quickInput.background'), 4.5);
  add('Lists', 'Quick input group label', c('pickerGroup.foreground'), c('quickInput.background'), 4.5);
  add('Lists', 'Match highlight in quick input', c('list.highlightForeground'), c('quickInput.background'), 4, { accessible: 4.5 });
  add('Lists', 'Match highlight on quick input focus', c('list.highlightForeground'), c('quickInputList.focusBackground'), 3, { accessible: 4.5 });
  add('Lists', 'Suggest widget', c('editorSuggestWidget.foreground'), c('editorSuggestWidget.background'), 7);
  add('Lists', 'Suggest widget selected row', c('editorSuggestWidget.selectedForeground'), c('editorSuggestWidget.selectedBackground'), 7);
  add('Lists', 'Suggest match', c('editorSuggestWidget.highlightForeground'), c('editorSuggestWidget.background'), 4, { accessible: 4.5 });
  add('Lists', 'Suggest match on selected row', c('editorSuggestWidget.focusHighlightForeground'), c('editorSuggestWidget.selectedBackground'), 3, { accessible: 4.5 });
  add('Lists', 'Hover widget', c('editorHoverWidget.foreground'), c('editorHoverWidget.background'), 7);
  add('Lists', 'Menu', c('menu.foreground'), c('menu.background'), 7);
  add('Lists', 'Menu selection', c('menu.selectionForeground'), c('menu.selectionBackground'), 7);
  add('Lists', 'Peek view results', c('peekViewResult.fileForeground'), c('peekViewResult.background'), 7);
  add('Lists', 'Peek view result lines', c('peekViewResult.lineForeground'), c('peekViewResult.background'), 4.4, { accessible: 4.5 });
  add('Lists', 'Peek view editor', c('editor.foreground'), c('peekViewEditor.background'), 7);
  add('Lists', 'Notifications', c('notifications.foreground'), c('notifications.background'), 7);
  add('Lists', 'Notification links', c('notificationLink.foreground'), c('notifications.background'), 4.5);
  add('Lists', 'Banner', c('banner.foreground'), c('banner.background'), 7);
  add('Lists', 'Links', c('textLink.foreground'), editor, 4.5);
  add('Lists', 'Links on side bar', c('textLink.foreground'), sidebar, 0, { accessible: 4.5 });
  add('Lists', 'Error text', c('errorForeground'), sidebar, 4.5);

  // ── Source control and diagnostics in the explorer ────────────────────
  const git = {
    modified: ['gitDecoration.modifiedResourceForeground', 4.5],
    added: ['gitDecoration.addedResourceForeground', 4.5],
    untracked: ['gitDecoration.untrackedResourceForeground', 4.5],
    deleted: ['gitDecoration.deletedResourceForeground', 4.2],
    conflict: ['gitDecoration.conflictingResourceForeground', 4.5],
    renamed: ['gitDecoration.renamedResourceForeground', 4.2],
    submodule: ['gitDecoration.submoduleResourceForeground', 4.5],
    ignored: ['gitDecoration.ignoredResourceForeground', 2.2],
  };
  for (const [label, [key, min]] of Object.entries(git)) {
    const strict = label === 'ignored' ? 3 : 4.5;
    add('Source control', `Git ${label}`, c(key), sidebar, min, { accessible: strict });
    add('Source control', `Git ${label} on selected row`, c(key), c('list.activeSelectionBackground'), 0, { accessible: label === 'ignored' ? 2.5 : 3 });
  }
  add('Source control', 'List error', c('list.errorForeground'), sidebar, 4.5);
  add('Source control', 'List warning', c('list.warningForeground'), sidebar, 4.2, { accessible: 4.5 });

  // ── Terminal ─────────────────────────────────────────────────────────
  add('Terminal', 'Terminal text', c('terminal.foreground'), terminal, 7);
  add('Terminal', 'Terminal text on selection', c('terminal.foreground'), c('terminal.selectionBackground'), 7);
  for (const name of ['Red', 'Green', 'Yellow', 'Blue', 'Magenta', 'Cyan']) {
    add('Terminal', `ANSI ${name}`, c(`terminal.ansi${name}`), terminal, 4.5);
    add('Terminal', `ANSI bright ${name}`, c(`terminal.ansiBright${name}`), terminal, 4.5);
  }
  add('Terminal', 'ANSI bright black', c('terminal.ansiBrightBlack'), terminal, 4.5);
  if (theme.type === 'dark') {
    add('Terminal', 'ANSI white', c('terminal.ansiWhite'), terminal, 7);
    add('Terminal', 'ANSI bright white', c('terminal.ansiBrightWhite'), terminal, 7);
  } else {
    add('Terminal', 'ANSI black', c('terminal.ansiBlack'), terminal, 7);
  }

  return pairs;
}

/**
 * Measure every pair. Translucent backgrounds are composited onto their
 * `base` surface and translucent foregrounds onto the result. A pair whose
 * applicable minimum is 0 is reported for information only.
 */
export function auditContrast(theme, { accessible = false } = {}) {
  return contrastPairs(theme).map((pair) => {
    if (pair.bg.length === 9 && !pair.base) throw new Error(`${theme.name}: ${pair.name} has a translucent background but no base`);
    const background = pair.base ? over(pair.bg, pair.base) : pair.bg;
    const foreground = over(pair.fg, background);
    const ratio = contrast(foreground, background);
    const required = accessible ? (pair.accessible ?? pair.min) : pair.min;
    const status = required > 0 ? (ratio >= required ? 'pass' : 'fail') : 'info';
    return { ...pair, background, foreground, ratio, required, status };
  });
}
