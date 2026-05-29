import './styles.css';
import { detectFiguresWithOpenCv } from './opencv';
import {
  ALPHA_CHANNEL_OFFSET,
  ANALYSIS_MAX_PIXELS,
  ANALYSIS_SAMPLE_LAST_PIXEL,
  ANALYSIS_SAMPLE_MID_PIXEL,
  ANALYSIS_SAMPLE_SIZE,
  BLUE_CHANNEL_OFFSET,
  CANVAS_MIN_OFFSET,
  CANVAS_SAFE_PADDING,
  CHECKERBOARD_SIZE,
  COMPONENT_MERGE_PADDING_MIN,
  COMPONENT_MERGE_PADDING_RATIO,
  COMPONENT_PADDING_BASE,
  COMPONENT_PADDING_MIN,
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_DETECTION_BACKEND,
  DEFAULT_DETECTION_MIN_AREA,
  DEFAULT_DETECTION_THRESHOLD,
  DEFAULT_GRID,
  DEFAULT_ZOOM,
  DETECTED_MODE,
  EMPTY_STATE_FONT,
  GREEN_CHANNEL_OFFSET,
  GRID_MODE,
  HEURISTIC_BACKEND,
  MAX_COLOR_CHANNEL,
  MAX_ZOOM,
  MIN_ALPHA_FOR_FOREGROUND,
  MIN_CONNECTED_COMPONENT_AREA,
  MIN_COUNT_INPUT,
  MIN_NUMERIC_INPUT,
  MIN_ZOOM,
  OPENCV_BACKEND,
  OVERLAY_LABEL_FONT,
  OVERLAY_LABEL_HEIGHT,
  OVERLAY_LABEL_TEXT_X,
  OVERLAY_LABEL_TEXT_Y,
  OVERLAY_LABEL_WIDTH,
  OVERLAY_LABEL_X,
  OVERLAY_LABEL_Y,
  PREVIEW_CANVAS_SIZE,
  PREVIEW_CHECKERBOARD_SIZE,
  RGBA_STRIDE,
  SHEET_CANVAS_HEIGHT,
  SHEET_CANVAS_WIDTH,
  STATUS_READY,
  ZOOM_STEP
} from './studioConstants';
import type { CanvasPlacement, ComponentBounds, DetectionBackend, FrameMode, FrameRect, RgbColor, StudioState } from './types';

const HALF = 2;
const CSS_PERCENT = 100;

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
  detectedFrames: []
};

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Missing #app element');

app.innerHTML = `
  <main class="studio-shell">
    <header class="topbar">
      <div>
        <strong>ILuvCoconut Studio</strong>
        <span>Asset slicing e montagem visual de slots</span>
      </div>
      <div class="topbar-actions">
        <label class="file-button">
          Importar imagem
          <input id="assetFile" type="file" accept="image/png,image/jpeg,image/webp,image/avif" />
        </label>
        <button id="exportPlan" type="button">Exportar plano</button>
      </div>
    </header>

    <aside class="asset-panel">
      <section>
        <h2>Projeto</h2>
        <label>Jogo <input id="gameId" value="fruit-classic" /></label>
        <label>Prefixo <input id="assetPrefix" value="symbol" /></label>
      </section>

      <section>
        <h2>Modo</h2>
        <div class="segmented">
          <button id="gridMode" class="active" type="button">Grid</button>
          <button id="detectedMode" type="button">Figuras</button>
        </div>
      </section>

      <section>
        <h2>Grid manual</h2>
        <div class="control-grid">
          <label>Colunas <input id="columns" type="number" min="${MIN_COUNT_INPUT}" value="${DEFAULT_GRID.columns}" /></label>
          <label>Linhas <input id="rows" type="number" min="${MIN_COUNT_INPUT}" value="${DEFAULT_GRID.rows}" /></label>
          <label>Margem X <input id="marginX" type="number" min="${MIN_NUMERIC_INPUT}" value="${DEFAULT_GRID.marginX}" /></label>
          <label>Margem Y <input id="marginY" type="number" min="${MIN_NUMERIC_INPUT}" value="${DEFAULT_GRID.marginY}" /></label>
          <label>Gap X <input id="gapX" type="number" min="${MIN_NUMERIC_INPUT}" value="${DEFAULT_GRID.gapX}" /></label>
          <label>Gap Y <input id="gapY" type="number" min="${MIN_NUMERIC_INPUT}" value="${DEFAULT_GRID.gapY}" /></label>
          <label>Largura <input id="frameWidth" type="number" min="${MIN_NUMERIC_INPUT}" value="${DEFAULT_GRID.frameWidth}" /></label>
          <label>Altura <input id="frameHeight" type="number" min="${MIN_NUMERIC_INPUT}" value="${DEFAULT_GRID.frameHeight}" /></label>
        </div>
      </section>

      <section>
        <h2>Fundo e figuras</h2>
        <div class="control-grid">
          <label>Tolerancia <input id="detectionThreshold" type="number" min="${MIN_COUNT_INPUT}" max="${MAX_COLOR_CHANNEL}" value="${DEFAULT_DETECTION_THRESHOLD}" /></label>
          <label>Area minima <input id="detectionMinArea" type="number" min="${MIN_COUNT_INPUT}" value="${DEFAULT_DETECTION_MIN_AREA}" /></label>
        </div>
        <div class="segmented secondary">
          <button id="heuristicBackend" class="active" type="button">Leve</button>
          <button id="opencvBackend" type="button">OpenCV</button>
        </div>
        <div class="tool-row">
          <button id="sampleBackground" type="button">Detectar fundo</button>
          <button id="detectFigures" type="button">Auto figuras</button>
        </div>
        <div id="backgroundSwatch" class="swatch">rgb(${DEFAULT_BACKGROUND_COLOR.r}, ${DEFAULT_BACKGROUND_COLOR.g}, ${DEFAULT_BACKGROUND_COLOR.b})</div>
      </section>
    </aside>

    <section class="canvas-stage">
      <div class="stage-toolbar">
        <button id="zoomOut" type="button">-</button>
        <span id="zoomLabel">100%</span>
        <button id="zoomIn" type="button">+</button>
        <label><input id="backgroundPreview" type="checkbox" checked /> fundo claro</label>
      </div>
      <canvas id="sheetCanvas" width="${SHEET_CANVAS_WIDTH}" height="${SHEET_CANVAS_HEIGHT}"></canvas>
    </section>

    <aside class="inspector">
      <section>
        <h2>Frame</h2>
        <div id="frameInfo" class="frame-info">Importe uma imagem para começar.</div>
        <canvas id="previewCanvas" width="${PREVIEW_CANVAS_SIZE}" height="${PREVIEW_CANVAS_SIZE}"></canvas>
      </section>
      <section>
        <h2>Pipeline</h2>
        <ol>
          <li>Importar arte bruta local</li>
          <li>Ajustar grid ou detectar figuras</li>
          <li>Validar preview dos frames</li>
          <li>Exportar plano JSON</li>
          <li>Rodar pipeline CLI/Tauri</li>
        </ol>
      </section>
    </aside>

    <footer class="statusbar">
      <span id="statusText">${STATUS_READY}</span>
    </footer>
  </main>
`;

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
getElement<HTMLButtonElement>('heuristicBackend').addEventListener('click', () => { setDetectionBackend(HEURISTIC_BACKEND); });
getElement<HTMLButtonElement>('opencvBackend').addEventListener('click', () => { setDetectionBackend(OPENCV_BACKEND); });

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
  const plan = createExportPlan();
  void navigator.clipboard.writeText(JSON.stringify(plan, null, HALF));
  setStatus('Plano JSON copiado para a area de transferencia.');
});

sheetCanvas.addEventListener('pointerdown', (event) => {
  const frame = frameAtPointer(event);
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
  state.backgroundColor = sampleBackgroundColor(image);
  updateBackgroundSwatch();
  setStatus(`${file.name} carregado: ${image.naturalWidth}x${image.naturalHeight}`);
  draw();
}

function draw(): void {
  updateZoomLabel();
  sheetContext.clearRect(MIN_NUMERIC_INPUT, MIN_NUMERIC_INPUT, sheetCanvas.width, sheetCanvas.height);

  if (state.backgroundPreview) {
    drawCheckerboard(sheetContext, sheetCanvas.width, sheetCanvas.height, CHECKERBOARD_SIZE);
  }

  if (!state.image) {
    drawEmptyState();
    drawPreview();
    return;
  }

  const placement = getCanvasPlacement();
  sheetContext.drawImage(
    state.image,
    placement.offsetX,
    placement.offsetY,
    state.image.naturalWidth * placement.scale,
    state.image.naturalHeight * placement.scale
  );
  drawOverlay(placement);
  drawPreview();
}

function drawEmptyState(): void {
  sheetContext.fillStyle = '#263241';
  sheetContext.fillRect(MIN_NUMERIC_INPUT, MIN_NUMERIC_INPUT, sheetCanvas.width, sheetCanvas.height);
  sheetContext.fillStyle = '#d8e2ee';
  sheetContext.font = EMPTY_STATE_FONT;
  sheetContext.textAlign = 'center';
  sheetContext.fillText('Importe uma imagem composta para ajustar grid ou detectar figuras.', sheetCanvas.width / HALF, sheetCanvas.height / HALF);
}

function drawOverlay(placement: CanvasPlacement): void {
  sheetContext.lineWidth = MIN_COUNT_INPUT;
  sheetContext.font = OVERLAY_LABEL_FONT;
  sheetContext.textAlign = 'left';

  for (const frame of getFrames()) {
    const x = placement.offsetX + frame.x * placement.scale;
    const y = placement.offsetY + frame.y * placement.scale;
    const width = frame.width * placement.scale;
    const height = frame.height * placement.scale;
    const selected = frame.index === state.selectedFrame;
    sheetContext.strokeStyle = selected ? '#39e29d' : state.frameMode === DETECTED_MODE ? 'rgba(255,199,92,0.86)' : 'rgba(255,255,255,0.76)';
    sheetContext.fillStyle = selected ? 'rgba(57,226,157,0.16)' : 'rgba(14,21,32,0.08)';
    sheetContext.fillRect(x, y, width, height);
    sheetContext.strokeRect(x, y, width, height);
    sheetContext.fillStyle = selected ? '#07130f' : '#ffffff';
    sheetContext.fillRect(x + OVERLAY_LABEL_X, y + OVERLAY_LABEL_Y, OVERLAY_LABEL_WIDTH, OVERLAY_LABEL_HEIGHT);
    sheetContext.fillStyle = selected ? '#39e29d' : '#121820';
    sheetContext.fillText(String(frame.index + MIN_COUNT_INPUT), x + OVERLAY_LABEL_TEXT_X, y + OVERLAY_LABEL_TEXT_Y);
  }
}

function drawPreview(): void {
  previewContext.clearRect(MIN_NUMERIC_INPUT, MIN_NUMERIC_INPUT, previewCanvas.width, previewCanvas.height);
  drawCheckerboard(previewContext, previewCanvas.width, previewCanvas.height, PREVIEW_CHECKERBOARD_SIZE);

  const frame = getFrames()[state.selectedFrame];
  if (!state.image || !frame) {
    setFrameInfo('Nenhum frame selecionado.');
    return;
  }

  const scale = Math.min(previewCanvas.width / frame.width, previewCanvas.height / frame.height);
  const width = frame.width * scale;
  const height = frame.height * scale;
  previewContext.drawImage(
    state.image,
    frame.x,
    frame.y,
    frame.width,
    frame.height,
    (previewCanvas.width - width) / HALF,
    (previewCanvas.height - height) / HALF,
    width,
    height
  );
  setFrameInfo(`Frame ${frame.index + MIN_COUNT_INPUT}: ${frame.width}x${frame.height}px, x ${frame.x}, y ${frame.y}`);
}

function drawCheckerboard(context: CanvasRenderingContext2D, width: number, height: number, size: number): void {
  for (let y = MIN_NUMERIC_INPUT; y < height; y += size) {
    for (let x = MIN_NUMERIC_INPUT; x < width; x += size) {
      context.fillStyle = (x / size + y / size) % HALF === MIN_NUMERIC_INPUT ? '#f2f4f7' : '#d9dee7';
      context.fillRect(x, y, size, size);
    }
  }
}

function getFrames(): FrameRect[] {
  if (!state.image) return [];
  if (state.frameMode === DETECTED_MODE) return state.detectedFrames;

  const { columns, rows, marginX, marginY, gapX, gapY, frameWidth, frameHeight } = state.grid;
  const availableWidth = state.image.naturalWidth - marginX * HALF - gapX * (columns - MIN_COUNT_INPUT);
  const availableHeight = state.image.naturalHeight - marginY * HALF - gapY * (rows - MIN_COUNT_INPUT);
  const width = frameWidth > MIN_NUMERIC_INPUT ? frameWidth : Math.max(MIN_COUNT_INPUT, Math.floor(availableWidth / columns));
  const height = frameHeight > MIN_NUMERIC_INPUT ? frameHeight : Math.max(MIN_COUNT_INPUT, Math.floor(availableHeight / rows));
  const frames: FrameRect[] = [];

  for (let row = MIN_NUMERIC_INPUT; row < rows; row += MIN_COUNT_INPUT) {
    for (let column = MIN_NUMERIC_INPUT; column < columns; column += MIN_COUNT_INPUT) {
      frames.push({
        index: row * columns + column,
        column,
        row,
        x: marginX + column * (width + gapX),
        y: marginY + row * (height + gapY),
        width,
        height
      });
    }
  }

  return frames;
}

async function detectFigures(): Promise<void> {
  if (!state.image) return;
  state.backgroundColor = sampleBackgroundColor(state.image);
  setStatus(state.detectionBackend === OPENCV_BACKEND ? 'Carregando OpenCV.js...' : 'Detectando figuras...');

  try {
    state.detectedFrames = state.detectionBackend === OPENCV_BACKEND
      ? await detectFigureFramesWithOpenCv(state.image)
      : detectFigureFramesWithHeuristic(state.image);
    setStatus(`${state.detectedFrames.length} figuras detectadas com ${state.detectionBackend}.`);
  } catch (error: unknown) {
    state.detectedFrames = detectFigureFramesWithHeuristic(state.image);
    setStatus(`OpenCV indisponivel; fallback leve usado. ${error instanceof Error ? error.message : ''}`.trim());
  }

  state.selectedFrame = MIN_NUMERIC_INPUT;
  setFrameMode(DETECTED_MODE);
  updateBackgroundSwatch();
}

async function detectFigureFramesWithOpenCv(image: HTMLImageElement): Promise<FrameRect[]> {
  const result = await detectFiguresWithOpenCv({
    image,
    backgroundColor: state.backgroundColor,
    threshold: state.detectionThreshold,
    minArea: state.detectionMinArea
  });
  return componentBoundsToFrames(result.bounds, image.naturalWidth, image.naturalHeight, MIN_COUNT_INPUT);
}

function detectFigureFramesWithHeuristic(image: HTMLImageElement): FrameRect[] {
  const scale = Math.min(MIN_COUNT_INPUT, Math.sqrt(ANALYSIS_MAX_PIXELS / (image.naturalWidth * image.naturalHeight)));
  const width = Math.max(MIN_COUNT_INPUT, Math.round(image.naturalWidth * scale));
  const height = Math.max(MIN_COUNT_INPUT, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = getCanvasContext(canvas, true);
  context.drawImage(image, MIN_NUMERIC_INPUT, MIN_NUMERIC_INPUT, width, height);
  const imageData = context.getImageData(MIN_NUMERIC_INPUT, MIN_NUMERIC_INPUT, width, height);
  const mask = createForegroundMask(imageData, state.backgroundColor, state.detectionThreshold);
  const minArea = Math.max(MIN_CONNECTED_COMPONENT_AREA, Math.round(state.detectionMinArea * scale * scale));
  return componentBoundsToFrames(connectedComponents(mask, width, height, minArea), image.naturalWidth, image.naturalHeight, scale);
}

function componentBoundsToFrames(bounds: ComponentBounds[], imageWidth: number, imageHeight: number, scale: number): FrameRect[] {
  const padding = Math.max(COMPONENT_PADDING_MIN, Math.round(COMPONENT_PADDING_BASE * scale));
  const inverseScale = MIN_COUNT_INPUT / scale;

  return bounds
    .map((component, index) => {
      const x = Math.max(MIN_NUMERIC_INPUT, Math.floor((component.minX - padding) * inverseScale));
      const y = Math.max(MIN_NUMERIC_INPUT, Math.floor((component.minY - padding) * inverseScale));
      const maxX = Math.min(imageWidth, Math.ceil((component.maxX + padding) * inverseScale));
      const maxY = Math.min(imageHeight, Math.ceil((component.maxY + padding) * inverseScale));
      return {
        index,
        column: index,
        row: MIN_NUMERIC_INPUT,
        x,
        y,
        width: Math.max(MIN_COUNT_INPUT, maxX - x),
        height: Math.max(MIN_COUNT_INPUT, maxY - y)
      };
    })
    .sort((left, right) => left.y - right.y || left.x - right.x)
    .map((frame, index) => ({ ...frame, index, column: index }));
}

function createForegroundMask(imageData: ImageData, background: RgbColor, threshold: number): Uint8Array {
  const mask = new Uint8Array(imageData.width * imageData.height);
  const data = imageData.data;

  for (let i = MIN_NUMERIC_INPUT, pixel = MIN_NUMERIC_INPUT; i < data.length; i += RGBA_STRIDE, pixel += MIN_COUNT_INPUT) {
    const alpha = data[i + ALPHA_CHANNEL_OFFSET] ?? MAX_COLOR_CHANNEL;
    const distance = colorDistance(
      {
        r: data[i] ?? MIN_NUMERIC_INPUT,
        g: data[i + GREEN_CHANNEL_OFFSET] ?? MIN_NUMERIC_INPUT,
        b: data[i + BLUE_CHANNEL_OFFSET] ?? MIN_NUMERIC_INPUT
      },
      background
    );
    mask[pixel] = alpha > MIN_ALPHA_FOR_FOREGROUND && distance > threshold ? MIN_COUNT_INPUT : MIN_NUMERIC_INPUT;
  }

  return mask;
}

function connectedComponents(mask: Uint8Array, width: number, height: number, minArea: number): ComponentBounds[] {
  const visited = new Uint8Array(mask.length);
  const queue = new Int32Array(mask.length);
  const components: ComponentBounds[] = [];
  let tail = MIN_NUMERIC_INPUT;

  for (let start = MIN_NUMERIC_INPUT; start < mask.length; start += MIN_COUNT_INPUT) {
    if (visited[start] || !mask[start]) continue;
    let head = MIN_NUMERIC_INPUT;
    tail = MIN_NUMERIC_INPUT;
    queue[tail] = start;
    tail += MIN_COUNT_INPUT;
    visited[start] = MIN_COUNT_INPUT;
    const startX = start % width;
    const startY = Math.floor(start / width);
    const bounds: ComponentBounds = { minX: startX, minY: startY, maxX: startX, maxY: startY, area: MIN_NUMERIC_INPUT };

    while (head < tail) {
      const pixel = queue[head] ?? MIN_NUMERIC_INPUT;
      head += MIN_COUNT_INPUT;
      const x = pixel % width;
      const y = Math.floor(pixel / width);
      bounds.area += MIN_COUNT_INPUT;
      bounds.minX = Math.min(bounds.minX, x);
      bounds.minY = Math.min(bounds.minY, y);
      bounds.maxX = Math.max(bounds.maxX, x);
      bounds.maxY = Math.max(bounds.maxY, y);
      enqueueNeighbor(pixel - MIN_COUNT_INPUT, x > MIN_NUMERIC_INPUT);
      enqueueNeighbor(pixel + MIN_COUNT_INPUT, x < width - MIN_COUNT_INPUT);
      enqueueNeighbor(pixel - width, y > MIN_NUMERIC_INPUT);
      enqueueNeighbor(pixel + width, y < height - MIN_COUNT_INPUT);
    }

    if (bounds.area >= minArea) components.push(bounds);
  }

  return mergeNearbyComponents(components, Math.max(COMPONENT_MERGE_PADDING_MIN, Math.round(Math.min(width, height) * COMPONENT_MERGE_PADDING_RATIO)));

  function enqueueNeighbor(pixel: number, valid: boolean): void {
    if (!valid || visited[pixel] || !mask[pixel]) return;
    visited[pixel] = MIN_COUNT_INPUT;
    queue[tail] = pixel;
    tail += MIN_COUNT_INPUT;
  }
}

function mergeNearbyComponents(components: ComponentBounds[], padding: number): ComponentBounds[] {
  const merged: ComponentBounds[] = [];

  for (const component of components) {
    const target = merged.find((candidate) => boxesOverlap(candidate, component, padding));
    if (!target) {
      merged.push({ ...component });
      continue;
    }

    target.minX = Math.min(target.minX, component.minX);
    target.minY = Math.min(target.minY, component.minY);
    target.maxX = Math.max(target.maxX, component.maxX);
    target.maxY = Math.max(target.maxY, component.maxY);
    target.area += component.area;
  }

  return merged;
}

function boxesOverlap(left: ComponentBounds, right: ComponentBounds, padding: number): boolean {
  return left.minX - padding <= right.maxX
    && left.maxX + padding >= right.minX
    && left.minY - padding <= right.maxY
    && left.maxY + padding >= right.minY;
}

function sampleBackgroundColor(image: HTMLImageElement): RgbColor {
  const canvas = document.createElement('canvas');
  canvas.width = ANALYSIS_SAMPLE_SIZE;
  canvas.height = ANALYSIS_SAMPLE_SIZE;
  const context = getCanvasContext(canvas, true);
  context.drawImage(image, MIN_NUMERIC_INPUT, MIN_NUMERIC_INPUT, ANALYSIS_SAMPLE_SIZE, ANALYSIS_SAMPLE_SIZE);
  const imageData = context.getImageData(MIN_NUMERIC_INPUT, MIN_NUMERIC_INPUT, ANALYSIS_SAMPLE_SIZE, ANALYSIS_SAMPLE_SIZE);
  const points = [
    [MIN_COUNT_INPUT, MIN_COUNT_INPUT],
    [ANALYSIS_SAMPLE_LAST_PIXEL, MIN_COUNT_INPUT],
    [MIN_COUNT_INPUT, ANALYSIS_SAMPLE_LAST_PIXEL],
    [ANALYSIS_SAMPLE_LAST_PIXEL, ANALYSIS_SAMPLE_LAST_PIXEL],
    [ANALYSIS_SAMPLE_MID_PIXEL, MIN_COUNT_INPUT],
    [MIN_COUNT_INPUT, ANALYSIS_SAMPLE_MID_PIXEL],
    [ANALYSIS_SAMPLE_LAST_PIXEL, ANALYSIS_SAMPLE_MID_PIXEL],
    [ANALYSIS_SAMPLE_MID_PIXEL, ANALYSIS_SAMPLE_LAST_PIXEL]
  ] as const;

  return medianColor(points.map(([x, y]) => {
    const index = (y * imageData.width + x) * RGBA_STRIDE;
    return {
      r: imageData.data[index] ?? MIN_NUMERIC_INPUT,
      g: imageData.data[index + GREEN_CHANNEL_OFFSET] ?? MIN_NUMERIC_INPUT,
      b: imageData.data[index + BLUE_CHANNEL_OFFSET] ?? MIN_NUMERIC_INPUT
    };
  }));
}

function medianColor(samples: RgbColor[]): RgbColor {
  return {
    r: median(samples.map((sample) => sample.r)),
    g: median(samples.map((sample) => sample.g)),
    b: median(samples.map((sample) => sample.b))
  };
}

function median(values: number[]): number {
  return [...values].sort((left, right) => left - right)[Math.floor(values.length / HALF)] ?? MIN_NUMERIC_INPUT;
}

function colorDistance(left: RgbColor, right: RgbColor): number {
  const red = left.r - right.r;
  const green = left.g - right.g;
  const blue = left.b - right.b;
  return Math.sqrt(red * red + green * green + blue * blue);
}

function frameAtPointer(event: PointerEvent): FrameRect | undefined {
  if (!state.image) return undefined;
  const rect = sheetCanvas.getBoundingClientRect();
  const placement = getCanvasPlacement();
  const x = (event.clientX - rect.left) * (sheetCanvas.width / rect.width);
  const y = (event.clientY - rect.top) * (sheetCanvas.height / rect.height);

  return getFrames().find((frame) => {
    const frameX = placement.offsetX + frame.x * placement.scale;
    const frameY = placement.offsetY + frame.y * placement.scale;
    return x >= frameX && x <= frameX + frame.width * placement.scale && y >= frameY && y <= frameY + frame.height * placement.scale;
  });
}

function getCanvasPlacement(): CanvasPlacement {
  if (!state.image) return { offsetX: MIN_NUMERIC_INPUT, offsetY: MIN_NUMERIC_INPUT, scale: MIN_COUNT_INPUT };
  const scale = calculateScale();
  const drawWidth = state.image.naturalWidth * scale;
  const drawHeight = state.image.naturalHeight * scale;
  return {
    offsetX: Math.max(CANVAS_MIN_OFFSET, (sheetCanvas.width - drawWidth) / HALF),
    offsetY: Math.max(CANVAS_MIN_OFFSET, (sheetCanvas.height - drawHeight) / HALF),
    scale
  };
}

function calculateScale(): number {
  if (!state.image) return MIN_COUNT_INPUT;
  const fitScale = Math.min((sheetCanvas.width - CANVAS_SAFE_PADDING) / state.image.naturalWidth, (sheetCanvas.height - CANVAS_SAFE_PADDING) / state.image.naturalHeight);
  return fitScale * state.zoom;
}

function createExportPlan(): object {
  return {
    gameId: getElement<HTMLInputElement>('gameId').value,
    source: state.imageName ?? null,
    mode: state.frameMode,
    target: 'games/<game-id>/assets/raw/symbols',
    command: state.frameMode === GRID_MODE && state.imageName
      ? `pnpm ilc raw:slice-grid raw-assets/<source>/${state.imageName} games/<game-id>/assets/raw/symbols ${state.grid.columns} ${state.grid.rows} ${getElement<HTMLInputElement>('assetPrefix').value}`
      : null,
    backgroundColor: state.backgroundColor,
    detection: {
      threshold: state.detectionThreshold,
      minArea: state.detectionMinArea,
      backend: state.detectionBackend
    },
    grid: state.grid,
    frames: getFrames()
  };
}

function setFrameMode(mode: FrameMode): void {
  state.frameMode = mode;
  state.selectedFrame = Math.min(state.selectedFrame, Math.max(MIN_NUMERIC_INPUT, getFrames().length - MIN_COUNT_INPUT));
  getElement<HTMLButtonElement>('gridMode').classList.toggle('active', mode === GRID_MODE);
  getElement<HTMLButtonElement>('detectedMode').classList.toggle('active', mode === DETECTED_MODE);
  draw();
}

function setDetectionBackend(backend: DetectionBackend): void {
  state.detectionBackend = backend;
  getElement<HTMLButtonElement>('heuristicBackend').classList.toggle('active', backend === HEURISTIC_BACKEND);
  getElement<HTMLButtonElement>('opencvBackend').classList.toggle('active', backend === OPENCV_BACKEND);
}

function updateZoomLabel(): void {
  getElement<HTMLSpanElement>('zoomLabel').textContent = `${Math.round(state.zoom * CSS_PERCENT)}%`;
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

function getCanvasContext(canvas: HTMLCanvasElement, willReadFrequently = false): CanvasRenderingContext2D {
  const context = canvas.getContext('2d', { alpha: true, willReadFrequently });
  if (!context) throw new Error('Unable to create 2D canvas context.');
  return context;
}

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing #${id} element.`);
  return element as T;
}

function getInputTarget(event: Event): HTMLInputElement {
  if (!(event.currentTarget instanceof HTMLInputElement)) throw new Error('Expected input event target.');
  return event.currentTarget;
}
