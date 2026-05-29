export type SymbolId = string;
export type GameId = string;

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
  scope: 'boot' | 'base' | 'feature' | 'lazy';
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
