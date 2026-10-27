// Real tokens in the fixtures and the syntax role each must resolve to,
// checked by `npm run tokens` against VS Code's own TextMate engine and
// grammars. `role` names a key of the palette's `syntax` (or `state.*`).
// `fontStyle` is checked when given; 'constantStyle' means "bold where the
// variant tells constants apart by weight, regular otherwise".
//
// These cover TextMate coloring only. Semantic highlighting needs a running
// language server and is checked by hand (docs/accessibility.md).

const accessibleOnly = (variant) => Boolean(variant.accessible);

export const expectations = [
  // TypeScript / TSX
  { file: 'fixtures/project-board.tsx', line: 3, text: 'import', role: 'module' },
  { file: 'fixtures/project-board.tsx', line: 9, text: 'type', role: 'keyword' },
  { file: 'fixtures/project-board.tsx', line: 9, text: 'Status', role: 'type' },
  { file: 'fixtures/project-board.tsx', line: 9, text: 'draft', role: 'string' },
  { file: 'fixtures/project-board.tsx', line: 11, text: 'ProjectBoardProps', role: 'type' },
  { file: 'fixtures/project-board.tsx', line: 18, text: 'PAGE_SIZE', role: 'text', fontStyle: '' },
  { file: 'fixtures/project-board.tsx', line: 18, text: '12', role: 'number' },
  { file: 'fixtures/project-board.tsx', line: 35, text: 'projects', role: 'text', fontStyle: '' },
  { file: 'fixtures/project-board.tsx', line: 35, text: 'useState', role: 'function' },
  { file: 'fixtures/project-board.tsx', line: 45, text: 'PAGE_SIZE', role: 'constant', fontStyle: 'bold', only: accessibleOnly },
  { file: 'fixtures/project-board.tsx', line: 32, text: 'null', role: 'nullish' },
  { file: 'fixtures/project-board.tsx', line: 26, text: ' A responsive board of studio projects, filtered by status.', role: 'docComment', fontStyle: 'italic' },
  { file: 'fixtures/session-store.ts', line: 12, text: 'Persistence', role: 'enum' },
  { file: 'fixtures/session-store.ts', line: 13, text: 'Memory', role: 'constant', fontStyle: 'constantStyle' },
  { file: 'fixtures/session-store.ts', line: 17, text: ' one hour', role: 'comment', fontStyle: 'italic' },
  { file: 'fixtures/session-store.ts', line: 58, text: 'info', role: 'function' },
  { file: 'fixtures/theme-tour.ts', line: 30, text: 'abstract', role: 'keyword' },
  { file: 'fixtures/theme-tour.ts', line: 31, text: 'MAX_ENTRIES', role: 'text', fontStyle: '' },
  { file: 'fixtures/theme-tour.ts', line: 39, text: 'MAX_ENTRIES', role: 'constant', fontStyle: 'bold', only: accessibleOnly },
  { file: 'fixtures/theme-tour.ts', line: 36, text: 'logged', role: 'function' },

  // JavaScript / JSX
  { file: 'fixtures/studio-client.js', line: 13, text: 'ApiError', role: 'type' },
  { file: 'fixtures/studio-client.js', line: 31, text: 'RETRIES', role: 'constant', fontStyle: 'bold', only: accessibleOnly },
  { file: 'fixtures/studio-client.js', line: 32, text: 'fetch', role: 'function' },
  { file: 'fixtures/studio-client.js', line: 11, text: 'param', role: 'docTag', fontStyle: 'italic' },
  { file: 'fixtures/ProjectList.jsx', line: 11, text: 'section', role: 'tag' },
  { file: 'fixtures/ProjectList.jsx', line: 11, text: 'className', role: 'attribute' },
  { file: 'fixtures/ProjectList.jsx', line: 31, text: 'ProjectCard', role: 'component' },

  // HTML and stylesheets
  { file: 'fixtures/index.html', line: 2, text: 'html', role: 'tag' },
  { file: 'fixtures/index.html', line: 2, text: 'lang', role: 'attribute' },
  { file: 'fixtures/index.html', line: 2, text: 'en', role: 'string' },
  { file: 'fixtures/globals.css', line: 5, text: '--surface', role: 'constant', fontStyle: '' },
  { file: 'fixtures/globals.css', line: 5, text: 'fff9f5', role: 'number', fontStyle: '' },
  { file: 'fixtures/globals.css', line: 22, text: 'color', role: 'cssProperty' },
  { file: 'fixtures/globals.css', line: 36, text: 'grid', role: 'string', fontStyle: '' },

  // Python, Rust, Go
  { file: 'fixtures/analytics.py', line: 10, text: 'MAX_WEEKLY_HOURS', role: 'constant', fontStyle: 'constantStyle' },
  { file: 'fixtures/analytics.py', line: 14, text: 'frozen', role: 'attribute' },
  { file: 'fixtures/analytics.py', line: 22, text: 'burn_rate', role: 'function' },
  { file: 'fixtures/analytics.py', line: 23, text: 'Share of the budget consumed, between 0 and 1.', role: 'docComment', fontStyle: 'italic' },
  { file: 'fixtures/budget.rs', line: 4, text: 'MAX_HOURS', role: 'constant', fontStyle: 'constantStyle' },
  { file: 'fixtures/budget.rs', line: 23, text: 'Some', role: 'constant', fontStyle: 'constantStyle' },
  { file: 'fixtures/budget.rs', line: 4, text: 'f32', role: 'typeSoft' },
  { file: 'fixtures/server.go', line: 18, text: 'listProjects', role: 'function' },
  { file: 'fixtures/server.go', line: 13, text: 'int64', role: 'typeSoft' },

  // Data and configuration
  { file: 'fixtures/package.json', line: 2, text: 'name', role: 'key' },
  { file: 'fixtures/package.json', line: 2, text: 'atelier-studio', role: 'string' },
  { file: 'fixtures/package.json', line: 4, text: 'true', role: 'number' },
  { file: 'fixtures/deploy.yml', line: 2, text: 'name', role: 'key' },
  { file: 'fixtures/deploy.yml', line: 10, text: '22', role: 'number' },
  { file: 'fixtures/deploy.yml', line: 13, text: 'defaults', role: 'key' },
  { file: 'fixtures/deploy.yml', line: 19, text: 'defaults', role: 'typeSoft' },
  { file: 'fixtures/queries.sql', line: 3, text: 'SELECT', role: 'keyword' },
  { file: 'fixtures/queries.sql', line: 4, text: 'id', role: 'text', fontStyle: '' },
  { file: 'fixtures/deploy.sh', line: 18, text: 'git', role: 'function' },
  { file: 'fixtures/deploy.sh', line: 18, text: '-ff-only', role: 'number', fontStyle: '' },

  // Markdown
  { file: 'fixtures/NOTES.md', line: 1, text: 'Release notes', role: 'heading', fontStyle: 'bold' },
  { file: 'fixtures/NOTES.md', line: 5, text: 'Checklist', role: 'subheading', fontStyle: 'bold' },
  { file: 'fixtures/NOTES.md', line: 1, text: '#', role: 'tagPunctuation', fontStyle: '' },
  { file: 'fixtures/NOTES.md', line: 13, text: 'npm run vision', role: 'string' },
  { file: 'fixtures/NOTES.md', line: 13, text: 'the docs', role: 'link' },
  { file: 'fixtures/NOTES.md', line: 13, text: '../docs/accessibility.md', role: 'punctuation', fontStyle: 'underline' },
  { file: 'fixtures/NOTES.md', line: 20, text: '1.', role: 'heading' },
  { file: 'fixtures/NOTES.md', line: 26, text: 'Simulation is a model, not a person.', role: 'docComment', fontStyle: 'italic' },
  { file: 'fixtures/NOTES.md', line: 8, text: 'people who have', role: 'text', fontStyle: 'bold' },

  // Diffs
  { file: 'fixtures/release.diff', line: 6, text: 'export function formatBudget(value: number) {', role: 'state.deleted' },
  { file: 'fixtures/release.diff', line: 10, text: 'export function formatBudget(value: number): string {', role: 'state.added' },
];
