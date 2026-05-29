# Boas práticas de desenvolvimento

Este projeto deve priorizar código simples, previsível e fácil de evoluir. O ILuvCoconut é uma engine reutilizável, então decisões locais não devem acoplar lógica de jogo a um renderer específico.

## Regras gerais

- Escrever código claro antes de escrever código esperto.
- Manter funções e classes pequenas, com responsabilidade única.
- Aplicar DRY sem criar abstrações prematuras.
- Aplicar KISS: preferir fluxos explícitos a camadas genéricas sem necessidade real.
- Evitar estado global mutável; dependências devem ser passadas por contratos.
- Tratar erros com mensagens acionáveis para desenvolvimento e QA.
- Nomear variáveis, tipos, comandos e configs pelo domínio do jogo.
- Não duplicar lógica de jogo em PixiJS ou Cocos; lógica pertence ao core.

## Docstrings e comentários

APIs públicas, contratos, classes exportadas e funções com regra de domínio devem possuir docstrings TSDoc. Comentários devem explicar intenção, regra de negócio, restrição técnica ou decisão de performance; não devem narrar uma linha de código óbvia.

Exemplo:

```ts
/**
 * Planeja comandos visuais a partir de um resultado de spin já resolvido.
 * Não calcula matemática de prêmio; esse dado vem do provider/RGS.
 */
export class WinPresentationPlanner {
  // ...
}
```

## TypeScript

- Manter `strict` ativo.
- Preferir `interface` para contratos públicos e objetos extensíveis.
- Preferir `type` para unions, aliases e tipos utilitários.
- Usar `import type` para tipos.
- Evitar `any`; quando a forma do dado é desconhecida, usar `unknown` e validar.
- Modelar estados com unions literais em vez de strings soltas.
- Manter configs serializáveis e independentes de classes.
- Não ignorar erros do TypeScript sem uma justificativa curta e verificável.
- Rodar `pnpm lint`, `pnpm typecheck` e `pnpm validate` antes de abrir PR.

## ESLint

A configuração do projeto usa ESLint flat config com regras TypeScript type-aware. A intenção é bloquear problemas de contrato, promises esquecidas, imports de tipo incorretos e funções exportadas sem retorno explícito.

Comandos:

```bash
pnpm lint
pnpm lint:ci
pnpm lint:fix
```

`pnpm lint:ci` deve ser usado em CI porque falha quando existem warnings.

## PixiJS

- Usar Pixi como renderer principal web e Linux-first.
- Carregar assets via pipeline/manifest; evitar caminhos soltos dentro do renderer.
- Usar spritesheets/atlases para melhorar batching.
- Evitar criar e destruir sprites durante spin; preferir pooling.
- Controlar resolução, `antialias` e perfis de qualidade conforme dispositivo.
- Separar layers previsíveis: background, reels, symbols, win lines, particles, UI, modals e debug.
- Não colocar matemática, paylines ou settlement no renderer Pixi.
- Liberar texturas apenas em transições seguras, nunca durante animações críticas.

## Cocos Creator

- Tratar Cocos como renderer/editor opcional.
- Manter componentes Cocos como adapters finos para o Coconut Core.
- Usar prefabs e cenas para autoria visual, não para duplicar regra de jogo.
- Usar Asset Bundles para separar assets comuns, assets por jogo e features carregadas sob demanda.
- Evitar dependência do Creator no pipeline principal Linux-first.
- Automatizar builds Cocos em runners compatíveis com Windows/macOS quando necessário.

## Arquitetura

- `@iluvcoconut/contracts` define formatos compartilhados.
- `@iluvcoconut/core` coordena runtime, estado e timeline sem importar APIs gráficas.
- `@iluvcoconut/renderer-api` é a fronteira entre core e renderers.
- `@iluvcoconut/pixi` e `@iluvcoconut/cocos` implementam desenho e apresentação.
- `@iluvcoconut/asset-pipeline` valida e gera manifests.

Qualquer mudança que force o core a conhecer PixiJS, Cocos ou detalhes de DOM deve ser rejeitada ou redesenhada.

## Pull requests

Antes de revisar ou integrar uma mudança:

```bash
pnpm lint:ci
pnpm typecheck
pnpm validate
pnpm build:pixi
```

Em clones limpos ou containers, execute `pnpm typecheck` antes de `pnpm lint:ci` para gerar os artefatos `dist` esperados pelos manifests dos pacotes workspace.

Mudanças em contratos compartilhados exigem atenção extra porque afetam core, renderers, CLI, fixtures e documentação.

## Docker e ambiente

- Manter o ambiente Docker como caminho suportado para desenvolvimento local.
- Não versionar `node_modules`, `dist`, `build`, cache de Cocos ou arquivos `.env` reais.
- Não versionar `raw-assets/`; arte bruta, licenciada ou temporária deve ficar fora do Git.
- Usar `.dockerignore` para manter imagens pequenas e builds reproduzíveis.
- Usar `.gitattributes` para padronizar LF no repositório e reduzir diferenças entre Windows e Linux.
- Validar mudanças de infraestrutura com `docker compose --profile tools run --rm quality` quando Docker estiver disponível.
