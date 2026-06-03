import { type SlotEvaluationMode } from '@iluvcoconut/contracts';
import { Field, Prop, Seg, Stepper } from '../../components/controls';
import { SymbolTile } from '../../components/SymbolTile';
import { deriveSymbolView } from '../../components/symbolView';
import { type RendererKind } from '../../state/createStudioState';
import { type StudioProject } from '../../state/useStudioProject';
import { type StudioLanguage } from '../../engine/types';

const MIN_REELS = 3;
const MAX_REELS = 7;
const MIN_ROWS = 2;
const MAX_ROWS = 6;

const LANGUAGES: Array<{ value: StudioLanguage; label: string }> = [
  { value: 'pt', label: 'pt-BR' },
  { value: 'en', label: 'en-US' },
  { value: 'es', label: 'es-ES' }
];
const EVALUATIONS: Array<{ value: SlotEvaluationMode; label: string }> = [
  { value: 'leftToRight', label: 'Esquerda → direita' },
  { value: 'rightToLeft', label: 'Direita → esquerda' },
  { value: 'bothWays', label: 'Ambos os lados' }
];

export function InspectorGame({ project }: { project: StudioProject }): JSX.Element {
  return (
    <div className="dock-section">
      <Field label="Nome do projeto"><input className="input" value={project.meta.title} onChange={(event) => project.setMeta({ title: event.target.value })} /></Field>
      <Field label="ID do jogo"><input className="input mono" value={project.meta.gameId} onChange={(event) => project.setMeta({ gameId: event.target.value })} /></Field>
      <Field label="Prefixo de asset"><input className="input mono" value={project.meta.assetPrefix} onChange={(event) => project.setMeta({ assetPrefix: event.target.value })} /></Field>
      <Field label="Renderer">
        <Seg<RendererKind> full value={project.meta.renderer} options={[{ value: 'pixi', label: 'Pixi' }, { value: 'cocos', label: 'Cocos' }]} onChange={(renderer) => project.setMeta({ renderer })} />
      </Field>
      <Field label="Idioma base">
        <select className="select" value={project.state.language} onChange={(event) => project.mutate((state) => { state.language = event.target.value as StudioLanguage; })}>
          {LANGUAGES.map((language) => <option key={language.value} value={language.value}>{language.label}</option>)}
        </select>
      </Field>
      <Prop label="Resolução">{project.meta.resolution}</Prop>
    </div>
  );
}

export function InspectorReels({ project }: { project: StudioProject }): JSX.Element {
  const { reels, rows, cellWidth, cellHeight, reelGap, rowGap } = project.state.slotLayout;
  const set = (patch: Partial<typeof project.state.slotLayout>): void => project.mutate((state) => { Object.assign(state.slotLayout, patch); });
  return (
    <div className="dock-section">
      <div className="field-row">
        <Field label="Colunas (reels)"><Stepper value={reels} min={MIN_REELS} max={MAX_REELS} onChange={(value) => set({ reels: value })} /></Field>
        <Field label="Linhas"><Stepper value={rows} min={MIN_ROWS} max={MAX_ROWS} onChange={(value) => set({ rows: value })} /></Field>
      </div>
      <div className="field-row">
        <Field label="Largura célula"><input className="num" type="number" value={cellWidth} onChange={(event) => set({ cellWidth: Number(event.target.value) })} /></Field>
        <Field label="Altura célula"><input className="num" type="number" value={cellHeight} onChange={(event) => set({ cellHeight: Number(event.target.value) })} /></Field>
      </div>
      <div className="field-row">
        <Field label="Gap reels"><input className="num" type="number" value={reelGap} onChange={(event) => set({ reelGap: Number(event.target.value) })} /></Field>
        <Field label="Gap linhas"><input className="num" type="number" value={rowGap} onChange={(event) => set({ rowGap: Number(event.target.value) })} /></Field>
      </div>
      <Prop label="Células">{reels * rows}</Prop>
    </div>
  );
}

export function InspectorPaytable({ project }: { project: StudioProject }): JSX.Element {
  const { paytable } = project.state;
  const set = (patch: Partial<typeof project.state.paytable>): void => project.mutate((state) => { Object.assign(state.paytable, patch); });
  const toggle = (key: 'wildSubstitutes' | 'scatterPaysAnywhere' | 'highestWinOnlyPerLine'): void =>
    project.mutate((state) => { state.paytable[key] = !state.paytable[key]; });
  return (
    <div className="dock-section">
      <div className="field-row">
        <Field label="Aposta por linha"><input className="num" type="number" value={paytable.lineBet} onChange={(event) => set({ lineBet: Number(event.target.value) })} /></Field>
        <Field label="Mín. combinação"><input className="num" type="number" value={paytable.minMatch} onChange={(event) => set({ minMatch: Number(event.target.value) })} /></Field>
      </div>
      <Field label="Avaliação">
        <select className="select" value={paytable.evaluation} onChange={(event) => set({ evaluation: event.target.value as SlotEvaluationMode })}>
          {EVALUATIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </Field>
      <label className="row" style={{ gap: 8, marginTop: 8 }}><input type="checkbox" checked={paytable.wildSubstitutes} onChange={() => toggle('wildSubstitutes')} /> Wild substitui</label>
      <label className="row" style={{ gap: 8 }}><input type="checkbox" checked={paytable.scatterPaysAnywhere} onChange={() => toggle('scatterPaysAnywhere')} /> Scatter em qualquer posição</label>
      <label className="row" style={{ gap: 8 }}><input type="checkbox" checked={paytable.highestWinOnlyPerLine} onChange={() => toggle('highestWinOnlyPerLine')} /> Maior prêmio por linha</label>
    </div>
  );
}

export function InspectorCell({ project, reel, row }: { project: StudioProject; reel: number; row: number }): JSX.Element {
  const current = project.reelGrid[reel]?.[row] ?? '';
  const symbol = project.state.symbols.find((item) => item.id === current);
  const view = symbol ? deriveSymbolView(symbol.label, symbol.role, symbol.order) : null;
  return (
    <div className="dock-section">
      <Field label="Símbolo">
        <select className="select" value={current} onChange={(event) => project.paintCell(reel, row, event.target.value)}>
          {project.state.symbols.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </Field>
      <div style={{ width: 88, margin: '4px auto 0' }}><SymbolTile view={view} /></div>
      <Prop label="Coluna">{reel}</Prop>
      <Prop label="Linha">{row}</Prop>
    </div>
  );
}
