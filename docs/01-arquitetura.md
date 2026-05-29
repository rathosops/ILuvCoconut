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
