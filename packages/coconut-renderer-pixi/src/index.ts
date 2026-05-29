import { Application, Assets, Container, Sprite, Text, Texture } from 'pixi.js';
import type { CoconutAssetManifest } from '@iluvcoconut/contracts';
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
  constructor(public readonly id: string, public readonly node: Container) {}
  get x(): number { return this.node.x; }
  set x(value: number) { this.node.x = value; }
  get y(): number { return this.node.y; }
  set y(value: number) { this.node.y = value; }
  async spin(durationMs: number): Promise<void> { await new Promise((resolve) => setTimeout(resolve, durationMs)); }
  async stop(_finalSymbols: string[], delayMs: number): Promise<void> { await new Promise((resolve) => setTimeout(resolve, delayMs)); }
  destroy(): void { this.node.destroy({ children: true }); }
}

export class PixiCoconutRenderer implements ICoconutRenderer {
  private app?: Application;
  private readonly layers = new Map<LayerId, PixiContainerAdapter>();
  private readonly reels = new Map<string, PixiReelAdapter>();
  private readonly loadedAssetIds = new Set<string>();
  private quality: QualityProfile = 'high';

  async init(options: CoconutRendererInitOptions): Promise<void> {
    this.quality = options.quality ?? 'high';
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
    const adapter = new PixiReelAdapter(options.id, reelNode);
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
        case 'COUNT_UP_WIN':
        case 'HIGHLIGHT_WIN':
        case 'SHOW_BIG_WIN':
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
  getStats(): CoconutRenderStats { return { texturesLoaded: this.loadedAssetIds.size, pooledSymbols: 0 }; }
  destroy(): void { this.app?.destroy(true); }
}
