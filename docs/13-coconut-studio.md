# Coconut Studio

Coconut Studio é a interface web/local do ILuvCoconut para facilitar criação de jogos slot, tratamento de assets e montagem visual. A ferramenta deve ser leve, rápida e separada do player de produção.

## Decisão técnica

O Studio começa como app Vite/TypeScript em `apps/coconut-studio`. Ele pode rodar no navegador durante desenvolvimento e também possui shell Tauri v2 para desktop local.

```txt
TypeScript + Vite
  -> DOM/CSS para painéis, formulários e inspector
  -> Canvas para recorte visual, overlays e preview
  -> Tauri/Rust para filesystem, permissões e tarefas locais
```

Tauri foi escolhido porque usa Rust no backend e WebView do sistema operacional. No Windows usa WebView2; no Linux usa WebKitGTK; no macOS usa WKWebView. Isso é mais leve que Electron, mas exige testes reais por sistema operacional.

## Primeira versão

A primeira versão oferece:

- importação local de imagem raster;
- ajuste de grid de spritesheet;
- seleção e preview de frames;
- simulação visual de fundo claro;
- exportação de plano JSON;
- base Tauri/Rust mínima para evoluir comandos locais.

## Fluxo esperado

```bash
pnpm dev:studio
```

Abre `http://localhost:5174`.

Via Docker:

```bash
docker compose up studio
```

Abre `http://localhost:3002`.

Para desktop local:

```bash
pnpm studio:tauri dev
```

No Linux, instalar os pré-requisitos do Tauri, incluindo WebKitGTK.

## Arquitetura de UI

- Toolbar superior com ações globais.
- Browser/inspector de projeto à esquerda.
- Canvas central para imagem, linhas de recorte e preview visual.
- Inspector à direita com frame selecionado e próximos passos.
- Status bar inferior para feedback curto.

O canvas é usado para interação visual. DOM/CSS continuam responsáveis por controles, inputs e navegação para manter acessibilidade e performance.

## Próximos passos

- Conectar o Studio ao `@iluvcoconut/asset-pipeline` via comandos Tauri.
- Permitir escolher pasta de jogo local.
- Escrever planos de recorte e manifests com escrita atômica.
- Adicionar ferramenta de linhas/polígonos para recorte manual.
- Integrar preview real com `apps/player-pixi`.
- Fazer o player Pixi carregar `games/<game-id>` e fixtures por query string.

## Riscos

- `@iluvcoconut/asset-pipeline` usa filesystem e `sharp`, então não deve ir para bundle browser.
- WebView varia por sistema operacional; testar Linux/Windows/macOS.
- Ferramentas de recorte manual precisam preservar coordenadas em pixels reais da imagem.
- Remoção de fundo complexa deve ficar em pipeline especializado, não em heurística visual frágil.
