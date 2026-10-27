import { createPalette } from './palette.mjs';
import { semanticTokenColors } from './semantic.mjs';
import { tokenColors } from './syntax.mjs';
import { workbench } from './workbench.mjs';

/** Every Cindervale variant. Future variants join this list, nothing else changes. */
export const variants = [
  { type: 'dark', name: 'Cindervale Dark', file: 'cindervale-dark-color-theme.json' },
  { type: 'light', name: 'Cindervale Light', file: 'cindervale-light-color-theme.json' },
  { type: 'dark', accessible: true, name: 'Cindervale Accessible Dark', file: 'cindervale-accessible-dark-color-theme.json' },
  { type: 'light', accessible: true, name: 'Cindervale Accessible Light', file: 'cindervale-accessible-light-color-theme.json' },
];

export function createTheme(variant) {
  const palette = createPalette(variant);
  return {
    $schema: 'vscode://schemas/color-theme',
    name: variant.name,
    type: variant.type,
    semanticHighlighting: true,
    colors: workbench(palette),
    tokenColors: tokenColors(palette),
    semanticTokenColors: semanticTokenColors(palette),
  };
}
