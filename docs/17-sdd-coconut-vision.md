# SDD: Coconut Vision

## Decisao

O ILuvCoconut tera um nucleo Rust compartilhado chamado `coconut-vision` para deteccao e recorte de figuras em assets brutos.

A decisao e criar uma biblioteca Rust pura, consumida por wrappers finos:

```txt
crates/
  coconut-vision/          # algoritmo e contratos de visao
  coconut-vision-cli/      # batch, debug e crop por linha de comando

apps/coconut-studio/
  src/                     # UI TypeScript, preview rapido e overlays
  src-tauri/               # Tauri command chamando coconut-vision
```

O detector TypeScript do Studio continua existindo como preview rapido. O `coconut-vision` sera o caminho de producao para deteccao, crop final, batch e validacao.

## Problema

O Studio precisa detectar figuras automaticamente em imagens compostas de slot. Essas imagens podem ter linhas com quantidades diferentes de figuras, simbolos com brilho/sombra, partes separadas do mesmo objeto e fundos com variacao de cor.

O exemplo guia tem 3 linhas visuais: 8 figuras na primeira, 8 na segunda e 9 na terceira. Uma grade fixa nao resolve esse caso. O sistema precisa detectar objetos por conteudo, agrupar em linhas, preservar coordenadas reais e permitir revisao.

## Por que Rust compartilhado

O projeto tem duas superficies que precisam da mesma inteligencia:

- Coconut Studio: precisa de feedback visual rapido, overlays e ajustes.
- Asset pipeline/CLI: precisa de resultado reprodutivel, crop final e batch.

Se o algoritmo ficar apenas no `src-tauri`, ele atende o Studio desktop, mas nao vira uma ferramenta clara para o pipeline. Se ficar apenas em TypeScript, a UI melhora, mas o recorte final continua dependente de heuristica no browser. Se virar uma crate Rust compartilhada, o mesmo nucleo alimenta Tauri e CLI.

Rust tambem e uma boa escolha porque:

- trabalha bem com buffers lineares de pixels;
- permite controle de memoria e performance;
- tem crates maduras para imagem, morfologia e componentes conectados;
- integra naturalmente com Tauri;
- pode ser testado isoladamente, sem DOM/WebView;
- pode rodar em batch sem carregar o Studio.

## Alternativas consideradas

| Alternativa | O que faria | Beneficio | Custo/Risco | Decisao |
|---|---|---|---|---|
| So TypeScript/browser | Manter toda deteccao em Canvas/ImageData | Iteracao rapida e roda no navegador | Thread principal, menos previsivel para batch, dificil garantir crop final | Manter apenas como preview |
| Rust dentro de `src-tauri` | Implementar direto no app desktop | Mais rapido para Tauri | Algoritmo preso ao Studio, pouco reuso pelo CLI | Rejeitado como solucao final |
| Rust sidecar | Chamar binario externo pelo Studio | Bom isolamento e batch | Empacotamento por plataforma, permissao shell, overhead de processo | Usar so se CLI precisar virar sidecar |
| Rust N-API | Node chama Rust como modulo nativo | Bom para pipeline Node | Build/distribuicao nativa mais complexos, nao resolve Tauri sozinho | Adiar |
| Rust WASM Worker | Rust roda no browser | Studio web forte sem Tauri | Duplicacao com nativo, boundary JS/WASM, threads mais complexas | Futuro opcional |
| Python/scikit-image | Prototipar segmentacao | Pesquisa rapida e boas ferramentas | Runtime separado, pior integracao com produto | Usar para pesquisa/fixtures |
| `coconut-vision` crate | Lib Rust pura com Tauri/CLI | Reuso, testes, performance e producao | Exige workspace Rust e CI | Escolhida |

## Responsabilidades

### `coconut-vision`

Responsavel por:

- carregar imagem quando receber caminho de arquivo;
- aceitar pixels brutos quando chamado por wrapper que ja fez decode;
- amostrar/modelar fundo;
- gerar mascara foreground;
- aplicar morfologia;
- rotular componentes conectados;
- unir partes proximas do mesmo simbolo;
- agrupar simbolos por linhas e colunas variaveis;
- retornar `DetectedSymbol[]` e `DetectionSummary`;
- no futuro, gerar crops finais com padding e alpha.

Nao deve:

- conhecer DOM, Canvas, Tauri WebView ou UI;
- escrever manifests de jogo diretamente;
- decidir nomes finais de assets;
- depender de paths fora dos parametros recebidos.

## Refinamento de segmentacao

O Coconut Vision usa componentes conectados como base, mas o merge nao deve transformar proximidade visual em um unico simbolo. A regra atual separa tres casos:

- partes pequenas proximas ao corpo principal continuam sendo agregadas como acessorios;
- dois componentes grandes proximos permanecem separados, mesmo que o padding de merge aproxime as caixas;
- componentes muito proximos e com forte sobreposicao perpendicular ainda podem ser unidos para simbolos compostos.

Esse comportamento mira folhas como `8/8/9`, em que uva e banana na segunda linha podem ficar perto por sombra/brilho, mas ainda precisam virar dois crops independentes. Para casos realmente encostados, a evolucao planejada e adicionar split por distancia/watershed antes do agrupamento final.

### Tauri wrapper

Responsavel por:

- receber chamada do frontend via `invoke`;
- validar caminhos e permissoes;
- chamar `coconut-vision`;
- retornar JSON serializavel;
- mapear erros Rust para mensagens curtas da UI.

### CLI wrapper

Responsavel por:

- executar deteccao em batch;
- gerar JSON de debug;
- opcionalmente salvar mascara/overlay para auditoria;
- salvar crops finais em diretorio de destino;
- integrar com comandos `ilc` quando o fluxo estiver estavel.

### TypeScript Studio

Responsavel por:

- preview rapido no browser;
- desenhar overlays;
- mostrar status claro;
- permitir ajuste manual;
- chamar Tauri quando o usuario pedir resultado de producao;
- exportar plano com parametros e resumo.

## Contratos

### Request

```rust
pub struct DetectSymbolsRequest {
    pub input_path: String,
    pub threshold: u8,
    pub min_area: u32,
    pub padding: u32,
    pub max_analysis_pixels: u32,
    pub background_mode: BackgroundMode,
}
```

O crop por arquivo usa um request separado:

```rust
pub struct CropSymbolsRequest {
    pub input_path: String,
    pub output_dir: String,
    pub name_prefix: String,
    pub threshold: u8,
    pub min_area: u32,
    pub padding: u32,
    pub max_analysis_pixels: u32,
    pub background_mode: BackgroundMode,
}
```

### Response

```rust
pub struct DetectSymbolsResponse {
    pub symbols: Vec<DetectedSymbol>,
    pub summary: DetectionSummary,
    pub parameters: EffectiveDetectionParameters,
}
```

### Symbol

```rust
pub struct DetectedSymbol {
    pub id: String,
    pub index: u32,
    pub row: u32,
    pub column: u32,
    pub x: u32,
    pub y: u32,
    pub width: u32,
    pub height: u32,
    pub source_area: u32,
    pub score: f32,
}
```

Os nomes devem serializar em `camelCase` para TypeScript via `serde(rename_all = "camelCase")`.

## Algoritmo inicial

1. Decode e normalizacao:
   - corrigir orientacao quando possivel;
   - converter para RGBA8;
   - reduzir copia de analise para `max_analysis_pixels`.

2. Fundo:
   - amostrar bordas e cantos;
   - calcular mediana de cor;
   - registrar cor e variancia no resumo.

3. Mascara:
   - foreground se alpha for relevante;
   - foreground se distancia de cor contra fundo passar do threshold;
   - manter buffer binario linear.

4. Morfologia:
   - abertura para ruido pequeno;
   - fechamento/dilatacao leve para antialiasing, glow e sombras;
   - parametros nomeados, nao numeros soltos.

5. Componentes:
   - conectividade 8;
   - filtro por area minima escalada;
   - extrair bbox, area e centroide.

6. Merge:
   - unir componentes proximos ou sobrepostos apos padding relativo;
   - repetir ate estabilizar;
   - preservar area original para score.

7. Agrupamento:
   - ordenar por centro Y;
   - clusterizar linhas por tolerancia baseada na altura mediana;
   - ordenar cada linha por centro X;
   - permitir contagens variaveis por linha.

8. Saida:
   - converter coordenadas para resolucao original;
   - adicionar padding final;
   - retornar resumo: total, linhas, figuras por linha, escala, tempo e versao do algoritmo.

## Dependencias Rust

Primeira versao recomendada:

- `serde`: contratos com Tauri/CLI.
- `thiserror`: erros de dominio.
- `image`: decode basico e RGBA8.
- morfologia/componentes implementados internamente no primeiro corte para manter controle fino.
- `imageproc`: opcao futura para comparar/validar regioes, contornos e operacoes morfologicas.
- `rayon`: paralelismo futuro por arquivo ou por lote, depois de medir.
- `clap`: apenas no `coconut-vision-cli`.

`libvips`/`vips-rs` fica para uma segunda etapa se imagens muito grandes ou formatos exigirem ganho de IO. O projeto ja usa `sharp`/libvips no Node; nao precisamos acoplar libvips ao Rust antes de medir.

## Layout do workspace

O repositorio deve passar a ter um workspace Rust proprio:

```txt
Cargo.toml
crates/
  coconut-vision/
    Cargo.toml
    src/
      lib.rs
      detection.rs
      mask.rs
      morphology.rs
      components.rs
      grouping.rs
      types.rs
      error.rs
  coconut-vision-cli/
    Cargo.toml
    src/main.rs
apps/coconut-studio/src-tauri/
  Cargo.toml
  src/main.rs
```

O `apps/coconut-studio/src-tauri/Cargo.toml` deve depender da crate local:

```toml
coconut-vision = { path = "../../../crates/coconut-vision" }
```

O workspace deve incluir o app Tauri para permitir `cargo check --workspace`.

## Integracao com Studio

Fluxo desejado:

```txt
Auto figuras
  -> preview TypeScript imediato
  -> se app Tauri estiver disponivel:
       executar Detectar producao
       substituir/combinar boxes com resultado Rust
       mostrar resumo e permitir revisao
```

Estados de UI:

- `Detectando figuras...`
- `Preview: 25 figuras em 3 linhas (8/8/9).`
- `Producao: 25 figuras em 3 linhas (8/8/9) com coconut-vision.`
- `Coconut Vision indisponivel; usando preview local.`

## Integracao com asset pipeline

O CLI deve expor comandos como:

```bash
coconut-vision detect raw-assets/source/sheet.png --json out/detection.json
coconut-vision crop raw-assets/source/sheet.png games/<game-id>/assets/raw/symbols --prefix symbol
```

Depois de estabilizado, o `@iluvcoconut/cli` pode encapsular isso:

```bash
pnpm ilc raw:detect-symbols raw-assets/source/sheet.png games/<game-id>/assets/raw/symbols symbol
```

## Testes e fixtures

### Rust

- testes unitarios para mascara, morfologia, componentes, merge e agrupamento;
- fixtures sinteticas pequenas em PNG;
- snapshot JSON para casos esperados;
- teste de regressao para 3 linhas com contagem `8/8/9`;
- benchmark simples para imagens grandes.

### TypeScript

- validar conversao entre resposta Rust e frames do canvas;
- validar fallback quando Tauri nao esta disponivel;
- validar mensagens de status e export plan.

## Criterios de aceite

Primeira entrega do `coconut-vision`:

- `cargo check --workspace` passa;
- `cargo test --workspace` passa;
- crate pura detecta componentes em fixture sintetica;
- resposta contem `figuresByRow`;
- Tauri command retorna JSON para o frontend;
- Studio mostra resumo vindo do Rust quando disponivel;
- fallback TypeScript continua funcionando no browser.

Status: a primeira entrega esta implementada. O core detecta linhas variaveis em teste sintetico, o Tauri command existe, o Studio chama `coconut-vision` quando disponivel e o CLI executa `detect`/`crop`.

Entrega de producao:

- CLI gera crops reais;
- JSON registra parametros efetivos e versao do algoritmo;
- fixtures de fundo solido, gradiente e `8/8/9` passam;
- performance medida em imagens grandes;
- resultado pode ser revisado manualmente no Studio antes de salvar assets finais.

## Impacto no projeto

### Positivo

- um algoritmo compartilhado para Studio e pipeline;
- menos dependencia de runtime externo no browser;
- deteccao testavel fora do browser;
- caminho claro para batch e crop final;
- melhor performance previsivel para assets grandes;
- arquitetura alinhada ao uso de Tauri/Rust ja escolhido.

### Custo

- adicionar workspace Rust ao monorepo;
- manter toolchain Rust no ambiente de desenvolvimento/CI;
- corrigir base Tauri atual, incluindo icon ausente;
- criar fixtures e testes visuais;
- definir empacotamento futuro do CLI/binario.

### Riscos

- lib Rust pode crescer demais se tentar resolver segmentacao perfeita logo no inicio;
- dependencia de `imageproc` pode nao cobrir todos os casos, exigindo implementacao propria;
- diferenca entre preview TypeScript e producao Rust pode confundir se a UI nao indicar backend;
- empacotamento Tauri precisa ser testado em Linux, Windows e macOS.

Mitigacao: manter contratos pequenos, algoritmo versionado, fixtures de regressao e mensagens de UI explicitas.

## Plano de execucao

1. Criar workspace Rust e crate `coconut-vision`. Concluido na primeira entrega.
2. Corrigir base Tauri para `cargo check` passar, incluindo icon/config necessarios. Concluido na primeira entrega.
3. Implementar tipos, erros e funcao publica `detect_symbols`. Concluido na primeira entrega.
4. Implementar detector minimo com RGBA8, mascara, componentes 8-neighbor e agrupamento. Concluido na primeira entrega.
5. Adicionar fixtures e testes Rust. Iniciado com fixture sintetica de linhas variaveis.
6. Criar Tauri command `detect_symbols`. Concluido na primeira entrega.
7. Integrar Studio com chamada opcional ao Tauri, mantendo fallback TS. Concluido na primeira entrega.
8. Criar CLI `coconut-vision-cli`. Concluido na primeira entrega com comando `detect`.
9. Conectar `pnpm ilc raw:detect-symbols` ao CLI ou a um wrapper Node. Concluido usando wrapper Node que chama `cargo run -p coconut-vision-cli -- crop`.
10. Medir performance e ajustar morfologia/merge.

## Fontes

- Cargo Workspaces: https://doc.rust-lang.org/cargo/reference/workspaces.html
- Tauri commands: https://v2.tauri.app/es/develop/calling-rust/
- Tauri sidecar: https://v2.tauri.app/fr/develop/sidecar/
- image crate: https://www.image-rs.org/image/image/
- imageproc: https://docs.rs/imageproc/latest/imageproc/
- imageproc region labelling: https://docs.rs/imageproc/latest/imageproc/region_labelling/
- rayon: https://docs.rs/rayon/latest/rayon/
- serde: https://serde.rs/
- thiserror: https://docs.rs/thiserror/latest/thiserror/
- clap: https://docs.rs/clap/latest/clap/
