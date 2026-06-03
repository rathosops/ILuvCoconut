import { type CSSProperties } from 'react';
import { Icon } from '../../icons/Icon';
import { SymbolTile } from '../../components/SymbolTile';
import { buildSymbolViews } from '../../components/symbolView';
import { resetPaytable } from '../../engine/paytable';
import { type StudioProject } from '../../state/useStudioProject';

const RTP_TARGET = 'alvo 94–96%';

export interface PaytableModeProps {
  project: StudioProject;
  rtp: number;
}

export function PaytableMode({ project, rtp }: PaytableModeProps): JSX.Element {
  const { symbolPays, paylines } = project.state.paytable;
  const views = buildSymbolViews(project.state.symbols);
  const counts = symbolPays[0]?.payouts.map((payout) => payout.count) ?? [];
  const gridStyle = { gridTemplateColumns: `1fr ${counts.map(() => '64px').join(' ')}` } as CSSProperties;
  const enabledLines = paylines.filter((line) => line.enabled).length;

  function editPayout(symbolId: string, count: number, value: string): void {
    const multiplier = Number(value.replace(/\D/gu, '')) || 0;
    project.mutate((state) => {
      const pay = state.paytable.symbolPays.find((item) => item.symbolId === symbolId);
      const payout = pay?.payouts.find((item) => item.count === count);
      if (payout) payout.multiplier = multiplier;
    });
  }

  return (
    <div className="viewport">
      <div className="vp-toolbar">
        <span className="vp-title">Paytable</span>
        <span className="tag muted">moedas por linha</span>
        <span className="grow" />
        <button type="button" className="btn sm" onClick={() => project.mutate((state) => resetPaytable(state))}><Icon name="refresh" size={14} /> Resetar</button>
      </div>
      <div className="vp-stage top">
        <div className="pay-layout">
          <div className="pay-table">
            <div className="pay-head" style={gridStyle}>
              <span>Símbolo</span>
              {counts.map((count) => <span key={count}>×{count}</span>)}
            </div>
            {symbolPays.map((pay) => (
              <div key={pay.symbolId} className="pay-row" style={gridStyle}>
                <div className="pay-sym">
                  <span className="tile"><SymbolTile view={views[pay.symbolId] ?? null} badge={false} /></span>
                  <div>
                    <div className="nm">{views[pay.symbolId]?.name ?? pay.symbolId}</div>
                    <div className="id">{pay.symbolId} · {pay.role}</div>
                  </div>
                </div>
                {pay.payouts.map((payout) => (
                  <input key={payout.count} className="num" value={payout.multiplier} onChange={(event) => editPayout(pay.symbolId, payout.count, event.target.value)} />
                ))}
              </div>
            ))}
            {symbolPays.length === 0 && <div className="dock-section muted">Detecte figuras e defina símbolos para montar a paytable.</div>}
          </div>

          <div className="col" style={{ gap: 12 }}>
            <div className="rtp-card">
              <div className="sec-label" style={{ marginBottom: 8 }}>RTP estimado</div>
              <div className="rtp-value">{rtp}%</div>
              <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>{RTP_TARGET}</div>
              <div className="rtp-bar"><div style={{ width: `${rtp}%` }} /></div>
            </div>
            <div className="info-card">
              <div className="prop-row"><span className="prop-key">Linhas ativas</span><span className="prop-val">{enabledLines}</span></div>
              <div className="prop-row"><span className="prop-key">Mín. combinação</span><span className="prop-val">{project.state.paytable.minMatch}</span></div>
              <div className="prop-row"><span className="prop-key">Aposta linha</span><span className="prop-val">{project.state.paytable.lineBet}</span></div>
            </div>
            <div className="note-card">
              <span className="row" style={{ gap: 7, fontWeight: 700, marginBottom: 4 }}><Icon name="bolt" size={14} /> Paytable demo</span>
              Valores de exemplo. O balanceamento final usa as fixtures do Core.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
