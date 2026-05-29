# Coconut Studio

Coconut Studio é a interface web/local do ILuvCoconut para facilitar criação de jogos slot, tratamento de assets e montagem visual. A ferramenta deve ser leve, rápida e separada do player de produção.

## Decisão técnica

O Studio começa como app Vite/TypeScript em `apps/coconut-studio`. Ele pode rodar no navegador durante desenvolvimento e também possui shell Tauri v2 para desktop local.

```txt
TypeScript + Vite
  -> DOM/CSS para painéis, formulários e inspector
  -> Canvas para recorte visual, overlays e preview
  -> Tauri/Rust para filesystem, permissões e tarefas locais
  -> coconut-vision para detecção e crop de produção
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

O código do Studio é dividido por responsabilidade para evitar arquivos colossais:

- `main.ts`: orquestra estado, eventos e chamadas de alto nível.
- `studioTemplate.ts`: mantém o HTML estático da interface.
- `dom.ts`: centraliza helpers de DOM e criação de contexto 2D.
- `frameMath.ts`: calcula grids, bounding boxes, seleção e posicionamento no canvas.
- `imageDetection.ts`: executa a heurística leve de máscara e componentes conectados.
- `coconutVision.ts`: chama o backend Rust quando o Studio roda no Tauri.
- `canvasRenderer.ts`: desenha imagem, overlays, checkerboard e preview.
- `exportPlan.ts`: monta o plano JSON para integração com o pipeline.

## Detecção inteligente

O Studio usa uma heurística leve no browser:

```txt
imagem -> canvas de análise -> amostra de fundo -> máscara foreground -> componentes conectados -> bounding boxes
```

Essa abordagem é adequada para spritesheets com fundo relativamente uniforme, como a screenshot analisada na raiz do projeto. Ela permite encontrar figuras que não se encaixam perfeitamente em uma grade fixa, ou casos em que uma célula contém mais de um símbolo.

O caminho de produção é o `coconut-vision`, uma crate Rust compartilhada entre Tauri e CLI. O detector TypeScript permanece como preview rápido no browser; o `coconut-vision` gera resultado reprodutível, testável e adequado para crop final em alta resolução.

Controles atuais:

- `Tolerancia`: distância de cor mínima para separar figura do fundo.
- `Area minima`: remove ruídos pequenos.
- `Detectar fundo`: amostra cantos e bordas da imagem.
- `Auto figuras`: detecta regiões conectadas diferentes do fundo.
- `Largura` e `Altura`: permitem dimensionar manualmente a célula do grid quando a divisão automática não encaixa.
- `Leve`: usa heurística própria com `getImageData` e componentes conectados.
- `coconut-vision`: backend Rust via Tauri para detecção de produção, com fallback para a heurística TypeScript quando indisponível.

Limites:

- fundo com gradiente forte pode exigir tolerância maior;
- sombras muito parecidas com o fundo podem ser cortadas;
- figuras encostadas podem virar uma única região;
- remoção de fundo fina ainda deve ficar no pipeline `sharp`, WASM ou Rust.

## Evolução técnica

Para avançar além da heurística leve:

- `coconut-vision` como crate Rust compartilhada por Tauri e CLI;
- Marching Squares para gerar contornos editáveis;
- Web Worker ou OffscreenCanvas para não bloquear a UI;
- Rust/WASM apenas como evolução futura caso o Studio web precise do mesmo núcleo sem Tauri;
- Tauri commands para rodar o pipeline local com `sharp`, `oxipng`, `ravif` e validações de assets.

## Próximos passos

- Conectar o Studio ao `@iluvcoconut/asset-pipeline` via comandos Tauri.
- Integrar o Studio ao `coconut-vision` via Tauri command.
- Usar `pnpm ilc raw:detect-symbols` para crop final por arquivo quando o resultado revisado estiver pronto para produção.
- Permitir escolher pasta de jogo local.
- Escrever planos de recorte e manifests com escrita atômica.
- Adicionar ferramenta de linhas/polígonos para recorte manual.
- Permitir editar manualmente bounding boxes detectadas.
- Integrar preview real com `apps/player-pixi`.
- Fazer o player Pixi carregar `games/<game-id>` e fixtures por query string.

## Riscos

- `@iluvcoconut/asset-pipeline` usa filesystem e `sharp`, então não deve ir para bundle browser.
- `coconut-vision` deve permanecer fora do bundle web; o browser usa preview TypeScript e o desktop usa Tauri/Rust.
- WebView varia por sistema operacional; testar Linux/Windows/macOS.
- Ferramentas de recorte manual precisam preservar coordenadas em pixels reais da imagem.
- Remoção de fundo complexa deve ficar em pipeline especializado, não em heurística visual frágil.
