# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

WORKDIR /workspace

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/player-pixi/package.json apps/player-pixi/package.json
COPY apps/coconut-studio/package.json apps/coconut-studio/package.json
COPY apps/player-cocos/extensions/iluvcoconut-cocos-builder/package.json apps/player-cocos/extensions/iluvcoconut-cocos-builder/package.json
COPY packages/coconut-asset-pipeline/package.json packages/coconut-asset-pipeline/package.json
COPY packages/coconut-cli/package.json packages/coconut-cli/package.json
COPY packages/coconut-contracts/package.json packages/coconut-contracts/package.json
COPY packages/coconut-core/package.json packages/coconut-core/package.json
COPY packages/coconut-renderer-api/package.json packages/coconut-renderer-api/package.json
COPY packages/coconut-renderer-cocos/package.json packages/coconut-renderer-cocos/package.json
COPY packages/coconut-renderer-pixi/package.json packages/coconut-renderer-pixi/package.json
COPY packages/coconut-test-tools/package.json packages/coconut-test-tools/package.json

RUN pnpm install --frozen-lockfile

FROM deps AS dev

ENV HOST=0.0.0.0
ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true

COPY . .

EXPOSE 5173

CMD ["pnpm", "dev:pixi"]

FROM deps AS quality

COPY . .

CMD ["pnpm", "lint:ci"]

FROM deps AS build

COPY . .

RUN pnpm typecheck
RUN pnpm lint:ci
RUN pnpm validate
RUN pnpm build:pixi

FROM nginx:1.27-alpine AS production

COPY infra/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/apps/player-pixi/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
