# Arquitetura

## Princípio

O jogo deve ser escrito uma vez no Coconut Core e renderizado por PixiJS ou Cocos.

```txt
Game Config + Theme Config + Fixtures
              |
              v
        Coconut Core
              |
       Renderer API comum
        /              \
Coconut Pixi       Coconut Cocos
```

## Pacotes

| Pacote | Responsabilidade |
|---|---|
| `@iluvcoconut/contracts` | Tipos compartilhados: config, spin, win, assets |
| `@iluvcoconut/core` | Runtime, FSM, timeline, apresentação semântica |
| `@iluvcoconut/renderer-api` | Interface comum entre core e renderers |
| `@iluvcoconut/pixi` | Implementação PixiJS |
| `@iluvcoconut/cocos` | Contrato/adapters Cocos |
| `@iluvcoconut/asset-pipeline` | Manifest, validação e pipeline de assets |
| `@iluvcoconut/cli` | Comandos `ilc` |
| `@iluvcoconut/test-tools` | Testes, fixtures, smoke e validações |

## Coconut Vision

O projeto passa a adotar `coconut-vision` como nucleo Rust compartilhado para deteccao e crop de figuras em assets brutos.

```txt
Coconut Studio (TypeScript)
      |
      v
Tauri command
      |
      v
coconut-vision (Rust)
      ^
      |
coconut-vision-cli / ilc raw:detect-symbols
```

O detector TypeScript do Studio continua sendo o caminho de preview rapido. O `coconut-vision` sera o caminho de producao para deteccao reprodutivel, batch, crop final e testes isolados. A decisao completa esta em `docs/17-sdd-coconut-vision.md`.

## Runtime

O `SlotRuntime` coordena:

1. boot;
2. carregamento de assets;
3. criação de cena base;
4. requisição de spin ao `SpinProvider`;
5. planejamento de timeline;
6. execução da timeline pelo renderer;
7. retorno ao estado idle.

## State Machine

Estados iniciais:

```txt
boot
loading
idle
spinRequested
spinning
presentingWin
settled
error
```

Essa máquina deve crescer com cuidado. Estados financeiros ou de settlement real pertencem ao backend/RGS futuro; o frontend deve representar apenas estados visuais e interativos.
