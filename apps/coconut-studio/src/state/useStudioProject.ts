import { useCallback, useMemo, useReducer, useRef, useState } from 'react';
import { syncSymbolsWithFrames } from '../engine/symbolManager';
import { syncPaytableWithState } from '../engine/paytable';
import type { StudioState } from '../engine/types';
import { createStudioState, type ProjectSeed, type RendererKind } from './createStudioState';
import { preferredBackend, runDetection } from './detection';
import { buildReelGrid, cellKey } from './reelGrid';

export interface ProjectMeta {
  gameId: string;
  assetPrefix: string;
  title: string;
  renderer: RendererKind;
  resolution: string;
}

export interface StudioProject {
  state: StudioState;
  meta: ProjectMeta;
  reelGrid: string[][];
  status: string;
  version: number;
  mutate: (fn: (state: StudioState) => void) => void;
  setMeta: (patch: Partial<ProjectMeta>) => void;
  setStatus: (message: string) => void;
  loadImage: (file: File) => Promise<void>;
  detect: () => Promise<void>;
  paintCell: (reel: number, row: number, symbolId: string) => void;
}

const READY_STATUS = 'Pronto. Preview local ativo no navegador.';

export function useStudioProject(seed: ProjectSeed): StudioProject {
  const stateRef = useRef<StudioState>(createStudioState(seed, preferredBackend()));
  const paintedRef = useRef<Map<string, string>>(new Map());
  const [version, bump] = useReducer((count: number) => count + 1, 0);
  const [status, setStatus] = useState(READY_STATUS);
  const [meta, setMetaState] = useState<ProjectMeta>({
    gameId: seed.gameId,
    assetPrefix: seed.assetPrefix,
    title: seed.title,
    renderer: seed.renderer,
    resolution: seed.resolution
  });

  const resync = useCallback(() => {
    syncSymbolsWithFrames(stateRef.current, meta.assetPrefix);
    syncPaytableWithState(stateRef.current);
    bump();
  }, [meta.assetPrefix]);

  const mutate = useCallback((fn: (state: StudioState) => void) => {
    fn(stateRef.current);
    resync();
  }, [resync]);

  const setMeta = useCallback((patch: Partial<ProjectMeta>) => {
    setMetaState((current) => ({ ...current, ...patch }));
    bump();
  }, []);

  const loadImage = useCallback(async (file: File) => {
    const state = stateRef.current;
    if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
    const imageUrl = URL.createObjectURL(file);
    const image = new Image();
    image.decoding = 'async';
    image.src = imageUrl;
    await image.decode();
    state.image = image;
    state.imageName = file.name;
    state.imageUrl = imageUrl;
    state.selectedFrame = 0;
    state.detectedFrames = [];
    state.symbols = [];
    state.detectionSummary = undefined;
    paintedRef.current.clear();
    setStatus(`${file.name} carregado: ${image.naturalWidth}x${image.naturalHeight}`);
    resync();
  }, [resync]);

  const detect = useCallback(async () => {
    setStatus('Detectando figuras...');
    const message = await runDetection(stateRef.current);
    paintedRef.current.clear();
    setStatus(message);
    resync();
  }, [resync]);

  const paintCell = useCallback((reel: number, row: number, symbolId: string) => {
    paintedRef.current.set(cellKey(reel, row), symbolId);
    bump();
  }, []);

  // `version` captures every in-place mutation to the engine state, so it is the
  // single dependency that should rebuild the derived reel grid.
  const reelGrid = useMemo(
    () => buildReelGrid(stateRef.current.symbols, stateRef.current.slotLayout.reels, stateRef.current.slotLayout.rows, paintedRef.current),
    [version]
  );

  return { state: stateRef.current, meta, reelGrid, status, version, mutate, setMeta, setStatus, loadImage, detect, paintCell };
}
