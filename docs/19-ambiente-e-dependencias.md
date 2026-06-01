# Ambiente e dependências

Este documento descreve as dependências para desenvolver o ILuvCoconut em Linux e Windows. O fluxo principal do projeto continua Linux-first, mas o runtime web e o Studio também podem ser executados no Windows com as dependências corretas.

Referências oficiais:

- Tauri v2 prerequisites: https://v2.tauri.app/start/prerequisites/
- Tauri WebView versions: https://v2.tauri.app/reference/webview-versions/
- Rust install: https://www.rust-lang.org/tools/install
- pnpm install: https://pnpm.io/installation

## Dependências comuns

Obrigatórias:

- Git.
- Node.js LTS.
- npm, instalado junto com Node.js.
- pnpm 9.15.0, conforme `packageManager` no `package.json`.
- Rust stable via `rustup`.
- Cargo, instalado junto com Rust.

O projeto aceita duas formas de chamar pnpm:

```bash
npx -y pnpm@9.15.0 <comando>
```

ou, se pnpm estiver instalado/global via Corepack:

```bash
pnpm <comando>
```

Para habilitar pnpm via Corepack:

```bash
corepack enable
corepack prepare pnpm@9.15.0 --activate
```

Instale Rust com `rustup`:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Depois reabra o terminal e confira:

```bash
node -v
npm -v
cargo --version
rustc --version
```

## Linux

### Arch Linux

Para rodar o Studio via Tauri no Arch, instale as dependências de sistema recomendadas pelo Tauri:

```bash
sudo pacman -Syu
sudo pacman -S --needed \
  webkit2gtk-4.1 \
  base-devel \
  curl \
  wget \
  file \
  openssl \
  appmenu-gtk-module \
  libappindicator-gtk3 \
  librsvg \
  xdotool
```

Dependências úteis para o fluxo completo:

```bash
sudo pacman -S --needed git nodejs npm rustup docker docker-compose make
```

Configure Rust, se ainda não estiver configurado:

```bash
rustup default stable
```

Se for usar Docker:

```bash
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"
```

Depois faça logout/login para o grupo `docker` entrar em vigor.

### Debian/Ubuntu

Para Tauri no Debian/Ubuntu:

```bash
sudo apt update
sudo apt install \
  libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

Instale também Git, Node.js LTS, npm, Rust e Docker conforme a política da distribuição ou as instruções oficiais dos projetos.

### Wayland, Hyprland e NVIDIA

Em alguns ambientes Wayland com WebKitGTK, especialmente Hyprland/NVIDIA, o app Tauri pode fechar com erro parecido com:

```txt
Gdk-Message: Error 71 (Protocol error) dispatching to Wayland display.
```

Use o alvo do Makefile que força X11/XWayland e desabilita DMABUF no WebKit:

```bash
make studio-tauri-linux
```

Comando equivalente:

```bash
env GDK_BACKEND=x11 WEBKIT_DISABLE_DMABUF_RENDERER=1 npx -y pnpm@9.15.0 studio:tauri dev
```

## Windows

O runtime web funciona no Windows com Node.js, pnpm e os comandos npm/pnpm. Para o Studio desktop com Tauri, instale também as dependências nativas.

Obrigatório:

- Git for Windows.
- Node.js LTS.
- Rust via `rustup-init.exe`.
- Microsoft C++ Build Tools com a opção `Desktop development with C++`.
- Microsoft Edge WebView2 Runtime.

No Windows 10 versão 1803 ou superior e no Windows 11, o WebView2 normalmente já vem instalado. Se não estiver, instale o `Evergreen Bootstrapper` do WebView2 Runtime.

Instale Rust pelo instalador oficial do Windows ou via PowerShell:

```powershell
winget install --id Rustlang.Rustup
```

Use a toolchain MSVC:

```powershell
rustup default stable-msvc
```

Instale pnpm via Corepack:

```powershell
corepack enable
corepack prepare pnpm@9.15.0 --activate
```

Em seguida, na raiz do projeto:

```powershell
pnpm install
pnpm dev:studio
pnpm studio:tauri dev
```

Se o `make` não estiver disponível no Windows, use os comandos `pnpm` diretamente. Outra opção é usar WSL2 para o fluxo Linux.

## Docker

Docker é opcional, mas útil para manter ambiente isolado.

Comandos principais:

```bash
docker compose up player-pixi
docker compose up studio
docker compose --profile tools run --rm quality
docker build --target production -t iluvcoconut/player-pixi:local .
```

No Docker:

- player Pixi: `http://localhost:3000`;
- Coconut Studio: `http://localhost:3002`.

## Makefile

O projeto possui um `Makefile` na raiz para reduzir digitação. Por padrão, ele usa:

```make
PNPM ?= npx -y pnpm@9.15.0
```

Isso permite rodar os comandos mesmo quando `pnpm` não está instalado globalmente.

Comandos úteis:

```bash
make help
make install
make dev-studio
make studio-tauri-linux
make dev-pixi
make typecheck
make lint
make validate
make rust-test
make quality
make build
make docker-studio
make docker-stop-studio
```

Se quiser usar um pnpm global:

```bash
make PNPM=pnpm dev-studio
```

## Primeiro setup recomendado

Linux:

```bash
make install
make typecheck
make lint
make validate
make rust-test
make dev-studio
```

Tauri em Arch/Hyprland/NVIDIA:

```bash
make docker-stop-studio
make studio-tauri-linux
```

Windows PowerShell:

```powershell
pnpm install
pnpm typecheck
pnpm lint:ci
pnpm validate
pnpm rust:test
pnpm dev:studio
```
