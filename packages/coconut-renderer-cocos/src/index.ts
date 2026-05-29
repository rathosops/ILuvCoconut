import type { CoconutAssetManifest } from '@iluvcoconut/contracts';
import type {
  CoconutRendererInitOptions,
  CoconutRenderStats,
  CoconutReelOptions,
  CoconutSpriteOptions,
  CoconutTextOptions,
  CoconutViewport,
  ICoconutContainer,
  ICoconutReel,
  ICoconutRenderer,
  ICoconutSprite,
  ICoconutText,
  LayerId,
  PresentationTimeline,
  QualityProfile
} from '@iluvcoconut/renderer-api';

/**
 * Adapter placeholder para Cocos Creator.
 * A implementação real deve viver dentro do projeto Cocos, onde o módulo `cc` está disponível.
 * Este pacote existe para manter a API, contratos e documentação sincronizados com Pixi.
 */
export class CocosCoconutRenderer implements ICoconutRenderer {
  async init(_options: CoconutRendererInitOptions): Promise<void> {}
  async loadAssets(_manifest: CoconutAssetManifest): Promise<void> {}
  async unloadAssets(_scope: 'boot' | 'base' | 'feature' | 'lazy'): Promise<void> {}
  createLayer(_id: LayerId): ICoconutContainer { throw new Error('Cocos layer adapter must be implemented inside apps/player-cocos.'); }
  createSprite(_options: CoconutSpriteOptions): ICoconutSprite { throw new Error('Cocos sprite adapter must be implemented inside apps/player-cocos.'); }
  createText(_options: CoconutTextOptions): ICoconutText { throw new Error('Cocos text adapter must be implemented inside apps/player-cocos.'); }
  createReel(_options: CoconutReelOptions): ICoconutReel { throw new Error('Cocos reel adapter must be implemented inside apps/player-cocos.'); }
  async playTimeline(_timeline: PresentationTimeline): Promise<void> {}
  playSound(_soundId: string): void {}
  setQualityProfile(_profile: QualityProfile): void {}
  resize(_viewport: CoconutViewport): void {}
  getStats(): CoconutRenderStats { return {}; }
  destroy(): void {}
}
