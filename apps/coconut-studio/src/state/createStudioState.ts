import {
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_DETECTION_MIN_AREA,
  DEFAULT_DETECTION_THRESHOLD,
  DEFAULT_GRID,
  DEFAULT_ZOOM,
  GRID_MODE,
  HEURISTIC_BACKEND,
  MIN_NUMERIC_INPUT
} from '../engine/studioConstants';
import { createDefaultPaytable } from '../engine/paytable';
import { createDefaultSlotLayout } from '../engine/slotLayout';
import type { DetectionBackend, GameProjectType, StudioLanguage, StudioState } from '../engine/types';

export type RendererKind = 'pixi' | 'cocos';

export interface ProjectSeed {
  gameId: string;
  title: string;
  assetPrefix: string;
  projectType: GameProjectType;
  language: StudioLanguage;
  renderer: RendererKind;
  resolution: string;
}

export function createStudioState(seed: ProjectSeed, backend: DetectionBackend = HEURISTIC_BACKEND): StudioState {
  const slotLayout = createDefaultSlotLayout();
  return {
    grid: { ...DEFAULT_GRID },
    zoom: DEFAULT_ZOOM,
    selectedFrame: MIN_NUMERIC_INPUT,
    backgroundPreview: true,
    frameMode: GRID_MODE,
    backgroundColor: { ...DEFAULT_BACKGROUND_COLOR },
    detectionThreshold: DEFAULT_DETECTION_THRESHOLD,
    detectionMinArea: DEFAULT_DETECTION_MIN_AREA,
    detectionBackend: backend,
    detectedFrames: [],
    detectionSummary: undefined,
    language: seed.language,
    projectType: seed.projectType,
    selectedJsonPreview: 'exportPlan',
    slotLayout,
    paytable: createDefaultPaytable(slotLayout.reels, slotLayout.rows),
    symbols: []
  };
}
