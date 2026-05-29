# Assets e bundles

## Ingestão local

`raw-assets/` é uma área local de trabalho para arquivos brutos recebidos de arte, bancos de imagem ou fornecedores. Esse diretório não deve ser commitado, porque pode conter arquivos grandes, licenciados, temporários, duplicados ou ainda sem tratamento.

Exemplos locais usados para validar o pipeline:

```txt
raw-assets/77-base-slot/
raw-assets/default-base-slot/
raw-assets/miner-base-slot/
```

Esses exemplos representam três casos comuns em slots:

- folhas rasterizadas com vários símbolos em uma única imagem;
- arquivo vetorial de origem, como EPS, que precisa ser exportado para PNG/WebP/TIFF antes do processamento automático;
- imagens com fundo sólido que podem exigir remoção de fundo ou recorte de bordas.

`raw-assets/` deve ser tratado como caixa de entrada, não como fonte final do jogo.

## Entrada do jogo

Cada jogo deve fornecer assets em uma estrutura padronizada:

```txt
games/<game-id>/assets/raw/
  symbols/
  backgrounds/
  ui/
  audio/
```

Depois do tratamento, os símbolos recortados e normalizados devem ser salvos no jogo correto, por exemplo:

```txt
games/<game-id>/assets/raw/symbols/
  cherry.png
  lemon.png
  seven.png

games/<game-id>/assets/raw/backgrounds/
games/<game-id>/assets/raw/ui/
games/<game-id>/assets/raw/audio/
```

O pipeline deve gerar saídas otimizadas para Pixi e Cocos.

```txt
games/<game-id>/assets/optimized/
  common/
  pixi/
  cocos/
```

## Processamento de imagens brutas

O pipeline inicial suporta inspeção e fatiamento por grid de spritesheets rasterizados:

```bash
pnpm assets:inspect-raw
pnpm ilc raw:inspect raw-assets
pnpm ilc raw:slice-grid raw-assets/default-base-slot/source.jpg games/fruit-classic/assets/raw/symbols 5 3 fruit-classic
pnpm assets:optimize-image raw-assets/default-base-slot/source.jpg games/fruit-classic/assets/optimized/pixi symbol-test 512
```

`raw:slice-grid` gera PNGs separados usando:

- quantidade de colunas e linhas;
- recorte por célula;
- `trim` de borda;
- tentativa controlada de remover fundo branco com alpha.

`raw:optimize-image` gera variantes AVIF, WebP e PNG otimizado. PNG não deve ser a primeira escolha para runtime web quando AVIF/WebP mantiverem qualidade visual com menos bytes.

Fundos complexos, sombras acopladas ao fundo, símbolos parcialmente sobrepostos ou imagens com iluminação irregular exigem uma etapa manual, ferramenta artística ou modelo de segmentação antes de entrar no pipeline automático. A automação do ILuvCoconut não deve mascarar asset ruim como se fosse asset pronto.

## Regras para spritesheets

- Preferir sprites em grade regular quando o arquivo vier como imagem única.
- Manter margem e espaçamento consistentes entre células.
- Exportar símbolos finais com alpha real em PNG quando houver transparência.
- Converter runtime para AVIF/WebP e manter PNG como fallback ou fonte intermediária.
- Preservar sombras e brilhos como camadas ou efeitos separados quando forem reutilizáveis.
- Nomear símbolos com IDs estáveis, em minúsculas e sem espaços.
- Gerar atlas com padding/extrude para evitar vazamento de pixels em escala, mipmap ou movimento.
- Separar assets base, features e lazy loading para reduzir carregamento inicial.

## Manifest Coconut

O manifest próprio do ILuvCoconut é o contrato entre config, assets e renderers.

```json
{
  "gameId": "fruit-classic",
  "version": "0.1.0",
  "assets": [
    {
      "id": "symbol.cherry",
      "type": "image",
      "src": "assets/optimized/pixi/symbols.webp#cherry",
      "scope": "base"
    }
  ]
}
```

## Pixi

O pipeline Pixi deve gerar:

- spritesheets;
- atlases JSON;
- WebP/AVIF quando suportado;
- manifests compatíveis com `Assets`;
- fallback quando necessário.

Pixi deve consumir atlases e manifests gerados, não arquivos soltos de `raw-assets/`.

## Cocos

O pipeline Cocos deve gerar:

- resources/bundles organizados;
- configuração para Asset Bundles;
- assets compartilhados com prioridade adequada;
- opção de bundle remoto/versionado.

Cocos pode usar Auto Atlas/Asset Bundles no projeto Creator, mas a lógica de seleção e identidade dos assets continua vindo dos manifests do ILuvCoconut.

## Regra

O asset pipeline deve bloquear build quando:

- símbolo definido em config não possui asset;
- asset é pesado demais;
- dimensões fogem do padrão;
- nome contém caracteres inconsistentes;
- fixture referencia símbolo inexistente.
- `raw-assets/` é usado diretamente por config, theme ou manifest final.
- arquivo vetorial, como EPS, é enviado diretamente para runtime web sem exportação raster adequada.
