# ILuvCoconut

**ILuvCoconut** é uma slot frontend engine TypeScript, otimizada para jogos de cassino web, com runtime próprio e dois renderers oficiais:

- **Coconut Pixi**: renderer principal, Linux-first, CI/CD-first e produção web.
- **Coconut Cocos**: renderer/editor opcional para equipes que usam Cocos Creator em Windows/macOS.

O objetivo é criar uma factory de slots: novos jogos devem ser criados principalmente por configuração, assets e fixtures, sem duplicar lógica.

## Instalação

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm validate
pnpm rust:test
pnpm dev:pixi
pnpm dev:studio
```

`pnpm quality` executa a validação completa local: TypeScript, ESLint, configs do jogo de exemplo e testes Rust do `coconut-vision`.

Se `pnpm` não estiver instalado globalmente, use `npx -y pnpm@9.15.0 <comando>` ou os atalhos do `Makefile`.

## Ambiente

Dependências de Linux, Windows, Tauri, Rust, Node.js, pnpm e Docker estão documentadas em `docs/19-ambiente-e-dependencias.md`.

Atalhos principais:

```bash
make help
make install
make dev-studio
make free-studio-port
make studio-tauri-linux
make dev-pixi
make quality
```

## Coconut Studio

O Studio é a interface web/local para importar arte bruta, ajustar grid, detectar figuras, revisar frames e exportar plano JSON.

```bash
pnpm dev:studio      # web em http://localhost:5174
pnpm studio:tauri dev # desktop local com Tauri e Coconut Vision
```

O guia completo fica em `docs/18-guia-coconut-studio.md`. Em Linux com Wayland/Hyprland/NVIDIA, prefira `make studio-tauri-linux`.

## Desenvolvimento com Docker

```bash
docker compose up player-pixi
docker compose up studio
```

O player Pixi fica disponível em `http://localhost:3000`.
O Coconut Studio fica disponível em `http://localhost:3002`.

Comandos úteis:

```bash
pnpm docker:dev      # sobe o Vite dev server em container
pnpm docker:quality  # roda lint, typecheck e validate em container
pnpm docker:build    # cria imagem estática de produção
pnpm docker:prod     # serve o build Pixi com Nginx em http://localhost:8080
```

O Compose usa bind mount do código e volumes nomeados para `node_modules`, o que evita misturar dependências instaladas no host com dependências Linux do container. Na primeira subida, o container executa `pnpm install --frozen-lockfile` para popular esses volumes. Esse fluxo funciona tanto em Linux quanto em Windows com Docker Desktop/WSL2.

## Estrutura

```txt
apps/player-pixi      Player web principal com Vite + PixiJS
apps/coconut-studio   Interface web/local para montar slots e tratar assets
apps/player-cocos     Ponto de integração Cocos Creator
packages/*            Core, contratos, render API, renderers, CLI e pipeline
crates/*              Coconut Vision em Rust e CLI de visão
games/fruit-classic   Jogo de exemplo
docs/                 Documentação técnica, CI/CD e boas práticas
raw-assets/           Caixa de entrada local para arte bruta, ignorada pelo Git
```

## Fluxo de assets

```txt
raw-assets/<fonte>/sheet.png
  -> pnpm ilc raw:detect-symbols <input> games/<game-id>/assets/raw/symbols <prefix>
  -> pnpm assets:optimize-image <input> <outputDir> <assetId> [width]
  -> games/<game-id>/assets/optimized/
  -> theme.config.json / manifest
```

`raw:detect-symbols` usa o `coconut-vision` em Rust para detectar figuras por conteúdo e salvar crops PNG em `games/<game-id>/assets/raw/symbols`.

## Qualidade

```bash
pnpm lint       # ESLint TypeScript
pnpm typecheck  # TypeScript project references
pnpm validate   # valida configs do jogo de exemplo
pnpm rust:test  # testes Rust do coconut-vision, CLI e Tauri
pnpm build:pixi # build web oficial Linux-first
pnpm build:studio # build da interface Studio
pnpm quality    # typecheck, lint:ci, validate e rust:test
pnpm assets:inspect-raw # inspeciona raw-assets local
pnpm assets:detect-symbols <input> <outputDir> <namePrefix> [threshold] [minArea] [padding]
pnpm assets:optimize-image <input> <outputDir> <assetId> [width]
```

A esteira principal roda em GitHub Actions com install, typecheck, lint, validação, testes Rust e build Pixi. Em ambientes limpos, `typecheck` roda antes do lint para gerar os artefatos `dist` usados pelos manifests dos pacotes workspace. O Dependabot monitora GitHub Actions, dependências npm/pnpm e Cargo.

## Filosofia

```txt
Tudo que define o jogo fica no Coconut Core.
Tudo que desenha o jogo fica em Coconut Pixi ou Coconut Cocos.
```

## Status

Starter kit inicial. Ele não é um produto final, mas já estabelece a arquitetura, os contratos, a estrutura de pastas e a documentação para iniciar o desenvolvimento.
