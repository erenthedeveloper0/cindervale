import { createPalette } from './palette.mjs';
import { semanticTokenColors } from './semantic.mjs';
import { tokenColors } from './syntax.mjs';
import { workbench } from './workbench.mjs';

/** Every Cindervale variant. Future variants join this list, nothing else changes. */
export const variants = [
  { type: 'dark', name: 'Cindervale Dark', file: 'cindervale-dark-color-theme.json' },
  { type: 'light', name: 'Cindervale Light', file: 'cindervale-light-color-theme.json' },
];

export function createTheme({ type, name }) {
  const palette = createPalette(type);
  return {
    $schema: 'vscode://schemas/color-theme',
    name,
    type,
    semanticHighlighting: true,
    colors: workbench(palette),
    tokenColors: tokenColors(palette),
    semanticTokenColors: semanticTokenColors(palette),
  };
}
