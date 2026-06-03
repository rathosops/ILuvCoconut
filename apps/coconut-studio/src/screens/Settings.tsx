import { Dialog } from '../components/Dialog';
import { Field, Seg } from '../components/controls';
import { useTheme } from '../theme/ThemeProvider';
import { THEMES, THEME_ORDER, type Density, type FontPair, type RadiusName } from '../theme/themes';

const FONT_OPTIONS: Array<{ value: FontPair; label: string }> = [
  { value: 'plex', label: 'IBM Plex' },
  { value: 'manrope', label: 'Manrope + Sora' },
  { value: 'hanken', label: 'Hanken Grotesk' }
];
const RADIUS_OPTIONS: Array<{ value: RadiusName; label: string }> = [
  { value: 'rounded', label: 'Arredondado' },
  { value: 'square', label: 'Reto' }
];
const DENSITY_OPTIONS: Array<{ value: Density; label: string }> = [
  { value: 'compact', label: 'Compacto' },
  { value: 'regular', label: 'Regular' },
  { value: 'comfy', label: 'Amplo' }
];

export function Settings({ onClose }: { onClose: () => void }): JSX.Element {
  const { prefs, theme, setTheme, setAccent, setFontPair, setDensity, setRadius } = useTheme();

  return (
    <Dialog title="Configurações" subtitle="Aparência do editor" narrow onClose={onClose}>
      <Field label="Paleta">
        <select className="select" value={prefs.theme} onChange={(event) => setTheme(event.target.value as typeof prefs.theme)}>
          {THEME_ORDER.map((name) => <option key={name} value={name}>{THEMES[name].label}</option>)}
        </select>
      </Field>

      <Field label="Cor de acento">
        <div className="row wrap" style={{ gap: 8 }}>
          {theme.accents.map((accent) => (
            <button
              key={accent.a}
              type="button"
              className={`swatch-btn ${prefs.accent === accent.a ? 'sel' : ''}`}
              style={{ background: accent.a }}
              title={accent.a}
              onClick={() => setAccent(accent.a)}
            />
          ))}
        </div>
      </Field>

      <Field label="Tipografia">
        <Seg full value={prefs.fontPair} options={FONT_OPTIONS} onChange={setFontPair} />
      </Field>

      <Field label="Cantos">
        <Seg full value={prefs.radius} options={RADIUS_OPTIONS} onChange={setRadius} />
      </Field>

      <Field label="Densidade">
        <Seg full value={prefs.density} options={DENSITY_OPTIONS} onChange={setDensity} />
      </Field>
    </Dialog>
  );
}
