# Performance de assets web

O ILuvCoconut é 100% web no runtime principal. A regra é simples: preservar qualidade visual na autoria, mas entregar ao navegador o menor conjunto possível de bytes, texturas e sons necessários para o momento do jogo.

## Estratégia de imagens

PNG deve ser tratado como formato intermediário quando precisamos de alpha, inspeção visual ou compatibilidade de ferramenta. Para runtime web, o pipeline deve preferir:

```txt
AVIF -> WebP -> PNG fallback
```

Uso recomendado:

- `AVIF`: primeira opção para imagens finais quando o tamanho cair sem perda visual inaceitável.
- `WebP`: fallback moderno, bom para alpha e sprites quando AVIF não compensar.
- `PNG`: fallback sem perdas, assets de autoria, casos com pixel art ou quando WebP/AVIF piorarem bordas/texto.
- `JPEG`: apenas para backgrounds sem alpha quando AVIF/WebP não forem usados.

Comando inicial:

```bash
pnpm assets:optimize-image \
  raw-assets/default-base-slot/source.jpg \
  games/fruit-classic/assets/optimized/pixi \
  symbol-test \
  512
```

O comando gera AVIF, WebP e PNG otimizado usando `sharp`.

## Atlases e spritesheets

Slots repetem muitos símbolos. Arquivos soltos aumentam requests, overhead de decode e trocas de textura. O pipeline deve gerar atlases para Pixi e bundles para Cocos:

- agrupar símbolos do base game no mesmo atlas;
- separar feature/bônus em atlases lazy;
- usar padding/extrude para evitar bleeding em escala e movimento;
- manter dimensões dentro do limite de textura de GPUs móveis;
- gerar versões por escala quando necessário, como `1x` e `0.5x`;
- evitar texturas maiores que o necessário para o tamanho real no canvas.

## Canvas, WebGL e PixiJS

PixiJS é o caminho principal porque usa WebGL/WebGPU sob uma API 2D. As práticas do projeto:

- não desenhar no DOM durante spin;
- evitar criar/destruir sprites em loop crítico;
- usar pooling de símbolos;
- manter containers/layers previsíveis;
- evitar máscaras e filtros pesados em grande quantidade;
- usar `cacheAsTexture` apenas quando o conteúdo for estático o bastante para compensar;
- reduzir resolução em perfis `low` e `batterySaver`;
- carregar assets de feature somente quando necessários.

O canvas deve ficar livre para renderização. UI de debug, métricas e ferramentas internas podem usar DOM, mas a experiência do jogo deve passar pelo renderer.

## Áudio

Áudio também precisa de orçamento. O projeto deve trabalhar com variações por uso:

- efeitos curtos: Web Audio API, arquivos pequenos, pré-decodificados no carregamento base;
- música e loops longos: streaming com `<audio>` ou carregamento lazy;
- formatos preferenciais: Opus/Ogg ou WebM Opus quando suportado, MP3/M4A como fallback prático;
- não carregar todos os sons no boot;
- normalizar volume e remover silêncio antes do build;
- separar áudio base, big win, free spins e bônus em scopes diferentes.

No futuro, o manifest deve permitir variantes de áudio do mesmo jeito que imagens:

```json
{
  "id": "audio.spin",
  "type": "audio",
  "src": "assets/optimized/common/audio/spin.mp3",
  "variants": [
    { "format": "ogg", "mimeType": "audio/ogg", "src": "assets/optimized/common/audio/spin.ogg" },
    { "format": "mp3", "mimeType": "audio/mpeg", "src": "assets/optimized/common/audio/spin.mp3" }
  ],
  "scope": "base"
}
```

## TypeScript no pipeline

TypeScript é suficiente para orquestração, validação, manifests e integração com Node:

- `sharp` para resize, trim, WebP, AVIF e PNG otimizado;
- validação de dimensões, peso e nomes;
- geração de manifests com variantes;
- agrupamento por scopes;
- integração com CI e Docker;
- relatórios JSON para QA.

O pipeline TypeScript deve falhar quando:

- PNG final exceder orçamento sem justificativa;
- imagem runtime vier de `raw-assets/`;
- símbolo definido no config não possuir asset;
- variante moderna não for menor que fallback;
- textura exceder limite do perfil de qualidade.

## Rust e WASM

Rust entra quando houver ganho real de performance, paralelismo ou qualidade de codec:

- `oxipng`: otimização PNG sem perdas, útil como etapa final ou verificação de CI;
- `pngquant`/quantização: redução com perdas controladas para PNG quando fizer sentido;
- `ravif`/AVIF: alternativa para codificação AVIF mais controlada;
- WebAssembly com `wasm-bindgen`: processamento pesado no browser ou em workers sem bloquear a thread principal;
- módulos Rust nativos no CI: batch grande de assets, execução paralela e builds reprodutíveis.

Rust não deve substituir TypeScript para regras de negócio, manifests ou integração com o monorepo. Ele deve ser uma ferramenta especializada do pipeline.

## Orçamentos iniciais

```txt
Símbolo individual:
  ideal: < 80 KB
  alerta: > 150 KB
  falha: > 300 KB

Atlas base:
  ideal: < 2 MB
  alerta: > 4 MB
  falha: > 8 MB

Background:
  ideal: < 500 KB
  alerta: > 1 MB
  falha: > 2 MB

Áudio base total:
  ideal: < 1 MB
  alerta: > 2 MB
  falha: > 4 MB
```

Esses números são ponto de partida. O CI deve evoluir para medir gzip/brotli, bytes reais de assets, tempo de decode e tempo até jogável.

## Decisão para o projeto

O runtime não deve depender de PNG pesado quando AVIF/WebP preservarem qualidade. PNG fica como fonte intermediária ou fallback. Pixi consome assets otimizados por manifest, e Cocos consome bundles equivalentes. A qualidade final deve ser verificada visualmente, porque compressão boa no arquivo pode ser ruim para símbolos com bordas, brilho, texto ou transparência.
