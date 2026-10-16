// Foreground/background pairs that must stay readable, with minimum WCAG
// contrast ratios. Text a person reads for meaning targets 4.5:1; secondary
// labels, hints and line numbers have lower, deliberate floors.

const token = (theme, name) => theme.tokenColors.find((r) => r.name === name).settings.foreground;

export function contrastPairs(theme) {
  const c = (key) => theme.colors[key];
  const editor = c('editor.background');
  const sidebar = c('sideBar.background');
  const panel = c('panel.background');

  const pairs = [
    // Editor
    ['Editor text', c('editor.foreground'), editor, 7],
    ['Comments', token(theme, 'Comments'), editor, 4.5],
    ['Documentation comments', token(theme, 'Documentation comments and docstrings'), editor, 4.5],
    ['Line numbers', c('editorLineNumber.foreground'), editor, 3],
    ['Active line number', c('editorLineNumber.activeForeground'), editor, 7],
    ['Code lens', c('editorCodeLens.foreground'), editor, 3],
    ['Ghost text', c('editorGhostText.foreground'), editor, 2.5],
    ['Text on selection', c('editor.foreground'), c('editor.selectionBackground'), 7],
    ['Comments on selection', token(theme, 'Comments'), c('editor.selectionBackground'), 2.8],

    // Chrome
    ['Side bar text', c('sideBar.foreground'), sidebar, 7],
    ['Side bar title', c('sideBarTitle.foreground'), sidebar, 4.4],
    ['Active tab', c('tab.activeForeground'), c('tab.activeBackground'), 7],
    ['Inactive tab', c('tab.inactiveForeground'), c('tab.inactiveBackground'), 4.4],
    ['Unfocused inactive tab', c('tab.unfocusedInactiveForeground'), c('tab.unfocusedInactiveBackground'), 3],
    ['Breadcrumbs', c('breadcrumb.foreground'), c('breadcrumb.background'), 4.5],
    ['Activity bar (inactive)', c('activityBar.inactiveForeground'), c('activityBar.background'), 4.4],
    ['Title bar', c('titleBar.activeForeground'), c('titleBar.activeBackground'), 7],
    ['Status bar', c('statusBar.foreground'), c('statusBar.background'), 4.5],
    ['Status bar remote', c('statusBarItem.remoteForeground'), c('statusBarItem.remoteBackground'), 4.5],
    ['Status bar debugging', c('statusBar.debuggingForeground'), c('statusBar.debuggingBackground'), 4.5],
    ['Status bar error item', c('statusBarItem.errorForeground'), c('statusBarItem.errorBackground'), 4.5],
    ['Status bar warning item', c('statusBarItem.warningForeground'), c('statusBarItem.warningBackground'), 4.5],
    ['Panel title', c('panelTitle.activeForeground'), panel, 7],
    ['Inactive panel title', c('panelTitle.inactiveForeground'), panel, 4.4],

    // Controls
    ['Primary button', c('button.foreground'), c('button.background'), 4.5],
    ['Primary button hover', c('button.foreground'), c('button.hoverBackground'), 4.5],
    ['Secondary button', c('button.secondaryForeground'), c('button.secondaryBackground'), 7],
    ['Activity badge', c('activityBarBadge.foreground'), c('activityBarBadge.background'), 4.5],
    ['Badge', c('badge.foreground'), c('badge.background'), 7],
    ['Input text', c('input.foreground'), c('input.background'), 7],
    ['Input placeholder', c('input.placeholderForeground'), c('input.background'), 3],
    ['Selected list row', c('list.activeSelectionForeground'), c('list.activeSelectionBackground'), 7],
    ['Match highlight in list', c('list.highlightForeground'), sidebar, 4],
    ['Match highlight on selected row', c('list.highlightForeground'), c('list.activeSelectionBackground'), 3],
    ['Quick input', c('quickInput.foreground'), c('quickInput.background'), 7],
    ['Quick input focused row', c('quickInputList.focusForeground'), c('quickInputList.focusBackground'), 7],
    ['Suggest match on selected row', c('editorSuggestWidget.focusHighlightForeground'), c('editorSuggestWidget.selectedBackground'), 3],
    ['Hover widget', c('editorHoverWidget.foreground'), c('editorHoverWidget.background'), 7],
    ['Notifications', c('notifications.foreground'), c('notifications.background'), 7],
    ['Links', c('textLink.foreground'), editor, 4.5],
    ['Error text', c('errorForeground'), sidebar, 4.5],

    // Source control and diagnostics in the explorer
    ['Git modified', c('gitDecoration.modifiedResourceForeground'), sidebar, 4.5],
    ['Git added', c('gitDecoration.addedResourceForeground'), sidebar, 4.5],
    ['Git deleted', c('gitDecoration.deletedResourceForeground'), sidebar, 4.2],
    ['Git conflict', c('gitDecoration.conflictingResourceForeground'), sidebar, 4.5],
    ['Git renamed', c('gitDecoration.renamedResourceForeground'), sidebar, 4.2],
    ['Git ignored', c('gitDecoration.ignoredResourceForeground'), sidebar, 2.2],
    ['List error', c('list.errorForeground'), sidebar, 4.5],
    ['List warning', c('list.warningForeground'), sidebar, 4.2],

    // Terminal
    ['Terminal text', c('terminal.foreground'), panel, 7],
  ];

  for (const name of ['Red', 'Green', 'Yellow', 'Blue', 'Magenta', 'Cyan']) {
    pairs.push([`ANSI ${name}`, c(`terminal.ansi${name}`), panel, 4.5]);
    pairs.push([`ANSI bright ${name}`, c(`terminal.ansiBright${name}`), panel, 4.5]);
  }
  pairs.push(['ANSI bright black', c('terminal.ansiBrightBlack'), panel, 4.5]);
  if (theme.type === 'dark') pairs.push(['ANSI white', c('terminal.ansiWhite'), panel, 7]);

  // Every syntax role must read on the editor background.
  const syntaxFloors = { Strings: 4.5, Functions: 4.5, Methods: 4.5, 'Keywords and storage': 4.5, 'Types, classes, interfaces': 4.5, 'Primitive and built-in types': 4.4, 'Numbers and units': 4, 'Named constants and enum members': 4.5, Operators: 4.5, 'null, undefined, nil, None': 4.5, 'Namespaces and modules': 4.5, Tags: 4.5, Attributes: 4.4, 'Tag punctuation': 3.5, Punctuation: 4 };
  for (const [name, floor] of Object.entries(syntaxFloors)) pairs.push([`Syntax · ${name}`, token(theme, name), editor, floor]);

  return pairs.map(([name, fg, background, min]) => ({ name, fg, bg: background, min }));
}

