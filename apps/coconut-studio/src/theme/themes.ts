/* ILuvCoconut Studio — theme palettes (typed).
   Each theme defines a full token set plus accent options.
   accents[0] is the theme default. */

export interface ThemeAccent {
  /** Accent hex (the `--accent` token). */
  a: string;
  strong: string;
  soft: string;
  ink: string;
  /** Ink color used on top of the accent. */
  on: string;
}

export interface Theme {
  label: string;
  dark: boolean;
  vars: Record<string, string>;
  accents: ThemeAccent[];
}

export type ThemeName = 'cream' | 'night' | 'gruvLight' | 'gruvDark';
export type FontPair = 'plex' | 'manrope' | 'hanken';
export type Density = 'compact' | 'regular' | 'comfy';
export type RadiusName = 'rounded' | 'square';

export interface FontTokens {
  ui: string;
  disp: string;
  mono: string;
}

export const THEMES: Record<ThemeName, Theme> = {
  cream: {
    label: 'Coco Cream',
    dark: false,
    vars: {
      '--desktop': '#E7DEC9', '--dot': 'rgba(32,32,76,0.05)',
      '--paper': '#E7DEC9', '--bg': '#F1EAD9', '--surface': '#FCF8EF',
      '--surface-2': '#F5EEDF', '--surface-3': '#EFE7D4', '--surface-sel': '#FFFDF8',
      '--ink': '#20204C', '--ink-2': '#5B5874', '--ink-3': '#908DA3',
      '--line': '#E2D9C3', '--line-2': '#D3C8AC', '--line-3': '#C3B795',
      '--gold': '#E6A526', '--gold-soft': '#F6E4BC', '--gold-ink': '#7A5410',
      '--husk': '#CBB590', '--danger': '#C5523F', '--danger-soft': '#F3DCD6'
    },
    accents: [
      { a: '#2E9E5B', strong: '#1E7A43', soft: '#DCEEDF', ink: '#0F3D24', on: '#FFFFFF' },
      { a: '#2E2E78', strong: '#1E1E58', soft: '#E2E2F3', ink: '#1E1E58', on: '#FFFFFF' },
      { a: '#D9941A', strong: '#B87A12', soft: '#F6E4BC', ink: '#7A5410', on: '#3A2705' },
      { a: '#6FB52E', strong: '#4E9018', soft: '#E6F0CE', ink: '#3A4A0C', on: '#16210A' }
    ]
  },
  night: {
    label: 'Coco Night',
    dark: true,
    vars: {
      '--desktop': '#050b09', '--dot': 'rgba(160,220,190,0.05)',
      '--paper': '#050b09', '--bg': '#0b1512', '--surface': '#11201b',
      '--surface-2': '#0e1a16', '--surface-3': '#17271f', '--surface-sel': '#1a2e25',
      '--ink': '#E7F0EA', '--ink-2': '#9FB9AC', '--ink-3': '#6E8479',
      '--line': '#22382f', '--line-2': '#2c463b', '--line-3': '#38564a',
      '--gold': '#E6B341', '--gold-soft': '#352b12', '--gold-ink': '#F4D98A',
      '--husk': '#6b5b3c', '--danger': '#E2776A', '--danger-soft': '#3a1f1c'
    },
    accents: [
      { a: '#46D58A', strong: '#62E0A0', soft: '#123a29', ink: '#9DEBC0', on: '#06281A' },
      { a: '#5BD6C4', strong: '#79E2D2', soft: '#0f3631', ink: '#9CEDE0', on: '#062622' },
      { a: '#E6B341', strong: '#F0C45F', soft: '#38300f', ink: '#F4D98A', on: '#2A2206' },
      { a: '#B79CF0', strong: '#C9B4F5', soft: '#2a2540', ink: '#D6C9F5', on: '#161030' }
    ]
  },
  gruvLight: {
    label: 'Gruvbox Light',
    dark: false,
    vars: {
      '--desktop': '#e6d8a8', '--dot': 'rgba(60,56,54,0.06)',
      '--paper': '#ece0b8', '--bg': '#fbf1c7', '--surface': '#f9f5d7',
      '--surface-2': '#f2e5bc', '--surface-3': '#ebdbb2', '--surface-sel': '#fffbe6',
      '--ink': '#3c3836', '--ink-2': '#665c54', '--ink-3': '#928374',
      '--line': '#e0d2a3', '--line-2': '#d5c4a1', '--line-3': '#bdae93',
      '--gold': '#b57614', '--gold-soft': '#f3e3b0', '--gold-ink': '#79560f',
      '--husk': '#a89984', '--danger': '#cc241d', '--danger-soft': '#f3d9cf'
    },
    accents: [
      { a: '#79740e', strong: '#5c560a', soft: '#e6e7bd', ink: '#5c560a', on: '#fbf1c7' },
      { a: '#427b58', strong: '#2f5d41', soft: '#d9e8d6', ink: '#2f5d41', on: '#fbf1c7' },
      { a: '#af3a03', strong: '#8c2e02', soft: '#f5ddc4', ink: '#8c2e02', on: '#fbf1c7' },
      { a: '#076678', strong: '#054e5c', soft: '#cfe5e8', ink: '#054e5c', on: '#fbf1c7' }
    ]
  },
  gruvDark: {
    label: 'Gruvbox Dark',
    dark: true,
    vars: {
      '--desktop': '#1d2021', '--dot': 'rgba(235,219,178,0.05)',
      '--paper': '#1d2021', '--bg': '#282828', '--surface': '#32302f',
      '--surface-2': '#3c3836', '--surface-3': '#423d39', '--surface-sel': '#3c3836',
      '--ink': '#ebdbb2', '--ink-2': '#bdae93', '--ink-3': '#928374',
      '--line': '#3c3836', '--line-2': '#504945', '--line-3': '#665c54',
      '--gold': '#fabd2f', '--gold-soft': '#3d3420', '--gold-ink': '#fabd2f',
      '--husk': '#7c6f64', '--danger': '#fb4934', '--danger-soft': '#42211f'
    },
    accents: [
      { a: '#b8bb26', strong: '#98971a', soft: '#383a1c', ink: '#d5d96a', on: '#1d2021' },
      { a: '#8ec07c', strong: '#689d6a', soft: '#2c3a2a', ink: '#b8d6aa', on: '#1d2021' },
      { a: '#fe8019', strong: '#d65d0e', soft: '#3d2a16', ink: '#fdab63', on: '#1d2021' },
      { a: '#83a598', strong: '#458588', soft: '#243330', ink: '#a9c4ba', on: '#1d2021' }
    ]
  }
};

export const THEME_ORDER: ThemeName[] = ['cream', 'night', 'gruvLight', 'gruvDark'];

export const FONTS: Record<FontPair, FontTokens> = {
  plex: { ui: '"IBM Plex Sans", system-ui, sans-serif', disp: '"Space Grotesk", sans-serif', mono: '"IBM Plex Mono", monospace' },
  manrope: { ui: '"Manrope", system-ui, sans-serif', disp: '"Sora", sans-serif', mono: '"JetBrains Mono", monospace' },
  hanken: { ui: '"Hanken Grotesk", system-ui, sans-serif', disp: '"Hanken Grotesk", sans-serif', mono: '"Space Mono", monospace' }
};

export const RADII: Record<RadiusName, [string, string, string]> = {
  rounded: ['9px', '6px', '14px'],
  square: ['3px', '3px', '4px']
};

const ACCENT_LOOKUP: Record<string, ThemeAccent> = {};
for (const theme of Object.values(THEMES)) {
  for (const accent of theme.accents) ACCENT_LOOKUP[accent.a] = accent;
}

export function findAccent(hex: string): ThemeAccent | undefined {
  return ACCENT_LOOKUP[hex];
}
