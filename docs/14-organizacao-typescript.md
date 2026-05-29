# Organização TypeScript

Esta regra existe para evitar arquivos colossais e funções que acumulam muitas responsabilidades. O objetivo não é dividir código por estética, mas preservar legibilidade, revisão, teste e evolução.

## Referências usadas

- TypeScript Handbook Modules: módulos ES são a unidade natural para organizar código por imports e exports explícitos.
- TypeScript Handbook Modules Theory: a fronteira entre arquivos deve refletir dependências reais e superfícies exportadas claras.
- ESLint `max-lines`: controla arquivos que crescem demais.
- ESLint `max-lines-per-function`: controla funções longas.
- ESLint `complexity`: controla ramificações excessivas.

Links completos estão em `docs/09-links-de-referencia.md`.

## Regra do projeto

- Arquivo TypeScript: até 300 linhas não vazias/não comentadas.
- Função TypeScript: até 90 linhas não vazias/não comentadas.
- Complexidade ciclomática: até 12.
- Números relevantes devem estar em constantes nomeadas.
- O arquivo de entrada de uma aplicação deve orquestrar, não concentrar algoritmo, renderização, template e IO.

Esses limites são aplicados como warnings no ESLint. Como `lint:ci` roda com `--max-warnings=0`, qualquer warning bloqueia CI.

## Como quebrar sem perder organização

Quebre primeiro por responsabilidade concreta:

- `types.ts`: contratos e tipos compartilhados.
- `*Constants.ts`: limites, dimensões, thresholds e valores de domínio.
- `dom.ts`: helpers de DOM, eventos e contexto de canvas.
- `frameMath.ts`: cálculo de coordenadas, grids e seleção.
- `imageDetection.ts`: algoritmos de análise de imagem.
- `canvasRenderer.ts`: desenho e composição visual.
- `exportPlan.ts`: montagem de payloads e comandos.
- `main.ts`: inicialização, estado e ligação entre módulos.

Evite criar um `utils.ts` genérico quando o código tem domínio claro. Um módulo com nome de domínio facilita encontrar regra, testar isoladamente e substituir implementação depois.

## Quando extrair

Extraia código quando uma destas condições aparecer:

- O arquivo mistura template, estado, renderização e algoritmo.
- A função exige rolagem longa para entender entradas e saídas.
- A mesma constante aparece em mais de um lugar.
- O teste unitário ficaria difícil porque a função depende de DOM, canvas ou filesystem sem necessidade.
- Uma mudança pequena exige ler áreas não relacionadas do arquivo.

## Aplicação atual

O Coconut Studio foi dividido em módulos dedicados. O `main.ts` passou a coordenar eventos e estado, enquanto detecção de imagem, matemática de frames, renderização em canvas, template e exportação ficam em arquivos próprios.
