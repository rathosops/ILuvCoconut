import { type CSSProperties } from 'react';
import { type SymbolView } from './symbolView';

export interface SymbolTileProps {
  view: SymbolView | null;
  badge?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function SymbolTile({ view, badge = true, className = '', style }: SymbolTileProps): JSX.Element {
  if (!view) {
    return (
      <div className={`symbol-tile ${className}`.trim()} style={{ '--st-bg': 'var(--surface-3)', '--st-fg': 'var(--ink-3)', ...style } as CSSProperties}>
        <span className="st-code" style={{ opacity: 0.4 }}>·</span>
      </div>
    );
  }
  return (
    <div className={`symbol-tile ${className}`.trim()} style={{ '--st-bg': view.bg, '--st-fg': view.fg, ...style } as CSSProperties}>
      {badge && view.badge !== null && <span className="st-badge" style={{ color: view.fg }}>{view.badge}</span>}
      <span className="st-code">{view.code}</span>
      <span className="st-name">{view.name}</span>
    </div>
  );
}
