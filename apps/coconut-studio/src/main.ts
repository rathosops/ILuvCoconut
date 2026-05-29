import './styles.css';
import { detectFiguresWithCoconutVision } from './coconutVision';
import { drawStudioCanvas } from './canvasRenderer';
import { getCanvasContext, getElement, getInputTarget } from './dom';
import { createExportPlan } from './exportPlan';
import { frameAtPointer, getFrames } from './frameMath';
import { detectFiguresWithHeuristic, sampleBackgroundColor } from './imageDetection';
import {
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_DETECTION_BACKEND,
  DEFAULT_DETECTION_MIN_AREA,
  DEFAULT_DETECTION_THRESHOLD,
  DEFAULT_GRID,
  DEFAULT_ZOOM,
  COCONUT_VISION_BACKEND,
  DETECTED_MODE,
  GRID_MODE,
  HEURISTIC_BACKEND,
  JSON_INDENT_SPACES,
  MAX_COLOR_CHANNEL,
  MAX_ZOOM,
  MIN_COUNT_INPUT,
  MIN_NUMERIC_INPUT,
  MIN_ZOOM,
  PERCENT_MULTIPLIER,
  ZOOM_STEP
} from './studioConstants';
import { renderStudioShell } from './studioTemplate';
import type { DetectionBackend, DetectionSummary, FrameMode, FrameRect, StudioState } from './types';

const state: StudioState = {
  grid: { ...DEFAULT_GRID },
  zoom: DEFAULT_ZOOM,
  selectedFrame: MIN_NUMERIC_INPUT,
  backgroundPreview: true,
  frameMode: GRID_MODE,
  backgroundColor: DEFAULT_BACKGROUND_COLOR,
  detectionThreshold: DEFAULT_DETECTION_THRESHOLD,
  detectionMinArea: DEFAULT_DETECTION_MIN_AREA,
  detectionBackend: DEFAULT_DETECTION_BACKEND,
  detectedFrames: [],
  detectionSummary: undefined
};

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Missing #app element');

app.innerHTML = renderStudioShell();

const sheetCanvas = getElement<HTMLCanvasElement>('sheetCanvas');
const previewCanvas = getElement<HTMLCanvasElement>('previewCanvas');
const sheetContext = getCanvasContext(sheetCanvas);
const previewContext = getCanvasContext(previewCanvas);

bindNumberInput('columns', (value) => { state.grid.columns = Math.max(MIN_COUNT_INPUT, value); });
bindNumberInput('rows', (value) => { state.grid.rows = Math.max(MIN_COUNT_INPUT, value); });
bindNumberInput('marginX', (value) => { state.grid.marginX = Math.max(MIN_NUMERIC_INPUT, value); });
bindNumberInput('marginY', (value) => { state.grid.marginY = Math.max(MIN_NUMERIC_INPUT, value); });
bindNumberInput('gapX', (value) => { state.grid.gapX = Math.max(MIN_NUMERIC_INPUT, value); });
bindNumberInput('gapY', (value) => { state.grid.gapY = Math.max(MIN_NUMERIC_INPUT, value); });
bindNumberInput('frameWidth', (value) => { state.grid.frameWidth = Math.max(MIN_NUMERIC_INPUT, value); });
bindNumberInput('frameHeight', (value) => { state.grid.frameHeight = Math.max(MIN_NUMERIC_INPUT, value); });
bindNumberInput('detectionThreshold', (value) => { state.detectionThreshold = Math.max(MIN_COUNT_INPUT, Math.min(MAX_COLOR_CHANNEL, value)); });
bindNumberInput('detectionMinArea', (value) => { state.detectionMinArea = Math.max(MIN_COUNT_INPUT, value); });

getElement<HTMLButtonElement>('gridMode').addEventListener('click', () => { setFrameMode(GRID_MODE); });
getElement<HTMLButtonElement>('detectedMode').addEventListener('click', () => { setFrameMode(DETECTED_MODE); });
getElement<HTMLButtonElement>('coconutVisionBackend').addEventListener('click', () => { setDetectionBackend(COCONUT_VISION_BACKEND); });
getElement<HTMLButtonElement>('heuristicBackend').addEventListener('click', () => { setDetectionBackend(HEURISTIC_BACKEND); });

getElement<HTMLButtonElement>('sampleBackground').addEventListener('click', () => {
  if (!state.image) return;
  state.backgroundColor = sampleBackgroundColor(state.image);
  updateBackgroundSwatch();
  draw();
});

getElement<HTMLButtonElement>('detectFigures').addEventListener('click', () => {
  void detectFigures();
});

getElement<HTMLInputElement>('backgroundPreview').addEventListener('change', (event) => {
  state.backgroundPreview = getInputTarget(event).checked;
  draw();
});

getElement<HTMLInputElement>('assetFile').addEventListener('change', (event) => {
  const file = getInputTarget(event).files?.[MIN_NUMERIC_INPUT];
  if (!file) return;
  void loadImageFile(file);
});

getElement<HTMLButtonElement>('zoomIn').addEventListener('click', () => {
  state.zoom = Math.min(MAX_ZOOM, state.zoom + ZOOM_STEP);
  draw();
});

getElement<HTMLButtonElement>('zoomOut').addEventListener('click', () => {
  state.zoom = Math.max(MIN_ZOOM, state.zoom - ZOOM_STEP);
  draw();
});

getElement<HTMLButtonElement>('exportPlan').addEventListener('click', () => {
  const plan = createExportPlan({
    assetPrefix: getElement<HTMLInputElement>('assetPrefix').value,
    gameId: getElement<HTMLInputElement>('gameId').value,
    state
  });
  void navigator.clipboard.writeText(JSON.stringify(plan, null, JSON_INDENT_SPACES));
  setStatus('Plano JSON copiado para a area de transferencia.');
});

sheetCanvas.addEventListener('pointerdown', (event) => {
  const frame = frameAtPointer(event, sheetCanvas, state.image, state.zoom, getFrames(state));
  if (!frame) return;
  state.selectedFrame = frame.index;
  draw();
});

draw();

function bindNumberInput(id: string, onValue: (value: number) => void): void {
  getElement<HTMLInputElement>(id).addEventListener('input', (event) => {
    onValue(Number(getInputTarget(event).value));
    draw();
  });
}

async function loadImageFile(file: File): Promise<void> {
  if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
  const imageUrl = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = 'async';
  image.src = imageUrl;
  await image.decode();
  state.image = image;
  state.imageName = file.name;
  state.imageUrl = imageUrl;
  state.selectedFrame = MIN_NUMERIC_INPUT;
  state.detectedFrames = [];
  state.detectionSummary = undefined;
  state.backgroundColor = sampleBackgroundColor(image);
  updateBackgroundSwatch();
  setStatus(`${file.name} carregado: ${image.naturalWidth}x${image.naturalHeight}`);
  draw();
}

function draw(): void {
  updateZoomLabel();
  drawStudioCanvas({
    previewCanvas,
    previewContext,
    setFrameInfo,
    sheetCanvas,
    sheetContext,
    state
  });
}

async function detectFigures(): Promise<void> {
  if (!state.image) return;
  state.backgroundColor = sampleBackgroundColor(state.image);
  setStatus('Detectando figuras...');

  try {
    const result = await detectFiguresWithPreferredBackend();
    state.detectedFrames = result.frames;
    state.detectionSummary = result.summary;
    setStatus(formatDetectionSummary(result.summary));
  } catch (error: unknown) {
    const result = detectFiguresWithHeuristic(state.image, state.backgroundColor, state.detectionThreshold, state.detectionMinArea);
    state.detectedFrames = result.frames;
    state.detectionSummary = result.summary;
    setStatus(`${getBackendLabel(state.detectionBackend)} indisponivel; fallback leve usado. ${formatDetectionSummary(result.summary)} ${error instanceof Error ? error.message : ''}`.trim());
  }

  state.selectedFrame = MIN_NUMERIC_INPUT;
  setFrameMode(DETECTED_MODE);
  updateBackgroundSwatch();
}

async function detectFiguresWithPreferredBackend(): Promise<{ frames: FrameRect[]; summary: DetectionSummary }> {
  if (!state.image) return { frames: [], summary: createEmptySummary() };
  if (state.detectionBackend === HEURISTIC_BACKEND) return detectFiguresWithHeuristic(state.image, state.backgroundColor, state.detectionThreshold, state.detectionMinArea);
  return detectFiguresWithCoconutVision(state.image, state.backgroundColor, state.detectionThreshold, state.detectionMinArea);
}

function setFrameMode(mode: FrameMode): void {
  state.frameMode = mode;
  state.selectedFrame = Math.min(state.selectedFrame, Math.max(MIN_NUMERIC_INPUT, getFrames(state).length - MIN_COUNT_INPUT));
  getElement<HTMLButtonElement>('gridMode').classList.toggle('active', mode === GRID_MODE);
  getElement<HTMLButtonElement>('detectedMode').classList.toggle('active', mode === DETECTED_MODE);
  draw();
}

function setDetectionBackend(backend: DetectionBackend): void {
  state.detectionBackend = backend;
  getElement<HTMLButtonElement>('coconutVisionBackend').classList.toggle('active', backend === COCONUT_VISION_BACKEND);
  getElement<HTMLButtonElement>('heuristicBackend').classList.toggle('active', backend === HEURISTIC_BACKEND);
}

function updateZoomLabel(): void {
  getElement<HTMLSpanElement>('zoomLabel').textContent = `${Math.round(state.zoom * PERCENT_MULTIPLIER)}%`;
}

function updateBackgroundSwatch(): void {
  const swatch = getElement<HTMLDivElement>('backgroundSwatch');
  swatch.textContent = `rgb(${state.backgroundColor.r}, ${state.backgroundColor.g}, ${state.backgroundColor.b})`;
  swatch.style.background = `rgb(${state.backgroundColor.r}, ${state.backgroundColor.g}, ${state.backgroundColor.b})`;
}

function setFrameInfo(value: string): void {
  getElement<HTMLDivElement>('frameInfo').textContent = value;
}

function setStatus(value: string): void {
  getElement<HTMLSpanElement>('statusText').textContent = value;
}

function formatDetectionSummary(summary: DetectionSummary): string {
  if (summary.figureCount === MIN_NUMERIC_INPUT) return `Nenhuma figura encontrada com ${summary.backend}. Ajuste tolerancia ou area minima.`;
  const rowText = summary.figuresByRow.length > MIN_NUMERIC_INPUT ? ` (${summary.figuresByRow.join('/')})` : '';
  return `${summary.figureCount} figuras em ${summary.rowCount} linhas${rowText} com ${summary.backend} em ${summary.elapsedMs}ms.`;
}

function getBackendLabel(backend: DetectionBackend): string {
  if (backend === COCONUT_VISION_BACKEND) return 'Coconut Vision';
  return 'Detector leve';
}

function createEmptySummary(): DetectionSummary {
  return {
    backend: 'heuristic',
    figureCount: MIN_NUMERIC_INPUT,
    rowCount: MIN_NUMERIC_INPUT,
    figuresByRow: [],
    analysisScale: MIN_COUNT_INPUT,
    elapsedMs: MIN_NUMERIC_INPUT
  };
}
