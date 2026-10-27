// Arranges the scenes listed in <controlDir>/scenes.json, one at a time.
// After each scene it writes ready-<n> and waits for the capture script to
// write shot-<n>. The control folder comes from the cindervaleShots.controlDir
// setting in the throwaway profile that capture.mjs creates.
const fs = require('node:fs');
const path = require('node:path');
const vscode = require('vscode');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(file, timeout = 120_000) {
  const start = Date.now();
  while (!fs.existsSync(file)) {
    if (Date.now() - start > timeout) throw new Error(`Timed out waiting for ${file}`);
    await sleep(200);
  }
}

async function run(step, root, log) {
  const uri = (file) => vscode.Uri.file(path.join(root, file));
  if (step.theme) {
    await vscode.workspace.getConfiguration().update('workbench.colorTheme', step.theme, vscode.ConfigurationTarget.Global);
  } else if (step.settings) {
    for (const [key, value] of Object.entries(step.settings)) {
      await vscode.workspace.getConfiguration().update(key, value, vscode.ConfigurationTarget.Global);
    }
  } else if (step.command) {
    for (let i = 0; i < (step.repeat ?? 1); i++) await vscode.commands.executeCommand(step.command, ...(step.args ?? []));
  } else if (step.open) {
    const document = await vscode.workspace.openTextDocument(uri(step.open));
    const editor = await vscode.window.showTextDocument(document, { viewColumn: step.column ?? vscode.ViewColumn.One, preview: false, preserveFocus: Boolean(step.preserveFocus) });
    if (step.select) {
      const [l1, c1, l2, c2] = step.select;
      editor.selection = new vscode.Selection(l1 - 1, c1 - 1, (l2 ?? l1) - 1, (c2 ?? c1) - 1);
      editor.revealRange(editor.selection, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
    }
    if (step.top) editor.revealRange(new vscode.Range(step.top - 1, 0, step.top - 1, 0), vscode.TextEditorRevealType.AtTop);
  } else if (step.reveal) {
    await vscode.commands.executeCommand('revealInExplorer', uri(step.reveal));
  } else if (step.diff) {
    await vscode.commands.executeCommand('git.openChange', uri(step.diff));
  } else if (step.terminal) {
    const terminal = vscode.window.createTerminal({
      name: 'bash',
      cwd: root,
      shellPath: '/bin/bash',
      shellArgs: ['--noprofile', '--norc'],
      env: { PS1: step.prompt ?? '$ ', BASH_SILENCE_DEPRECATION_WARNING: '1', TERM: 'xterm-256color' },
    });
    terminal.show(Boolean(step.preserveFocus));
    // Let the shell start, or typed-ahead commands are echoed twice.
    await sleep(2000);
    for (const line of step.terminal) terminal.sendText(line);
  } else if (step.wait) {
    await sleep(step.wait);
  }
  log(`ran ${JSON.stringify(step)}`);
}

async function activate() {
  const controlDir = vscode.workspace.getConfiguration('cindervaleShots').get('controlDir');
  if (!controlDir || !fs.existsSync(path.join(controlDir, 'scenes.json'))) return;
  const log = (line) => fs.appendFileSync(path.join(controlDir, 'driver.log'), `${new Date().toISOString()} ${line}\n`);
  const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const scenes = JSON.parse(fs.readFileSync(path.join(controlDir, 'scenes.json'), 'utf8'));
  try {
    await sleep(2500);
    for (const [index, scene] of scenes.entries()) {
      log(`scene ${index} ${scene.name}`);
      for (const step of scene.steps) await run(step, root, log);
      await sleep(scene.settle ?? 1500);
      fs.writeFileSync(path.join(controlDir, `ready-${index}`), scene.name);
      await waitFor(path.join(controlDir, `shot-${index}`));
    }
    fs.writeFileSync(path.join(controlDir, 'done'), '');
  } catch (error) {
    log(`error ${error.stack}`);
    fs.writeFileSync(path.join(controlDir, 'failed'), String(error.stack));
  }
}

module.exports = { activate, deactivate() {} };
