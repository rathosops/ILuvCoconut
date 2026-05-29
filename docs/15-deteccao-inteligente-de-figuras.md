# Deteccao inteligente de figuras

Este documento consolida a pesquisa para evoluir o auto-detect do Coconut Studio em imagens compostas de simbolos, como folhas de slot com linhas irregulares. Um exemplo real pode ter 3 linhas visuais, com 8 figuras na primeira, 8 na segunda e 9 na terceira. O recorte correto nao deve depender de uma grade fixa; ele deve detectar objetos, calcular bounding boxes, preservar margem/sombra e permitir revisao manual.

## Situacao atual

O Studio tem dois backends de deteccao:

- `apps/coconut-studio/src/imageDetection.ts`: heuristica TypeScript no browser usando `getImageData`, distancia RGB contra fundo amostrado, componentes conectados e merge de regioes proximas.
- `apps/coconut-studio/src/opencv.ts`: OpenCV.js carregado sob demanda via CDN, usando `inRange`, `bitwise_not`, `morphologyEx` e `connectedComponentsWithStats`.

O pipeline CLI atual em `packages/coconut-asset-pipeline/src/index.ts` usa `sharp` para inspecao, slice por grid e otimizacao AVIF/WebP/PNG. Ele ainda nao possui comando de slice por deteccao de componentes.

## Problemas encontrados

- OpenCV.js e carregado de `https://docs.opencv.org/4.x/opencv.js`. Isso cria falha por rede, CORS/cache, indisponibilidade offline e variacao de versao.
- Se o carregamento de OpenCV.js falha uma vez, a promise cacheada pode permanecer rejeitada e impedir novas tentativas ate recarregar a pagina.
- O OpenCV roda na resolucao completa da imagem, enquanto a heuristica leve limita a analise por `ANALYSIS_MAX_PIXELS`. Em folhas grandes, isso aumenta custo e memoria.
- A mascara atual assume fundo dentro de uma faixa RGB simples. Em fundos com gradiente, glow, sombra ou compressao JPEG, essa regra cria componentes quebrados ou objetos unidos.
- `morphologyEx` usa kernel `1x1`, que na pratica nao limpa ruido nem fecha pequenos buracos.
- O fluxo nao separa claramente tres etapas diferentes: detectar candidatos, agrupar candidatos em simbolos e exportar crops finais em alta resolucao.
- Ainda nao existe edicao manual de bounding boxes, entao falsos positivos/falsos negativos viram bloqueio em vez de ajuste visual.
- O plano exportado do Studio ainda nao tem comando de producao para frames detectados; o CLI so executa slice por grid.

## Recomendacao

Manter a UI do Studio em TypeScript, mas mover a deteccao de producao para o `coconut-vision`, uma crate Rust compartilhada por Tauri e CLI. O Studio deve continuar dando feedback visual rapido, enquanto o `coconut-vision` faz o processamento reprodutivel fora do bundle web.

Ordem recomendada:

1. Curto prazo: melhorar o detector TypeScript atual e remover a dependencia de OpenCV via CDN.
2. Producao local: criar `coconut-vision` com algoritmo Rust proprio de mascara/componentes, exposto por Tauri command e CLI.
3. Alta robustez: adicionar crop final, exportacao atomica, fixtures e metricas ao `coconut-vision`.
4. Casos dificeis: oferecer modo Python/SAM opcional para segmentacao assistida, nao como dependencia padrao do Studio.

A decisao arquitetural completa esta em `docs/17-sdd-coconut-vision.md`.

## Alternativas avaliadas

### TypeScript e Node

`sharp`/libvips ja esta no projeto e deve continuar sendo o padrao para leitura, crop, trim, resize e exportacao final. libvips e rapido, usa pouca memoria e possui morfologia/label regions no core. A limitacao e que a API JavaScript do `sharp` nao expoe todas as operacoes de visao computacional de libvips diretamente; para label regions pode ser necessario usar raw pixels no Node, binding especifico ou chamar `vips`/ImageMagick como ferramenta externa.

Bom uso no projeto:

- usar `sharp().ensureAlpha().raw().toBuffer({ resolveWithObject: true })` para obter pixels;
- gerar mascara binaria em `Uint8Array`;
- rodar componentes conectados e bounding boxes em worker/CLI;
- aplicar crop final com `sharp.extract()`, `trim()`, `png()` e metadados JSON.

### Rust

Rust e a melhor opcao para um backend local otimizado e previsivel no Tauri. As crates `image` e `imageproc` cobrem decode basico, manipulacao de pixels, morfologia, contornos, template matching e componentes conectados. `imageproc` tambem usa `rayon` em variacoes paralelas de algumas operacoes.

Bom uso no projeto:

- crate `coconut-vision` para centralizar algoritmo;
- comando Tauri e CLI como wrappers finos;
- decode com `image`;
- mascara em buffer linear;
- componentes conectados com `imageproc::region_labelling` ou implementacao union-find propria;
- agrupamento por linhas usando centroides;
- retorno de `DetectedSymbol[]` para o frontend.

### Python

Python e a melhor bancada de pesquisa e validacao. `scikit-image` tem exemplos maduros para threshold, fechamento morfologico, `label` e `regionprops`. Para imagens muito dificeis, SAM pode gerar mascaras automaticas ou promptadas, mas e pesado e deve ser opcional.

Bom uso no projeto:

- prototipar notebooks/scripts com `scikit-image`;
- gerar fixtures de teste com bounding boxes esperadas;
- usar SAM somente em pipeline assistido, quando cor/fundo/morfologia nao bastarem.

### ImageMagick

ImageMagick tem `connected-components` com estatisticas de bounding box, area, centroide e filtros por area/perimetro/circularidade. E uma opcao forte para CLI local, especialmente como fallback operacional rapido. A desvantagem e depender de binario externo e parsear saida textual, entao deve ser encapsulado e testado.

### OpenCV

OpenCV continua valido, mas deve ser tratado como backend especializado, nao como unico caminho. Para browser, OpenCV.js exige gerenciamento manual de `Mat.delete()`, carregamento assicrono correto e cuidado com heap WASM. Para producao local, OpenCV nativo em Python/Rust/C++ e mais previsivel do que OpenCV.js via CDN.

## Algoritmo recomendado para sheets de simbolos

1. Normalizar leitura:
   - corrigir orientacao EXIF;
   - trabalhar em copia reduzida para deteccao;
   - manter escala para converter boxes de volta a pixels reais.

2. Estimar fundo:
   - amostrar cantos e bordas;
   - usar mediana e variancia, nao apenas uma cor unica;
   - opcionalmente ajustar um modelo de fundo por distancia em Lab/HSV, mais robusto que RGB puro.

3. Criar mascara:
   - considerar alpha como foreground;
   - usar distancia perceptual ou HSV para separar fundo;
   - aceitar fundo com gradiente por threshold adaptativo/local;
   - remover ruido com abertura;
   - fechar pequenos buracos com fechamento;
   - dilatar levemente para preservar glow/sombra.

4. Componentes conectados:
   - rotular componentes 8-conectados para simbolos com diagonais/sombras;
   - filtrar por area minima, largura, altura e proporcao;
   - calcular `bbox`, area, centroide e score.

5. Merge inteligente:
   - unir partes proximas do mesmo simbolo, como cartas inclinadas, cerejas duplas, letras do BAR ou brilho separado;
   - evitar unir simbolos vizinhos por distancia relativa ao tamanho medio dos componentes;
   - usar overlap apos dilatacao virtual, nao apenas padding fixo.

6. Agrupar em linhas:
   - ordenar boxes por centro Y;
   - clusterizar linhas por tolerancia baseada na altura mediana;
   - dentro de cada linha ordenar por centro X;
   - permitir quantidades diferentes por linha, como 8/8/9.

7. Exportar:
   - aplicar padding configuravel no crop final;
   - preservar coordenadas originais;
   - gerar preview de mascara e overlay para revisao;
   - salvar JSON com boxes, parametros e backend usado.

## Boas praticas com OpenCV no projeto

- Nao carregar OpenCV.js de CDN em fluxo de producao. Versionar localmente ou empacotar como chunk separado.
- Manter OpenCV lazy-loaded e fora do bundle inicial do Studio.
- Rodar deteccao pesada em Web Worker ou Tauri command para nao travar a UI.
- Reusar buffers e limitar resolucao de analise; fazer crop final na resolucao original.
- Sempre chamar `delete()` em todo `cv.Mat`, inclusive temporarios, em `finally`.
- Validar tipo e canais de cada `Mat` antes de operar. Muitos erros em OpenCV.js vem de tipo/canal incorreto.
- Preferir pipeline explicito: `RGBA -> RGB/HSV/Lab -> mask -> morph -> connectedComponentsWithStats/findContours`.
- Evitar kernels sem efeito. `1x1` nao limpa mascara; usar `3x3` ou parametrizar.
- Registrar parametros no plano exportado: threshold, kernel, minArea, escala, backend e versao.
- Criar fixtures visuais com resultado esperado para evitar regressao silenciosa.

## Backlog proposto

1. Substituir o URL generico `4.x/opencv.js` por versao fixa local ou remover OpenCV.js do fluxo principal.
2. Corrigir retry do loader OpenCV para limpar a promise cacheada quando o carregamento falhar.
3. Adicionar `DetectedSymbol` ao contrato do Studio:
   - `id`, `bbox`, `centroid`, `area`, `rowIndex`, `columnIndex`, `score`, `sourceBackend`.
4. Melhorar `imageDetection.ts`:
   - distancia em HSV/Lab ou RGB normalizado;
   - morfologia simples em `Uint8Array`;
   - componentes 8-conectados;
   - agrupamento por linhas com contagem variavel.
5. Adicionar editor manual de boxes:
   - mover, redimensionar, excluir e criar box;
   - desfazer/refazer;
   - snap opcional ao conteudo detectado.
6. Criar crate `coconut-vision`.
7. Criar comando `raw:detect-symbols` usando `coconut-vision`.
8. Criar comando de recorte por lista de frames exportada pelo Studio, alem do `raw:slice-grid`.
9. Fazer `raw:slice-grid` aceitar `marginX`, `marginY`, `gapX`, `gapY`, `frameWidth` e `frameHeight`, alinhando CLI ao que a UI permite.
10. Integrar Studio -> Tauri -> `coconut-vision` -> asset pipeline para salvar crops em `games/<game-id>/assets/raw/symbols`.
11. Adicionar fixtures de deteccao:
   - sheet 8/8/9;
   - fundo solido;
   - fundo gradiente;
   - simbolos separados em partes;
   - simbolos proximos mas distintos.
12. Medir performance:
   - tempo de decode;
   - tempo de mascara;
   - tempo de componentes;
   - memoria de pico;
   - numero de boxes corretas/incorretas.

## Fontes consultadas

- OpenCV.js usage: https://docs.opencv.org/4.x/d0/d84/tutorial_js_usage.html
- OpenCV.js basic operations: https://docs.opencv.org/4.x/de/d06/tutorial_js_basic_ops.html
- OpenCV connected components: https://docs.opencv.org/3.4/d3/dc0/group__imgproc__shape.html
- sharp: https://sharp.pixelplumbing.com/
- sharp channel/raw APIs: https://sharp.pixelplumbing.com/api-channel/
- libvips: https://www.libvips.org/
- libvips morphology and labelregions: https://www.libvips.org/API/8.16/libvips-morphology.html
- libvips labelregions: https://www.libvips.org/API/8.17/method.Image.labelregions.html
- imageproc Rust: https://docs.rs/imageproc/latest/imageproc/
- imageproc connected components: https://docs.rs/imageproc/latest/imageproc/region_labelling/
- image-rs: https://www.image-rs.org/image/image/
- scikit-image label/regionprops example: https://scikit-image.org/docs/0.20.x/auto_examples/segmentation/plot_label.html
- scikit-image segmentation API: https://scikit-image.org/docs/stable/api/skimage.segmentation
- ImageMagick connected components: https://imagemagick.org/connected-components/
- ONNX Runtime Web/WebGPU: https://onnxruntime.ai/docs/tutorials/web/ep-webgpu.html
- Segment Anything: https://github.com/facebookresearch/segment-anything
