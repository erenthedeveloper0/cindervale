// Captures the README and documentation screenshots from a real VS Code.
//
//   npm run screenshots          scenes for screenshots/ and the boards
//   npm run screenshots -- --qa  also interaction states for manual review
//
// It builds the demo project, starts a separate VS Code instance with a
// throwaway profile in .vscode-test/, installs the packaged extension (the
// VSIX `vsce` builds) and a small scene driver into it, and captures each
// scene through the DevTools protocol at 2×.
// A VS Code window opens while this runs; leave it alone until it closes.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findVSCode } from '../lib/vscode.mjs';
import { buildBoards, buildPalette } from './boards.mjs';
import { cleanEnv, connect, launch } from './cdp.mjs';
import { createWorkspace } from './workspace.mjs';

const repo = fileURLToPath(new URL('../../', import.meta.url));
const work = path.join(repo, '.vscode-test', 'screenshots');
const qa = process.argv.includes('--qa');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const DARK = 'Cindervale Accessible Dark';
const LIGHT = 'Cindervale Accessible Light';
const PROMPT = '\\[\\e[35m\\]atelier-studio\\[\\e[0m\\] \\[\\e[90m\\]main\\[\\e[0m\\] $ ';

/** Position just after `needle` on the line that contains it (1-based). */
function after(root, file, needle) {
  const lines = readFileSync(path.join(root, file), 'utf8').split('\n');
  const line = lines.findIndex((l) => l.includes(needle));
  if (line < 0) throw new Error(`${file}: "${needle}" not found`);
  return [line + 1, lines[line].indexOf(needle) + needle.length + 1];
}

function scenes(root) {
  const reset = [
    { command: 'workbench.action.closeAllEditors' },
    { command: 'workbench.action.terminal.killAll' },
    { command: 'workbench.action.closePanel' },
  ];
  const shots = [];
  // Each scene is arranged once, then captured in every listed theme.
  const scene = (name, steps, captures, settle = 1500) => {
    captures.forEach(([theme, output], index) => {
      shots.push({ name: `${name} · ${theme}`, output, settle: index ? 900 : settle, steps: index ? [{ theme }] : [{ theme }, ...steps] });
    });
  };
  const out = (file) => path.join(repo, 'screenshots', file);
  const scratch = (file) => path.join(work, 'captures', file);

  scene(
    'React component, Explorer and terminal',
    [
      ...reset,
      { command: 'workbench.view.explorer' },
      { open: 'src/lib/format.ts' },
      { open: 'src/styles/globals.css' },
      { open: 'src/lib/session-store.ts' },
      { open: 'src/components/project-board.tsx', select: [12, 3] },
      { reveal: 'src/lib/format.ts' },
      { reveal: 'src/styles/globals.css' },
      { reveal: 'src/components/project-board.tsx' },
      { terminal: ['clear', 'git status -sb', 'git diff --stat'], prompt: PROMPT, preserveFocus: true },
      { command: 'workbench.action.focusActiveEditorGroup' },
    ],
    [
      [DARK, out('cindervale-accessible-dark.png')],
      [LIGHT, out('cindervale-accessible-light.png')],
      ['Cindervale Dark', scratch('cindervale-dark.png')],
      ['Cindervale Light', scratch('cindervale-light.png')],
    ],
    7000,
  );

  scene(
    'CSS beside HTML',
    [
      ...reset,
      { command: 'workbench.action.closeSidebar' },
      { open: 'src/styles/globals.css', select: [22, 3] },
      { open: 'public/index.html', column: 2, select: [12, 1] },
      { command: 'workbench.action.focusFirstEditorGroup' },
    ],
    [
      [DARK, out('cindervale-accessible-dark-css-html.png')],
      [LIGHT, out('cindervale-accessible-light-css-html.png')],
    ],
  );

  scene(
    'JSON beside Markdown',
    [
      ...reset,
      { command: 'workbench.action.closeSidebar' },
      { open: 'package.json', select: [1, 1] },
      { open: 'NOTES.md', column: 2, select: [1, 1] },
      { command: 'workbench.action.focusFirstEditorGroup' },
    ],
    [
      [DARK, out('cindervale-accessible-dark-json-markdown.png')],
      [LIGHT, out('cindervale-accessible-light-json-markdown.png')],
    ],
  );

  scene(
    'Source control, diff and problems',
    [
      ...reset,
      { open: 'src/components/card.module.scss', select: [19, 3] },
      { open: 'src/lib/invoice.ts', select: [after(root, 'src/lib/invoice.ts', 'const label')[0], 5] },
      { diff: 'src/components/project-board.tsx' },
      { command: 'workbench.view.scm' },
      { command: 'workbench.actions.view.problems' },
      { command: 'workbench.action.focusActiveEditorGroup' },
    ],
    [
      [DARK, out('cindervale-accessible-dark-review.png')],
      [LIGHT, out('cindervale-accessible-light-review.png')],
    ],
    8000,
  );

  scene(
    'Diagnostics and terminal colors',
    [
      ...reset,
      { command: 'workbench.view.explorer' },
      { open: 'src/lib/invoice.ts', top: 54, select: after(root, 'src/lib/invoice.ts', 'const label') },
      { reveal: 'src/lib/invoice.ts' },
      // No `clear` here: resizing the panel afterwards pulls cleared lines back.
      { terminal: ['bash scripts/colors.sh'], prompt: PROMPT, preserveFocus: true },
      // Give the terminal room for the whole palette: shrinking the focused
      // editor hands its space to the panel.
      { command: 'workbench.action.focusActiveEditorGroup' },
      { command: 'workbench.action.decreaseViewHeight', repeat: 6 },
    ],
    [
      [DARK, out('cindervale-accessible-dark-terminal.png')],
      [LIGHT, out('cindervale-accessible-light-terminal.png')],
    ],
    8000,
  );

  if (qa) {
    const both = (name) => [
      [DARK, path.join(work, 'qa', `${name}-dark.png`)],
      [LIGHT, path.join(work, 'qa', `${name}-light.png`)],
    ];
    const board = 'src/components/project-board.tsx';
    scene('Command palette', [...reset, { open: board, select: [12, 3] }, { command: 'workbench.action.quickOpen', args: ['>color theme'] }], both('command-palette'));
    scene('Selection across tokens', [{ command: 'workbench.action.closeQuickOpen' }, { open: board, select: [18, 1, 23, 3] }], both('selection'));
    scene('Find matches', [{ open: board, select: [12, 3] }, { command: 'editor.actions.findWithArgs', args: [{ searchString: 'project', matchCase: false }] }, { command: 'editor.action.nextMatchFindAction' }], both('find'));
    scene('Suggestions', [{ command: 'closeFindWidget' }, { open: board, select: after(root, board, 'projects.filter((project) => project.') }, { command: 'editor.action.triggerSuggest' }, { wait: 1500 }], both('suggest'), 2500);
    scene('Hover', [{ command: 'hideSuggestWidget' }, { open: board, select: after(root, board, 'const visible = useMem') }, { command: 'editor.action.showHover' }, { wait: 2000 }], both('hover'), 3000);
    scene('Settings', [...reset, { command: 'workbench.action.openSettings2' }, { wait: 1500 }], both('settings'), 2500);
    scene('Search', [...reset, { command: 'workbench.action.findInFiles', args: [{ query: 'PAGE_SIZE', triggerSearch: true }] }, { wait: 2000 }], both('search'), 2500);
  }
  return shots;
}

const vscode = findVSCode();
if (!vscode?.binary) {
  console.error('VS Code was not found. Install it or set VSCODE_APP to its resources/app folder.');
  process.exit(2);
}

await mkdir(work, { recursive: true });
const root = await createWorkspace(work);
const profile = path.join(work, 'profile');
const control = path.join(work, 'control');
await rm(profile, { recursive: true, force: true });
await rm(control, { recursive: true, force: true });
await mkdir(path.join(profile, 'User'), { recursive: true });
await mkdir(control, { recursive: true });
await mkdir(path.join(work, 'captures'), { recursive: true });
if (qa) await mkdir(path.join(work, 'qa'), { recursive: true });

await writeFile(
  path.join(profile, 'User', 'settings.json'),
  JSON.stringify(
    {
      'cindervaleShots.controlDir': control,
      'workbench.colorTheme': DARK,
      'workbench.startupEditor': 'none',
      'workbench.tips.enabled': false,
      'workbench.enableExperiments': false,
      'workbench.secondarySideBar.defaultVisibility': 'hidden',
      'workbench.editor.highlightModifiedTabs': true,
      'window.restoreWindows': 'none',
      'window.commandCenter': true,
      'chat.disableAIFeatures': true,
      'telemetry.telemetryLevel': 'off',
      'update.mode': 'none',
      'extensions.ignoreRecommendations': true,
      'extensions.autoCheckUpdates': false,
      'security.workspace.trust.enabled': false,
      'git.openRepositoryInParentFolders': 'never',
      'git.autofetch': false,
      'terminal.integrated.enablePersistentSessions': false,
      'npm.autoDetect': 'off',
    },
    null,
    2,
  ),
);
const list = scenes(root);
await writeFile(path.join(control, 'scenes.json'), JSON.stringify(list, null, 2));

// Install the extension as users get it, from the packaged VSIX, so the
// window is a normal one rather than an Extension Development Host.
const vsce = path.join(repo, 'node_modules', '@vscode', 'vsce', 'vsce');
const themeVsix = path.join(work, 'cindervale-theme.vsix');
const driverVsix = path.join(work, 'screenshot-driver.vsix');
const run = (cmd, args, options) => {
  const result = spawnSync(cmd, args, { encoding: 'utf8', ...options });
  if (result.status !== 0) throw new Error(`${path.basename(cmd)} ${args.join(' ')} failed:\n${result.stdout}${result.stderr}`);
};
run(process.execPath, [vsce, 'package', '--out', themeVsix], { cwd: repo });
run(process.execPath, [vsce, 'package', '--allow-missing-repository', '--skip-license', '--out', driverVsix], { cwd: path.join(repo, 'scripts', 'screenshots', 'driver') });
const extensionsDir = path.join(work, 'extensions');
await rm(extensionsDir, { recursive: true, force: true });
run(vscode.binary, [path.join(vscode.app, 'out', 'cli.js'), `--user-data-dir=${profile}`, `--extensions-dir=${extensionsDir}`, '--install-extension', themeVsix, '--install-extension', driverVsix, '--force'], { env: cleanEnv({ ELECTRON_RUN_AS_NODE: '1' }) });
console.log('✓ installed the packaged extension and the scene driver');

const logFile = path.join(work, 'vscode.log');
await writeFile(logFile, '');
const child = launch(
  vscode.binary,
  [
    `--user-data-dir=${profile}`,
    `--extensions-dir=${extensionsDir}`,
    '--remote-debugging-port=0',
    '--locale=en',
    '--disable-workspace-trust',
    '--skip-release-notes',
    '--new-window',
    root,
  ],
  { log: (text) => writeFile(logFile, text, { flag: 'a' }) },
);

try {
  const page = await connect(await child.port, /workbench\.html/);
  await page.send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 2, mobile: false });
  for (const [index, shot] of list.entries()) {
    const ready = path.join(control, `ready-${index}`);
    const start = Date.now();
    while (!existsSync(ready)) {
      if (existsSync(path.join(control, 'failed'))) throw new Error(await readFile(path.join(control, 'failed'), 'utf8'));
      if (Date.now() - start > 120_000) throw new Error(`Timed out on scene ${shot.name}`);
      await sleep(200);
    }
    await sleep(400);
    await writeFile(shot.output, await page.screenshot());
    console.log(`✓ ${shot.name} → ${path.relative(repo, shot.output)}`);
    await writeFile(path.join(control, `shot-${index}`), '');
  }
  page.close();
} finally {
  child.kill();
}

await buildPalette(repo, work);
await buildBoards(repo, work);
