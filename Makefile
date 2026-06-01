PNPM ?= npx -y pnpm@9.15.0
TAURI_LINUX_ENV ?= GDK_BACKEND=x11 WEBKIT_DISABLE_DMABUF_RENDERER=1

.PHONY: help install typecheck lint validate test rust-test quality \
	dev-pixi dev-studio free-studio-port studio-tauri studio-tauri-linux \
	build-pixi build-studio build docker-pixi docker-studio docker-stop-studio \
	docker-quality docker-build docker-prod assets-inspect clean

help:
	@printf '%s\n' 'ILuvCoconut commands'
	@printf '%s\n' ''
	@printf '%s\n' 'Setup:'
	@printf '%s\n' '  make install              Install workspace dependencies'
	@printf '%s\n' ''
	@printf '%s\n' 'Development:'
	@printf '%s\n' '  make dev-pixi             Run Pixi player web app'
	@printf '%s\n' '  make dev-studio           Run Coconut Studio in browser'
	@printf '%s\n' '  make free-studio-port     Stop stale Studio dev server on port 5174'
	@printf '%s\n' '  make studio-tauri         Run Coconut Studio with Tauri'
	@printf '%s\n' '  make studio-tauri-linux   Run Tauri with Linux X11/WebKitGTK workaround'
	@printf '%s\n' ''
	@printf '%s\n' 'Quality:'
	@printf '%s\n' '  make typecheck            Run TypeScript project references'
	@printf '%s\n' '  make lint                 Run ESLint CI mode'
	@printf '%s\n' '  make validate             Validate game configs'
	@printf '%s\n' '  make rust-test            Run Rust workspace tests'
	@printf '%s\n' '  make quality              Run the full project quality gate'
	@printf '%s\n' ''
	@printf '%s\n' 'Build:'
	@printf '%s\n' '  make build-studio         Build Coconut Studio'
	@printf '%s\n' '  make build-pixi           Build Pixi player'
	@printf '%s\n' '  make build                Build both web apps'
	@printf '%s\n' ''
	@printf '%s\n' 'Docker:'
	@printf '%s\n' '  make docker-pixi          Run Pixi player container'
	@printf '%s\n' '  make docker-studio        Run Studio container'
	@printf '%s\n' '  make docker-stop-studio   Stop Studio container'
	@printf '%s\n' '  make docker-quality       Run quality checks in Docker'
	@printf '%s\n' '  make docker-build         Build production Docker image'
	@printf '%s\n' '  make docker-prod          Serve production Docker image'

install:
	$(PNPM) install

typecheck:
	$(PNPM) typecheck

lint:
	$(PNPM) lint:ci

validate:
	$(PNPM) validate

test: rust-test

rust-test:
	$(PNPM) rust:test

quality:
	$(PNPM) quality

dev-pixi:
	$(PNPM) dev:pixi

dev-studio:
	$(PNPM) dev:studio

free-studio-port:
	@docker compose stop studio >/dev/null 2>&1 || true
	@pid=$$(ss -ltnp 'sport = :5174' 2>/dev/null | sed -n 's/.*pid=\([0-9][0-9]*\).*/\1/p' | head -n 1); \
	if [ -n "$$pid" ]; then \
		echo "Stopping stale Coconut Studio dev server on port 5174 (pid $$pid)"; \
		kill -TERM "$$pid" || true; \
		sleep 1; \
	fi

studio-tauri: free-studio-port
	$(PNPM) studio:tauri dev

studio-tauri-linux: free-studio-port
	$(TAURI_LINUX_ENV) $(PNPM) studio:tauri dev

build-pixi:
	$(PNPM) build:pixi

build-studio:
	$(PNPM) build:studio

build: build-studio build-pixi

docker-pixi:
	docker compose up player-pixi

docker-studio:
	docker compose up studio

docker-stop-studio:
	docker compose stop studio

docker-quality:
	docker compose --profile tools run --rm quality

docker-build:
	docker build --target production -t iluvcoconut/player-pixi:local .

docker-prod:
	docker compose --profile production up web

assets-inspect:
	$(PNPM) assets:inspect-raw

clean:
	$(PNPM) clean
