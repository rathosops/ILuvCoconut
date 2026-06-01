export type SymbolId = string;
export type GameId = string;
export type GameProjectType = 'slot' | 'bingo' | 'pachinko' | 'free';
export type StudioLanguage = 'pt' | 'en' | 'es';
export type SymbolRole = 'regular' | 'wild' | 'scatter' | 'bonus' | 'multiplier' | 'decorative';
export type OrientationMode = 'portrait' | 'landscape' | 'responsive';
export type SlotPaylinesMode = 'fixed' | 'ways';
export type SlotEvaluationMode = 'leftToRight' | 'rightToLeft' | 'bothWays';

export interface GameConfig {
  id: GameId;
  title: string;
  template: string;
  layout: {
    reels: number;
    rows: number;
    mode: 'paylines' | 'ways' | 'cluster';
  };
  bet: {
    default: number;
    min: number;
    max: number;
    denominations: number[];
  };
  symbols: Array<{
    id: SymbolId;
    type: 'regular' | 'wild' | 'scatter' | 'bonus';
  }>;
  presentation: {
    spinDurationMs: number;
    reelStopDelayMs: number;
    winCycleDelayMs: number;
    turboMode: boolean;
    quickSpin: boolean;
  };
  assetManifest: CoconutAssetManifest;
}

export interface ThemeConfig {
  background: {
    portrait: string;
    landscape: string;
  };
  symbols: Record<SymbolId, string>;
  audio: Record<string, string>;
  ui: Record<string, string>;
}

export interface CoconutAssetManifest {
  gameId: GameId;
  version: string;
  assets: CoconutAsset[];
}

export interface CoconutAsset {
  id: string;
  type: 'image' | 'audio' | 'json' | 'font' | 'atlas' | 'spine';
  src: string;
  variants?: CoconutAssetVariant[];
  scope: 'boot' | 'base' | 'feature' | 'lazy';
}

export interface CoconutAssetVariant {
  format: 'avif' | 'webp' | 'png' | 'jpg' | 'mp3' | 'ogg' | 'opus' | 'm4a';
  src: string;
  mimeType: string;
  width?: number;
  height?: number;
  bytes?: number;
}

export interface SpinRequest {
  gameId: GameId;
  sessionId: string;
  betAmount: number;
  currency: string;
  mode: 'demo' | 'mock' | 'integration';
}

export interface SpinResult {
  roundId: string;
  gameId: GameId;
  betAmount: number;
  matrix: SymbolId[][];
  reelStops?: number[];
  wins: WinResult[];
  totalWin: number;
  balanceAfter?: number;
  features?: FeatureResult[];
  presentation?: SpinPresentationHints;
}

export interface WinResult {
  id: string;
  type: 'line' | 'ways' | 'scatter' | 'bonus' | 'jackpot';
  symbolId: SymbolId;
  amount: number;
  multiplier?: number;
  positions: SymbolPosition[];
  lineIndex?: number;
}

export interface FeatureResult {
  type: 'freeSpins' | 'bonusGame' | 'pick' | 'wheel';
  awarded?: number;
  payload?: unknown;
}

export interface SymbolPosition {
  reel: number;
  row: number;
}

export interface SpinPresentationHints {
  anticipationReels?: number[];
  bigWinLevel?: 'none' | 'big' | 'mega' | 'epic';
  forceDurationMs?: number;
}

export interface FrameRectContract {
  index: number;
  column: number;
  row: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SlotProjectDraft {
  schemaVersion: 1;
  projectType: 'slot';
  gameId: GameId;
  title: string;
  language: StudioLanguage;
  symbols: SymbolDraft[];
  slot: SlotDraft;
  paytable: PaytableDraft;
  theme: ThemeDraft;
  exportPlan: unknown;
}

export interface SymbolDraft {
  id: SymbolId;
  label: string;
  role: SymbolRole;
  order: number;
  frame: FrameRectContract;
  assetKey: string;
  source: {
    imageName: string | null;
    detectionBackend: 'heuristic' | 'coconutVision';
    detectionIndex: number;
  };
  render: {
    layer: 'symbols' | 'symbolEffects' | 'ui';
    anchorX: number;
    anchorY: number;
    fit: 'contain' | 'cover' | 'native';
  };
}

export interface SlotDraft {
  reels: number;
  rows: number;
  visibleRows: number;
  cellWidth: number;
  cellHeight: number;
  reelGap: number;
  rowGap: number;
  spinDirection: 'vertical' | 'horizontal';
  defaultBet: number;
  paylinesMode: SlotPaylinesMode;
  layout: LayoutDraft;
}

export interface LayoutDraft {
  designWidth: number;
  designHeight: number;
  orientation: OrientationMode;
  safeArea: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  breakpoints: LayoutBreakpointDraft[];
}

export interface LayoutBreakpointDraft {
  id: 'mobile' | 'tablet' | 'desktop';
  minWidth: number;
  maxWidth?: number;
  scaleMode: 'fit' | 'fill' | 'fixed';
  reelsRect: { x: number; y: number; width: number; height: number };
  uiSlots: Record<string, { x: number; y: number; width: number; height: number }>;
}

export interface PaytableDraft {
  currencyMode: 'credits';
  lineBet: number;
  paylines: PaylineDraft[];
  symbolPays: SymbolPayDraft[];
  rules: SlotRuleDraft;
}

export interface SymbolPayDraft {
  symbolId: SymbolId;
  role: SymbolRole;
  payouts: Array<{
    count: number;
    multiplier: number;
  }>;
}

export interface PaylineDraft {
  id: string;
  enabled: boolean;
  order: number;
  pattern: number[];
}

export interface SlotRuleDraft {
  evaluation: SlotEvaluationMode;
  minMatch: number;
  wildSubstitutes: boolean;
  scatterPaysAnywhere: boolean;
  bonusTriggersAnywhere: boolean;
  highestWinOnlyPerLine: boolean;
}

export interface ThemeDraft {
  layers: Array<'background' | 'reelFrame' | 'reelMask' | 'symbols' | 'symbolEffects' | 'winLines' | 'ui' | 'modal' | 'debugOverlay'>;
  symbols: Record<SymbolId, {
    asset: string;
    fit: 'contain' | 'cover' | 'native';
    anchor: [number, number];
  }>;
}
