import { useState } from 'react';
import { Icon, type IconName } from '../../icons/Icon';
import { SymbolTile } from '../../components/SymbolTile';
import { buildSymbolViews } from '../../components/symbolView';
import { stringifyJsonPreview, type JsonPreviewState } from '../../engine/slotProjectDraft';
import { type StudioProject } from '../../state/useStudioProject';

type BottomTab = 'symbols' | 'output' | 'problems' | 'json';
type JsonKind = 'exportPlan' | 'gameConfig' | 'themeConfig' | 'paytableConfig' | 'slotDraft';

const TABS: Array<{ id: BottomTab; icon: IconName; label: string }> = [
  { id: 'symbols', icon: 'sparkle', label: 'Símbolos' },
  { id: 'output', icon: 'code', label: 'Saída' },
  { id: 'problems', icon: 'bolt', label: 'Erros' },
  { id: 'json', icon: 'code', label: 'JSON' }
];
const JSON_KINDS: Array<{ id: JsonKind; label: string }> = [
  { id: 'exportPlan', label: 'Export plan' },
  { id: 'gameConfig', label: 'game.config' },
  { id: 'themeConfig', label: 'theme.config' },
  { id: 'paytableConfig', label: 'paytable.config' },
  { id: 'slotDraft', label: 'slot draft' }
];

export interface BottomPanelProps {
  project: StudioProject;
  json: JsonPreviewState;
}

export function BottomPanel({ project, json }: BottomPanelProps): JSX.Element {
  const [tab, setTab] = useState<BottomTab>('symbols');
  const [jsonKind, setJsonKind] = useState<JsonKind>('exportPlan');
  const symbols = [...project.state.symbols].sort((left, right) => left.order - right.order);
  const views = buildSymbolViews(project.state.symbols);
  const issues = json.validation;

  return (
    <div className="dock bottom">
      <div className="dock-tabs">
        {TABS.map((item) => (
          <button key={item.id} type="button" className={`dock-tab ${tab === item.id ? 'active' : ''}`} onClick={() => setTab(item.id)}>
            <Icon name={item.icon} size={14} /> {item.label}
            {item.id === 'problems' && <span className={`tag ${issues.length ? 'gold' : 'muted'}`} style={{ height: 15, fontSize: 9, marginLeft: 2 }}>{issues.length}</span>}
          </button>
        ))}
      </div>
      <div className="dock-body pad">
        {tab === 'symbols' && (
          <div className="asset-grid">
            {symbols.map((symbol) => (
              <div key={symbol.frameIndex} className="asset-cell">
                <SymbolTile view={views[symbol.id] ?? null} badge={false} />
                <div className="nm">{symbol.assetKey}</div>
              </div>
            ))}
            {symbols.length === 0 && <span className="muted">Sem símbolos. Importe arte e detecte figuras na aba Assets.</span>}
          </div>
        )}

        {tab === 'output' && (
          <pre className="log-pre">{`[studio] sessão aberta · ${project.meta.gameId}
[core]   contratos validados ${issues.length === 0 ? '✓' : '⚠'}
[vision] ${project.state.detectedFrames.length} frames detectados
[grid]   layout ${project.state.slotLayout.reels}×${project.state.slotLayout.rows} aplicado
[export] plano JSON disponível`}</pre>
        )}

        {tab === 'problems' && (
          issues.length === 0
            ? <div className="issue ok"><Icon name="check" size={15} style={{ color: 'var(--accent)' }} /> Nenhum problema. Configs válidas.</div>
            : <div className="col" style={{ gap: 2 }}>{issues.map((issue) => <div key={issue} className="issue bad"><Icon name="bolt" size={14} /> {issue}</div>)}</div>
        )}

        {tab === 'json' && (
          <div className="col" style={{ gap: 8, height: '100%' }}>
            <div className="row" style={{ gap: 6 }}>
              {JSON_KINDS.map((kind) => (
                <button key={kind.id} type="button" className={`btn sm ${jsonKind === kind.id ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setJsonKind(kind.id)}>{kind.label}</button>
              ))}
            </div>
            <pre className="json-pre">{stringifyJsonPreview(json[jsonKind])}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
