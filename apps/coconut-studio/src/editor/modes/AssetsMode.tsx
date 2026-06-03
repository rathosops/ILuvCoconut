import { useRef } from 'react';
import { Icon } from '../../icons/Icon';
import { Seg } from '../../components/controls';
import { isCoconutVisionRuntimeAvailable } from '../../engine/coconutVision';
import {
  COCONUT_VISION_BACKEND,
  HEURISTIC_BACKEND,
  MAX_ZOOM,
  MIN_ZOOM,
  PREVIEW_CANVAS_SIZE,
  SHEET_CANVAS_HEIGHT,
  SHEET_CANVAS_WIDTH,
  ZOOM_STEP
} from '../../engine/studioConstants';
import { type DetectionBackend } from '../../engine/types';
import { type StudioProject } from '../../state/useStudioProject';
import { type Selection } from '../types';
import { useSheetCanvas } from './useSheetCanvas';

const PERCENT = 100;
const TOLERANCE_MIN = 4;
const TOLERANCE_MAX = 120;
const MIN_AREA_MIN = 100;
const MIN_AREA_MAX = 8000;

export interface AssetsModeProps {
  project: StudioProject;
  selection: Selection;
  onSelectFrame: (index: number) => void;
}

export function AssetsMode({ project, onSelectFrame }: AssetsModeProps): JSX.Element {
  const fileRef = useRef<HTMLInputElement>(null);
  const canvas = useSheetCanvas(project, onSelectFrame);
  const visionReady = isCoconutVisionRuntimeAvailable();
  const { state } = project;
  const summary = state.detectionSummary;

  function setBackend(backend: DetectionBackend): void {
    if (backend === COCONUT_VISION_BACKEND && !visionReady) {
      project.setStatus('Coconut Vision está disponível apenas no app Tauri. Usando detector leve.');
      return;
    }
    project.mutate((current) => { current.detectionBackend = backend; });
  }

  function zoom(delta: number): void {
    project.mutate((current) => { current.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, current.zoom + delta)); });
  }

  function onFile(event: React.ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (file) void project.loadImage(file);
  }

  return (
    <div className="viewport">
      <div className="vp-toolbar">
        <span className="vp-title">Detecção de figuras</span>
        <span className="grow" />
        <Seg<DetectionBackend>
          value={state.detectionBackend}
          options={[{ value: HEURISTIC_BACKEND, label: 'Detector leve' }, { value: COCONUT_VISION_BACKEND, label: 'Coconut Vision' }]}
          onChange={setBackend}
        />
        <label className="row" style={{ gap: 7, fontSize: 12 }}>
          Tolerância
          <input className="range" style={{ width: 84 }} type="range" min={TOLERANCE_MIN} max={TOLERANCE_MAX} value={state.detectionThreshold}
            onChange={(event) => project.mutate((current) => { current.detectionThreshold = Number(event.target.value); })} />
          <span className="mono" style={{ width: 26 }}>{state.detectionThreshold}</span>
        </label>
        <label className="row" style={{ gap: 7, fontSize: 12 }}>
          Área
          <input className="range" style={{ width: 72 }} type="range" min={MIN_AREA_MIN} max={MIN_AREA_MAX} step={MIN_AREA_MIN} value={state.detectionMinArea}
            onChange={(event) => project.mutate((current) => { current.detectionMinArea = Number(event.target.value); })} />
        </label>
        <button type="button" className="btn sm btn-primary" disabled={!state.image} onClick={() => void project.detect()}><Icon name="wand" size={14} /> Detectar</button>
        <button type="button" className="btn sm icon" title="Fundo claro" onClick={() => project.mutate((current) => { current.backgroundPreview = !current.backgroundPreview; })}><Icon name="eye" size={14} /></button>
        <div className="seg">
          <button type="button" onClick={() => zoom(-ZOOM_STEP)}><Icon name="zoomOut" size={14} /></button>
          <button type="button" className="mono" style={{ minWidth: 44 }}>{Math.round(state.zoom * PERCENT)}%</button>
          <button type="button" onClick={() => zoom(ZOOM_STEP)}><Icon name="zoomIn" size={14} /></button>
        </div>
        <button type="button" className="btn sm" onClick={() => fileRef.current?.click()}><Icon name="upload" size={14} /> Importar</button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
      </div>

      <div className="vp-stage top">
        {!state.image ? (
          <div className="drop-hint">
            <Icon name="image" size={28} />
            <span>Importe uma imagem (PNG/WebP) com os símbolos para detectar as figuras.</span>
            <button type="button" className="btn btn-primary" onClick={() => fileRef.current?.click()}><Icon name="upload" size={15} /> Importar arte</button>
          </div>
        ) : (
          <div className="canvas-wrap" ref={canvas.cursorRef}>
            <div className="row between" style={{ marginBottom: 8 }}>
              <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-2)' }}>{state.imageName} · {state.image.naturalWidth}×{state.image.naturalHeight}</span>
              {summary && <span className="tag green"><Icon name="check" size={12} /> {summary.figureCount} frames</span>}
            </div>
            <div className={`sheet ${state.backgroundPreview ? '' : 'light'}`}>
              <canvas
                ref={canvas.sheetRef}
                className="sheet-canvas"
                width={SHEET_CANVAS_WIDTH}
                height={SHEET_CANVAS_HEIGHT}
                onPointerDown={canvas.onPointerDown}
                onPointerMove={canvas.onPointerMove}
                onPointerUp={canvas.onPointerUp}
              />
            </div>
            <div className="row" style={{ gap: 12, marginTop: 10 }}>
              <canvas ref={canvas.previewRef} width={PREVIEW_CANVAS_SIZE} height={PREVIEW_CANVAS_SIZE} style={{ width: 96, height: 96, borderRadius: 'var(--r-sm)', border: '1px solid var(--line)' }} />
              <span className="muted" style={{ fontSize: 12 }}>
                {state.detectionBackend === COCONUT_VISION_BACKEND ? 'Coconut Vision (Rust) — detecção por conteúdo' : 'Detector leve no browser'}.
                Clique num frame para selecionar e arraste as alças para ajustar.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
