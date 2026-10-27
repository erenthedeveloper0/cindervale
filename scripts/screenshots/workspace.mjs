// Builds "atelier-studio", the demo project the screenshots show: the
// fixtures arranged as a small Next.js app, with git history and a few
// uncommitted changes so the Explorer, Source Control and diff views have
// something to say.
import { execFileSync } from 'node:child_process';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const fixtures = fileURLToPath(new URL('../../fixtures/', import.meta.url));

const LAYOUT = {
  '.github/workflows/deploy.yml': 'deploy.yml',
  'analytics/analytics.py': 'analytics.py',
  'db/queries.sql': 'queries.sql',
  'public/index.html': 'index.html',
  'scripts/deploy.sh': 'deploy.sh',
  'scripts/colors.sh': 'terminal-colors.sh',
  'src/components/card.module.scss': 'card.module.scss',
  'src/components/project-board.tsx': 'project-board.tsx',
  'src/components/ProjectList.jsx': 'ProjectList.jsx',
  'src/lib/session-store.ts': 'session-store.ts',
  'src/lib/invoice.ts': 'theme-tour.ts',
  'src/styles/globals.css': 'globals.css',
  '.env.example': '.env.example',
  'package.json': 'package.json',
  'README.md': 'README.md',
  'tsconfig.json': 'tsconfig.json',
};

// Stand-ins for the packages the demo does not install, so TypeScript
// reports only the diagnostics the screenshots show on purpose.
const NEXT_ENV = `// Type stand-ins for the demo; a real project gets these from node_modules.
declare module "react" {
  export type ReactNode = string | number | boolean | null | undefined | JSX.Element | ReactNode[];
  export function useState<T>(initial: T | (() => T)): [T, (next: T | ((previous: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
  export function useCallback<T extends (...args: never[]) => unknown>(callback: T, deps: readonly unknown[]): T;
}
declare module "next/link" {
  export default function Link(props: { href: string; onClick?: () => void; children?: unknown }): JSX.Element;
}
declare module "@/lib/utils" {
  export function cn(...classes: unknown[]): string;
}
declare module "@/lib/api" {
  export interface Project { id: string; slug: string; name: string; status: "draft" | "active" | "archived"; budget: number }
  export function fetchProjects(options: { limit: number; signal?: AbortSignal }): Promise<Project[]>;
}
declare module "node:crypto" {
  export function createHash(algorithm: string): { update(data: string): { digest(encoding: "hex"): string } };
}
declare module "node:path" {
  export function join(...parts: string[]): string;
}
declare module "node:events" {
  export class EventEmitter {
    emit(event: string, ...args: unknown[]): boolean;
    removeAllListeners(): this;
  }
}
declare module "node:stream" {
  export interface Readable extends AsyncIterable<unknown> {}
}
declare namespace JSX {
  interface Element {}
  interface IntrinsicElements { [name: string]: Record<string, unknown> }
}
`;

const FORMAT_TS = `const formatter = new Intl.NumberFormat("en", { style: "currency", currency: "EUR" });

export function formatBudget(value: number): string {
  return formatter.format(value);
}

export function formatHours(hours: number) {
  const whole = Math.floor(hours);
  return \`\${whole}h \${Math.round((hours - whole) * 60)}m\`;
}
`;

const LEGACY_JS = `// Superseded by src/lib/format.ts.
export function formatBudget(value) {
  return value.toFixed(2) + " EUR";
}
`;

const git = (cwd, ...args) => execFileSync('git', args, { cwd, stdio: 'pipe', env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' } });

async function edit(file, replacements) {
  let text = await readFile(file, 'utf8');
  for (const [from, to] of replacements) {
    if (!text.includes(from)) throw new Error(`${path.basename(file)}: "${from}" not found`);
    text = text.replace(from, to);
  }
  await writeFile(file, text);
}

export async function createWorkspace(parent) {
  const root = path.join(parent, 'atelier-studio');
  await rm(root, { recursive: true, force: true });
  for (const [target, source] of Object.entries(LAYOUT)) {
    await mkdir(path.dirname(path.join(root, target)), { recursive: true });
    await cp(path.join(fixtures, source), path.join(root, target));
  }
  await mkdir(path.join(root, 'node_modules', '.cache'), { recursive: true });
  await writeFile(path.join(root, 'node_modules', '.cache', '.keep'), '');
  await writeFile(path.join(root, 'next-env.d.ts'), NEXT_ENV);
  await writeFile(path.join(root, 'src/lib/legacy-budget.js'), LEGACY_JS);
  await writeFile(path.join(root, '.gitignore'), 'node_modules/\n.next/\n.env.local\n');

  git(root, 'init', '-q', '-b', 'main');
  git(root, 'config', 'user.name', 'Studio');
  git(root, 'config', 'user.email', 'studio@atelier.example');
  git(root, 'config', 'commit.gpgsign', 'false');
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '-m', 'Project board and studio analytics');

  // Uncommitted work: a modified component and stylesheet, a staged new
  // module, a deleted file and an untracked note.
  await edit(path.join(root, 'src/components/project-board.tsx'), [
    ['const PAGE_SIZE = 12;', 'const PAGE_SIZE = 9;'],
    ['  archived: "Archived",', '  archived: "Wrapped up",'],
    ['        <span className="text-xs uppercase text-stone-500">{visible.length} projects</span>', '        <span className="text-xs uppercase text-stone-500">\n          {visible.length} of {projects.length} projects\n        </span>'],
  ]);
  await edit(path.join(root, 'src/styles/globals.css'), [['  --radius: 0.75rem;', '  --radius: 0.625rem;']]);
  // A deliberate warning for the diagnostics screenshot (an empty ruleset).
  await edit(path.join(root, 'src/components/card.module.scss'), [['  &__title {', '  &__legacy {}\n\n  &__title {']]);
  await edit(path.join(root, 'src/lib/invoice.ts'), [
    ['    return Math.round(sum * 100) / 100;', '    const label: string = sum;\n    return Math.round(sum * 100) / 100;'],
  ]);
  await writeFile(path.join(root, 'src/lib/format.ts'), FORMAT_TS);
  git(root, 'add', 'src/lib/format.ts');
  await rm(path.join(root, 'src/lib/legacy-budget.js'));
  await cp(path.join(fixtures, 'NOTES.md'), path.join(root, 'NOTES.md'));
  return root;
}
