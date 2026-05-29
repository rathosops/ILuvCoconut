# SDD: Deteccao de figuras no Coconut Studio

## Objetivo

Tornar a deteccao automatica de figuras precisa, rapida e compreensivel para o usuario. O Studio deve dar feedback quase imediato na UI, detectar folhas com quantidades variaveis por linha e produzir dados confiaveis para crop final no pipeline local.

Exemplo alvo: uma folha com 3 linhas visuais, sendo 8 figuras na primeira, 8 na segunda e 9 na terceira. O algoritmo deve identificar figuras por conteudo, nao por grade fixa.

## Escopo

Inclui:

- deteccao visual rapida no Studio web;
- mascara, morfologia, componentes conectados, merge e agrupamento por linhas;
- status legivel na UI com quantidade de figuras, linhas e backend usado;
- contrato JSON para execucao via Tauri/Rust;
- caminho de producao via `coconut-vision` sem bloquear a UI TypeScript.

Fora desta primeira fase:

- segmentacao neural obrigatoria;
- remocao perfeita de fundos artisticos complexos;
- classificacao semantica do simbolo;
- dependencias de visao computacional no browser.

## Arquitetura

```txt
Usuario
  -> Coconut Studio UI (TypeScript)
      -> detector rapido no browser
          -> ImageData reduzido
          -> mascara foreground
          -> morfologia em Uint8Array
          -> componentes conectados 8-neighbor
          -> merge de partes proximas
          -> agrupamento por linhas
          -> overlay + preview + status
      -> export plan JSON
      -> Tauri command
          -> coconut-vision
              -> decode em alta resolucao
              -> mascara/morfologia/componentes
              -> crop final + manifest
```

O browser e responsavel por resposta rapida e edicao visual. `coconut-vision` sera responsavel por reproducibilidade, batch e crop final em alta resolucao. A decisao arquitetural completa esta em `docs/17-sdd-coconut-vision.md`.

## Decisoes tecnicas

### TypeScript

- Usar `ImageData` e buffers lineares (`Uint8Array`) para minimizar alocacoes.
- Reduzir a imagem para limite de pixels na deteccao e converter boxes de volta para a resolucao original.
- Preferir Web Worker/OffscreenCanvas para trabalho pesado. Enquanto isso nao estiver ligado, manter o limite de pixels baixo o suficiente para nao travar a UI.
- Usar Vite com worker via `new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })` quando a deteccao sair da thread principal.
- Separar tipos de dominio (`DetectedSymbol`, `DetectionSummary`, `DetectionParameters`) dos detalhes de Canvas.

### Rust

- Implementar detector local na crate compartilhada `coconut-vision`, chamada por Tauri command e CLI.
- Usar estruturas pequenas, serializaveis com `serde`, e retornar JSON simples para TypeScript.
- Usar `image` para decode/crop inicial ou `libvips` quando formatos/performance justificarem.
- Usar `imageproc::region_labelling` ou union-find proprio para componentes conectados.
- Paralelizar por arquivo/batch com `rayon`; evitar paralelizar loops pequenos antes de medir.
- Propagar erros com `Result<T, E>` e mensagens de dominio; nao usar `unwrap()` em caminho de producao.

## Contratos

```ts
type DetectionBackend = 'heuristic' | 'coconutVision';

interface DetectedSymbol {
  id: string;
  index: number;
  row: number;
  column: number;
  x: number;
  y: number;
  width: number;
  height: number;
  sourceArea: number;
  score: number;
  backend: DetectionBackend;
}

interface DetectionSummary {
  backend: DetectionBackend;
  figureCount: number;
  rowCount: number;
  figuresByRow: number[];
  analysisScale: number;
  elapsedMs: number;
}
```

O `FrameRect` atual pode continuar alimentando canvas/preview. A evolucao deve migrar para `DetectedSymbol` sem quebrar overlays.

## Algoritmo rapido no browser

1. Desenhar imagem em canvas de analise reduzido.
2. Amostrar fundo por bordas e cantos, usando mediana.
3. Criar mascara foreground:
   - `alpha > MIN_ALPHA_FOR_FOREGROUND`;
   - distancia RGB normalizada contra o fundo;
   - tolerancia configuravel.
4. Morfologia:
   - abertura leve para remover ruido isolado;
   - fechamento leve para juntar antialiasing, brilho e pequenas falhas;
   - dilatacao virtual apenas para merge, preservando box original.
5. Componentes conectados:
   - conectividade 8;
   - fila prealocada;
   - filtro por area minima escalada.
6. Merge:
   - unir acessorios pequenos proximos ao corpo principal do simbolo;
   - evitar unir dois componentes grandes apenas por proximidade de bounding box;
   - repetir ate estabilizar para juntar partes separadas do mesmo simbolo sem fundir simbolos vizinhos.
7. Agrupamento por linhas:
   - ordenar por centro Y;
   - clusterizar por tolerancia baseada na altura mediana;
   - ordenar cada linha por centro X;
   - reindexar frames com `row` e `column`, permitindo contagem variavel por linha.
8. Feedback:
   - exibir `N figuras em M linhas (a/b/c)`;
   - indicar fallback quando o backend Rust estiver indisponivel no browser;
   - manter overlay desenhado imediatamente apos a deteccao.

## Pipeline coconut-vision

Primeiro comando planejado:

```rust
#[tauri::command]
async fn detect_symbols(request: DetectSymbolsRequest) -> Result<DetectSymbolsResponse, DetectSymbolsError>
```

Esse command deve ser um wrapper fino sobre `coconut_vision::detect_symbols`.

Entrada:

- caminho da imagem;
- parametros de threshold, area minima, padding, modo de fundo;
- destino opcional para crops.

Saida:

- `DetectedSymbol[]`;
- `DetectionSummary`;
- caminhos gerados quando crop estiver ativo;
- parametros efetivamente usados.

Boas praticas:

- validar caminhos contra escopo permitido pelo app;
- nao bloquear o event loop de UI;
- fazer crop final em resolucao original;
- salvar arquivos de forma atomica;
- registrar versao do algoritmo no JSON.

## UI

O feedback deve ser curto e operacional:

- durante execucao: `Detectando figuras...`;
- sucesso: `25 figuras em 3 linhas (8/8/9) com heuristic.`;
- producao: `25 figuras em 3 linhas (8/8/9) com coconut-vision.`;
- fallback: `Coconut Vision indisponivel; fallback leve usado. 25 figuras em 3 linhas (8/8/9).`;
- vazio: `Nenhuma figura encontrada. Ajuste tolerancia ou area minima.`;
- erro real: mensagem curta, sem stack trace.

O usuario deve conseguir revisar o overlay sem interpretar detalhes tecnicos. Parametros avancados ficam no inspector.

## Testes

Criar fixtures pequenas e deterministicas para:

- fundo solido;
- fundo gradiente;
- linhas 8/8/9;
- simbolo separado em multiplas partes;
- simbolos proximos mas distintos;
- componentes grandes proximos na mesma linha, como uva e banana, nao sao fundidos;
- ruido pequeno removido por area/morfologia.

Testes unitarios prioritarios:

- `componentBoundsToFrames` preserva linhas/colunas variaveis;
- componentes conectados usam 8-neighbor;
- merge e agrupamento por linhas nao unem linhas diferentes;
- export plan inclui resumo de deteccao.

## Plano de entrega

1. Melhorar detector TypeScript atual com 8-neighbor, morfologia simples, merge iterativo e agrupamento por linhas.
2. Melhorar status da UI com resumo de linhas.
3. Remover backend legado do browser e manter Coconut Vision como caminho principal. Concluido.
4. Adicionar worker para deteccao heuristica.
5. Criar contratos `DetectedSymbol`/`DetectionSummary`.
6. Criar crate `coconut-vision`. Concluido.
7. Criar comando Rust/Tauri `detect_symbols` usando `coconut-vision`. Concluido.
8. Criar CLI para crop por frames detectados. Concluido.
9. Adicionar fixtures e testes.

## Fontes

- imageproc region labelling: https://docs.rs/imageproc/latest/imageproc/region_labelling/
- imageproc crate: https://docs.rs/imageproc/latest/imageproc/
- image-rs: https://www.image-rs.org/image/image/
- Tauri commands: https://v2.tauri.app/es/develop/calling-rust/
- Vite workers: https://vite.dev/guide/features/
- MDN Web Workers: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API
- MDN OffscreenCanvas: https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas
- sharp/libvips: https://sharp.pixelplumbing.com/
- libvips morphology: https://www.libvips.org/API/8.16/libvips-morphology.html
- Coconut Vision SDD: `docs/17-sdd-coconut-vision.md`
