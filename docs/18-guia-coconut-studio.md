# Guia do Coconut Studio

O Coconut Studio é a ferramenta web/local do ILuvCoconut para preparar imagens brutas, revisar recortes de símbolos e gerar um plano JSON para o pipeline de assets.

Ele roda de duas formas:

- **Web com Vite**: ideal para preview rápido, ajustes visuais e desenvolvimento.
- **Desktop com Tauri**: usa a mesma interface, mas habilita o backend Rust `coconut-vision` para detecção de produção.

## Pré-requisitos

Instale as dependências do monorepo antes de iniciar o Studio:

```bash
pnpm install
```

Para executar o modo desktop, também é necessário ter Rust instalado e os pré-requisitos do Tauri v2 para o sistema operacional. No Linux, isso inclui WebKitGTK. No Windows, o runtime usa WebView2. No macOS, usa WKWebView.

## Executar na web

Use o comando de atalho da raiz:

```bash
pnpm dev:studio
```

Ou execute direto pelo pacote:

```bash
pnpm --filter @iluvcoconut/studio dev
```

O Studio fica disponível em:

```txt
http://localhost:5174
```

Também é possível rodar via Docker:

```bash
docker compose up studio
```

Nesse caso, abra:

```txt
http://localhost:3002
```

No navegador, o backend `coconut-vision` não está disponível. A ferramenta usa o `Detector leve`, uma heurística TypeScript baseada em Canvas, `ImageData`, máscara de foreground e componentes conectados. Esse modo é bom para preview e revisão visual, mas o crop final de produção deve usar o fluxo Tauri/CLI.

## Executar no Tauri

Use o atalho da raiz:

```bash
pnpm studio:tauri dev
```

Ou execute direto pelo pacote:

```bash
pnpm --filter @iluvcoconut/studio tauri dev
```

Esse modo abre o Studio como app desktop local. Quando o runtime Tauri está disponível, o botão `Coconut Vision` fica ativo e a detecção de figuras pode usar o backend Rust compartilhado.

O empacotamento final do app desktop ainda não é o foco do projeto. O fluxo suportado neste momento é o shell Tauri local para desenvolvimento e uso interno.

## Fluxo recomendado

1. Coloque a arte bruta em uma pasta local de trabalho, normalmente `raw-assets/<fonte>/`.
2. Abra o Coconut Studio pela web ou pelo Tauri.
3. Clique em `Importar imagem` e selecione PNG, JPEG, WebP ou AVIF.
4. Use `Grid` quando a folha tiver células regulares.
5. Use `Auto figuras` quando os símbolos estiverem distribuídos por conteúdo, sem grade fixa.
6. Revise o overlay no canvas e o preview do frame selecionado.
7. Ajuste tolerância, área mínima, grid, zoom e fundo claro conforme necessário.
8. Clique em `Exportar plano` para copiar o JSON para a área de transferência.
9. Para crop final, rode o pipeline CLI/Tauri com `coconut-vision` e revise os assets gerados.

## Interface

### Barra superior

- `Importar imagem`: carrega uma imagem local no Studio.
- `Exportar plano`: copia para a área de transferência um JSON com jogo, prefixo, grid, frames detectados e resumo de detecção.

### Projeto

- `Jogo`: identifica o jogo de destino no plano exportado. O valor inicial é `fruit-classic`.
- `Prefixo`: prefixo usado para os símbolos no plano exportado. O valor inicial é `symbol`.

Esses campos não gravam arquivos automaticamente. Eles apenas entram no plano JSON.

### Modo

- `Grid`: mostra frames calculados por colunas, linhas, margens, gaps e tamanho de célula.
- `Figuras`: mostra os frames detectados automaticamente por conteúdo.

Ao finalizar `Auto figuras`, o Studio troca para `Figuras` automaticamente.

### Grid manual

Use quando a imagem é uma spritesheet regular.

- `Colunas` e `Linhas`: quantidade de células.
- `Margem X` e `Margem Y`: deslocamento inicial do grid.
- `Gap X` e `Gap Y`: espaço entre células.
- `Largura` e `Altura`: tamanho fixo de cada célula. Quando ficam em `0`, o Studio calcula o tamanho com base na imagem, margens, gaps e quantidade de células.

O grid é recalculado imediatamente enquanto os campos são editados.

### Fundo e figuras

- `Tolerância`: distância mínima de cor em relação ao fundo para um pixel virar foreground. Aumente quando o fundo estiver entrando no símbolo; reduza quando sombras ou brilhos estiverem sendo capturados demais.
- `Área mínima`: remove componentes pequenos. Aumente para limpar ruídos; reduza para preservar partículas, chamas, brilhos ou acessórios pequenos.
- `Coconut Vision`: usa o backend Rust no Tauri. Fica desabilitado no navegador.
- `Detector leve`: usa a heurística TypeScript no browser.
- `Detectar fundo`: reamostra a cor do fundo a partir dos cantos e bordas da imagem.
- `Auto figuras`: executa a detecção e cria os frames automáticos.
- Swatch de fundo: mostra a cor de fundo detectada em `rgb(...)`.

No navegador, selecionar `Coconut Vision` força fallback para `Detector leve`, porque o backend Rust só existe no Tauri.

### Canvas central

- Mostra a imagem carregada.
- Mostra overlays de recorte do `Grid` ou das `Figuras`.
- Permite selecionar um frame clicando sobre ele.
- O frame selecionado aparece no preview do inspector.

Controles:

- `-` e `+`: reduzem ou aumentam o zoom.
- `Fundo claro`: alterna a simulação visual de fundo claro para facilitar a revisão de transparência, bordas e brilho.

### Inspector

- `Frame`: mostra dados do frame selecionado e o preview recortado.
- `Pipeline`: lista o fluxo operacional esperado: importar arte, ajustar grid ou detectar figuras, validar preview, exportar plano e rodar pipeline CLI/Tauri.

### Status

A barra inferior mostra mensagens curtas de operação:

- imagem carregada e dimensões;
- detecção em andamento;
- quantidade de figuras e linhas detectadas;
- backend usado;
- fallback quando `coconut-vision` não está disponível;
- plano JSON copiado.

## Detecção de figuras

O Studio possui dois backends.

### Detector leve

Roda no navegador. O fluxo é:

```txt
imagem -> canvas reduzido -> amostra de fundo -> máscara foreground -> morfologia leve -> componentes conectados -> merge controlado -> frames
```

Ele é rápido e suficiente para preview, mas ainda exige revisão visual. Casos com símbolos encostados, sombras muito parecidas com o fundo, gradientes fortes ou partículas finas podem precisar de ajustes de tolerância e área mínima.

### Coconut Vision

Roda no Tauri via Rust. É o caminho preferido para produção porque também é usado pelo CLI e pelo pipeline de assets.

Use esse backend quando o objetivo for gerar uma detecção mais reprodutível antes do crop final.

## Exportar plano

`Exportar plano` copia um JSON para a área de transferência. O plano inclui:

- `gameId`;
- prefixo do asset;
- imagem carregada;
- configuração de grid;
- frames detectados ou calculados;
- parâmetros de detecção;
- backend usado;
- resumo de detecção quando existir.

O plano não substitui os assets finais. Ele serve como contrato intermediário para revisão, integração e automação futura.

## Limites atuais

- O Studio ainda não grava crops finais diretamente em `games/<game-id>/assets/raw/symbols`.
- O navegador não acessa filesystem local além do arquivo importado pelo usuário.
- O backend `coconut-vision` só está disponível no Tauri.
- A edição manual de bounding boxes ainda não foi implementada.
- Recortes de produção devem ser finalizados pelo CLI/Tauri e revisados visualmente.

## Comandos relacionados

Build web do Studio:

```bash
pnpm build:studio
```

Detecção/crop por CLI usando `coconut-vision`:

```bash
pnpm ilc raw:detect-symbols <inputPath> <outputDir> <namePrefix> [threshold] [minArea] [padding]
```

Otimização de imagem:

```bash
pnpm assets:optimize-image <inputPath> <outputDir> <assetId> [width]
```

Validação geral do projeto:

```bash
pnpm quality
```
