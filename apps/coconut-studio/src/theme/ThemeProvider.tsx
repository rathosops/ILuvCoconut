import { createContext, useCallback, useContext, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import {
  FONTS,
  RADII,
  THEMES,
  findAccent,
  type Density,
  type FontPair,
  type RadiusName,
  type Theme,
  type ThemeAccent,
  type ThemeName
} from './themes';

export interface ThemePrefs {
  theme: ThemeName;
  accent: string;
  fontPair: FontPair;
  density: Density;
  radius: RadiusName;
}

export interface ThemeContextValue {
  prefs: ThemePrefs;
  theme: Theme;
  accent: ThemeAccent;
  setTheme: (name: ThemeName) => void;
  setAccent: (hex: string) => void;
  setFontPair: (pair: FontPair) => void;
  setDensity: (density: Density) => void;
  setRadius: (radius: RadiusName) => void;
}

const STORAGE_KEY = 'ilc.studio.theme';

const FALLBACK_ACCENT: ThemeAccent = { a: '#2E9E5B', strong: '#1E7A43', soft: '#DCEEDF', ink: '#0F3D24', on: '#FFFFFF' };

const DEFAULT_PREFS: ThemePrefs = {
  theme: 'cream',
  accent: (THEMES.cream.accents[0] ?? FALLBACK_ACCENT).a,
  fontPair: 'plex',
  density: 'regular',
  radius: 'rounded'
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function loadPrefs(): ThemePrefs {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<ThemePrefs>) };
  } catch {
    return DEFAULT_PREFS;
  }
}

function resolveAccent(prefs: ThemePrefs, theme: Theme): ThemeAccent {
  const known = theme.accents.some((option) => option.a === prefs.accent) ? findAccent(prefs.accent) : undefined;
  return known ?? theme.accents[0] ?? FALLBACK_ACCENT;
}

function buildRootStyle(theme: Theme, accent: ThemeAccent, prefs: ThemePrefs): CSSProperties {
  const font = FONTS[prefs.fontPair];
  const radius = RADII[prefs.radius];
  return {
    ...theme.vars,
    '--accent': accent.a,
    '--accent-strong': accent.strong,
    '--accent-soft': accent.soft,
    '--accent-ink': accent.ink,
    '--ink-on-accent': accent.on,
    '--ui-font': font.ui,
    '--display-font': font.disp,
    '--mono-font': font.mono,
    '--r': radius[0],
    '--r-sm': radius[1],
    '--r-lg': radius[2]
  } as CSSProperties;
}

export function ThemeProvider({ children }: { children: ReactNode }): JSX.Element {
  const [prefs, setPrefs] = useState<ThemePrefs>(loadPrefs);

  const update = useCallback((patch: Partial<ThemePrefs>) => {
    setPrefs((current) => {
      const next = { ...current, ...patch };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable — keep in-memory only */
      }
      return next;
    });
  }, []);

  const theme = THEMES[prefs.theme];
  const accent = resolveAccent(prefs, theme);

  const value = useMemo<ThemeContextValue>(() => ({
    prefs,
    theme,
    accent,
    setTheme: (name) => update({ theme: name, accent: (THEMES[name].accents[0] ?? FALLBACK_ACCENT).a }),
    setAccent: (hex) => update({ accent: hex }),
    setFontPair: (pair) => update({ fontPair: pair }),
    setDensity: (density) => update({ density }),
    setRadius: (radius) => update({ radius })
  }), [prefs, theme, accent, update]);

  return (
    <ThemeContext.Provider value={value}>
      <div className="desktop" data-density={prefs.density} style={buildRootStyle(theme, accent, prefs)}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used within ThemeProvider');
  return value;
}
