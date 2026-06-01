import type { SlotEvaluationMode, SymbolRole } from '@iluvcoconut/contracts';

export type FrameMode = 'grid' | 'detected';
export type DetectionBackend = 'heuristic' | 'coconutVision';
export type GameProjectType = 'slot' | 'bingo' | 'pachinko' | 'free';
export type StudioLanguage = 'pt' | 'en' | 'es';

export interface CropGrid {
  columns: number;
  rows: number;
  marginX: number;
  marginY: number;
  gapX: number;
  gapY: number;
  frameWidth: number;
  frameHeight: number;
}

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface StudioState {
  image?: HTMLImageElement;
  imageName?: string;
  imageUrl?: string;
  grid: CropGrid;
  zoom: number;
  selectedFrame: number;
  backgroundPreview: boolean;
  frameMode: FrameMode;
  backgroundColor: RgbColor;
  detectionThreshold: number;
  detectionMinArea: number;
  detectionBackend: DetectionBackend;
  detectedFrames: FrameRect[];
  detectionSummary?: DetectionSummary | undefined;
  language: StudioLanguage;
  projectType: GameProjectType;
  selectedJsonPreview: JsonPreviewKind;
  slotLayout: StudioSlotLayout;
  paytable: StudioPaytable;
  symbols: StudioSymbol[];
}

export interface FrameRect {
  index: number;
  column: number;
  row: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CanvasPlacement {
  offsetX: number;
  offsetY: number;
  scale: number;
}

export interface ComponentBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  area: number;
}

export interface DetectionSummary {
  backend: DetectionBackend;
  figureCount: number;
  rowCount: number;
  figuresByRow: number[];
  analysisScale: number;
  elapsedMs: number;
}

export type JsonPreviewKind = 'exportPlan' | 'slotDraft' | 'gameConfig' | 'themeConfig' | 'paytableConfig';

export interface StudioSymbol {
  assetKey: string;
  frameIndex: number;
  id: string;
  label: string;
  order: number;
  role: SymbolRole;
}

export interface StudioSlotLayout {
  cellHeight: number;
  cellWidth: number;
  desktopHeight: number;
  desktopWidth: number;
  mobileHeight: number;
  mobileWidth: number;
  reelGap: number;
  reels: number;
  rowGap: number;
  rows: number;
}

export interface StudioPaytable {
  bonusTriggersAnywhere: boolean;
  evaluation: SlotEvaluationMode;
  highestWinOnlyPerLine: boolean;
  lineBet: number;
  minMatch: number;
  paylines: StudioPayline[];
  scatterPaysAnywhere: boolean;
  selectedPaylineId: string;
  selectedSymbolId: string;
  symbolPays: StudioSymbolPay[];
  wildSubstitutes: boolean;
}

export interface StudioPayline {
  enabled: boolean;
  id: string;
  order: number;
  pattern: number[];
}

export interface StudioSymbolPay {
  payouts: StudioPayout[];
  role: SymbolRole;
  symbolId: string;
}

export interface StudioPayout {
  count: number;
  multiplier: number;
}
