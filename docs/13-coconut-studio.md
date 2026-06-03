# Coconut Studio

Coconut Studio e a ferramenta de autoria do ILuvCoconut: cria projetos de jogo, trata assets e monta slots visualmente. Ele e leve, separado do player de producao, mas se comporta como uma engine de autoria: projeto, template de jogo, modos, arvore de cena, inspector e pipeline explicito.

## Decisao tecnica

O Studio e um app React + Vite + TypeScript em `apps/coconut-studio`. Roda no navegador durante o desenvolvimento e possui shell Tauri v2 para desktop local.

```txt
React + Vite + TypeScript
  -> src/engine: logica framework-agnostic (deteccao, render, paytable, export)
  -> src/state: hooks React que envolvem o engine
  -> src/editor + src/screens: a UI (launcher, dialogos, modos, docks)
  -> Tauri/Rust: filesystem, criacao de projetos e Coconut Vision
```

Tauri usa Rust no backend e o WebView do sistema operacional: WebView2 no Windows, WebKitGTK no Linux, WKWebView no macOS. Mais leve que Electron, mas exige testes reais por sistema operacional.

## Layout de pastas

```txt
src/main.tsx            entry -> ThemeProvider -> App
src/engine/             logica reutilizada, sem dependencia de React
src/state/              hooks React sobre o engine
src/platform/           descoberta e criacao de projetos (Tauri/web)
src/theme/              temas, acento, tipografia, densidade
src/icons/              Icon.tsx
src/components/         primitivos de UI (Mascot, Logo, SymbolTile, Dialog, ...)
src/screens/            Launcher, NewProjectDialog, Settings
src/editor/             shell do editor, docks e modos
src-tauri/src/main.rs   comandos Rust expostos ao frontend
```

### src/engine (logica framework-agnostic)

Reaproveita o nucleo da versao anterior, sem React:

- `imageDetection.ts`: heuristica leve de deteccao no browser.
- `coconutVision.ts`: ponte para o backend Rust via Tauri.
- `canvasRenderer.ts`: desenho de imagem, overlays e preview.
- `frameMath.ts`: grids, bounding boxes, selecao e posicionamento.
- `frameEditing.ts`: edicao/redimensionamento de frames.
- `paytable.ts`: regras, payouts e paylines.
- `slotLayout.ts`: dimensoes e layout do slot.
- `symbolManager.ts`: gerencia simbolos.
- `slotProjectDraft.ts`: monta o `SlotProjectDraft` e valida.
- `slotConfigExport.ts`: deriva `game.config`, `theme.config` e `paytable.config`.
- `exportPlan.ts`: monta o plano de exportacao JSON.
- `types.ts` e `studioConstants.ts`: tipos e constantes compartilhados.

### src/state (hooks React)

- `useStudioProject`: mantem um `StudioState` mutavel e expoe `mutate`, `loadImage`, `detect` e `paintCell`.
- `useRecentProjects`: projetos recentes.
- `detection.ts`: integra a deteccao ao estado.
- `createStudioState.ts`: constroi o estado inicial a partir de um `ProjectSeed`.

### src/platform

`projects.ts` faz a descoberta e criacao de projetos. No Tauri desktop, chama os comandos Rust `list_projects` e `create_project`, que leem e criam `games/<id>/`. Na web, usa recentes em `localStorage` mais um exemplo embarcado.

### src/theme

Quatro temas (Coco Cream/Night, Gruvbox claro/escuro) mais cor de acento, tipografia e densidade, persistidos em `localStorage`.

### src/editor

A casca do editor e seus modos:

- `Editor`: shell, com `Toolbar` e `StatusBar`.
- `docks/`: `ResourceTree` (Arvore de Cena), `Inspector` (contextual) e `BottomPanel` (abas Simbolos/Saida/Erros/JSON).
- `modes/`: `ReelsMode`, `AssetsMode`, `PaytableMode`, `PreviewMode`.

A interface do editor e em pt-BR. O idioma base do projeto (pt/en/es) e uma propriedade do projeto, escolhida em Novo Projeto ou no Inspector, e nao a lingua da interface.

## Backend Rust

`apps/coconut-studio/src-tauri/src/main.rs` expoe os comandos:

- `studio_version`
- `detect_symbols` (Coconut Vision)
- `list_projects`
- `create_project`

## Deteccao de figuras

O Studio tem dois backends:

- `Detector leve`: heuristica TypeScript no browser (`imageDetection.ts`). Rapido, bom para previa e revisao, mas exige revisao visual.
- `Coconut Vision`: crate Rust compartilhada com o CLI, chamada via Tauri (`coconutVision.ts`). Caminho preferido para producao por ser reproduzivel. Disponivel apenas no app desktop Tauri; no navegador ha fallback para o detector leve.

## Fluxo esperado

O guia operacional completo fica em `docs/18-guia-coconut-studio.md` e os how-tos focados em `docs/studio/`.

```bash
pnpm dev:studio        # web em http://localhost:5174
pnpm studio:tauri dev  # desktop com Coconut Vision e criacao de projeto
pnpm build:studio      # build web do Studio
```

## Documentacao relacionada

- Guia operacional: `docs/18-guia-coconut-studio.md`.
- How-tos: `docs/studio/README.md`.
- Montagem de slots, paytable e runtime: `docs/20-sdd-montagem-slots-paytable-runtime.md`.
- SDD de deteccao: `docs/16-sdd-deteccao-figuras-coconut-studio.md` e `docs/17-sdd-coconut-vision.md`.
- Ambiente e dependencias: `docs/19-ambiente-e-dependencias.md`.

## Riscos

- `@iluvcoconut/asset-pipeline` usa filesystem e `sharp`, entao nao deve ir para o bundle browser.
- `coconut-vision` deve permanecer fora do bundle web; o browser usa o detector leve e o desktop usa Tauri/Rust.
- O WebView varia por sistema operacional; testar Linux/Windows/macOS.
- Ferramentas de recorte manual precisam preservar coordenadas em pixels reais da imagem.
