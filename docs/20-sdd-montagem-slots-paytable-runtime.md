# SDD: Montagem de slots, paytable e runtime visual

## Objetivo

Evoluir o Coconut Studio de uma ferramenta de preparo de assets para uma ferramenta de autoria inicial de slots. Depois que as figuras foram detectadas, revisadas, redimensionadas e removidas quando necessario, o usuario deve conseguir transformar esse conjunto de simbolos em uma definicao jogavel:

- escolher quais simbolos entram no jogo;
- ordenar os simbolos para desenho, reels, paytable e exportacao;
- definir grade do slot, resolucao e comportamento responsivo;
- montar a paytable e as regras de pagamento;
- visualizar e validar o JSON final antes de exportar;
- gerar contratos compatíveis com `game.config.json`, `theme.config.json`, `paytable.config.json`, fixtures e runtime Pixi.

O foco desta fase e slot. Bingo, pachinko e projeto livre continuam como templates conceituais no Studio, mas a implementacao jogavel inicial deve priorizar `projectType: "slot"`.

## Contexto atual

O projeto ja possui as bases necessarias:

- `docs/00-visao-geral.md`: define ILuvCoconut como engine frontend para producao em massa de slots web.
- `docs/01-arquitetura.md`: separa Coconut Core, Renderer API, Pixi, Cocos, runtime e state machine.
- `docs/04-assets-e-bundles.md`: define manifest, assets raw/optimized e regra de nao usar `raw-assets/` no runtime.
- `docs/06-configuracao-de-jogos.md`: estabelece `game.config.json`, `theme.config.json`, `paytable.config.json` e fixtures.
- `docs/13-coconut-studio.md`: define Studio como interface web/local de autoria e preparo visual.
- `docs/16-sdd-deteccao-figuras-coconut-studio.md` e `docs/17-sdd-coconut-vision.md`: cobrem deteccao, crop e revisao de figuras.
- `docs/18-guia-coconut-studio.md`: descreve importacao, autofiguras, resize manual, remocao e export plan.

A lacuna atual esta depois do `Exportar plano`: o plano contem frames e parametros de deteccao, mas ainda nao vira uma configuracao completa de slot.

## Escopo

Inclui:

- editor de simbolos com IDs, nomes, tipo, ordem e asset frame;
- editor de grade do slot;
- editor de resolucao e perfis desktop/mobile;
- editor de paytable;
- definicao inicial de paylines e regras de avaliacao;
- painel de preview do JSON exportado;
- contrato de exportacao para configs finais;
- preparacao do runtime Pixi para consumir configs geradas.

Fora desta fase:

- RNG real;
- RGS, wallet, settlement e certificacao matematica;
- RTP certificado;
- simulador estatistico completo;
- bonus complexos, free spins e jackpots progressivos;
- editor visual completo de cenas com timeline;
- build final Cocos.

Esses itens devem ficar previstos nos contratos, mas nao bloquear a primeira implementacao.

## Decisoes

### 1. Configuracao e fonte de verdade

O Studio deve editar uma estrutura em memoria chamada `SlotProjectDraft`. Esse draft exporta para arquivos de jogo, mas nao substitui os contratos finais do core.

```txt
SlotProjectDraft
  -> game.config.json
  -> theme.config.json
  -> paytable.config.json
  -> fixtures/*.json
  -> asset manifest futuro
```

O draft pode conter metadados de UI, mas os arquivos finais devem ser limpos, serializaveis e independentes do Studio.

### 2. Paytable e regras sao frontend/demo

`paytable.config.json` define comportamento visual e avaliacao local para fixtures, demos e QA. Matematica final, RTP certificado e settlement pertencem ao RGS futuro. O frontend deve ser capaz de apresentar premios recebidos de um provider externo sem recalcular dinheiro real.

### 3. Runtime consome contratos, nao estado do Studio

O player Pixi deve carregar `games/<game-id>` por config e manifest. Ele nao deve importar codigo do Studio nem depender de `raw-assets/`.

### 4. Ordem de desenho deve ser explicita

Slots tem muitas camadas. A ordem inicial deve ser configuravel:

```txt
background
reelFrame
reelMask
symbols
symbolEffects
winLines
ui
modal
debugOverlay
```

Simbolos tambem precisam de ordem estavel para:

- nomeacao de assets;
- ordem visual no editor;
- ordem da paytable;
- ordem de fallback no runtime;
- fixtures deterministicas.

## Arquitetura desejada

```txt
Coconut Studio
  -> Asset Studio
      -> detecta/revisa frames
      -> cria SymbolDraft[]
  -> Slot Builder
      -> grade, resolucao, reels, layout
      -> paytable e paylines
      -> preview JSON
  -> Export
      -> game.config.json
      -> theme.config.json
      -> paytable.config.json
      -> fixtures
      -> asset plan

Coconut Core
  -> valida configs
  -> avalia spin demo/fixture
  -> planeja timeline sem conhecer Pixi

Coconut Pixi
  -> carrega manifest/assets
  -> monta stage
  -> desenha reels/simbolos/UI
  -> executa timeline
```

## Contratos de draft no Studio

### Projeto

```ts
type GameProjectType = 'slot' | 'bingo' | 'pachinko' | 'free';
type OrientationMode = 'portrait' | 'landscape' | 'responsive';

interface SlotProjectDraft {
  schemaVersion: 1;
  projectType: 'slot';
  gameId: string;
  title: string;
  language: 'pt' | 'en' | 'es';
  symbols: SymbolDraft[];
  slot: SlotDraft;
  paytable: PaytableDraft;
  theme: ThemeDraft;
  exportPlan: StudioExportPlan;
}
```

### Simbolos

Cada figura revisada deve virar um simbolo editavel.

```ts
type SymbolRole = 'regular' | 'wild' | 'scatter' | 'bonus' | 'multiplier' | 'decorative';

interface SymbolDraft {
  id: string;
  label: string;
  role: SymbolRole;
  order: number;
  frame: FrameRect;
  assetKey: string;
  source: {
    imageName: string | null;
    detectionBackend: DetectionBackend;
    detectionIndex: number;
  };
  render: {
    layer: 'symbols' | 'symbolEffects' | 'ui';
    anchorX: number;
    anchorY: number;
    fit: 'contain' | 'cover' | 'native';
  };
}
```

Regras:

- `id` deve ser estavel, minusculo e sem espacos: `symbol.cherry`, `symbol.wild`, `symbol.scatter`.
- `order` deve controlar a ordem no painel, na paytable e no JSON.
- Um simbolo pode existir no asset sheet, mas ficar `decorative` e nao entrar na paytable.
- Frames removidos no Studio nao devem aparecer em `symbols`.

### Grade e resolucao

```ts
interface SlotDraft {
  reels: number;
  rows: number;
  visibleRows: number;
  cellWidth: number;
  cellHeight: number;
  reelGap: number;
  rowGap: number;
  spinDirection: 'vertical' | 'horizontal';
  defaultBet: number;
  paylinesMode: 'fixed' | 'ways';
  layout: LayoutDraft;
}

interface LayoutDraft {
  designWidth: number;
  designHeight: number;
  orientation: OrientationMode;
  safeArea: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  breakpoints: Array<{
    id: 'mobile' | 'tablet' | 'desktop';
    minWidth: number;
    maxWidth?: number;
    scaleMode: 'fit' | 'fill' | 'fixed';
    reelsRect: { x: number; y: number; width: number; height: number };
    uiSlots: Record<string, { x: number; y: number; width: number; height: number }>;
  }>;
}
```

Defaults para primeira entrega:

- grade: `5x3`;
- resolucao desktop: `1920x1080`;
- resolucao mobile portrait: `1080x1920`;
- `scaleMode: "fit"` para preservar proporcao;
- `visibleRows = rows`;
- `paylinesMode: "fixed"` antes de implementar `ways`.

## Paytable

### Modelo

```ts
interface PaytableDraft {
  currencyMode: 'credits';
  lineBet: number;
  paylines: PaylineDraft[];
  symbolPays: SymbolPayDraft[];
  rules: SlotRuleDraft;
}

interface SymbolPayDraft {
  symbolId: string;
  role: SymbolRole;
  payouts: Array<{
    count: number;
    multiplier: number;
  }>;
}

interface PaylineDraft {
  id: string;
  enabled: boolean;
  order: number;
  pattern: number[];
}

interface SlotRuleDraft {
  evaluation: 'leftToRight' | 'rightToLeft' | 'bothWays';
  minMatch: number;
  wildSubstitutes: boolean;
  scatterPaysAnywhere: boolean;
  bonusTriggersAnywhere: boolean;
  highestWinOnlyPerLine: boolean;
}
```

Exemplo inicial:

```json
{
  "currencyMode": "credits",
  "lineBet": 1,
  "paylines": [
    { "id": "line.01", "enabled": true, "order": 0, "pattern": [1, 1, 1, 1, 1] },
    { "id": "line.02", "enabled": true, "order": 1, "pattern": [0, 0, 0, 0, 0] },
    { "id": "line.03", "enabled": true, "order": 2, "pattern": [2, 2, 2, 2, 2] }
  ],
  "rules": {
    "evaluation": "leftToRight",
    "minMatch": 3,
    "wildSubstitutes": true,
    "scatterPaysAnywhere": true,
    "bonusTriggersAnywhere": true,
    "highestWinOnlyPerLine": true
  }
}
```

### UX da paytable

O editor deve evitar uma tabela gigante sem contexto. A interface deve separar:

- lista de simbolos ordenaveis;
- papel do simbolo (`regular`, `wild`, `scatter`, `bonus`);
- payouts por quantidade;
- linhas habilitadas;
- regras globais;
- preview de resultado calculado para uma fixture.

Para produtividade:

- botao `Gerar paytable base` usando ordem dos simbolos;
- valores iniciais decrescentes por raridade;
- duplicar linha de pagamento;
- validar simbolo sem payout;
- destacar conflito: wild sem regra de substituicao, scatter sem regra anywhere, etc.

## Export JSON preview

O Studio deve adicionar um workspace/painel `JSON` ou uma aba no inspector para visualizar o resultado antes de copiar/exportar.

Funcionalidades:

- mostrar JSON formatado com `2` espacos;
- alternar entre `Export plan`, `game.config`, `theme.config`, `paytable.config` e `fixture`;
- botao `Copiar JSON`;
- indicador de validade;
- lista de problemas antes do JSON quando houver erro;
- diff simples entre draft atual e ultima exportacao.

O preview deve usar a mesma funcao que gera a exportacao. Nao deve existir uma segunda serializacao apenas para tela.

## Arquivos finais esperados

### `game.config.json`

Responsavel por regra estrutural do jogo:

```json
{
  "schemaVersion": 1,
  "gameId": "fruit-classic",
  "type": "slot",
  "slot": {
    "reels": 5,
    "rows": 3,
    "cellWidth": 220,
    "cellHeight": 220,
    "paylinesMode": "fixed"
  },
  "layout": {
    "designWidth": 1920,
    "designHeight": 1080,
    "orientation": "responsive"
  },
  "symbols": ["symbol.blueberry", "symbol.raspberry", "symbol.apple"]
}
```

### `theme.config.json`

Responsavel por apresentacao:

```json
{
  "schemaVersion": 1,
  "gameId": "fruit-classic",
  "layers": ["background", "reelFrame", "symbols", "symbolEffects", "winLines", "ui"],
  "symbols": {
    "symbol.blueberry": {
      "asset": "symbol.blueberry",
      "fit": "contain",
      "anchor": [0.5, 0.5]
    }
  }
}
```

### `paytable.config.json`

Responsavel por premios e regras demo:

```json
{
  "schemaVersion": 1,
  "gameId": "fruit-classic",
  "currencyMode": "credits",
  "rules": {
    "evaluation": "leftToRight",
    "minMatch": 3,
    "wildSubstitutes": true,
    "scatterPaysAnywhere": true,
    "highestWinOnlyPerLine": true
  },
  "symbolPays": [
    {
      "symbolId": "symbol.blueberry",
      "role": "regular",
      "payouts": [
        { "count": 3, "multiplier": 5 },
        { "count": 4, "multiplier": 20 },
        { "count": 5, "multiplier": 80 }
      ]
    }
  ]
}
```

## Runtime visual

### Core

O Coconut Core deve ganhar um avaliador demo de slot com responsabilidade limitada:

- receber grid final de simbolos;
- receber paytable;
- calcular wins para fixtures e preview;
- gerar eventos semanticos de timeline:
  - `spin.start`;
  - `reel.stop`;
  - `symbol.land`;
  - `win.line.highlight`;
  - `win.amount.countup`;
  - `spin.complete`.

Ele nao deve:

- gerar RNG real;
- decidir saldo;
- fazer settlement;
- conhecer Pixi, DOM ou Cocos.

### Pixi

O renderer Pixi deve:

- carregar assets por manifest;
- criar stage por `layout.designWidth/designHeight`;
- escalar por breakpoint;
- criar reels com pooling de simbolos;
- aplicar masks nos reels;
- respeitar ordem de layers;
- desenhar paylines/win overlays;
- expor debug overlay para grade, FPS e bounds.

### Provider

Primeira entrega pode ter `FixtureSpinProvider`:

```ts
interface SpinProvider {
  spin(request: SpinRequest): Promise<SpinResult>;
}

interface SpinResult {
  outcomeId: string;
  grid: string[][];
  wins: WinLine[];
  totalWin: number;
}
```

Depois, o mesmo contrato pode ser implementado por RGS real.

## Interface do Studio

### Workspaces

O topo do Studio deve evoluir para workspaces reais:

1. `Project`
   - game id;
   - tipo de projeto;
   - idioma;
   - resolucoes;
   - presets.

2. `Assets`
   - importacao;
   - deteccao;
   - resize/remocao;
   - nomeacao e ordem de simbolos.

3. `Slot`
   - grade;
   - reels;
   - layout;
   - ordem de layers.

4. `Paytable`
   - papeis dos simbolos;
   - payouts;
   - paylines;
   - regras de avaliacao.

5. `Preview`
   - mock de spin;
   - fixture selector;
   - simulacao visual Pixi quando disponivel.

6. `JSON`
   - preview formatado;
   - validacao;
   - copiar/exportar.

### Reducao de complexidade

Como o Studio tera muitas opcoes, a UI deve seguir estas regras:

- esconder controles avancados em secoes colapsaveis;
- mostrar problemas em um painel `Validation`, nao espalhados em alertas;
- usar presets para comecar rapido;
- manter inspector contextual ao item selecionado;
- evitar que paytable, layout e assets fiquem no mesmo painel simultaneamente;
- preservar status bar para feedback curto.

## Validacao

Antes de exportar, o draft deve validar:

- `gameId` preenchido;
- pelo menos um simbolo regular;
- IDs de simbolos unicos;
- todo simbolo usado na paytable existe;
- todo payout aponta para `count` valido entre `minMatch` e `reels`;
- paylines tem tamanho igual a `reels`;
- indices de payline ficam entre `0` e `rows - 1`;
- `cellWidth`, `cellHeight`, `designWidth`, `designHeight` maiores que zero;
- mobile e desktop possuem `reelsRect`;
- layer `symbols` existe;
- assets finais nao apontam para `raw-assets/`.

Falhas devem bloquear exportacao final de config, mas nao devem impedir o usuario de salvar/copiar um draft de trabalho.

## Testes

### Unitarios

- serializacao de `SlotProjectDraft`;
- transformacao draft -> `game.config.json`;
- transformacao draft -> `theme.config.json`;
- transformacao draft -> `paytable.config.json`;
- validacao de paylines;
- validacao de payouts;
- avaliacao de win left-to-right;
- wild substituindo regular;
- scatter pagando anywhere;
- `highestWinOnlyPerLine`.

### Integracao

- Studio gera JSON preview identico ao JSON copiado;
- remover/reordenar simbolo atualiza paytable;
- trocar grade de `5x3` para `6x4` invalida paylines antigas;
- fixture gerada roda no player Pixi;
- player carrega `games/fruit-classic` por query string.

### Visual

- desktop `1920x1080`;
- mobile portrait `390x844`;
- mobile landscape `844x390`;
- safe area nao cobre botoes;
- reels centralizados;
- simbolos nao estouram celula;
- paylines sobrepoem simbolos sem cobrir UI principal.

## Plano de entrega

### Fase 1: Contratos e preview JSON

1. Criar tipos `SlotProjectDraft`, `SymbolDraft`, `SlotDraft`, `PaytableDraft`. Iniciado em `@iluvcoconut/contracts`.
2. Criar geradores `createGameConfig`, `createThemeConfig`, `createPaytableConfig`. Iniciado no Studio como camada de draft.
3. Adicionar workspace/painel `JSON`. Iniciado no inspector do Studio.
4. Mostrar export plan atual e configs derivadas. Iniciado com selecao entre export plan, slot draft, game config, theme config e paytable config.
5. Adicionar validacao inicial. Iniciado com validacoes de `gameId`, simbolos, grade e paylines.

### Fase 2: Symbol manager

1. Transformar frames detectados em `SymbolDraft[]`. Iniciado com metadados de simbolo no estado do Studio.
2. Permitir editar `id`, `label`, `role` e `order`. Iniciado no inspector.
3. Permitir reordenacao visual. Iniciado com botoes de subir/descer simbolo.
4. Sincronizar `assetPrefix` com IDs sugeridos. Iniciado para novos simbolos e reset de projeto.
5. Bloquear IDs duplicados. Iniciado na validacao do draft e preview JSON.

### Fase 3: Slot layout

Status: iniciado.

1. Criar workspace `Slot`: iniciado como secao de layout no painel esquerdo do Studio.
2. Editar `reels`, `rows`, tamanho de celula e gaps: implementado.
3. Editar resolucao desktop/mobile: implementado.
4. Adicionar preview de grade do slot separado da spritesheet: pendente.
5. Exportar layout para `game.config.json`: implementado no plano JSON.

### Fase 4: Paytable

Status: iniciado.

1. Criar workspace `Paytable`: iniciado como secao no inspector.
2. Gerar paytable base a partir da ordem de simbolos: implementado.
3. Editar payouts por contagem: implementado para o simbolo selecionado.
4. Editar paylines iniciais: implementado com habilitacao e padrao por linha.
5. Implementar validacao de regras: iniciado no preview JSON.
6. Gerar fixtures `no-win`, `small-win`, `big-win`: iniciado em `paytable.config`.

### Fase 5: Runtime Pixi jogavel

Status: iniciado.

1. Player carrega `games/<game-id>` por query string: implementado para `?game=`.
2. Implementar `FixtureSpinProvider`: implementado no core e consumindo fixture externa.
3. Criar reels visuais reais com pooling: iniciado com celulas reutilizaveis no renderer Pixi.
4. Executar spin mock: implementado por clique usando `?fixture=`.
5. Destacar win lines: iniciado com highlight retangular por posicao vencedora.
6. Expor debug overlay: iniciado com HUD e `?debug=1`.

## Criterios de aceite

- O usuario consegue importar uma folha, detectar figuras, remover falsos positivos e nomear simbolos.
- O usuario consegue escolher grade `5x3`, resolucao desktop/mobile e regras basicas.
- O usuario consegue montar paytable com pelo menos 3, 4 e 5 iguais.
- O painel JSON mostra `game.config`, `theme.config` e `paytable.config`.
- O JSON copiado e exatamente o mesmo exibido no preview.
- O player Pixi consegue abrir uma fixture gerada pelo Studio.
- `pnpm typecheck`, `pnpm lint`, `pnpm validate` e testes relevantes passam.

## Riscos

- A UI pode ficar densa demais se todos os controles aparecerem juntos.
  - Mitigacao: workspaces reais, inspector contextual e secoes colapsaveis.
- Paytable pode ser confundida com matematica certificada.
  - Mitigacao: documentar e marcar como demo/frontend ate integrar RGS.
- Configs podem divergir do runtime.
  - Mitigacao: contratos compartilhados em `@iluvcoconut/contracts` e validacao no CI.
- Mobile pode ser tratado tarde demais.
  - Mitigacao: layout draft ja nasce com breakpoints e safe area.
- Assets podem ser usados direto de `raw-assets/`.
  - Mitigacao: validator bloqueia manifest/config final apontando para `raw-assets/`.

## Relacao com roadmap

Esta SDD deve puxar itens de `MVP 0.2` e `MVP 0.4` para uma trilha mais concreta:

- `MVP 0.2`: asset manifest, fixture selector, layout responsivo, debug overlay.
- `MVP 0.4`: paylines visuais, big win presenter, quality profiles.
- `MVP 1.0`: slot `5x3` production-ready e factory CLI completa.

O primeiro alvo jogavel deve ser um slot `5x3` com simbolos vindos do Coconut Studio, paytable demo, paylines fixas, fixtures e preview Pixi.
