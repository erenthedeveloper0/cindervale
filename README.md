<p align="center">
  <img src="images/icon.png" width="112" alt="Cindervale icon: a coral ember resting in a plum valley">
</p>

<h1 align="center">Cindervale</h1>

<p align="center">
  A warm, expressive VS Code theme designed for deep focus.<br>
  <em>Warm color. Deep focus.</em>
</p>

![Cindervale Dark with a React component, the Explorer and the integrated terminal](screenshots/cindervale-dark.png)

Cindervale is a warm color theme for Visual Studio Code, built around editorial surfaces and
expressive but restrained syntax highlighting. It comes in two modes that share one visual language,
each tuned on its own rather than inverted:

- **Cindervale Dark** — warm charcoal and walnut surfaces, copper and burgundy light, ivory type.
- **Cindervale Light** — warm ivory paper, terracotta and soft wine, sage and muted blue.

It is made for long coding sessions: no neon, no pure black, no pure white.

![Cindervale Light with the same project](screenshots/cindervale-light.png)

## Design

![The Cindervale palette in both modes](screenshots/palette.png)

A small set of colors repeats across every language, so a React component, a stylesheet and a
`package.json` all read the same way.

| Color | In code | In the interface |
| --- | --- | --- |
| **Coral** | functions, methods, React components | cursor, focus, badges, primary buttons |
| **Plum** | keywords, tags, JSON and YAML keys, CSS selectors | symbol references |
| **Amber** | types, classes, interfaces, attributes | search matches, warnings |
| **Eucalyptus** | strings, CSS values, inline code | hints |
| **Blue** | `import` / `export`, namespaces, CSS properties, links | information, peek views |
| **Berry** | constants, enums, CSS custom properties | removed lines, breakpoints |
| **Peach** | numbers, booleans, regular expressions | — |
| **Sage** | added lines in diff files | added and untracked files, passing tests |

Comments are set in a warm italic taupe, and punctuation stays quiet so the code itself carries the
page. Editor text measures 15.2:1 contrast in Dark and 13.0:1 in Light.

![Cindervale Dark: CSS beside Markdown](screenshots/cindervale-dark-split.png)

![Cindervale Light: Python beside JSON](screenshots/cindervale-light-split.png)

## Features

- Light and dark themes from one palette
- Full workbench styling: side bar, tabs, status bar, command palette, menus, notifications, settings,
  source control, debugging, testing, notebooks and chat
- Semantic highlighting aligned with TextMate colors, so code keeps its color when a language server loads
- Warm 16-color terminal palette
- Git decorations, diagnostics, and diff and merge editor colors
- Bracket pairs, indent guides and a quiet minimap
- Tuned for TypeScript, JavaScript, React, Next.js, HTML, CSS, SCSS, Markdown, JSON, YAML, Python, SQL,
  shell scripts, Go, Rust, Java, C#, C/C++, PHP, Vue and Svelte

## Install

1. Open the Extensions view (<kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>X</kbd>) and search for **Cindervale**.
2. Select **Install**.
3. Open the theme picker (<kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>K</kbd>, then <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>T</kbd>)
   and choose **Cindervale Dark** or **Cindervale Light**.

Or from a terminal:

```sh
code --install-extension erenthedeveloper0.cindervale-theme
```

## Recommended settings

Switch between the two modes with your operating system, and mark modified tabs with a coral edge:

```jsonc
{
  "window.autoDetectColorScheme": true,
  "workbench.preferredDarkColorTheme": "Cindervale Dark",
  "workbench.preferredLightColorTheme": "Cindervale Light",
  "workbench.editor.highlightModifiedTabs": true
}
```

Comments render best with a font that has a true italic, such as JetBrains Mono, Cascadia Code or
Monaspace. To turn italics off:

```jsonc
"editor.tokenColorCustomizations": {
  "[Cindervale Dark][Cindervale Light]": {
    "textMateRules": [{ "scope": ["comment", "string.quoted.docstring"], "settings": { "fontStyle": "" } }]
  }
}
```

## Feedback

Found a color that feels off in your language? [Open an issue](https://github.com/erenthedeveloper0/cindervale/issues)
with a short code sample and a screenshot.

## License

[MIT](LICENSE) © 2026 Eren SÜMER
