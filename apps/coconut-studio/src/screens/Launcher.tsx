import { useMemo, useState } from 'react';
import { Icon } from '../icons/Icon';
import { Logo } from '../components/Brand';
import { Tag } from '../components/controls';
import { FILTER_TYPES, TYPE_ICON, TYPE_LABEL, TYPE_TAG, TYPE_VISUAL } from '../data/catalog';
import type { GameProjectType } from '../engine/types';
import type { ProjectSummary } from '../platform/projects';

type FilterType = GameProjectType | 'all';

export interface LauncherProps {
  projects: ProjectSummary[];
  loading: boolean;
  onNew: () => void;
  onOpen: (project: ProjectSummary) => void;
  onSettings: () => void;
}

function editedLabel(updatedAt: number): string {
  if (!updatedAt) return 'exemplo';
  return new Date(updatedAt).toLocaleDateString('pt-BR');
}

function ProjectThumb({ type }: { type: GameProjectType }): JSX.Element {
  const visual = TYPE_VISUAL[type];
  return (
    <div className="proj-thumb" style={{ background: `linear-gradient(135deg, ${visual.tint}, ${visual.tint}88)` }}>
      <span className="thumb-icon" style={{ color: visual.fg }}>
        <Icon name={TYPE_ICON[type]} size={60} />
      </span>
    </div>
  );
}

function ProjectCard({ project, onOpen }: { project: ProjectSummary; onOpen: (project: ProjectSummary) => void }): JSX.Element {
  return (
    <button type="button" className="proj-card" onClick={() => onOpen(project)}>
      <ProjectThumb type={project.type} />
      <div className="row between" style={{ alignItems: 'flex-start', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div className="proj-name">{project.name}</div>
          <div className="proj-path">res://games/{project.id}</div>
        </div>
        <Tag variant={TYPE_TAG[project.type]}>{TYPE_LABEL[project.type]}</Tag>
      </div>
      <div className="proj-meta">
        <span className="row" style={{ gap: 5 }}><Icon name="reels" size={13} /> {project.gridLabel}</span>
        <span className="row" style={{ gap: 5 }}><Icon name="history" size={13} /> {editedLabel(project.updatedAt)}</span>
      </div>
    </button>
  );
}

export function Launcher({ projects, loading, onNew, onOpen, onSettings }: LauncherProps): JSX.Element {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<FilterType>('all');

  const list = useMemo(() => projects.filter((project) =>
    (type === 'all' || project.type === type) &&
    (!query || project.name.toLowerCase().includes(query.toLowerCase()) || project.id.includes(query.toLowerCase()))
  ), [projects, query, type]);

  return (
    <div className="launcher">
      <div className="launcher-head">
        <Logo size={30} sub="v0.4.1 · Pixi renderer" />
        <div className="row" style={{ gap: 9 }}>
          <div className="search-box">
            <Icon name="search" size={14} style={{ color: 'var(--ink-3)' }} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar projetos…" />
          </div>
          <button type="button" className="btn icon" title="Configurações" onClick={onSettings}><Icon name="settings" size={16} /></button>
          <button type="button" className="btn btn-primary" onClick={onNew}><Icon name="plus" size={15} /> Novo Projeto</button>
        </div>
      </div>
      <div className="launcher-body scrolly">
        <div className="filter-row">
          <div className="row" style={{ gap: 8 }}>
            {FILTER_TYPES.map((filter) => (
              <button
                key={filter}
                type="button"
                className={`btn sm ${type === filter ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setType(filter)}
              >
                {filter === 'all' ? 'Todos' : TYPE_LABEL[filter]}
              </button>
            ))}
          </div>
          <span className="muted" style={{ fontSize: 12 }}>{loading ? 'carregando…' : `${list.length} projeto(s)`}</span>
        </div>
        <div className="proj-grid">
          <button type="button" className="new-card" onClick={onNew}>
            <span className="badge"><Icon name="plus" size={24} /></span>
            <span style={{ fontWeight: 600 }}>Criar novo projeto</span>
          </button>
          {list.map((project) => <ProjectCard key={project.id} project={project} onOpen={onOpen} />)}
          {!loading && list.length === 0 && (
            <div className="empty-note">
              <Icon name="box" size={28} />
              <span>Nenhum projeto ainda. Crie o primeiro.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
