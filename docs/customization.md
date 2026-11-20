# Customizing Cindervale

VS Code can adjust any color theme from your settings, without forking it. Every recipe on this
page is scoped to Cindervale's variants by name, so other themes you use are not affected. Paste
them into your user settings: run **Preferences: Open User Settings (JSON)** from the Command
Palette and merge each snippet into the object that is already there.

1. [Follow your system's light and dark mode](#follow-your-systems-light-and-dark-mode)
2. [Fonts](#fonts)
3. [Turn off italics](#turn-off-italics)
4. [Turn off bold constants](#turn-off-bold-constants)
5. [Change an interface color](#change-an-interface-color)
6. [Change a syntax color](#change-a-syntax-color)
7. [Semantic highlighting](#semantic-highlighting)
8. [One rule for several variants](#one-rule-for-several-variants)
9. [How these recipes are checked](#how-these-recipes-are-checked)

## Follow your system's light and dark mode

VS Code switches between a preferred dark and a preferred light theme when your operating system
does. Pair the variants you like:

```jsonc
{
  "window.autoDetectColorScheme": true,
  "workbench.preferredDarkColorTheme": "Cindervale Dark",     // or "Cindervale Accessible Dark"
  "workbench.preferredLightColorTheme": "Cindervale Light"    // or "Cindervale Accessible Light"
}
```

## Fonts

Comments are italic in every variant, and constants are bold in the accessible ones. Both render
best with a font that has a true italic and a true bold rather than slanted or thickened letters,
such as JetBrains Mono, Cascadia Code or Monaspace. If you prefer neither, the next two recipes turn
them off.

## Turn off italics

```jsonc
{
  "editor.tokenColorCustomizations": {
    "[Cindervale Dark][Cindervale Light][Cindervale Accessible Dark][Cindervale Accessible Light]": {
      "textMateRules": [
        {
          "scope": [
            "comment",
            "punctuation.definition.comment",
            "comment.block.documentation",
            "comment.block.documentation punctuation.definition.comment",
            "comment.block.javadoc",
            "comment.line.documentation",
            "comment.line.double-slash.documentation",
            "comment.line.triple-slash",
            "string.quoted.docstring",
            "string.quoted.docstring punctuation.definition.string",
            "storage.type.class.jsdoc",
            "punctuation.definition.block.tag.jsdoc",
            "keyword.other.documentation",
            "comment keyword.codetag.notation",
            "comment.block.documentation keyword",
            "comment.block.documentation storage.type",
            "entity.name.type.instance.jsdoc",
            "comment.block.documentation entity.name.type",
            "punctuation.definition.bracket.curly.begin.jsdoc",
            "punctuation.definition.bracket.curly.end.jsdoc",
            "variable.other.jsdoc",
            "comment.block.documentation variable",
            "fenced_code.block.language",
            "fenced_code.block.language.attributes",
            "markup.quote",
            "markup.quote.markdown",
            "comment.block.javadoc punctuation.definition.comment",
            "comment.block.documentation entity.name.tag",
            "comment.block.documentation entity.other.attribute-name",
            "comment.block.documentation punctuation.definition.tag"
          ],
          "settings": { "fontStyle": "" }
        }
      ]
    }
  }
}
```

The list is long for a reason. A short rule such as `{ "scope": "comment", "settings": { "fontStyle": "" } }`
straightens ordinary comments only: when two rules match a token, VS Code applies the one with the
more specific selector, and Cindervale sets italics on documentation comments, JSDoc and Javadoc
tags, docstrings, code fence languages and Markdown quotes with selectors more specific than
`comment`. Repeating the theme's own selectors overrides each of them, because rules from your
settings come after the theme's and win when the selectors are equally specific.

Italic text you wrote yourself, such as `*emphasis*` in Markdown, stays italic.

## Turn off bold constants

In Cindervale Accessible Dark and Accessible Light, true constants (`ALL_CAPS` names, enum members,
Rust's `const` items and its `Some`, `None`, `Ok` and `Err`) keep the text color and are set in
**bold**. To keep them regular:

```jsonc
{
  "editor.tokenColorCustomizations": {
    "[Cindervale Accessible Dark][Cindervale Accessible Light]": {
      "textMateRules": [
        {
          "scope": [
            "source constant.other.caps",
            "source entity.name.constant",
            "source variable.other.enummember",
            "source constant.other.enum",
            "source entity.name.type.option.rust",
            "source entity.name.type.result.rust",
            "source variable.other.constant"
          ],
          "settings": { "fontStyle": "" }
        }
      ]
    }
  },
  "editor.semanticTokenColorCustomizations": {
    "[Cindervale Accessible Dark][Cindervale Accessible Light]": {
      "rules": {
        "enumMember": { "bold": false },
        "variable.constant": { "bold": false }
      }
    }
  }
}
```

The first half covers the grammar's tokens. The second covers the same constants when a language
server classifies them, such as enum members in TypeScript. Markdown headings and `**bold**` text
stay bold. The [accessibility notes](accessibility.md#the-palette) explain which constants are bold
and why.

## Change an interface color

Workbench colors are overridden by their color ID. This darkens the editor of Cindervale Dark and
gives its cursor the palette's peach:

```jsonc
{
  "workbench.colorCustomizations": {
    "[Cindervale Dark]": {
      "editor.background": "#141113",
      "editorCursor.foreground": "#F2A17F"
    }
  }
}
```

The current value of any color is in the variant's file in [`themes/`](../themes) (for example,
`editor.background` is `#191517` in Cindervale Dark and `editorCursor.foreground` is `#F08A76`), and
VS Code's [theme color reference](https://code.visualstudio.com/api/references/theme-color) lists
every ID. Cindervale's contrast and color-vision audits measure the colors it ships; a value you
change is not covered by them, so check text you lay over a new background.

## Change a syntax color

Place the cursor on a token and run **Developer: Inspect Editor Tokens and Scopes**. Under
*textmate scopes* it lists the token's scopes, and under *foreground* the theme rule that colors it.
Repeat that rule's selector in your settings with a new color. In Cindervale Dark, line and block
comments come from the selector `comment, punctuation.definition.comment`:

```jsonc
{
  "editor.tokenColorCustomizations": {
    "[Cindervale Dark]": {
      "textMateRules": [
        {
          "scope": ["comment", "punctuation.definition.comment"],
          "settings": { "foreground": "#BBA6A1" }
        }
      ]
    }
  }
}
```

Documentation comments have rules of their own and keep their color. If the inspector shows a
*semantic token type* for the token, a language server is coloring it; override that type under
`editor.semanticTokenColorCustomizations` instead, for example `"rules": { "function": "#E9A08C" }`.

## Semantic highlighting

Each Cindervale theme turns semantic highlighting on, and its semantic colors mirror the TextMate
ones, so code keeps its color when a language server attaches. To use the TextMate colors only:

```jsonc
{
  "editor.semanticHighlighting.enabled": false
}
```

## One rule for several variants

A key can name several themes, as the recipes above do: `"[Cindervale Dark][Cindervale Light]"`.
Recent VS Code releases also accept a wildcard, so `"[Cindervale*]"` applies a rule to all four
variants.

## How these recipes are checked

`npm test` compares the selectors in [Turn off italics](#turn-off-italics) and
[Turn off bold constants](#turn-off-bold-constants) with the italic and bold rules in the generated
theme files, so a change to the themes that this page does not follow fails the build. Because
your rules repeat the theme's selectors exactly, VS Code applies yours. The semantic-token rules for
constants follow VS Code's documented `editor.semanticTokenColorCustomizations` setting; they are
not exercised by the repository's tests.
