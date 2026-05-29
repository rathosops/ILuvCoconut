# Pipeline de assets brutos

O objetivo do pipeline de assets brutos é transformar insumos artísticos em assets previsíveis para slots. A engine deve conseguir partir de imagens compostas, recortar símbolos, remover fundos simples quando possível e organizar os arquivos dentro do jogo correto.

## Diretório não versionado

`raw-assets/` é ignorado pelo Git e pelo Docker. Ele serve para arquivos temporários ou proprietários recebidos antes do tratamento:

```txt
raw-assets/
  77-base-slot/
  default-base-slot/
  miner-base-slot/
```

Não referencie `raw-assets/` em `theme.config.json`, manifests finais ou código runtime. O destino correto é sempre `games/<game-id>/assets/...`.

## Fluxo recomendado

1. Colocar arquivos recebidos em `raw-assets/<source-name>/`.
2. Rodar inspeção para listar formatos, dimensões e arquivos não suportados.
3. Rasterizar arquivos vetoriais como EPS para PNG/WebP/TIFF com ferramenta artística.
4. Fatiar spritesheets por grid quando os símbolos estiverem em células regulares.
5. Remover fundo branco apenas quando ele for realmente sólido.
6. Revisar visualmente os PNGs gerados.
7. Salvar símbolos, backgrounds, UI e áudio em `games/<game-id>/assets/raw/`.
8. Gerar saídas otimizadas em `games/<game-id>/assets/optimized/`.

## Comandos

Inspecionar fontes brutas:

```bash
pnpm assets:inspect-raw
pnpm ilc raw:inspect raw-assets
```

Fatiar uma imagem em grid:

```bash
pnpm ilc raw:slice-grid \
  raw-assets/default-base-slot/source.jpg \
  games/fruit-classic/assets/raw/symbols \
  5 \
  3 \
  fruit-classic
```

O comando gera PNGs numerados em `games/fruit-classic/assets/raw/symbols/`.

## Limites da automação

A remoção automática de fundo só é confiável para fundos simples, principalmente branco sólido. Fundos com textura, gradiente, sombra misturada ao objeto ou reflexos precisam de tratamento artístico ou segmentação especializada antes do recorte final.

EPS não deve ir para runtime web. Ele deve ser usado como fonte de autoria e exportado para raster antes do pipeline automático.

## Studio e auto-detect

O Coconut Studio possui detecção inicial de figuras no browser usando diferença de cor em relação ao fundo e componentes conectados. Esse caminho é útil para spritesheets como os exemplos de slot em que há vários símbolos sobre uma base visual parecida.

Use o auto-detect para acelerar o trabalho, mas revise visualmente cada frame. Quando o resultado não for bom, volte para grid manual ou ajuste tolerância/área mínima. Para casos mais difíceis, o Studio pode carregar OpenCV.js sob demanda para uma segmentação mais robusta sem aumentar o bundle inicial.

Para recortes de produção, a saída final ainda deve passar pelo pipeline CLI/Tauri e validação de assets.

## Boas práticas

- Trabalhar com arquivos fonte em alta resolução.
- Manter grade regular em folhas de símbolos.
- Evitar símbolos encostando uns nos outros.
- Reservar margem e espaçamento entre células.
- Exportar símbolos finais com alpha.
- Usar nomes estáveis: `symbol.cherry`, `symbol.wild`, `symbol.scatter`.
- Separar frames de animação por sequência previsível.
- Gerar atlas com padding/extrude.
- Validar o resultado no Pixi e, quando aplicável, no Cocos.

## Pixi e Cocos

PixiJS deve carregar manifests e atlases gerados. Spritesheets reduzem downloads e ajudam o renderer a desenhar sprites que compartilham a mesma textura.

Cocos Creator pode usar Auto Atlas para empacotar SpriteFrames durante o build. O projeto Cocos deve continuar sendo adapter visual; identidade dos assets e regras do jogo pertencem ao ILuvCoconut.
