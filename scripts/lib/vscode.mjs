// Locates a local VS Code installation (the folder that holds
// node_modules.asar) and its executable. Set VSCODE_APP to override.
import { existsSync } from 'node:fs';
import path from 'node:path';

export function findVSCode() {
  const candidates = [
    process.env.VSCODE_APP,
    '/Applications/Visual Studio Code.app/Contents/Resources/app',
    '/usr/share/code/resources/app',
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Programs', 'Microsoft VS Code', 'resources', 'app'),
  ].filter(Boolean);
  const app = candidates.find((dir) => existsSync(path.join(dir, 'node_modules.asar')));
  if (!app) return null;
  const binaries = [
    path.join(app, '..', '..', 'MacOS', 'Code'),
    path.join(app, '..', '..', 'MacOS', 'Electron'),
    path.join(app, '..', '..', 'code'),
    path.join(app, '..', '..', 'Code.exe'),
  ];
  return { app, binary: binaries.find(existsSync) };
}
