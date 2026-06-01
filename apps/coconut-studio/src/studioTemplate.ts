import {
  DEFAULT_ASSET_PREFIX,
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_DETECTION_MIN_AREA,
  DEFAULT_DETECTION_THRESHOLD,
  DEFAULT_GAME_ID,
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
        <div class="brand-lockup">
          <img src="/icon.png" alt="" />
          <div>
            <strong>ILuvCoconut Studio</strong>
            <span data-i18n="appSubtitle">Engine visual para jogos de casino web</span>
          </div>
        </div>
        <nav class="workspace-tabs" aria-label="Studio workspaces">
          <button class="active" type="button" data-i18n="workspace">Asset Studio</button>
          <button type="button" disabled>Game Config</button>
          <button type="button" disabled>Preview</button>
        </nav>
        <div class="topbar-actions">
          <label class="compact-select">
            <span data-i18n="language">Idioma</span>
            <select id="languageSelect">
              <option value="pt" selected>PT</option>
              <option value="en">EN</option>
              <option value="es">ES</option>
            </select>
          </label>
          <button id="newProject" type="button" data-i18n="newProject">Novo projeto</button>
          <label class="file-button">
            <span data-i18n="importImage">Importar imagem</span>
            <input id="assetFile" type="file" accept="image/png,image/jpeg,image/webp,image/avif" />
          </label>
          <button id="exportPlan" type="button" data-i18n="exportPlan">Exportar plano</button>
        </div>
      </header>

      <aside class="asset-panel">
        <section>
          <h2 data-i18n="project">Projeto</h2>
          <label><span data-i18n="gameId">Jogo</span><input id="gameId" value="${DEFAULT_GAME_ID}" /></label>
          <label><span data-i18n="assetPrefix">Prefixo</span><input id="assetPrefix" value="${DEFAULT_ASSET_PREFIX}" /></label>
        </section>

        <section>
          <h2 data-i18n="gameType">Tipo de jogo</h2>
          <select id="projectType">
            <option value="slot" selected>Slot</option>
            <option value="bingo">Bingo</option>
            <option value="pachinko">Pachinko</option>
            <option value="free">Livre</option>
          </select>
          <div id="projectTypeDescription" class="hint"></div>
        </section>

        <section>
          <h2>Viewport</h2>
          <div class="segmented">
            <button id="gridMode" class="active" type="button" data-i18n="gridMode">Grid</button>
            <button id="detectedMode" type="button" data-i18n="figures">Figuras</button>
          </div>
        </section>

        <section>
          <h2 data-i18n="manualGrid">Grid manual</h2>
          <div class="control-grid">
            <label><span data-i18n="columns">Colunas</span><input id="columns" type="number" min="${MIN_COUNT_INPUT}" value="${DEFAULT_GRID.columns}" /></label>
            <label><span data-i18n="rows">Linhas</span><input id="rows" type="number" min="${MIN_COUNT_INPUT}" value="${DEFAULT_GRID.rows}" /></label>
            <label><span data-i18n="marginX">Margem X</span><input id="marginX" type="number" min="${MIN_NUMERIC_INPUT}" value="${DEFAULT_GRID.marginX}" /></label>
            <label><span data-i18n="marginY">Margem Y</span><input id="marginY" type="number" min="${MIN_NUMERIC_INPUT}" value="${DEFAULT_GRID.marginY}" /></label>
            <label>Gap X<input id="gapX" type="number" min="${MIN_NUMERIC_INPUT}" value="${DEFAULT_GRID.gapX}" /></label>
            <label>Gap Y<input id="gapY" type="number" min="${MIN_NUMERIC_INPUT}" value="${DEFAULT_GRID.gapY}" /></label>
            <label><span data-i18n="width">Largura</span><input id="frameWidth" type="number" min="${MIN_NUMERIC_INPUT}" value="${DEFAULT_GRID.frameWidth}" /></label>
            <label><span data-i18n="height">Altura</span><input id="frameHeight" type="number" min="${MIN_NUMERIC_INPUT}" value="${DEFAULT_GRID.frameHeight}" /></label>
          </div>
        </section>

        <section>
          <h2 data-i18n="backgroundAndFigures">Fundo e figuras</h2>
          <div class="control-grid">
            <label><span data-i18n="tolerance">Tolerância</span><input id="detectionThreshold" type="number" min="${MIN_COUNT_INPUT}" max="${MAX_COLOR_CHANNEL}" value="${DEFAULT_DETECTION_THRESHOLD}" /></label>
            <label><span data-i18n="minArea">Área mínima</span><input id="detectionMinArea" type="number" min="${MIN_COUNT_INPUT}" value="${DEFAULT_DETECTION_MIN_AREA}" /></label>
          </div>
          <div class="segmented secondary">
            <button id="coconutVisionBackend" class="active" type="button" data-i18n="coconutVision">Coconut Vision</button>
            <button id="heuristicBackend" type="button" data-i18n="heuristic">Detector leve</button>
          </div>
          <div class="tool-row">
            <button id="sampleBackground" type="button" data-i18n="detectBackground">Detectar fundo</button>
            <button id="detectFigures" type="button" data-i18n="autoFigures">Auto figuras</button>
          </div>
          <div id="backgroundSwatch" class="swatch">rgb(${DEFAULT_BACKGROUND_COLOR.r}, ${DEFAULT_BACKGROUND_COLOR.g}, ${DEFAULT_BACKGROUND_COLOR.b})</div>
        </section>
      </aside>

      <section class="canvas-stage">
        <div class="stage-toolbar">
          <strong data-i18n="stage">Viewport</strong>
          <button id="zoomOut" type="button" data-i18n-title="zoomOut">-</button>
          <span id="zoomLabel">100%</span>
          <button id="zoomIn" type="button" data-i18n-title="zoomIn">+</button>
          <label><input id="backgroundPreview" type="checkbox" checked /> <span data-i18n="backgroundPreview">Fundo claro</span></label>
        </div>
        <canvas id="sheetCanvas" width="${SHEET_CANVAS_WIDTH}" height="${SHEET_CANVAS_HEIGHT}"></canvas>
      </section>

      <aside class="inspector">
        <section>
          <h2 data-i18n="inspector">Inspector</h2>
          <div id="frameInfo" class="frame-info">Importe uma imagem para começar.</div>
          <canvas id="previewCanvas" width="${PREVIEW_CANVAS_SIZE}" height="${PREVIEW_CANVAS_SIZE}"></canvas>
          <div class="inspector-actions">
            <button id="deleteFrame" type="button" data-i18n="deleteFrame">Remover frame</button>
          </div>
        </section>
        <section>
          <h2 data-i18n="pipeline">Pipeline</h2>
          <ol id="pipelineList">
            <li data-i18n="pipelineProject">Escolher template</li>
            <li data-i18n="pipelineAsset">Preparar assets</li>
            <li data-i18n="pipelineValidate">Validar frames</li>
            <li data-i18n="pipelineExport">Exportar plano</li>
            <li data-i18n="pipelineRuntime">Integrar runtime</li>
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
