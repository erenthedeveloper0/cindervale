# Contributing to Cindervale

Thanks for helping improve Cindervale. A [color report](https://github.com/erenthedeveloper0/cindervale/issues/new/choose)
with a short code sample and a screenshot is the fastest way to flag a color that looks wrong. If
two colors are hard for you to tell apart, say which variant you use and, if you are comfortable
sharing it, how you see color.

## How the themes are built

The files in `themes/` are generated. Edit the source in `src/`, never the JSON directly.

```text
                   ┌─► src/workbench.mjs ─┐
src/palette.mjs ───┼─► src/syntax.mjs ────┼─► src/theme.mjs ─► npm run build ─► themes/*.json ─► VSIX
                   └─► src/semantic.mjs ──┘

npm test, npm run contrast, npm run vision and npm run tokens check the generated themes.
```

| Path | Contents |
| --- | --- |
| `src/palette.mjs` | Source palettes (`source` for the standard themes, `accessibleSource` for the accessible ones) and every derived role: surfaces, text, accents by role, states, syntax, terminal |
| `src/workbench.mjs` | Interface colors. Accents are referenced by role (`brand`, `focus`, `find`, `added`…), so each palette decides what a role looks like |
| `src/syntax.mjs` | TextMate token rules |
| `src/semantic.mjs` | Semantic token rules |
| `src/theme.mjs` | The list of variants |
| `src/color.mjs` | Color math: mixing, OKLCH adjustments, WCAG contrast |
| `src/vision.mjs` | Color-vision simulation (Brettel 1997) and CIEDE2000 |
| `test/` | Freshness, schema, manifest, color-ID, contrast, color-vision and documentation tests; token expectations |
| `scripts/` | Build, audits, token inspector, package check, screenshot tooling, brand assets |
| `fixtures/` | Sample files for visual testing in every supported language |
| `docs/` | Accessibility notes and customization recipes |
| `brand/` | The identity: logo, banners, social preview and [its guidelines](brand/README.md) |

In the standard light theme, accents used as text are darkened in OKLCH ("ink" tones) until they
reach a readable contrast on the ivory background; hue and chroma stay the same. The accessible
palettes give their final values directly; [docs/accessibility.md](docs/accessibility.md) explains
each one.

## Development

```sh
npm install
npm run build          # regenerate themes/*.json from src/
npm test               # freshness, schema, color IDs, contrast, color vision, documentation
npm run contrast       # full contrast report for all four themes
npm run vision         # full color-vision report
npm run tokens         # fixture tokens vs. VS Code's own grammars (needs a local VS Code)
```

Press <kbd>F5</kbd> in VS Code to launch an Extension Development Host, then open the `fixtures/`
folder. Theme changes apply live after `npm run build`. Use **Developer: Inspect Editor Tokens and
Scopes** to see which rule colors a token, or `npm run tokens -- fixtures/<file>` to list every
token of a file with its scopes and role.

`npm run tokens`, `npm run colors:sync` and `npm run screenshots` use the VS Code installed on your
machine. Set `VSCODE_APP` to its `resources/app` folder if it is not found.

## Changing colors

- Keep the standard themes' generated files unchanged unless the change is meant for them; the
  freshness test shows exactly what changed.
- Never lower an audit target to make a change pass. If a target is wrong, change it in its own
  commit with the reason.
- For the accessible variants, follow the
  [rules for future color changes](docs/accessibility.md#rules-for-future-color-changes) and include
  the "closest syntax pair" lines from `npm run vision` in the pull request.
- Add a token expectation in `test/token-expectations.mjs` for any new TextMate rule.
- If you add or remove an italic or bold rule, update the recipes in
  [docs/customization.md](docs/customization.md); `npm test` fails until they match the themes.

## Screenshots

`npm run screenshots` rebuilds the demo project, installs the packaged extension into a throwaway
VS Code profile under `.vscode-test/`, and captures every scene at 2×, followed by the palette
sheets and the color-vision boards. A VS Code window opens while it runs. Add `--qa` to also capture
interaction states (Command Palette, selection, find, suggestions, hover, settings, search) into
`.vscode-test/screenshots/qa/` for review. Look at the images before committing them.

`node scripts/screenshots/boards.mjs` rebuilds only the palette sheets and the color-vision boards,
from `src/palette.mjs` and the captures already in `screenshots/`, without opening VS Code. The two
standard-theme split views (`cindervale-dark-split.png` and `cindervale-light-split.png`) were
captured for 1.0.0 and are not produced by the script; the standard themes have not changed since.

## Brand assets

The logo, the Marketplace icon, the README banners and divider, and the social preview are generated
from [`scripts/brand/identity.mjs`](scripts/brand/identity.mjs). [brand/README.md](brand/README.md)
explains the identity and lists every file.

```sh
npm run brand            # everything (headless Chromium, network for the typefaces)
npm run brand -- --svg   # the SVG logos and icon only
```

`images/icon.png` ships in the VSIX, so a change to the mark changes the Marketplace listing at the
next release.

## Pull requests

The pull request template lists the checks for a color change. Include before-and-after screenshots
for anything visible, and the "closest syntax pair" lines from `npm run vision` for changes to the
accessible variants.
