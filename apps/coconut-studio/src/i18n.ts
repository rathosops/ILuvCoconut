/* eslint-disable max-lines */
import type { GameProjectType, StudioLanguage } from './types';

type TranslationKey =
  | 'appSubtitle'
  | 'assetPrefix'
  | 'autoFigures'
  | 'backgroundAndFigures'
  | 'backgroundPreview'
  | 'bingoDescription'
  | 'bingoType'
  | 'bonusAnywhere'
  | 'columns'
  | 'coconutVision'
  | 'deleteFrame'
  | 'detectBackground'
  | 'enabled'
  | 'evaluation'
  | 'exportPlan'
  | 'frame'
  | 'figures'
  | 'freeDescription'
  | 'freeType'
  | 'gameConfig'
  | 'gameId'
  | 'gameType'
  | 'grid'
  | 'gridMode'
  | 'height'
  | 'highestOnly'
  | 'heuristic'
  | 'importImage'
  | 'inspector'
  | 'jsonPreview'
  | 'language'
  | 'lineBet'
  | 'manualGrid'
  | 'marginX'
  | 'marginY'
  | 'minMatch'
  | 'minArea'
  | 'newProject'
  | 'pachinkoDescription'
  | 'pachinkoType'
  | 'payline'
  | 'paylinePattern'
  | 'paytable'
  | 'pipeline'
  | 'pipelineAsset'
  | 'pipelineExport'
  | 'pipelineProject'
  | 'pipelineRuntime'
  | 'pipelineValidate'
  | 'project'
  | 'resetPaylines'
  | 'rows'
  | 'scatterAnywhere'
  | 'slotDescription'
  | 'slotDraft'
  | 'slotType'
  | 'symbolId'
  | 'symbolLabel'
  | 'symbolManager'
  | 'symbolPayouts'
  | 'symbolRole'
  | 'stage'
  | 'tolerance'
  | 'width'
  | 'wildSubstitutes'
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
    bonusAnywhere: 'Bonus em qualquer posição',
    coconutVision: 'Coconut Vision',
    columns: 'Colunas',
    deleteFrame: 'Remover frame',
    detectBackground: 'Detectar fundo',
    enabled: 'Ativa',
    evaluation: 'Avaliação',
    exportPlan: 'Exportar plano',
    frame: 'Frame',
    figures: 'Figuras',
    freeDescription: 'Projeto sem preset rígido para protótipos e ferramentas internas.',
    freeType: 'Livre',
    gameConfig: 'Game config',
    gameId: 'Jogo',
    gameType: 'Tipo de jogo',
    grid: 'Grid',
    gridMode: 'Grid',
    height: 'Altura',
    highestOnly: 'Maior prêmio por linha',
    heuristic: 'Detector leve',
    importImage: 'Importar imagem',
    inspector: 'Inspector',
    jsonPreview: 'JSON',
    language: 'Idioma',
    lineBet: 'Aposta linha',
    manualGrid: 'Grid manual',
    marginX: 'Margem X',
    marginY: 'Margem Y',
    minMatch: 'Mín. match',
    minArea: 'Área mínima',
    newProject: 'Novo projeto',
    pachinkoDescription: 'Pinos, física, zonas de prêmio e multiplicadores como base.',
    pachinkoType: 'Pachinko',
    payline: 'Linha',
    paylinePattern: 'Padrão da linha',
    paytable: 'Paytable',
    pipeline: 'Pipeline',
    pipelineAsset: 'Preparar assets',
    pipelineExport: 'Exportar plano',
    pipelineProject: 'Escolher template',
    pipelineRuntime: 'Integrar runtime',
    pipelineValidate: 'Validar frames',
    project: 'Projeto',
    resetPaylines: 'Resetar linhas',
    rows: 'Linhas',
    scatterAnywhere: 'Scatter em qualquer posição',
    slotDescription: 'Rolos, símbolos, paytable, linhas, animações e assets de slot.',
    slotDraft: 'Slot draft',
    slotType: 'Slot',
    symbolId: 'ID',
    symbolLabel: 'Nome',
    symbolManager: 'Símbolo',
    symbolPayouts: 'Prêmios por símbolo',
    symbolRole: 'Papel',
    stage: 'Viewport',
    tolerance: 'Tolerância',
    width: 'Largura',
    wildSubstitutes: 'Wild substitui',
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
    bonusAnywhere: 'Bonus anywhere',
    coconutVision: 'Coconut Vision',
    columns: 'Columns',
    deleteFrame: 'Remove frame',
    detectBackground: 'Detect background',
    enabled: 'Enabled',
    evaluation: 'Evaluation',
    exportPlan: 'Export plan',
    frame: 'Frame',
    figures: 'Figures',
    freeDescription: 'No strict preset, useful for prototypes and internal tools.',
    freeType: 'Free',
    gameConfig: 'Game config',
    gameId: 'Game',
    gameType: 'Game type',
    grid: 'Grid',
    gridMode: 'Grid',
    height: 'Height',
    highestOnly: 'Highest win per line',
    heuristic: 'Light detector',
    importImage: 'Import image',
    inspector: 'Inspector',
    jsonPreview: 'JSON',
    language: 'Language',
    lineBet: 'Line bet',
    manualGrid: 'Manual grid',
    marginX: 'Margin X',
    marginY: 'Margin Y',
    minMatch: 'Min. match',
    minArea: 'Min area',
    newProject: 'New project',
    pachinkoDescription: 'Pins, physics, prize zones, and multipliers as the base.',
    pachinkoType: 'Pachinko',
    payline: 'Line',
    paylinePattern: 'Line pattern',
    paytable: 'Paytable',
    pipeline: 'Pipeline',
    pipelineAsset: 'Prepare assets',
    pipelineExport: 'Export plan',
    pipelineProject: 'Choose template',
    pipelineRuntime: 'Integrate runtime',
    pipelineValidate: 'Validate frames',
    project: 'Project',
    resetPaylines: 'Reset lines',
    rows: 'Rows',
    scatterAnywhere: 'Scatter anywhere',
    slotDescription: 'Reels, symbols, paytable, lines, animations, and slot assets.',
    slotDraft: 'Slot draft',
    slotType: 'Slot',
    symbolId: 'ID',
    symbolLabel: 'Name',
    symbolManager: 'Symbol',
    symbolPayouts: 'Symbol payouts',
    symbolRole: 'Role',
    stage: 'Viewport',
    tolerance: 'Tolerance',
    width: 'Width',
    wildSubstitutes: 'Wild substitutes',
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
    bonusAnywhere: 'Bonus en cualquier posición',
    coconutVision: 'Coconut Vision',
    columns: 'Columnas',
    deleteFrame: 'Eliminar frame',
    detectBackground: 'Detectar fondo',
    enabled: 'Activa',
    evaluation: 'Evaluación',
    exportPlan: 'Exportar plan',
    frame: 'Frame',
    figures: 'Figuras',
    freeDescription: 'Proyecto sin preset rígido para prototipos y herramientas internas.',
    freeType: 'Libre',
    gameConfig: 'Game config',
    gameId: 'Juego',
    gameType: 'Tipo de juego',
    grid: 'Grid',
    gridMode: 'Grid',
    height: 'Altura',
    highestOnly: 'Mayor premio por línea',
    heuristic: 'Detector ligero',
    importImage: 'Importar imagen',
    inspector: 'Inspector',
    jsonPreview: 'JSON',
    language: 'Idioma',
    lineBet: 'Apuesta línea',
    manualGrid: 'Grid manual',
    marginX: 'Margen X',
    marginY: 'Margen Y',
    minMatch: 'Mín. match',
    minArea: 'Área mínima',
    newProject: 'Nuevo proyecto',
    pachinkoDescription: 'Pines, física, zonas de premio y multiplicadores como base.',
    pachinkoType: 'Pachinko',
    payline: 'Línea',
    paylinePattern: 'Patrón de línea',
    paytable: 'Paytable',
    pipeline: 'Pipeline',
    pipelineAsset: 'Preparar assets',
    pipelineExport: 'Exportar plan',
    pipelineProject: 'Elegir template',
    pipelineRuntime: 'Integrar runtime',
    pipelineValidate: 'Validar frames',
    project: 'Proyecto',
    resetPaylines: 'Resetear líneas',
    rows: 'Filas',
    scatterAnywhere: 'Scatter en cualquier posición',
    slotDescription: 'Rodillos, símbolos, paytable, líneas, animaciones y assets de slot.',
    slotDraft: 'Slot draft',
    slotType: 'Slot',
    symbolId: 'ID',
    symbolLabel: 'Nombre',
    symbolManager: 'Símbolo',
    symbolPayouts: 'Premios por símbolo',
    symbolRole: 'Rol',
    stage: 'Viewport',
    tolerance: 'Tolerancia',
    width: 'Ancho',
    wildSubstitutes: 'Wild sustituye',
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
