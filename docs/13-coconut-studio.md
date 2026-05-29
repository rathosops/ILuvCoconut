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
- ajuste de grid de spritesheet com largura/altura manual de célula;
- seleção e preview de frames;
- detecção de cor de fundo por amostragem dos cantos;
- auto-detect de figuras por diferença de cor e componentes conectados;
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

## Detecção inteligente

O Studio usa uma heurística leve no browser:

```txt
imagem -> canvas de análise -> amostra de fundo -> máscara foreground -> componentes conectados -> bounding boxes
```

Essa abordagem é adequada para spritesheets com fundo relativamente uniforme, como a screenshot analisada na raiz do projeto. Ela permite encontrar figuras que não se encaixam perfeitamente em uma grade fixa, ou casos em que uma célula contém mais de um símbolo.

Também existe backend OpenCV.js opcional, carregado sob demanda. Ele não entra no bundle inicial do Studio; o carregamento acontece apenas quando o usuário escolhe `OpenCV` e executa `Auto figuras`. Se o runtime não carregar, o Studio usa fallback leve.

Controles atuais:

- `Tolerancia`: distância de cor mínima para separar figura do fundo.
- `Area minima`: remove ruídos pequenos.
- `Detectar fundo`: amostra cantos e bordas da imagem.
- `Auto figuras`: detecta regiões conectadas diferentes do fundo.
- `Largura` e `Altura`: permitem dimensionar manualmente a célula do grid quando a divisão automática não encaixa.
- `Leve`: usa heurística própria com `getImageData` e componentes conectados.
- `OpenCV`: usa OpenCV.js para threshold, morfologia e componentes quando disponível.

Limites:

- fundo com gradiente forte pode exigir tolerância maior;
- sombras muito parecidas com o fundo podem ser cortadas;
- figuras encostadas podem virar uma única região;
- remoção de fundo fina ainda deve ficar no pipeline `sharp`, OpenCV/WASM ou Rust.

## Evolução técnica

Para avançar além da heurística leve:

- OpenCV.js para `threshold`, operações morfológicas e `findContours`;
- manter OpenCV.js em carregamento lazy ou empacotamento separado, porque o WASM pode aumentar peso de download;
- Marching Squares para gerar contornos editáveis;
- Web Worker ou OffscreenCanvas para não bloquear a UI;
- Rust/WASM para componentes conectados, matting e rasterização em lote;
- Tauri commands para rodar o pipeline local com `sharp`, `oxipng`, `ravif` e validações de assets.

## Próximos passos

- Conectar o Studio ao `@iluvcoconut/asset-pipeline` via comandos Tauri.
- Permitir escolher pasta de jogo local.
- Escrever planos de recorte e manifests com escrita atômica.
- Adicionar ferramenta de linhas/polígonos para recorte manual.
- Permitir editar manualmente bounding boxes detectadas.
- Integrar preview real com `apps/player-pixi`.
- Fazer o player Pixi carregar `games/<game-id>` e fixtures por query string.

## Riscos

- `@iluvcoconut/asset-pipeline` usa filesystem e `sharp`, então não deve ir para bundle browser.
- WebView varia por sistema operacional; testar Linux/Windows/macOS.
- Ferramentas de recorte manual precisam preservar coordenadas em pixels reais da imagem.
- Remoção de fundo complexa deve ficar em pipeline especializado, não em heurística visual frágil.
