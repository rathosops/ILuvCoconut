# CI/CD

## Pipeline principal

O pipeline principal é Linux-first usando PixiJS.

```txt
install
typecheck
lint
validate configs
validate assets
headless tests
build pixi
browser smoke test
performance budget
deploy static artifact
```

## Pipeline atual

O workflow inicial em `.github/workflows/ci.yml` executa:

```txt
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint:ci
pnpm validate
pnpm build:pixi
```

`pnpm lint:ci` usa `--max-warnings=0`, então avisos de lint também bloqueiam pull requests. Em ambientes limpos, `typecheck` deve rodar antes do lint porque os manifests dos pacotes workspace apontam para `dist`. A evolução natural da esteira é adicionar testes headless, smoke tests de browser e budgets de performance conforme o runtime Pixi ganhar mais superfície visual.

## Docker

O projeto possui um `Dockerfile` multi-stage:

- `dev`: ambiente Node/pnpm para desenvolvimento com Vite;
- `quality`: ambiente para lint, typecheck e validação;
- `build`: executa lint, typecheck, validate e build Pixi;
- `production`: serve `apps/player-pixi/dist` com Nginx.

O `compose.yml` define:

- `player-pixi`: ambiente de desenvolvimento em `http://localhost:3000`;
- `quality`: checks locais isolados em container;
- `web`: build estático de produção em `http://localhost:8080`.

Comandos:

```bash
docker compose up player-pixi
docker compose --profile tools run --rm quality
docker compose --profile production up web
docker build --target production -t iluvcoconut/player-pixi:local .
```

No Windows, usar Docker Desktop com backend WSL2. O projeto define `.gitattributes` com LF por padrão para evitar divergências de line endings entre Windows e Linux.

## Dependabot

O projeto possui `.github/dependabot.yml` para manter atualizados:

- GitHub Actions;
- dependências npm/pnpm da raiz;
- dependências do player Pixi;
- dependências da extensão Cocos.

Atualizações relacionadas são agrupadas para reduzir ruído em pull requests, especialmente ESLint, TypeScript, Vite e PixiJS.

## Pipeline Cocos

O pipeline Cocos é opcional e deve rodar em ambiente compatível com Cocos Creator.

```txt
validate
export-cocos
run Cocos Creator CLI
post-process output
generate release manifest
```

## Artefatos

Cada build deve gerar um release manifest:

```json
{
  "project": "ILuvCoconut",
  "gameId": "fruit-classic",
  "version": "0.1.0",
  "renderer": "pixi",
  "environment": "staging",
  "gitSha": "abc123",
  "buildTime": "2026-05-29T00:00:00.000Z",
  "entrypoint": "index.html"
}
```

## Deploy

O build Pixi deve ser um artefato estático. Isso facilita deploy em:

- CDN;
- S3/CloudFront;
- Cloudflare Pages;
- Nginx;
- qualquer hosting estático.
