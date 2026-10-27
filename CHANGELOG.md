# Changelog

All notable changes to Cindervale are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [1.1.0] — 2026-10-27

### Added

- **Cindervale Accessible Dark** and **Cindervale Accessible Light**: Cindervale's surfaces with a
  separate set of syntax and interface colors, measured to stay apart under simulated protanopia,
  deuteranopia and tritanopia. Five syntax accents (violet keywords, blue functions, ochre types,
  ember strings, teal numbers) are separated by lightness as well as hue; constants are bold.
- In the accessible variants: one meaning per interface accent (blue for focus, information and
  additions; ochre for find, warnings and modifications; berry for errors; vermillion for removed
  text), solid 3:1 focus rings, 3:1 input and checkbox outlines, and an ANSI palette whose red and
  green stay apart.
- A contrast audit of every foreground on the surface it appears on, with translucent overlays
  composited (`npm run contrast`).
- A color-vision audit using Brettel 1997 simulation and CIEDE2000 (`npm run vision`), enforced for
  the accessible variants and reported for the standard ones.
- Checks that every workbench color ID is registered by VS Code, that no token scope appears in
  two rules, and that semantic tokens cannot inherit font styles from TextMate fallback probes.
- `npm run tokens`, which tokenizes the fixtures with VS Code's own TextMate engine and grammars
  and checks each token's role and font style.
- Fixtures for plain JavaScript, JSX, a TypeScript semantic-token tour, Markdown features, a
  unified diff and the terminal palette.
- Continuous integration on GitHub Actions: build freshness, tests, both audits, package contents,
  a VSIX build, and token checks against the latest stable VS Code.
- `docs/accessibility.md`, a release checklist, screenshots of the accessible variants, the
  accessible palette, and color-vision comparison boards.

### Changed

- The palette code addresses interface accents by role (brand, focus, find, added…), not by hue.
  The standard themes' generated files are unchanged.
- The Marketplace description and keywords mention the color-vision-aware variants.

## [1.0.0] — 2026-10-16

### Added

- **Cindervale Dark** and **Cindervale Light**, tuned independently from one shared palette.
- Full workbench styling: activity bar, side bar, tabs, status bar, title bar and command center,
  quick input, menus, notifications, hovers, peek views, settings, extensions, notebooks, chat and
  inline suggestions, testing and debugging.
- Semantic token colors for TypeScript, JavaScript, Python (Pylance), Rust, C/C++, Java and C#,
  aligned with the TextMate rules so code does not shift color when a language server attaches.
- Language refinements for TypeScript/TSX, JavaScript/JSX, HTML, CSS, SCSS, Less, JSON/JSONC,
  YAML, Markdown, Python, SQL, Shell, Go, Rust, Java, C#, C/C++, PHP, Vue, Svelte, dotenv and diffs.
- A warm 16-color terminal palette that meets 4.5:1 contrast without VS Code's automatic correction.
- Git decorations, diagnostics, diff and merge editor colors, bracket pairs and indent guides.
