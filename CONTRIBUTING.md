# Contributing to Cindervale

Thanks for helping improve Cindervale. Issues with a short code sample and a screenshot are the
fastest way to report a color that looks wrong.

## How the theme is built

The files in `themes/` are generated. Edit the source in `src/`, never the JSON directly.

| Path | Contents |
| --- | --- |
| `src/palette.mjs` | Source palette and every derived role (surfaces, text, syntax, states) |
| `src/workbench.mjs` | Interface colors, including the terminal palette |
| `src/syntax.mjs` | TextMate token rules |
| `src/semantic.mjs` | Semantic token rules |
| `src/color.mjs` | Color math: mixing, OKLCH adjustments, WCAG contrast |
| `test/` | Freshness, schema and contrast tests |
| `fixtures/` | Sample files for visual testing in every supported language |

In the light theme, accents used as text are darkened in OKLCH ("ink" tones) until they reach a
readable contrast on the ivory background; hue and chroma stay the same.

## Development

```sh
npm install
npm run build      # regenerate themes/*.json from src/
npm test           # freshness, schema and contrast checks
npm run contrast   # full contrast report for both themes
```

Press <kbd>F5</kbd> in VS Code to launch an Extension Development Host, then open the `fixtures/`
folder. Theme changes apply live after `npm run build`. Use **Developer: Inspect Editor Tokens and
Scopes** to see which rule colors a token.

## Releasing

1. Update `CHANGELOG.md` and bump `version` in `package.json`.
2. Run `npm run package`. Packaging runs the freshness check and tests first.
3. Upload the `.vsix` on the [Marketplace publisher page](https://marketplace.visualstudio.com/manage),
   or run `npx vsce publish --azure-credential`.
