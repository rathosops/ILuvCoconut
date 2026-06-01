import type { CoconutAssetManifest, SpinResult, SymbolId, SymbolPosition } from '@iluvcoconut/contracts';

export type LayerId = 'background' | 'reels' | 'symbols' | 'winLines' | 'particles' | 'ui' | 'modals' | 'debug';
export type QualityProfile = 'ultra' | 'high' | 'medium' | 'low' | 'batterySaver';

export interface CoconutViewport {
  width: number;
  height: number;
  devicePixelRatio: number;
  orientation: 'portrait' | 'landscape';
  safeArea?: { top: number; right: number; bottom: number; left: number };
}

export interface CoconutRendererInitOptions {
  parent?: HTMLElement;
  viewport?: CoconutViewport;
  quality?: QualityProfile;
  debug?: boolean;
}

export interface CoconutRenderStats {
  fps?: number;
  frameMs?: number;
  drawCalls?: number;
  texturesLoaded?: number;
  pooledSymbols?: number;
}

export interface ICoconutDisplayObject {
  id: string;
  x: number;
  y: number;
  visible: boolean;
  destroy(): void;
}

export interface ICoconutContainer extends ICoconutDisplayObject {
  add(child: ICoconutDisplayObject): void;
  remove(child: ICoconutDisplayObject): void;
}

export interface ICoconutSprite extends ICoconutDisplayObject {
  setTexture(textureId: string): void;
  setScale(x: number, y?: number): void;
  setAlpha(alpha: number): void;
}

export interface ICoconutText extends ICoconutDisplayObject {
  setText(value: string): void;
}

export interface CoconutSpriteOptions {
  id: string;
  textureId: string;
  layer?: LayerId;
  x?: number;
  y?: number;
}

export interface CoconutTextOptions {
  id: string;
  text: string;
  layer?: LayerId;
  x?: number;
  y?: number;
}

export interface CoconutReelOptions {
  id: string;
  initialSymbols: SymbolId[];
  rows: number;
  symbolWidth: number;
  symbolHeight: number;
  x: number;
  y: number;
}

export interface ICoconutReel extends ICoconutDisplayObject {
  spin(durationMs: number): Promise<void>;
  stop(finalSymbols: SymbolId[], delayMs: number): Promise<void>;
}

export type PresentationCommand =
  | { type: 'PRELOAD_FEATURE_ASSETS'; featureId: string }
  | { type: 'LOCK_INPUT' }
  | { type: 'SPIN_REELS'; reelIds: string[]; mode: 'normal' | 'turbo' | 'quick'; durationMs: number }
  | { type: 'STOP_REEL'; reelId: string; finalSymbols: SymbolId[]; stopIndex: number; delayMs: number }
  | { type: 'HIGHLIGHT_WIN'; winId: string; positions: SymbolPosition[]; durationMs: number }
  | { type: 'COUNT_UP_WIN'; amount: number; durationMs: number }
  | { type: 'SHOW_BIG_WIN'; level: 'big' | 'mega' | 'epic'; amount: number }
  | { type: 'UNLOCK_INPUT' };

export interface PresentationTimeline {
  result: SpinResult;
  commands: PresentationCommand[];
}

export interface ICoconutRenderer {
  init(options: CoconutRendererInitOptions): Promise<void>;
  loadAssets(manifest: CoconutAssetManifest): Promise<void>;
  unloadAssets(scope: 'boot' | 'base' | 'feature' | 'lazy'): Promise<void>;
  createLayer(id: LayerId): ICoconutContainer;
  createSprite(options: CoconutSpriteOptions): ICoconutSprite;
  createText(options: CoconutTextOptions): ICoconutText;
  createReel(options: CoconutReelOptions): ICoconutReel;
  playTimeline(timeline: PresentationTimeline): Promise<void>;
  playSound(soundId: string): void;
  setQualityProfile(profile: QualityProfile): void;
  resize(viewport: CoconutViewport): void;
  getStats(): CoconutRenderStats;
  destroy(): void;
}
