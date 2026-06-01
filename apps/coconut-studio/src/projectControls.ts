import { getElement, getInputTarget } from './dom';
import { applyTranslations, getProjectTypeDescription } from './i18n';
import {
  DEFAULT_ASSET_PREFIX,
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_DETECTION_MIN_AREA,
  DEFAULT_DETECTION_THRESHOLD,
  DEFAULT_GAME_ID,
  DEFAULT_GRID,
  DEFAULT_PROJECT_TYPE,
  GRID_MODE,
  MIN_NUMERIC_INPUT
} from './studioConstants';
import type { GameProjectType, StudioLanguage, StudioState } from './types';

interface BindProjectControlsOptions {
  draw: () => void;
  setStatus: (value: string) => void;
  state: StudioState;
  syncFrameModeButtons: () => void;
  updateBackgroundSwatch: () => void;
}

export function bindProjectControls(options: BindProjectControlsOptions): void {
  const { draw, state } = options;

  getElement<HTMLButtonElement>('newProject').addEventListener('click', () => { createNewProject(options); });
  getElement<HTMLSelectElement>('projectType').addEventListener('change', (event) => {
    state.projectType = getInputTarget(event).value as GameProjectType;
    syncProjectType(state);
    draw();
  });
  getElement<HTMLSelectElement>('languageSelect').addEventListener('change', (event) => {
    state.language = getInputTarget(event).value as StudioLanguage;
    syncLanguage(state);
    draw();
  });
}

export function syncLanguage(state: StudioState): void {
  applyTranslations(document, state.language);
  syncProjectType(state);
}

function createNewProject({ draw, setStatus, state, syncFrameModeButtons, updateBackgroundSwatch }: BindProjectControlsOptions): void {
  if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
  delete state.image;
  delete state.imageName;
  delete state.imageUrl;
  state.grid = { ...DEFAULT_GRID };
  state.selectedFrame = MIN_NUMERIC_INPUT;
  state.frameMode = GRID_MODE;
  state.backgroundColor = DEFAULT_BACKGROUND_COLOR;
  state.detectionThreshold = DEFAULT_DETECTION_THRESHOLD;
  state.detectionMinArea = DEFAULT_DETECTION_MIN_AREA;
  state.projectType = DEFAULT_PROJECT_TYPE;
  state.detectedFrames = [];
  state.detectionSummary = undefined;
  resetProjectInputs();
  syncFrameModeButtons();
  syncProjectType(state);
  updateBackgroundSwatch();
  setStatus('Novo projeto criado.');
  draw();
}

function syncProjectType(state: StudioState): void {
  getElement<HTMLDivElement>('projectTypeDescription').textContent = getProjectTypeDescription(state.language, state.projectType);
  getElement<HTMLSelectElement>('projectType').value = state.projectType;
}

function resetProjectInputs(): void {
  getElement<HTMLInputElement>('gameId').value = DEFAULT_GAME_ID;
  getElement<HTMLInputElement>('assetPrefix').value = DEFAULT_ASSET_PREFIX;
  getElement<HTMLInputElement>('columns').value = String(DEFAULT_GRID.columns);
  getElement<HTMLInputElement>('rows').value = String(DEFAULT_GRID.rows);
  getElement<HTMLInputElement>('marginX').value = String(DEFAULT_GRID.marginX);
  getElement<HTMLInputElement>('marginY').value = String(DEFAULT_GRID.marginY);
  getElement<HTMLInputElement>('gapX').value = String(DEFAULT_GRID.gapX);
  getElement<HTMLInputElement>('gapY').value = String(DEFAULT_GRID.gapY);
  getElement<HTMLInputElement>('frameWidth').value = String(DEFAULT_GRID.frameWidth);
  getElement<HTMLInputElement>('frameHeight').value = String(DEFAULT_GRID.frameHeight);
  getElement<HTMLInputElement>('detectionThreshold').value = String(DEFAULT_DETECTION_THRESHOLD);
  getElement<HTMLInputElement>('detectionMinArea').value = String(DEFAULT_DETECTION_MIN_AREA);
}
