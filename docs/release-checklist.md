# Release checklist

Releases are built locally or by CI and published by the publisher account owner. Nothing in this
repository publishes automatically.

## Before the release

- [ ] `CHANGELOG.md` describes every user-facing change under the new version and date.
- [ ] `version` in `package.json` follows [Semantic Versioning](https://semver.org): new themes or
      colors are a minor release, corrections a patch. The extension ID and publisher stay the same.
- [ ] `npm run build`, then `git status` shows no unexpected changes in `themes/`.
- [ ] `npm test` passes (schema, manifest, color IDs, contrast and color-vision checks).
- [ ] `npm run contrast` and `npm run vision` report no failures.
- [ ] `npm run tokens` passes against the current VS Code (also run by CI).
- [ ] If VS Code was updated: `npm run colors:sync -- --check` passes, then `npm run colors:sync`.
- [ ] Screenshots are current: `npm run screenshots` after any visible change, and the images were
      looked at, not just generated.
- [ ] `docs/accessibility.md` and the README palette tables match `src/palette.mjs`.
- [ ] `npm run package:check` lists the four themes, `README.md`, `CHANGELOG.md`, `LICENSE`,
      `package.json` and the icon, and nothing else.
- [ ] CI is green on the release commit.

## Manual checks in VS Code

Press <kbd>F5</kbd> (or install the VSIX) and open `fixtures/` with each of the four themes:

- [ ] TypeScript/TSX after the language server has started (semantic highlighting), and a
      JavaScript, CSS, HTML, JSON, YAML and Markdown file.
- [ ] Selection across several token colors; find with several matches; a hover and the
      suggestion list; the Command Palette.
- [ ] Explorer and Source Control with added, modified, deleted and untracked files; a diff.
- [ ] Problems panel with an error and a warning; squiggles in the editor.
- [ ] `bash fixtures/terminal-colors.sh` in the integrated terminal.
- [ ] A debugging session: breakpoints, the paused line, inline values and the debug toolbar.
- [ ] For the accessible variants: the screenshots run through a simulator other than this
      repository's (for example Color Oracle or Chrome DevTools' vision-deficiency emulation).

## Publishing (publisher account owner)

- [ ] `npm run package` builds `cindervale-theme-<version>.vsix` (it runs the checks again first).
- [ ] Install the VSIX in a clean profile and select each theme once.
- [ ] Publish with `npx vsce publish` using an authorized account, or upload the VSIX on the
      [Marketplace publisher page](https://marketplace.visualstudio.com/manage). Credentials are never
      committed or stored in CI by this repository.
- [ ] Tag the release (`git tag v<version>`) and push the tag.
- [ ] After the listing updates, check the Marketplace page: description, screenshots, changelog.
