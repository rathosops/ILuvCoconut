import './styles.css';

interface CropGrid {
  columns: number;
  rows: number;
  marginX: number;
  marginY: number;
  gapX: number;
  gapY: number;
}

interface StudioState {
  image?: HTMLImageElement;
  imageName?: string;
  imageUrl?: string;
  grid: CropGrid;
  zoom: number;
  selectedFrame: number;
  backgroundPreview: boolean;
}

interface FrameRect {
  index: number;
  column: number;
  row: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

const state: StudioState = {
  grid: {
    columns: 5,
    rows: 3,
    marginX: 0,
    marginY: 0,
    gapX: 0,
    gapY: 0
  },
  zoom: 1,
  selectedFrame: 0,
  backgroundPreview: true
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
        <label>
          Jogo
          <input id="gameId" value="fruit-classic" />
        </label>
        <label>
          Prefixo
          <input id="assetPrefix" value="symbol" />
        </label>
      </section>

      <section>
        <h2>Grid</h2>
        <div class="control-grid">
          <label>Colunas <input id="columns" type="number" min="1" value="5" /></label>
          <label>Linhas <input id="rows" type="number" min="1" value="3" /></label>
          <label>Margem X <input id="marginX" type="number" min="0" value="0" /></label>
          <label>Margem Y <input id="marginY" type="number" min="0" value="0" /></label>
          <label>Gap X <input id="gapX" type="number" min="0" value="0" /></label>
          <label>Gap Y <input id="gapY" type="number" min="0" value="0" /></label>
        </div>
      </section>
    </aside>

    <section class="canvas-stage">
      <div class="stage-toolbar">
        <button id="zoomOut" type="button">-</button>
        <span id="zoomLabel">100%</span>
        <button id="zoomIn" type="button">+</button>
        <label><input id="backgroundPreview" type="checkbox" checked /> fundo claro</label>
      </div>
      <canvas id="sheetCanvas" width="1280" height="720"></canvas>
    </section>

    <aside class="inspector">
      <section>
        <h2>Frame</h2>
        <div id="frameInfo" class="frame-info">Importe uma imagem para começar.</div>
        <canvas id="previewCanvas" width="256" height="256"></canvas>
      </section>
      <section>
        <h2>Pipeline</h2>
        <ol>
          <li>Importar arte bruta local</li>
          <li>Ajustar grid de recorte</li>
          <li>Validar preview dos frames</li>
          <li>Exportar plano JSON</li>
          <li>Rodar pipeline CLI/Tauri</li>
        </ol>
      </section>
    </aside>

    <footer class="statusbar">
      <span id="statusText">Pronto</span>
    </footer>
  </main>
`;

const sheetCanvas = getElement<HTMLCanvasElement>('sheetCanvas');
const previewCanvas = getElement<HTMLCanvasElement>('previewCanvas');
const sheetContext = getCanvasContext(sheetCanvas);
const previewContext = getCanvasContext(previewCanvas);

bindNumberInput('columns', (value) => {
  state.grid.columns = Math.max(1, value);
});
bindNumberInput('rows', (value) => {
  state.grid.rows = Math.max(1, value);
});
bindNumberInput('marginX', (value) => {
  state.grid.marginX = Math.max(0, value);
});
bindNumberInput('marginY', (value) => {
  state.grid.marginY = Math.max(0, value);
});
bindNumberInput('gapX', (value) => {
  state.grid.gapX = Math.max(0, value);
});
bindNumberInput('gapY', (value) => {
  state.grid.gapY = Math.max(0, value);
});

getElement<HTMLInputElement>('backgroundPreview').addEventListener('change', (event) => {
  state.backgroundPreview = getInputTarget(event).checked;
  draw();
});

getElement<HTMLInputElement>('assetFile').addEventListener('change', (event) => {
  const file = getInputTarget(event).files?.[0];
  if (!file) return;
  void loadImageFile(file);
});

getElement<HTMLButtonElement>('zoomIn').addEventListener('click', () => {
  state.zoom = Math.min(4, state.zoom + 0.25);
  draw();
});

getElement<HTMLButtonElement>('zoomOut').addEventListener('click', () => {
  state.zoom = Math.max(0.25, state.zoom - 0.25);
  draw();
});

getElement<HTMLButtonElement>('exportPlan').addEventListener('click', () => {
  const plan = createExportPlan();
  void navigator.clipboard.writeText(JSON.stringify(plan, null, 2));
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
  state.selectedFrame = 0;
  setStatus(`${file.name} carregado: ${image.naturalWidth}x${image.naturalHeight}`);
  draw();
}

function draw(): void {
  updateZoomLabel();
  sheetContext.clearRect(0, 0, sheetCanvas.width, sheetCanvas.height);

  if (state.backgroundPreview) {
    drawCheckerboard(sheetContext, sheetCanvas.width, sheetCanvas.height, 24);
  }

  if (!state.image) {
    drawEmptyState();
    drawPreview();
    return;
  }

  const scale = calculateScale();
  const drawWidth = state.image.naturalWidth * scale;
  const drawHeight = state.image.naturalHeight * scale;
  const offsetX = Math.max(24, (sheetCanvas.width - drawWidth) / 2);
  const offsetY = Math.max(24, (sheetCanvas.height - drawHeight) / 2);

  sheetContext.drawImage(state.image, offsetX, offsetY, drawWidth, drawHeight);
  drawGridOverlay(offsetX, offsetY, scale);
  drawPreview();
}

function drawEmptyState(): void {
  sheetContext.fillStyle = '#263241';
  sheetContext.fillRect(0, 0, sheetCanvas.width, sheetCanvas.height);
  sheetContext.fillStyle = '#d8e2ee';
  sheetContext.font = '18px system-ui';
  sheetContext.textAlign = 'center';
  sheetContext.fillText('Importe uma imagem composta para ajustar o recorte por grid.', sheetCanvas.width / 2, sheetCanvas.height / 2);
}

function drawGridOverlay(offsetX: number, offsetY: number, scale: number): void {
  const frames = getFrames();
  sheetContext.lineWidth = 1;
  sheetContext.font = '12px system-ui';

  for (const frame of frames) {
    const x = offsetX + frame.x * scale;
    const y = offsetY + frame.y * scale;
    const width = frame.width * scale;
    const height = frame.height * scale;
    const selected = frame.index === state.selectedFrame;
    sheetContext.strokeStyle = selected ? '#39e29d' : 'rgba(255,255,255,0.76)';
    sheetContext.fillStyle = selected ? 'rgba(57,226,157,0.16)' : 'rgba(14,21,32,0.08)';
    sheetContext.fillRect(x, y, width, height);
    sheetContext.strokeRect(x, y, width, height);
    sheetContext.fillStyle = selected ? '#07130f' : '#ffffff';
    sheetContext.fillRect(x + 6, y + 6, 28, 20);
    sheetContext.fillStyle = selected ? '#39e29d' : '#121820';
    sheetContext.fillText(String(frame.index + 1), x + 20, y + 21);
  }
}

function drawPreview(): void {
  previewContext.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  drawCheckerboard(previewContext, previewCanvas.width, previewCanvas.height, 16);

  const frame = getFrames()[state.selectedFrame];
  if (!state.image || !frame) {
    setFrameInfo('Nenhum frame selecionado.');
    return;
  }

  const scale = Math.min(previewCanvas.width / frame.width, previewCanvas.height / frame.height);
  const width = frame.width * scale;
  const height = frame.height * scale;
  const x = (previewCanvas.width - width) / 2;
  const y = (previewCanvas.height - height) / 2;
  previewContext.drawImage(state.image, frame.x, frame.y, frame.width, frame.height, x, y, width, height);
  setFrameInfo(`Frame ${frame.index + 1}: col ${frame.column + 1}, row ${frame.row + 1}, ${frame.width}x${frame.height}px`);
}

function drawCheckerboard(context: CanvasRenderingContext2D, width: number, height: number, size: number): void {
  for (let y = 0; y < height; y += size) {
    for (let x = 0; x < width; x += size) {
      context.fillStyle = (x / size + y / size) % 2 === 0 ? '#f2f4f7' : '#d9dee7';
      context.fillRect(x, y, size, size);
    }
  }
}

function getFrames(): FrameRect[] {
  if (!state.image) return [];

  const { columns, rows, marginX, marginY, gapX, gapY } = state.grid;
  const availableWidth = state.image.naturalWidth - marginX * 2 - gapX * (columns - 1);
  const availableHeight = state.image.naturalHeight - marginY * 2 - gapY * (rows - 1);
  const width = Math.max(1, Math.floor(availableWidth / columns));
  const height = Math.max(1, Math.floor(availableHeight / rows));
  const frames: FrameRect[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
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

function frameAtPointer(event: PointerEvent): FrameRect | undefined {
  if (!state.image) return undefined;
  const rect = sheetCanvas.getBoundingClientRect();
  const scale = calculateScale();
  const drawWidth = state.image.naturalWidth * scale;
  const drawHeight = state.image.naturalHeight * scale;
  const offsetX = Math.max(24, (sheetCanvas.width - drawWidth) / 2);
  const offsetY = Math.max(24, (sheetCanvas.height - drawHeight) / 2);
  const x = (event.clientX - rect.left) * (sheetCanvas.width / rect.width);
  const y = (event.clientY - rect.top) * (sheetCanvas.height / rect.height);

  return getFrames().find((frame) => {
    const frameX = offsetX + frame.x * scale;
    const frameY = offsetY + frame.y * scale;
    return x >= frameX && x <= frameX + frame.width * scale && y >= frameY && y <= frameY + frame.height * scale;
  });
}

function calculateScale(): number {
  if (!state.image) return 1;
  const fitScale = Math.min((sheetCanvas.width - 48) / state.image.naturalWidth, (sheetCanvas.height - 48) / state.image.naturalHeight);
  return fitScale * state.zoom;
}

function createExportPlan(): object {
  return {
    gameId: getElement<HTMLInputElement>('gameId').value,
    source: state.imageName ?? null,
    target: 'games/<game-id>/assets/raw/symbols',
    command: state.imageName
      ? `pnpm ilc raw:slice-grid raw-assets/<source>/${state.imageName} games/<game-id>/assets/raw/symbols ${state.grid.columns} ${state.grid.rows} ${getElement<HTMLInputElement>('assetPrefix').value}`
      : null,
    grid: state.grid,
    frames: getFrames()
  };
}

function updateZoomLabel(): void {
  getElement<HTMLSpanElement>('zoomLabel').textContent = `${Math.round(state.zoom * 100)}%`;
}

function setFrameInfo(value: string): void {
  getElement<HTMLDivElement>('frameInfo').textContent = value;
}

function setStatus(value: string): void {
  getElement<HTMLSpanElement>('statusText').textContent = value;
}

function getCanvasContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) throw new Error('Unable to create 2D canvas context.');
  return context;
}

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing #${id} element.`);
  return element as T;
}

function getInputTarget(event: Event): HTMLInputElement {
  if (!(event.currentTarget instanceof HTMLInputElement)) {
    throw new Error('Expected input event target.');
  }

  return event.currentTarget;
}
