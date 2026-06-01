# Roadmap

## MVP 0.1

- Monorepo TypeScript.
- Workspace Rust inicial.
- Contratos iniciais.
- Renderer API.
- Core runtime.
- Presentation timeline.
- Pixi renderer inicial.
- Cocos adapter placeholder.
- CLI inicial.
- Coconut Vision inicial para detecção/crop de símbolos.
- Jogo `fruit-classic`.
- Documentação técnica.

## MVP 0.2

- Symbol pooling real.
- Reels visuais reais no Pixi.
- Player Pixi carregando `games/<game-id>` e fixtures por query string.
- Asset manifest gerado em arquivo.
- SDD de montagem de slots, paytable e runtime como guia de implementacao.
- Preview JSON no Studio para `game.config`, `theme.config` e `paytable.config`.
- Symbol manager inicial a partir dos frames detectados.
- Editor inicial de grade/resolucao de slot.
- Editor inicial de paytable demo com payouts, regras e paylines.
- Fixtures reais para Coconut Vision com casos `8/8/9`, fundo sólido e fundo gradiente.
- Debug overlay de detecção/crop no Studio.
- Fixture selector.
- Debug overlay.
- Layout responsivo.
- Validação de fixtures.

## MVP 0.3

- Cocos adapter funcional.
- Exportação de assets para Cocos.
- Build Pixi completo.
- Playwright smoke tests.
- Performance budgets.

## MVP 0.4

- Paylines visuais.
- Editor avancado de paytable no Studio, incluindo duplicacao visual de linhas e preview de resultado.
- Avaliador demo de paylines no Coconut Core.
- Big win presenter.
- Audio manager.
- Quality profiles.
- Lazy loading de features.

## MVP 1.0

- Slot 5x3 production-ready.
- Factory CLI completa.
- Asset pipeline completo.
- Coconut Vision com métricas, debug masks e regressão visual.
- CI/CD staging/prod.
- Documentação de criação de novos jogos.
