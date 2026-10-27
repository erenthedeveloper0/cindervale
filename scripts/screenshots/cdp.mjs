// A small Chrome DevTools Protocol client on Node's built-in WebSocket, and
// helpers to launch VS Code or a headless Chromium with a debugging port.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** A clean environment: nothing inherited from a VS Code this script may run inside. */
export function cleanEnv(extra = {}) {
  const keep = ['HOME', 'USER', 'LOGNAME', 'TMPDIR', 'LANG', 'SHELL', 'DISPLAY', 'XDG_RUNTIME_DIR'];
  const env = Object.fromEntries(keep.filter((k) => process.env[k]).map((k) => [k, process.env[k]]));
  env.PATH = ['/usr/local/bin', '/opt/homebrew/bin', '/usr/bin', '/bin', '/usr/sbin', '/sbin'].join(':');
  env.LANG ??= 'en_US.UTF-8';
  return { ...env, ...extra };
}

/**
 * Start a Chromium-based app with `--remote-debugging-port=0` among its
 * arguments. Chromium picks a free port and announces it on stderr;
 * `child.port` resolves to it.
 */
export function launch(binary, args, { env = cleanEnv(), log } = {}) {
  const child = spawn(binary, args, { env, stdio: ['ignore', 'pipe', 'pipe'] });
  child.port = new Promise((resolve, reject) => {
    let buffered = '';
    const onData = (data) => {
      const text = String(data);
      log?.(text);
      buffered += text;
      const match = /DevTools listening on ws:\/\/[^:]+:(\d+)\//.exec(buffered);
      if (match) resolve(Number(match[1]));
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('exit', (code) => reject(new Error(`${binary} exited (${code}) before opening a debugging port`)));
  });
  return child;
}

/** Wait for a page target whose URL matches, then connect to it. */
export async function connect(port, match, timeout = 60_000) {
  const start = Date.now();
  let target;
  while (!target) {
    if (Date.now() - start > timeout) throw new Error(`No page matching ${match} on port ${port}`);
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      target = list.find((t) => t.type === 'page' && match.test(t.url));
    } catch {
      // not listening yet
    }
    if (!target) await sleep(300);
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  let id = 0;
  const pending = new Map();
  const waiting = new Map();
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.method && waiting.has(message.method)) {
      waiting.get(message.method)(message.params);
      waiting.delete(message.method);
    }
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      id += 1;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  return {
    send,
    /** Resolves with the params of the next event of this kind. */
    once: (method) => new Promise((resolve) => waiting.set(method, resolve)),
    async screenshot() {
      const { data } = await send('Page.captureScreenshot', { format: 'png' });
      return Buffer.from(data, 'base64');
    },
    close: () => ws.close(),
  };
}

/** The first Chromium-based browser installed, for rendering HTML boards. */
export function findChromium() {
  const candidates = [
    process.env.CHROME,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);
  return candidates.find(existsSync);
}

/** Render a local HTML file to PNG with a headless Chromium. */
export async function renderHtml(file, { width, height, scale = 2, profile }) {
  const binary = findChromium();
  if (!binary) throw new Error('No Chromium-based browser found; set CHROME to one.');
  // Size and scale are fixed at launch: changing the device scale after the
  // page has loaded leaves stale tiles in headless screenshots.
  const child = launch(binary, [
    '--headless=new',
    '--hide-scrollbars',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    `--window-size=${width},${height}`,
    `--force-device-scale-factor=${scale}`,
    '--no-first-run',
    '--allow-file-access-from-files',
    'about:blank',
  ]);
  try {
    // Navigate only once connected, so nothing is evaluated mid-navigation.
    const page = await connect(await child.port, /^about:blank/);
    await page.send('Page.enable');
    const loaded = page.once('Page.loadEventFired');
    await page.send('Page.navigate', { url: `file://${file}` });
    await loaded;
    await page.send('Runtime.evaluate', { expression: 'document.fonts.ready.then(() => Promise.all([...document.images].map((i) => i.decode())))', awaitPromise: true });
    await sleep(300);
    // Capture the laid-out page, not the window: headless window sizes
    // include browser chrome that is never drawn.
    const { cssContentSize } = await page.send('Page.getLayoutMetrics');
    const { data } = await page.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
      clip: { x: 0, y: 0, width: Math.ceil(cssContentSize.width), height: Math.ceil(cssContentSize.height), scale: 1 },
    });
    const png = Buffer.from(data, 'base64');
    page.close();
    return png;
  } finally {
    child.kill();
  }
}
