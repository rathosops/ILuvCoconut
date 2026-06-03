import { useState, type CSSProperties } from 'react';
import { Icon, type IconName } from '../../icons/Icon';
import { Tag } from '../../components/controls';
import { buildSymbolViews } from '../../components/symbolView';
import { TYPE_LABEL } from '../../data/catalog';
import { type StudioProject } from '../../state/useStudioProject';
import { type EditorMode, type Selection } from '../types';

export interface ResourceTreeProps {
  project: StudioProject;
  selection: Selection;
  onSelect: (selection: Selection, mode?: EditorMode) => void;
}

function Twist({ open }: { open: boolean }): JSX.Element {
  return <span className={`tree-twist ${open ? 'open' : ''}`}><Icon name="chevron" size={12} /></span>;
}

interface RowProps {
  active: boolean;
  icon?: IconName;
  dot?: string;
  label: string;
  meta?: string;
  indent: number;
  onClick: () => void;
}

function Row({ active, icon, dot, label, meta, indent, onClick }: RowProps): JSX.Element {
  return (
    <button type="button" className={`tree-row ${active ? 'sel' : ''}`} style={{ '--indent': `${indent}px` } as CSSProperties} onClick={onClick}>
      {dot !== undefined
        ? <span className="swatch-dot" style={{ background: dot }} />
        : icon && <Icon name={icon} size={15} style={{ color: active ? 'var(--accent-strong)' : 'var(--ink-3)' }} />}
      <span className="tree-label">{label}</span>
      {meta !== undefined && <span className="tree-meta">{meta}</span>}
    </button>
  );
}

export function ResourceTree({ project, selection, onSelect }: ResourceTreeProps): JSX.Element {
  const [openGame, setOpenGame] = useState(true);
  const [openSymbols, setOpenSymbols] = useState(true);
  const symbols = [...project.state.symbols].sort((left, right) => left.order - right.order);
  const views = buildSymbolViews(project.state.symbols);
  const { reels, rows } = project.state.slotLayout;

  return (
    <div className="dock left">
      <div className="dock-tabs"><button type="button" className="dock-tab active"><Icon name="layers" size={14} /> Cena</button></div>
      <div className="dock-body pad">
        <div className="tree">
          <button type="button" className={`tree-row ${selection.kind === 'game' ? 'sel' : ''}`} style={{ '--indent': '6px' } as CSSProperties} onClick={() => { setOpenGame((value) => !value); onSelect({ kind: 'game' }); }}>
            <Twist open={openGame} />
            <Icon name="box" size={15} style={{ color: 'var(--accent)' }} />
            <span className="tree-label" style={{ fontWeight: 600 }}>{project.meta.title}</span>
            <Tag variant="green">{TYPE_LABEL[project.state.projectType]}</Tag>
          </button>

          {openGame && (
            <>
              <Row active={selection.kind === 'reels'} icon="reels" label="Reels" meta={`${reels}×${rows}`} indent={24} onClick={() => onSelect({ kind: 'reels' }, 'reels')} />
              <button type="button" className="tree-row" style={{ '--indent': '24px' } as CSSProperties} onClick={() => setOpenSymbols((value) => !value)}>
                <Twist open={openSymbols} />
                <Icon name="sparkle" size={15} style={{ color: 'var(--ink-3)' }} />
                <span className="tree-label">Símbolos</span>
                <span className="tree-meta">{symbols.length}</span>
              </button>
              {openSymbols && symbols.map((symbol) => (
                <Row
                  key={symbol.frameIndex}
                  active={selection.kind === 'symbol' && selection.frameIndex === symbol.frameIndex}
                  dot={views[symbol.id]?.fg ?? 'var(--ink-3)'}
                  label={symbol.label}
                  indent={44}
                  onClick={() => onSelect({ kind: 'symbol', frameIndex: symbol.frameIndex }, 'assets')}
                />
              ))}
              <Row active={selection.kind === 'paytable'} icon="table" label="Paytable" indent={24} onClick={() => onSelect({ kind: 'paytable' }, 'paytable')} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
