## What and why

<!-- The problem this solves. Link the issue if there is one. -->

## How it was verified

- [ ] `npm run build`, and `git status` shows only the intended changes in `themes/`
- [ ] `npm test`
- [ ] `npm run contrast` and `npm run vision` report no failures
- [ ] `npm run tokens` (changes to `src/syntax.mjs`, `src/semantic.mjs` or `fixtures/`)
- [ ] Before-and-after screenshots for anything visible

## Conventions (CONTRIBUTING.md)

- [ ] `themes/*.json` changed only through `src/`
- [ ] No audit target was lowered, or it changed in its own commit with the reason
- [ ] Changes to the accessible variants include the "closest syntax pair" lines from `npm run vision`
- [ ] A token expectation in `test/token-expectations.mjs` for any new TextMate rule
- [ ] The README palette tables, `docs/accessibility.md`, `docs/customization.md` and `CHANGELOG.md` are updated where a value or behavior changed
