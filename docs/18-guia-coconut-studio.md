# Guia do Coconut Studio

O Coconut Studio e a ferramenta de autoria do ILuvCoconut. Voce cria um projeto de jogo, importa a arte, transforma figuras detectadas em simbolos, monta os reels, ajusta a paytable, testa uma previa jogavel e exporta as configs para o pipeline.

O frontend e React + Vite + TypeScript. A interface do editor e em pt-BR. O idioma base do projeto (pt/en/es) e uma propriedade do projeto, nao a lingua da interface.

Ele roda de duas formas:

- **Web com Vite**: previa rapida, ajustes visuais e desenvolvimento. Usa o `Detector leve` (heuristica no browser) e mantem projetos recentes no navegador.
- **Desktop com Tauri**: mesma interface, mas habilita o backend Rust `Coconut Vision` para deteccao por conteudo e cria projetos reais em `games/<slug>/`.

## Pre-requisitos

```bash
pnpm install
```

Para o modo desktop, instale Rust e os pre-requisitos do Tauri v2 do seu sistema (no Linux, WebKitGTK). Veja `docs/19-ambiente-e-dependencias.md`.

## Executar na web

```bash
pnpm dev:studio
```

Abre em `http://localhost:5174`. No navegador, `Coconut Vision` nao esta disponivel e a deteccao usa o `Detector leve`.

## Executar no Tauri

```bash
pnpm studio:tauri dev
```

Abre o Studio como app desktop. Habilita `Coconut Vision` e a criacao de projetos em `games/`. Em Linux com Wayland/Hyprland/NVIDIA, prefira `make studio-tauri-linux`.

## Fluxo passo a passo

### 1. Launcher

A tela inicial mostra um grid de cards de projetos recentes. Use a busca e os filtros por tipo (`Todos`, `Slot`, `Bingo`, `Pachinko`) para encontrar um projeto. Clique num card para abrir o editor, ou clique no icone de Configuracoes.

### 2. Novo Projeto

Clique em `Novo Projeto`. No dialogo, defina:

- `Tipo de jogo`: `Slot`, `Bingo`, `Pachinko` ou `Projeto Livre`.
- `Nome`: gera o slug `res://games/<slug>`.
- `Template`.
- `Renderer`: `Pixi` ou `Cocos`.
- `Resolucao`.
- `Idioma base`.

Clique em `Criar projeto` para abrir o editor. Detalhes em `docs/studio/criar-projeto.md`.

### 3. Conhecer o editor

O editor tem:

- Barra superior: voltar, menus, abas de modo (`Reels`, `Assets`, `Paytable`, `Preview`) e os botoes `Salvar`, `Exportar` e `Rodar`.
- Dock esquerdo: a Arvore de Cena (jogo -> Reels, Simbolos, Paytable).
- Centro: o modo ativo.
- Dock direito: o Inspector, contextual a selecao.
- Dock inferior: o BottomPanel com as abas `Simbolos`, `Saida`, `Erros` e `JSON`.
- Barra de status: status, caminho `res://`, grade, RTP estimado e renderer.

### 4. Importar arte e detectar figuras (modo Assets)

O modo Assets e o coracao do Studio. Clique em `Importar` para carregar PNG/WebP, escolha o backend (`Detector leve` no browser ou `Coconut Vision` no Tauri), ajuste os sliders `Tolerancia` e `Area` e clique em `Detectar`. Cada figura detectada vira um simbolo.

Veja `docs/studio/importar-arte.md` e `docs/studio/detectar-figuras.md`.

### 5. Montar os reels (modo Reels)

No modo Reels, clique numa celula da grade reels x rows e use a Paleta de simbolos para pintar. O Inspector de Reels ajusta colunas, linhas, tamanho de celula e gaps. Veja `docs/studio/montar-reels.md`.

### 6. Editar a paytable (modo Paytable)

A tabela mostra premios por simbolo (x3/x4/x5 conforme os reels). Edite multiplicadores, confira o card de RTP estimado e ajuste as regras no Inspector da Paytable. Veja `docs/studio/editar-paytable.md`.

### 7. Testar no Preview (modo Preview)

O modo Preview e um gabinete jogavel de demonstracao com `SPIN`, usando os simbolos reais e saldo/aposta/win simulados. E apenas uma previa de demonstracao no editor; a execucao de producao usa o runtime Pixi (`player-pixi`) e o `FixtureSpinProvider` do Core. Veja `docs/studio/preview.md`.

### 8. Exportar

Clique em `Exportar` para copiar o plano de exportacao (JSON) para a area de transferencia. A aba `JSON` do BottomPanel mostra `Export plan`, `game.config`, `theme.config`, `paytable.config` e o slot draft, derivados via `engine/slotConfigExport`. A aba `Erros` mostra as validacoes reais (gameId, simbolos, paylines, payouts). Veja `docs/studio/exportar-configs.md`.

## Inspector do no "jogo"

Selecione o no do jogo na Arvore de Cena para editar nome, ID, prefixo de asset, renderer e idioma base.

## Configuracoes

Em Configuracoes voce ajusta tema, cor de acento, tipografia, cantos e densidade. Tudo persiste no navegador. Veja `docs/studio/temas-e-aparencia.md`.

## Documentacao relacionada

- How-tos focados: `docs/studio/` (indice em `docs/studio/README.md`).
- Arquitetura do Studio: `docs/13-coconut-studio.md`.
- Montagem de slots, paytable e runtime: `docs/20-sdd-montagem-slots-paytable-runtime.md`.
- Ambiente e dependencias: `docs/19-ambiente-e-dependencias.md`.

## Comandos relacionados

```bash
pnpm dev:studio        # web em http://localhost:5174
pnpm studio:tauri dev  # desktop com Coconut Vision e criacao de projeto
pnpm build:studio      # build web do Studio
```
