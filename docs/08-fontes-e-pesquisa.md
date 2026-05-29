# Fontes e pesquisa

Este starter kit foi estruturado a partir de documentação oficial e decisões discutidas no desenho do projeto.

## PixiJS

- PixiJS é descrito como uma engine HTML5 com renderizador 2D WebGL flexível e rápido.
- A arquitetura v8 usa renderer que exibe a scene graph e pode usar WebGPU ou WebGL.
- `Assets` é promise-based, cache-aware e extensível.
- As recomendações de performance incluem spritesheets, redução de complexidade de cena, atenção à ordem de renderização e configurações como `antialias: false` em dispositivos mais lentos.

## Cocos Creator

- Cocos Creator suporta Asset Bundles para dividir recursos e carregar sob demanda, reduzindo o carregamento inicial.
- A publicação por linha de comando suporta builds e bundle builds com `configPath`.
- Cocos Creator ainda pode exigir ambiente GUI para automação em Jenkins/CI, o que reforça manter Pixi como pipeline principal Linux-first.
- TypeScript no Cocos possui particularidades de configuração, então o core deve ficar fora do projeto Cocos e ser consumido via adapter.

## TypeScript

- O projeto usa `strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noImplicitOverride` e `forceConsistentCasingInFileNames` para reduzir bugs em contratos compartilhados.

## Vite

- Vite gera bundles de produção para hosting estático e possui tratamento próprio de assets com hashing quando caminhos são analisáveis estaticamente.

## Decisão final

PixiJS é o renderer principal de produção e Linux/CI. Cocos Creator é renderer/editor opcional. O ILuvCoconut Core é dono da definição do jogo.
