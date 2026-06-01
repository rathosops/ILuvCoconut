import type { GameProjectType, StudioLanguage } from './types';

type TranslationKey =
  | 'appSubtitle'
  | 'assetPrefix'
  | 'autoFigures'
  | 'backgroundAndFigures'
  | 'backgroundPreview'
  | 'bingoDescription'
  | 'bingoType'
  | 'columns'
  | 'coconutVision'
  | 'deleteFrame'
  | 'detectBackground'
  | 'exportPlan'
  | 'frame'
  | 'figures'
  | 'freeDescription'
  | 'freeType'
  | 'gameId'
  | 'gameType'
  | 'grid'
  | 'gridMode'
  | 'height'
  | 'heuristic'
  | 'importImage'
  | 'inspector'
  | 'language'
  | 'manualGrid'
  | 'marginX'
  | 'marginY'
  | 'minArea'
  | 'newProject'
  | 'pachinkoDescription'
  | 'pachinkoType'
  | 'pipeline'
  | 'pipelineAsset'
  | 'pipelineExport'
  | 'pipelineProject'
  | 'pipelineRuntime'
  | 'pipelineValidate'
  | 'project'
  | 'rows'
  | 'slotDescription'
  | 'slotType'
  | 'stage'
  | 'tolerance'
  | 'width'
  | 'workspace'
  | 'zoomIn'
  | 'zoomOut';

type TranslationSet = Record<TranslationKey, string>;

const TRANSLATIONS: Record<StudioLanguage, TranslationSet> = {
  pt: {
    appSubtitle: 'Engine visual para jogos de casino web',
    assetPrefix: 'Prefixo',
    autoFigures: 'Auto figuras',
    backgroundAndFigures: 'Fundo e figuras',
    backgroundPreview: 'Fundo claro',
    bingoDescription: 'Cartelas, bolas, chamadas e estados de vitória por padrão.',
    bingoType: 'Bingo',
    coconutVision: 'Coconut Vision',
    columns: 'Colunas',
    deleteFrame: 'Remover frame',
    detectBackground: 'Detectar fundo',
    exportPlan: 'Exportar plano',
    frame: 'Frame',
    figures: 'Figuras',
    freeDescription: 'Projeto sem preset rígido para protótipos e ferramentas internas.',
    freeType: 'Livre',
    gameId: 'Jogo',
    gameType: 'Tipo de jogo',
    grid: 'Grid',
    gridMode: 'Grid',
    height: 'Altura',
    heuristic: 'Detector leve',
    importImage: 'Importar imagem',
    inspector: 'Inspector',
    language: 'Idioma',
    manualGrid: 'Grid manual',
    marginX: 'Margem X',
    marginY: 'Margem Y',
    minArea: 'Área mínima',
    newProject: 'Novo projeto',
    pachinkoDescription: 'Pinos, física, zonas de prêmio e multiplicadores como base.',
    pachinkoType: 'Pachinko',
    pipeline: 'Pipeline',
    pipelineAsset: 'Preparar assets',
    pipelineExport: 'Exportar plano',
    pipelineProject: 'Escolher template',
    pipelineRuntime: 'Integrar runtime',
    pipelineValidate: 'Validar frames',
    project: 'Projeto',
    rows: 'Linhas',
    slotDescription: 'Rolos, símbolos, paytable, linhas, animações e assets de slot.',
    slotType: 'Slot',
    stage: 'Viewport',
    tolerance: 'Tolerância',
    width: 'Largura',
    workspace: 'Asset Studio',
    zoomIn: 'Aumentar zoom',
    zoomOut: 'Reduzir zoom'
  },
  en: {
    appSubtitle: 'Visual engine for web casino games',
    assetPrefix: 'Prefix',
    autoFigures: 'Auto figures',
    backgroundAndFigures: 'Background and figures',
    backgroundPreview: 'Light background',
    bingoDescription: 'Cards, balls, calls, and win states as the default structure.',
    bingoType: 'Bingo',
    coconutVision: 'Coconut Vision',
    columns: 'Columns',
    deleteFrame: 'Remove frame',
    detectBackground: 'Detect background',
    exportPlan: 'Export plan',
    frame: 'Frame',
    figures: 'Figures',
    freeDescription: 'No strict preset, useful for prototypes and internal tools.',
    freeType: 'Free',
    gameId: 'Game',
    gameType: 'Game type',
    grid: 'Grid',
    gridMode: 'Grid',
    height: 'Height',
    heuristic: 'Light detector',
    importImage: 'Import image',
    inspector: 'Inspector',
    language: 'Language',
    manualGrid: 'Manual grid',
    marginX: 'Margin X',
    marginY: 'Margin Y',
    minArea: 'Min area',
    newProject: 'New project',
    pachinkoDescription: 'Pins, physics, prize zones, and multipliers as the base.',
    pachinkoType: 'Pachinko',
    pipeline: 'Pipeline',
    pipelineAsset: 'Prepare assets',
    pipelineExport: 'Export plan',
    pipelineProject: 'Choose template',
    pipelineRuntime: 'Integrate runtime',
    pipelineValidate: 'Validate frames',
    project: 'Project',
    rows: 'Rows',
    slotDescription: 'Reels, symbols, paytable, lines, animations, and slot assets.',
    slotType: 'Slot',
    stage: 'Viewport',
    tolerance: 'Tolerance',
    width: 'Width',
    workspace: 'Asset Studio',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out'
  },
  es: {
    appSubtitle: 'Engine visual para juegos de casino web',
    assetPrefix: 'Prefijo',
    autoFigures: 'Auto figuras',
    backgroundAndFigures: 'Fondo y figuras',
    backgroundPreview: 'Fondo claro',
    bingoDescription: 'Cartones, bolas, llamadas y estados de victoria como base.',
    bingoType: 'Bingo',
    coconutVision: 'Coconut Vision',
    columns: 'Columnas',
    deleteFrame: 'Eliminar frame',
    detectBackground: 'Detectar fondo',
    exportPlan: 'Exportar plan',
    frame: 'Frame',
    figures: 'Figuras',
    freeDescription: 'Proyecto sin preset rígido para prototipos y herramientas internas.',
    freeType: 'Libre',
    gameId: 'Juego',
    gameType: 'Tipo de juego',
    grid: 'Grid',
    gridMode: 'Grid',
    height: 'Altura',
    heuristic: 'Detector ligero',
    importImage: 'Importar imagen',
    inspector: 'Inspector',
    language: 'Idioma',
    manualGrid: 'Grid manual',
    marginX: 'Margen X',
    marginY: 'Margen Y',
    minArea: 'Área mínima',
    newProject: 'Nuevo proyecto',
    pachinkoDescription: 'Pines, física, zonas de premio y multiplicadores como base.',
    pachinkoType: 'Pachinko',
    pipeline: 'Pipeline',
    pipelineAsset: 'Preparar assets',
    pipelineExport: 'Exportar plan',
    pipelineProject: 'Elegir template',
    pipelineRuntime: 'Integrar runtime',
    pipelineValidate: 'Validar frames',
    project: 'Proyecto',
    rows: 'Filas',
    slotDescription: 'Rodillos, símbolos, paytable, líneas, animaciones y assets de slot.',
    slotType: 'Slot',
    stage: 'Viewport',
    tolerance: 'Tolerancia',
    width: 'Ancho',
    workspace: 'Asset Studio',
    zoomIn: 'Aumentar zoom',
    zoomOut: 'Reducir zoom'
  }
};

const PROJECT_TYPE_DESCRIPTION_KEYS: Record<GameProjectType, TranslationKey> = {
  bingo: 'bingoDescription',
  free: 'freeDescription',
  pachinko: 'pachinkoDescription',
  slot: 'slotDescription'
};

export function translate(language: StudioLanguage, key: TranslationKey): string {
  return TRANSLATIONS[language][key];
}

export function applyTranslations(root: ParentNode, language: StudioLanguage): void {
  root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((element) => {
    const key = element.dataset.i18n as TranslationKey | undefined;
    if (!key) return;
    element.textContent = translate(language, key);
  });

  root.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach((element) => {
    const key = element.dataset.i18nTitle as TranslationKey | undefined;
    if (!key) return;
    element.title = translate(language, key);
  });
}

export function getProjectTypeDescription(language: StudioLanguage, projectType: GameProjectType): string {
  return translate(language, PROJECT_TYPE_DESCRIPTION_KEYS[projectType]);
}
