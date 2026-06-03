import { useMemo, useState } from 'react';
import { createExportPlan } from '../engine/exportPlan';
import { createJsonPreviewState, type JsonPreviewState } from '../engine/slotProjectDraft';
import { type ProjectSeed } from '../state/createStudioState';
import { useStudioProject } from '../state/useStudioProject';
import { Toolbar } from './Toolbar';
import { StatusBar } from './StatusBar';
import { ResourceTree } from './docks/ResourceTree';
import { Inspector } from './docks/Inspector';
import { BottomPanel } from './docks/BottomPanel';
import { ReelsMode } from './modes/ReelsMode';
import { AssetsMode } from './modes/AssetsMode';
import { PaytableMode } from './modes/PaytableMode';
import { PreviewMode } from './modes/PreviewMode';
import { type EditorMode, type Selection } from './types';

const RTP_BASE = 88;
const RTP_CAP = 98;
const RTP_MOD = 17;
const RTP_BONUS = 4;

function estimateRtp(multiplierSum: number): number {
  return Math.min(RTP_CAP, RTP_BASE + Math.round((multiplierSum % RTP_MOD) / 2) + RTP_BONUS);
}

export interface EditorProps {
  seed: ProjectSeed;
  onExit: () => void;
}

export function Editor({ seed, onExit }: EditorProps): JSX.Element {
  const project = useStudioProject(seed);
  const [mode, setMode] = useState<EditorMode>('assets');
  const [selection, setSelection] = useState<Selection>({ kind: 'game' });

  const json = useMemo<JsonPreviewState>(() => {
    const exportPlan = createExportPlan({
      assetPrefix: project.meta.assetPrefix,
      gameId: project.meta.gameId,
      projectType: project.state.projectType,
      state: project.state
    });
    return createJsonPreviewState({
      assetPrefix: project.meta.assetPrefix,
      exportPlan,
      gameId: project.meta.gameId,
      state: project.state
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.version, project.meta.assetPrefix, project.meta.gameId]);

  const multiplierSum = project.state.paytable.symbolPays.reduce(
    (sum, pay) => sum + pay.payouts.reduce((acc, payout) => acc + payout.multiplier, 0),
    0
  );
  const rtp = estimateRtp(multiplierSum);

  function exportConfigs(): void {
    void navigator.clipboard.writeText(JSON.stringify(json.exportPlan, null, 2));
    project.setStatus('Plano de exportação copiado para a área de transferência.');
  }

  function selectMode(next: Selection, modeForSelection?: EditorMode): void {
    setSelection(next);
    if (modeForSelection) setMode(modeForSelection);
  }

  return (
    <div className="editor">
      <Toolbar mode={mode} setMode={setMode} onExit={onExit} onSave={() => project.setStatus('Sessão salva localmente.')} onExport={exportConfigs} />

      <div className="workbench">
        <ResourceTree project={project} selection={selection} onSelect={selectMode} />

        <div className="dock center">
          {mode === 'reels' && <ReelsMode project={project} selection={selection} onSelectCell={(reel, row) => setSelection({ kind: 'cell', reel, row })} />}
          {mode === 'assets' && <AssetsMode project={project} selection={selection} onSelectFrame={(index) => setSelection({ kind: 'frame', index })} />}
          {mode === 'paytable' && <PaytableMode project={project} rtp={rtp} />}
          {mode === 'preview' && <PreviewMode project={project} />}
        </div>

        <Inspector project={project} selection={selection} onSelect={setSelection} />

        <BottomPanel project={project} json={json} />
      </div>

      <StatusBar project={project} rtp={rtp} />
    </div>
  );
}
