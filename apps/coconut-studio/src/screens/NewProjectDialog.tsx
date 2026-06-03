import { useMemo, useState } from 'react';
import { Icon } from '../icons/Icon';
import { Dialog } from '../components/Dialog';
import { Field, Seg } from '../components/controls';
import { GAME_TYPES, TEMPLATES, TYPE_ICON, TYPE_VISUAL } from '../data/catalog';
import type { GameProjectType, StudioLanguage } from '../engine/types';
import type { RendererKind } from '../state/createStudioState';
import type { CreateProjectInput } from '../platform/projects';

const RESOLUTIONS = ['1280×720', '1920×1080', '1080×1920 (retrato)', '800×600'];
const LANGUAGES: Array<{ value: StudioLanguage; label: string }> = [
  { value: 'pt', label: 'pt-BR' },
  { value: 'en', label: 'en-US' },
  { value: 'es', label: 'es-ES' }
];

export interface NewProjectDialogProps {
  onClose: () => void;
  onCreate: (input: CreateProjectInput) => void;
}

function slugify(name: string): string {
  return (name || 'novo-projeto').toLowerCase().replace(/[^a-z0-9]+/gu, '-').replace(/^-|-$/gu, '');
}

export function NewProjectDialog({ onClose, onCreate }: NewProjectDialogProps): JSX.Element {
  const [type, setType] = useState<GameProjectType>('slot');
  const [name, setName] = useState('Meu Slot');
  const [template, setTemplate] = useState(TEMPLATES[0]?.id ?? 'classic-fruit');
  const [renderer, setRenderer] = useState<RendererKind>('pixi');
  const [resolution, setResolution] = useState(RESOLUTIONS[0] ?? '1280×720');
  const [language, setLanguage] = useState<StudioLanguage>('pt');
  const slug = useMemo(() => slugify(name), [name]);

  function submit(): void {
    onCreate({ id: slug, name, type, renderer, language, resolution, template });
  }

  const footer = (
    <>
      <span className="muted row" style={{ gap: 7, fontSize: 12 }}>
        <Icon name="bolt" size={14} style={{ color: 'var(--gold)' }} /> Runtime + contratos do Core são incluídos
      </span>
      <div className="row" style={{ gap: 9 }}>
        <button type="button" className="btn" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn btn-primary" onClick={submit}><Icon name="check" size={15} /> Criar projeto</button>
      </div>
    </>
  );

  return (
    <Dialog title="Novo projeto" subtitle="Escolha o tipo de jogo e o template inicial" onClose={onClose} footer={footer}>
      <div>
        <p className="sec-label" style={{ marginBottom: 10 }}>Tipo de jogo</p>
        <div className="type-grid">
          {GAME_TYPES.map((game) => {
            const selected = type === game.id;
            const visual = TYPE_VISUAL[game.id];
            return (
              <button key={game.id} type="button" className={`type-card ${selected ? 'sel' : ''}`} onClick={() => setType(game.id)}>
                <span className="type-icon" style={{ background: visual.tint, color: visual.fg }}>
                  <Icon name={TYPE_ICON[game.id]} size={20} />
                </span>
                <span style={{ minWidth: 0 }}>
                  <span className="row" style={{ gap: 7 }}>
                    <span className="type-name">{game.name}</span>
                    {selected && <Icon name="check" size={15} style={{ color: 'var(--accent)' }} />}
                  </span>
                  <span className="type-blurb">{game.blurb}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="field-row">
        <Field label="Nome do projeto">
          <input className="input" value={name} onChange={(event) => setName(event.target.value)} />
          <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 5 }}>res://games/{slug || '—'}</div>
        </Field>
        <Field label="Template">
          <select className="select" value={template} onChange={(event) => setTemplate(event.target.value)}>
            {TEMPLATES.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.note}</option>)}
          </select>
        </Field>
      </div>

      <div className="field-row three">
        <Field label="Renderer">
          <Seg
            full
            value={renderer}
            options={[{ value: 'pixi', label: 'Pixi' }, { value: 'cocos', label: 'Cocos' }]}
            onChange={setRenderer}
          />
        </Field>
        <Field label="Resolução">
          <select className="select" value={resolution} onChange={(event) => setResolution(event.target.value)}>
            {RESOLUTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </Field>
        <Field label="Idioma base">
          <select className="select" value={language} onChange={(event) => setLanguage(event.target.value as StudioLanguage)}>
            {LANGUAGES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </Field>
      </div>
    </Dialog>
  );
}
