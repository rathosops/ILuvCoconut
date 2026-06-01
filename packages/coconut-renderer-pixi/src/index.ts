/* eslint-disable max-lines, no-magic-numbers */
import { Application, Assets, Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
import type { CoconutAssetManifest, SymbolId, SymbolPosition } from '@iluvcoconut/contracts';
import type {
  CoconutRendererInitOptions,
  CoconutRenderStats,
  CoconutReelOptions,
  CoconutSpriteOptions,
  CoconutTextOptions,
  CoconutViewport,
  ICoconutContainer,
  ICoconutDisplayObject,
  ICoconutReel,
  ICoconutRenderer,
  ICoconutSprite,
  ICoconutText,
  LayerId,
  PresentationTimeline,
  QualityProfile
} from '@iluvcoconut/renderer-api';

const REEL_CELL_GAP = 12;
const REEL_BACKGROUND_ALPHA = 0.82;
const REEL_SPIN_ALPHA = 0.35;
const REEL_IDLE_ALPHA = 1;
const REEL_CELL_RADIUS = 10;
const HALF = 0.5;
const WIN_STROKE_WIDTH = 4;
const WIN_STROKE_RADIUS = 10;
const WIN_LINE_DURATION_FALLBACK_MS = 600;
const BIG_WIN_FONT_SIZE = 54;
const WIN_TEXT_FONT_SIZE = 24;
const BIG_WIN_Y_RATIO = 0.18;
const SYMBOL_LABEL_PART_LENGTH = 3;
const SYMBOL_HASH_MULTIPLIER = 31;
const SYMBOL_FALLBACK_COLOR = 0xffffff;
const SYMBOL_PALETTE = [0xff5e5b, 0xffd166, 0x5ed58a, 0x4dabf7, 0xc77dff, 0xf783ac, 0x63e6be] as const;

class PixiContainerAdapter implements ICoconutContainer {
  visible = true;
  constructor(public readonly id: string, public readonly node: Container) {}
  get x(): number { return this.node.x; }
  set x(value: number) { this.node.x = value; }
  get y(): number { return this.node.y; }
  set y(value: number) { this.node.y = value; }
  add(child: ICoconutDisplayObject): void {
    const maybePixi = child as unknown as { node?: Container };
    if (maybePixi.node) this.node.addChild(maybePixi.node);
  }
  remove(child: ICoconutDisplayObject): void {
    const maybePixi = child as unknown as { node?: Container };
    if (maybePixi.node) this.node.removeChild(maybePixi.node);
  }
  destroy(): void { this.node.destroy({ children: true }); }
}

class PixiSpriteAdapter implements ICoconutSprite {
  visible = true;
  constructor(public readonly id: string, public readonly node: Sprite) {}
  get x(): number { return this.node.x; }
  set x(value: number) { this.node.x = value; }
  get y(): number { return this.node.y; }
  set y(value: number) { this.node.y = value; }
  setTexture(textureId: string): void { this.node.texture = Texture.from(textureId); }
  setScale(x: number, y = x): void { this.node.scale.set(x, y); }
  setAlpha(alpha: number): void { this.node.alpha = alpha; }
  destroy(): void { this.node.destroy(); }
}

class PixiTextAdapter implements ICoconutText {
  visible = true;
  constructor(public readonly id: string, public readonly node: Text) {}
  get x(): number { return this.node.x; }
  set x(value: number) { this.node.x = value; }
  get y(): number { return this.node.y; }
  set y(value: number) { this.node.y = value; }
  setText(value: string): void { this.node.text = value; }
  destroy(): void { this.node.destroy(); }
}

class PixiReelAdapter implements ICoconutReel {
  visible = true;
  private readonly cells: Text[] = [];
  constructor(
    public readonly id: string,
    public readonly node: Container,
    private readonly options: CoconutReelOptions
  ) {
    this.createCells(options.initialSymbols);
  }
  get x(): number { return this.node.x; }
  set x(value: number) { this.node.x = value; }
  get y(): number { return this.node.y; }
  set y(value: number) { this.node.y = value; }
  getSymbolBounds(position: SymbolPosition): { x: number; y: number; width: number; height: number } {
    return {
      x: this.x,
      y: this.y + position.row * (this.options.symbolHeight + REEL_CELL_GAP),
      width: this.options.symbolWidth,
      height: this.options.symbolHeight
    };
  }
  async spin(durationMs: number): Promise<void> {
    this.node.alpha = REEL_SPIN_ALPHA;
    await wait(durationMs);
  }
  async stop(finalSymbols: SymbolId[], delayMs: number): Promise<void> {
    await wait(delayMs);
    this.setSymbols(finalSymbols);
    this.node.alpha = REEL_IDLE_ALPHA;
  }
  destroy(): void { this.node.destroy({ children: true }); }
  private createCells(symbols: SymbolId[]): void {
    for (let row = 0; row < this.options.rows; row += 1) {
      const y = row * (this.options.symbolHeight + REEL_CELL_GAP);
      const background = new Graphics()
        .roundRect(0, y, this.options.symbolWidth, this.options.symbolHeight, REEL_CELL_RADIUS)
        .fill({ color: 0x10231c, alpha: REEL_BACKGROUND_ALPHA })
        .stroke({ color: 0x315646, alpha: 1, width: 1 });
      const text = new Text({
        text: formatSymbolLabel(symbols[row] ?? 'missing'),
        style: {
          align: 'center',
          fill: getSymbolColor(symbols[row] ?? 'missing'),
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 22,
          fontWeight: '700'
        }
      });
      text.anchor.set(HALF);
      text.x = this.options.symbolWidth / 2;
      text.y = y + this.options.symbolHeight / 2;
      this.cells.push(text);
      this.node.addChild(background, text);
    }
  }
  private setSymbols(symbols: SymbolId[]): void {
    this.cells.forEach((cell, row) => {
      const symbolId = symbols[row] ?? 'missing';
      cell.text = formatSymbolLabel(symbolId);
      cell.style.fill = getSymbolColor(symbolId);
    });
  }
}

export class PixiCoconutRenderer implements ICoconutRenderer {
  private app?: Application;
  private debug = false;
  private readonly layers = new Map<LayerId, PixiContainerAdapter>();
  private readonly reels = new Map<string, PixiReelAdapter>();
  private readonly loadedAssetIds = new Set<string>();
  private quality: QualityProfile = 'high';
  private winText: Text | undefined;

  async init(options: CoconutRendererInitOptions): Promise<void> {
    this.quality = options.quality ?? 'high';
    this.debug = options.debug ?? false;
    this.app = new Application();
    await this.app.init({
      resizeTo: window,
      backgroundAlpha: 0,
      antialias: false,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio, this.quality === 'low' ? 1 : 2),
      preference: 'webgl'
    });
    options.parent?.appendChild(this.app.canvas);
  }

  async loadAssets(manifest: CoconutAssetManifest): Promise<void> {
    for (const asset of manifest.assets) {
      Assets.add({ alias: asset.id, src: asset.src });
    }
    const baseAssetIds = manifest.assets.filter((asset) => asset.scope === 'boot' || asset.scope === 'base').map((asset) => asset.id);
    if (baseAssetIds.length === 0) return;
    await Assets.load(baseAssetIds);
    for (const assetId of baseAssetIds) {
      this.loadedAssetIds.add(assetId);
    }
  }

  async unloadAssets(_scope: 'boot' | 'base' | 'feature' | 'lazy'): Promise<void> {
    // Intencionalmente conservador: em slots, descarregamentos devem ocorrer em transições seguras.
  }

  createLayer(id: LayerId): ICoconutContainer {
    if (!this.app) throw new Error('Pixi renderer not initialized');
    const existing = this.layers.get(id);
    if (existing) return existing;
    const container = new Container();
    container.label = id;
    this.app.stage.addChild(container);
    const adapter = new PixiContainerAdapter(id, container);
    this.layers.set(id, adapter);
    return adapter;
  }

  createSprite(options: CoconutSpriteOptions): ICoconutSprite {
    const sprite = Sprite.from(options.textureId);
    sprite.x = options.x ?? 0;
    sprite.y = options.y ?? 0;
    const adapter = new PixiSpriteAdapter(options.id, sprite);
    this.createLayer(options.layer ?? 'symbols').add(adapter);
    return adapter;
  }

  createText(options: CoconutTextOptions): ICoconutText {
    const text = new Text({ text: options.text });
    text.x = options.x ?? 0;
    text.y = options.y ?? 0;
    const adapter = new PixiTextAdapter(options.id, text);
    this.createLayer(options.layer ?? 'ui').add(adapter);
    return adapter;
  }

  createReel(options: CoconutReelOptions): ICoconutReel {
    const reelNode = new Container();
    reelNode.x = options.x;
    reelNode.y = options.y;
    const adapter = new PixiReelAdapter(options.id, reelNode, options);
    this.createLayer('reels').add(adapter);
    this.reels.set(options.id, adapter);
    return adapter;
  }

  async playTimeline(timeline: PresentationTimeline): Promise<void> {
    for (const command of timeline.commands) {
      switch (command.type) {
        case 'SPIN_REELS': {
          const reels = command.reelIds
            .map((id) => this.reels.get(id))
            .filter((reel): reel is PixiReelAdapter => reel !== undefined);
          await Promise.all(reels.map((reel) => reel.spin(command.durationMs)));
          break;
        }
        case 'STOP_REEL':
          await this.reels.get(command.reelId)?.stop(command.finalSymbols, command.delayMs);
          break;
        case 'HIGHLIGHT_WIN':
          await this.highlightWin(command.positions, command.durationMs);
          break;
        case 'COUNT_UP_WIN':
          await this.showWinText(`WIN ${command.amount}`, command.durationMs, WIN_TEXT_FONT_SIZE);
          break;
        case 'SHOW_BIG_WIN':
          await this.showWinText(`${command.level.toUpperCase()} WIN ${command.amount}`, WIN_LINE_DURATION_FALLBACK_MS, BIG_WIN_FONT_SIZE);
          break;
        case 'LOCK_INPUT':
        case 'UNLOCK_INPUT':
        case 'PRELOAD_FEATURE_ASSETS':
          break;
        default:
          command satisfies never;
      }
    }
  }

  playSound(_soundId: string): void {}
  setQualityProfile(profile: QualityProfile): void { this.quality = profile; }
  resize(_viewport: CoconutViewport): void {}
  getStats(): CoconutRenderStats { return { texturesLoaded: this.loadedAssetIds.size, pooledSymbols: this.reels.size }; }
  destroy(): void { this.app?.destroy(true); }
  private async highlightWin(positions: SymbolPosition[], durationMs: number): Promise<void> {
    const layer = this.createLayer('winLines') as PixiContainerAdapter;
    const graphics = new Graphics();
    for (const position of positions) {
      const bounds = this.reels.get(`reel-${position.reel}`)?.getSymbolBounds(position);
      if (!bounds) continue;
      graphics
        .roundRect(bounds.x, bounds.y, bounds.width, bounds.height, WIN_STROKE_RADIUS)
        .stroke({ color: 0xffd84f, alpha: 1, width: WIN_STROKE_WIDTH });
    }
    layer.node.addChild(graphics);
    await wait(durationMs);
    graphics.destroy();
  }
  private async showWinText(value: string, durationMs: number, fontSize: number): Promise<void> {
    if (!this.app) return;
    const layer = this.createLayer('ui') as PixiContainerAdapter;
    this.winText?.destroy();
    this.winText = new Text({
      text: value,
      style: {
        align: 'center',
        dropShadow: true,
        fill: 0xffe26a,
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize,
        fontWeight: '900',
        stroke: { color: 0x2b1600, width: 4 }
      }
    });
    this.winText.anchor.set(HALF);
    this.winText.x = this.app.screen.width * HALF;
    this.winText.y = this.app.screen.height * BIG_WIN_Y_RATIO;
    layer.node.addChild(this.winText);
    if (this.debug) console.info('[ILuvCoconut Pixi]', value);
    await wait(durationMs);
    this.winText.destroy();
    this.winText = undefined;
  }
}

function wait(durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

function formatSymbolLabel(symbolId: SymbolId): string {
  return symbolId
    .split(/[._-]+/u)
    .filter(Boolean)
    .map((part) => part.slice(0, SYMBOL_LABEL_PART_LENGTH).toUpperCase())
    .join('\n');
}

function getSymbolColor(symbolId: SymbolId): number {
  let hash = 0;
  for (const char of symbolId) hash = (hash * SYMBOL_HASH_MULTIPLIER + char.charCodeAt(0)) >>> 0;
  return SYMBOL_PALETTE[hash % SYMBOL_PALETTE.length] ?? SYMBOL_FALLBACK_COLOR;
}
