# Renderers: PixiJS e Cocos

## Regra de ouro

O core não importa PixiJS, Cocos nem APIs gráficas. Ele só conhece `ICoconutRenderer`.

## PixiJS

PixiJS é o renderer principal do projeto.

Motivos:

- funciona em Linux;
- funciona em Docker/CI;
- usa Vite para build web;
- é leve para jogos 2D;
- possui asset loader moderno, promise-based e cache-aware;
- permite controle fino de performance.

O renderer Pixi deve implementar:

- layers;
- sprite creation;
- text creation;
- reels otimizados;
- symbol pooling;
- timeline player;
- asset loading;
- profiling;
- quality profiles.

Estado atual:

- `apps/player-pixi` carrega `game.config.json` e fixtures via `/games/<game-id>` usando `?game=` e `?fixture=`.
- `@iluvcoconut/core` planeja a timeline e usa `FixtureSpinProvider` para spins mockados.
- `@iluvcoconut/pixi` renderiza reels/celulas reutilizaveis, troca simbolos no stop, destaca posições vencedoras e mostra textos de win/big win.
- `?debug=1` habilita HUD/diagnostico inicial no player.

## Cocos

Cocos é um renderer/editor opcional.

Ele deve ser usado quando a equipe precisa de:

- editor visual;
- composição de cenas;
- prefabs;
- animações no Creator;
- workflow artístico baseado em Cocos.

O Cocos não deve ser dono da lógica. Componentes Cocos devem ser adaptadores finos para o Coconut Core.

## Compatibilidade de ambiente

```txt
Linux:
  - Pixi
  - Core
  - CLI
  - Vite
  - Playwright/CI

Windows/macOS:
  - Pixi
  - Core
  - CLI
  - Cocos Creator opcional
```

## Build

Pixi é o build oficial Linux-first. Cocos pode ter build separado em runners Windows/macOS usando a CLI do Cocos Creator.
