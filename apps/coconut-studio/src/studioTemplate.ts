import {
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_DETECTION_MIN_AREA,
  DEFAULT_DETECTION_THRESHOLD,
  DEFAULT_GRID,
  MAX_COLOR_CHANNEL,
  MIN_COUNT_INPUT,
  MIN_NUMERIC_INPUT,
  PREVIEW_CANVAS_SIZE,
  SHEET_CANVAS_HEIGHT,
  SHEET_CANVAS_WIDTH,
  STATUS_READY
} from './studioConstants';

const STUDIO_SHELL_TEMPLATE = `
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

export function renderStudioShell(): string {
  return STUDIO_SHELL_TEMPLATE;
}
