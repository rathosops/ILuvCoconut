import { type SymbolRole } from '@iluvcoconut/contracts';
import { Icon } from '../../icons/Icon';
import { Field, Prop } from '../../components/controls';
import { SymbolTile } from '../../components/SymbolTile';
import { deriveSymbolView } from '../../components/symbolView';
import { moveSelectedSymbol, updateSelectedSymbol } from '../../engine/symbolManager';
import { type StudioProject } from '../../state/useStudioProject';

const ROLES: Array<{ value: SymbolRole; label: string }> = [
  { value: 'regular', label: 'Regular' },
  { value: 'wild', label: 'Wild' },
  { value: 'scatter', label: 'Scatter' },
  { value: 'bonus', label: 'Bônus' },
  { value: 'multiplier', label: 'Multiplicador' },
  { value: 'decorative', label: 'Decorativo' }
];

export function InspectorSymbol({ project, frameIndex }: { project: StudioProject; frameIndex: number }): JSX.Element {
  const ordered = [...project.state.symbols].sort((left, right) => left.order - right.order);
  const symbol = project.state.symbols.find((item) => item.frameIndex === frameIndex);
  if (!symbol) return <div className="dock-section muted">Símbolo não encontrado. Detecte figuras na aba Assets.</div>;

  const view = deriveSymbolView(symbol.label, symbol.role, symbol.order);
  const pay = project.state.paytable.symbolPays.find((item) => item.symbolId === symbol.id);

  function patch(change: Parameters<typeof updateSelectedSymbol>[1]): void {
    project.mutate((state) => {
      state.selectedFrame = frameIndex;
      updateSelectedSymbol(state, change);
    });
  }

  function move(direction: -1 | 1): void {
    project.mutate((state) => {
      state.selectedFrame = frameIndex;
      moveSelectedSymbol(state, direction);
    });
  }

  return (
    <div className="dock-section">
      <div style={{ width: 96, margin: '0 auto 12px' }}><SymbolTile view={view} /></div>
      <Field label="Nome"><input className="input" value={symbol.label} onChange={(event) => patch({ label: event.target.value })} /></Field>
      <Field label="ID"><input className="input mono" value={symbol.id} onChange={(event) => patch({ id: event.target.value })} /></Field>
      <div className="field-row">
        <Field label="Papel">
          <select className="select" value={symbol.role} onChange={(event) => patch({ role: event.target.value as SymbolRole })}>
            {ROLES.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
          </select>
        </Field>
        <Field label="Ordem">
          <div className="row" style={{ gap: 6 }}>
            <button type="button" className="btn icon sm" disabled={symbol.order === 0} onClick={() => move(-1)}><Icon name="chevron" size={13} style={{ transform: 'rotate(-90deg)' }} /></button>
            <button type="button" className="btn icon sm" disabled={symbol.order >= ordered.length - 1} onClick={() => move(1)}><Icon name="chevron" size={13} style={{ transform: 'rotate(90deg)' }} /></button>
          </div>
        </Field>
      </div>
      <Prop label="Asset"><span style={{ fontSize: 10.5 }}>{symbol.assetKey}</span></Prop>
      <Prop label="Frame">#{symbol.frameIndex}</Prop>
      {pay && (
        <Field label="Prêmios (por combinação)">
          <div className="row" style={{ gap: 6 }}>
            {pay.payouts.map((payout) => (
              <span key={payout.count} className="tag muted">×{payout.count}: {payout.multiplier}</span>
            ))}
          </div>
        </Field>
      )}
    </div>
  );
}
