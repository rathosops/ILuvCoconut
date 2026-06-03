<div align="center">

# 🥥 ILuvCoconut

**Engine TypeScript para jogos de cassino na web — uma _factory_ de slots.**

Crie jogos por configuração, assets e fixtures, sem duplicar lógica. Runtime próprio,
renderers oficiais em PixiJS e Cocos, e um editor visual (Coconut Studio) no estilo Godot.

</div>

---

## O que é

ILuvCoconut é uma engine de frontend para produção em massa de slots web. Não é um jogo:
é uma base reutilizável para criar muitos jogos, com variações de tema, grade, paytable,
animação e apresentação. A arquitetura é focada em slots hoje, mas preparada para crescer
(bingo, pachinko, projetos livres) sem reescrever o núcleo.

A engine cuida do **frontend**: runtime, renderização, cenas/reels/símbolos, configuração de
jogos, assets/manifests, detecção de símbolos, fixtures, build web e QA visual. Ela **não**
cuida (ainda) de RGS, wallet, autenticação, RNG real ou liquidação — essas partes entram no
futuro por contratos (`SpinProvider`), sem reescrever o frontend.

## Destaques

- **Factory de slots** — novos jogos saem de `game.config`, `theme.config`, `paytable.config`,
  assets e fixtures. Lógica não se duplica.
- **Renderers oficiais** — **Coconut Pixi** (principal, web/Linux-first, CI/CD) e **Coconut
  Cocos** (opcional, editor visual em Windows/macOS).
- **Coconut Studio** — editor visual em React + Vite estilo Godot: launcher de projetos,
  criação por tipo de jogo, importação de arte, detecção de figuras, montagem de reels,
  paytable, prévia jogável e exportação das configs.
- **Coconut Vision** — detecção de figuras por conteúdo em **Rust** (via Tauri/CLI), com
  fallback heurístico leve no navegador.
- **Qualidade embutida** — TypeScript estrito, ESLint (arquivos ≤300 linhas, sem números
  mágicos na lógica), testes Rust e validação de configs no CI.

## Filosofia

```txt
Tudo que define o jogo fica no Coconut Core.
Tudo que desenha o jogo fica em Coconut Pixi ou Coconut Cocos.
```

## Arquitetura

```txt
ILuvCoconut Core         define estado, contratos, timeline, layout, assets e eventos
   ├── Coconut Pixi      desenha com PixiJS (WebGL/WebGPU) — renderer principal
   └── Coconut Cocos     desenha com Cocos Creator — opcional

Coconut Studio           autoria visual: arte -> símbolos -> reels -> paytable -> configs
Coconut Vision (Rust)    detecção de figuras por conteúdo para o Studio e o pipeline
```

| Caminho | Papel |
| --- | --- |
| `apps/player-pixi` | Player web principal (Vite + PixiJS) |
| `apps/coconut-studio` | Editor de autoria (React + Vite, shell Tauri opcional) |
| `apps/player-cocos` | Ponto de integração com Cocos Creator |
| `packages/coconut-core` | Runtime, estado, timeline |
| `packages/coconut-contracts` | Tipos e contratos compartilhados |
| `packages/coconut-renderer-api` | Interface comum core ↔ renderers |
| `packages/coconut-renderer-pixi` / `-cocos` | Implementações de render |
| `packages/coconut-asset-pipeline` | Manifests e validação de assets |
| `packages/coconut-cli` | CLI `ilc` (validate, preview, assets) |
| `crates/coconut-vision` | Detecção de figuras em Rust |
| `games/fruit-classic` | Jogo de exemplo |
| `docs/` | Documentação técnica e guias |

## Início rápido

Pré-requisitos (Linux/Windows/macOS): Node.js, **pnpm 9+**, Rust (para Coconut Vision/Tauri).
Detalhes em [`docs/19-ambiente-e-dependencias.md`](docs/19-ambiente-e-dependencias.md).

```bash
pnpm install          # instala o workspace
pnpm quality          # typecheck + lint + validação de configs + testes Rust
pnpm dev:studio       # Coconut Studio em http://localhost:5174
pnpm dev:pixi         # Player Pixi em http://localhost:5173
```

Sem `pnpm` global? Use `npx -y pnpm@9.15.0 <comando>` ou os atalhos do `Makefile`
(`make help`, `make install`, `make dev-studio`, `make dev-pixi`, `make quality`,
`make studio-tauri-linux`).

## Coconut Studio

Editor visual de autoria (React + Vite). Cria um projeto, importa arte, detecta figuras como
símbolos, monta os reels, edita a paytable demo, testa uma prévia jogável e exporta as configs
JSON. O editor tem launcher, modos Reels/Assets/Paytable/Preview, árvore de cena, inspector e
painel inferior, com temas e idioma de projeto.

```bash
pnpm dev:studio        # web em http://localhost:5174
pnpm studio:tauri dev  # desktop local com Tauri + Coconut Vision (detecção em Rust)
```

A detecção por conteúdo (Coconut Vision/Rust) roda no app Tauri; no navegador, usa-se o
detector leve. Em Linux com Wayland/Hyprland/NVIDIA, prefira `make studio-tauri-linux`.

Guia completo: [`docs/18-guia-coconut-studio.md`](docs/18-guia-coconut-studio.md) ·
how-tos: [`docs/studio/`](docs/studio/) · arquitetura:
[`docs/13-coconut-studio.md`](docs/13-coconut-studio.md).

## Fluxo de assets

```txt
raw-assets/<fonte>/sheet.png
  -> pnpm ilc raw:detect-symbols <input> games/<game-id>/assets/raw/symbols <prefix>
  -> pnpm assets:optimize-image <input> <outputDir> <assetId> [width]
  -> games/<game-id>/assets/optimized/
  -> theme.config.json / manifest
```

`raw:detect-symbols` usa o `coconut-vision` (Rust) para detectar figuras por conteúdo e salvar
crops PNG. `raw-assets/` é uma caixa de entrada local, ignorada pelo Git.

## Desenvolvimento com Docker

```bash
docker compose up player-pixi   # player em http://localhost:3000
docker compose up studio        # studio em http://localhost:3002
pnpm docker:dev                 # Vite dev server em container
pnpm docker:quality             # lint + typecheck + validate em container
pnpm docker:build               # imagem estática de produção
pnpm docker:prod                # serve o build Pixi com Nginx em http://localhost:8080
```

O Compose usa bind mount do código e volumes nomeados para `node_modules`, evitando misturar
dependências do host com as do container Linux. Funciona em Linux e em Windows com Docker
Desktop/WSL2.

## Qualidade e CI

```bash
pnpm typecheck    # TypeScript (project references)
pnpm lint         # ESLint (TS + TSX)
pnpm validate     # valida configs do jogo de exemplo
pnpm rust:test    # testes Rust (coconut-vision, CLI, Tauri)
pnpm build:pixi   # build web oficial Linux-first
pnpm build:studio # build do Coconut Studio
pnpm quality      # typecheck + lint:ci + validate + testes Rust
```

A esteira roda em GitHub Actions: install, typecheck, lint, validação, testes Rust e build
Pixi. Em ambientes limpos, `typecheck` roda antes do lint para gerar os `dist` usados pelos
manifests do workspace. O Dependabot monitora GitHub Actions, npm/pnpm e Cargo.

## Documentação

Comece pela [`docs/00-visao-geral.md`](docs/00-visao-geral.md).

**Fundamentos**
- [00 · Visão geral](docs/00-visao-geral.md)
- [01 · Arquitetura](docs/01-arquitetura.md)
- [02 · Renderers Pixi e Cocos](docs/02-renderers-pixi-cocos.md)
- [06 · Configuração de jogos](docs/06-configuracao-de-jogos.md)
- [07 · Roadmap](docs/07-roadmap.md)

**Assets e performance**
- [04 · Assets e bundles](docs/04-assets-e-bundles.md)
- [11 · Pipeline de assets brutos](docs/11-pipeline-de-assets-brutos.md)
- [03 · Performance web](docs/03-performance-web.md)
- [12 · Performance de assets web](docs/12-performance-assets-web.md)

**Coconut Studio**
- [13 · Arquitetura do Studio](docs/13-coconut-studio.md)
- [18 · Guia do Studio](docs/18-guia-coconut-studio.md)
- [studio/ · How-tos](docs/studio/)
- [16 · SDD detecção de figuras](docs/16-sdd-deteccao-figuras-coconut-studio.md)
- [17 · SDD Coconut Vision (Rust)](docs/17-sdd-coconut-vision.md)
- [20 · SDD montagem de slots, paytable e runtime](docs/20-sdd-montagem-slots-paytable-runtime.md)

**Engenharia**
- [10 · Boas práticas](docs/10-boas-praticas.md)
- [14 · Organização TypeScript](docs/14-organizacao-typescript.md)
- [05 · CI/CD](docs/05-cicd.md)
- [19 · Ambiente e dependências](docs/19-ambiente-e-dependencias.md)
- [08 · Fontes e pesquisa](docs/08-fontes-e-pesquisa.md) · [09 · Links de referência](docs/09-links-de-referencia.md)

## Contribuindo

1. `pnpm install` e rode `pnpm quality` antes de abrir um PR — ele precisa passar limpo
   (`lint:ci` usa `--max-warnings=0`).
2. Mantenha os limites de organização: arquivos ≤300 linhas, funções ≤90, sem números mágicos
   na lógica (`docs/14-organizacao-typescript.md`).
3. Para novos jogos, prefira configuração/assets/fixtures a código novo.
4. Commits seguem o padrão do histórico (`feature:`, `fix:`, `chore:`, `docs:`).

## Status e licença

Starter kit em evolução: já estabelece arquitetura, contratos, estrutura de pastas e
documentação. O projeto caminha para ser **open-source**; a licença será definida antes da
publicação pública. Até lá, trate o conteúdo como proprietário do autor.
