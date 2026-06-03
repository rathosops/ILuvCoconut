import { type ReactNode } from 'react';
import { Icon } from '../icons/Icon';
import { Mascot } from './Brand';

export interface DialogProps {
  title: string;
  subtitle?: string;
  narrow?: boolean;
  footer?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}

export function Dialog({ title, subtitle, narrow = false, footer, onClose, children }: DialogProps): JSX.Element {
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className={`dialog ${narrow ? 'narrow' : ''}`.trim()} onClick={(event) => event.stopPropagation()}>
        <div className="dialog-head">
          <div className="row" style={{ gap: 11 }}>
            <Mascot size={30} ring />
            <div>
              <div className="dialog-title">{title}</div>
              {subtitle !== undefined && <div className="muted" style={{ fontSize: 12 }}>{subtitle}</div>}
            </div>
          </div>
          <button type="button" className="btn icon btn-ghost" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        <div className="dialog-body scrolly">{children}</div>
        {footer !== undefined && <div className="dialog-foot">{footer}</div>}
      </div>
    </div>
  );
}
