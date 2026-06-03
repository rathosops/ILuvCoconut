import { useState, type CSSProperties } from 'react';
import { Icon } from '../../icons/Icon';
import { SymbolTile } from '../../components/SymbolTile';
import { buildSymbolViews } from '../../components/symbolView';
import { type StudioProject } from '../../state/useStudioProject';
import { type Selection } from '../types';

const MIN_ZOOM = 60;
const MAX_ZOOM = 140;
const ZOOM_STEP = 10;
const FULL = 100;

export interface ReelsModeProps {
  project: StudioProject;
  selection: Selection;
  onSelectCell: (reel: number, row: number) => void;
}

export function ReelsMode({ project, selection, onSelectCell }: ReelsModeProps): JSX.Element {
  const [zoom, setZoom] = useState(FULL);
  const { reels, rows } = project.state.slotLayout;
  const views = buildSymbolViews(project.state.symbols);
  const selCell = selection.kind === 'cell' ? selection : null;
  const gridStyle = { gridTemplateColumns: `repeat(${reels}, 1fr)`, width: Math.min(108 * reels, 760) } as CSSProperties;

  return (
    <div className="viewport">
      <div className="vp-toolbar">
        <span className="vp-title">Layout dos Reels</span>
        <span className="tag muted">{reels}×{rows}</span>
        <span className="grow" />
        <div className="seg">
          <button type="button" onClick={() => setZoom((value) => Math.max(MIN_ZOOM, value - ZOOM_STEP))}><Icon name="zoomOut" size={14} /></button>
          <button type="button" style={{ minWidth: 44 }} className="mono">{zoom}%</button>
          <button type="button" onClick={() => setZoom((value) => Math.min(MAX_ZOOM, value + ZOOM_STEP))}><Icon name="zoomIn" size={14} /></button>
        </div>
      </div>

      <div className="vp-stage">
        <div style={{ transform: `scale(${zoom / FULL})` }}>
          <div className="reel-machine">
            <div className="reel-heads">
              {Array.from({ length: reels }).map((_value, reel) => <span key={reel} className="reel-head">REEL {reel + 1}</span>)}
            </div>
            <div className="reel-screen">
              <div className="reel-grid" style={gridStyle}>
                {Array.from({ length: reels }).map((_reelValue, reel) =>
                  Array.from({ length: rows }).map((_rowValue, row) => {
                    const id = project.reelGrid[reel]?.[row] ?? '';
                    const selected = selCell?.reel === reel && selCell.row === row;
                    return (
                      <button key={`${reel}-${row}`} type="button" className={`reel-cell ${selected ? 'sel' : ''}`} onClick={() => onSelectCell(reel, row)}>
                        <SymbolTile view={views[id] ?? null} />
                        {selected && <span className="cell-tag">{reel},{row}</span>}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="palette">
            <div className="row between" style={{ marginBottom: 9 }}>
              <span className="sec-label">Paleta de símbolos</span>
              <span className="muted" style={{ fontSize: 11 }}>{selCell ? `Clique para pintar a célula ${selCell.reel},${selCell.row}` : 'Selecione uma célula'}</span>
            </div>
            <div className="palette-grid">
              {project.state.symbols.map((symbol) => (
                <button
                  key={symbol.frameIndex}
                  type="button"
                  className="palette-cell"
                  disabled={!selCell}
                  title={symbol.label}
                  onClick={() => selCell && project.paintCell(selCell.reel, selCell.row, symbol.id)}
                >
                  <SymbolTile view={buildSymbolViews(project.state.symbols)[symbol.id] ?? null} badge={false} />
                </button>
              ))}
              {project.state.symbols.length === 0 && <span className="muted">Detecte figuras para preencher a paleta.</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
