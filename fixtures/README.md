---
title: Atelier Studio
updated: 2026-10-16
---

# Atelier Studio

A portfolio and project board for a small design studio. Built with **Next.js**,
_TypeScript_ and a handful of ~~clever~~ careful decisions.

> Good tools disappear. The work stays.

## Getting started

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env.local` and fill in the keys.
3. Run the dev server:

```bash
pnpm dev --port 3000
```

### Project structure

| Path            | Purpose                         |
| --------------- | ------------------------------- |
| `src/app`       | Routes, layouts and metadata    |
| `src/lib/api.ts`| Typed data access               |
| `styles/`       | Tokens and global styles        |

- Components live in `src/components`.
- Shared hooks live in `src/hooks`, see [the hooks guide](./docs/hooks.md).
  - Prefer composition over configuration.

```ts
export const formatBudget = (value: number) =>
  new Intl.NumberFormat("en", { style: "currency", currency: "EUR" }).format(value);
```

---

Read the [contribution notes][contributing] before opening a pull request.
<kbd>⌘</kbd> + <kbd>K</kbd> opens the command palette.

[contributing]: https://example.com/contributing
