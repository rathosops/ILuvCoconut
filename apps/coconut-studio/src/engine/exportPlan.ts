import { GRID_MODE } from './studioConstants';
import { getFrames } from './frameMath';
import type { GameProjectType, StudioState } from './types';

export interface ExportPlanInput {
  assetPrefix: string;
  gameId: string;
  projectType: GameProjectType;
  state: StudioState;
}

export function createExportPlan({ assetPrefix, gameId, projectType, state }: ExportPlanInput): object {
  return {
    gameId,
    projectType,
    source: state.imageName ?? null,
    mode: state.frameMode,
    target: 'games/<game-id>/assets/raw/symbols',
    command: state.frameMode === GRID_MODE && state.imageName
      ? `pnpm ilc raw:slice-grid raw-assets/<source>/${state.imageName} games/<game-id>/assets/raw/symbols ${state.grid.columns} ${state.grid.rows} ${assetPrefix}`
      : null,
    backgroundColor: state.backgroundColor,
    detection: {
      threshold: state.detectionThreshold,
      minArea: state.detectionMinArea,
      backend: state.detectionBackend,
      summary: state.detectionSummary ?? null
    },
    grid: state.grid,
    frames: getFrames(state)
  };
}
