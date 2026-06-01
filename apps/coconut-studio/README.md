# ILuvCoconut Studio

Interface local/web para preparar assets e montar jogos de casino web no ILuvCoconut.

## Guia completo

O guia de execução e uso fica em:

```txt
docs/18-guia-coconut-studio.md
```

Ele cobre execução web, execução Tauri, criação de projeto, tipos de jogo, idiomas, importação de imagens, grid manual, autofiguras, backends de detecção, edição manual de frames, preview, exportação de plano JSON e limites atuais. Dependências por sistema ficam em `docs/19-ambiente-e-dependencias.md`.

## Executar na web

Pela raiz do monorepo:

```bash
pnpm dev:studio
```

Ou:

```bash
make dev-studio
```

Ou pelo pacote:

```bash
pnpm --filter @iluvcoconut/studio dev
```

Abre em `http://localhost:5174`.

## Executar no desktop local

O shell desktop usa Tauri v2: frontend TypeScript/Vite e backend Rust com acesso ao `coconut-vision`.

Pela raiz do monorepo:

```bash
pnpm studio:tauri dev
```

Ou:

```bash
make studio-tauri
```

Em Linux com Wayland/Hyprland/NVIDIA:

```bash
make studio-tauri-linux
```

Se aparecer `Port 5174 is already in use`:

```bash
make free-studio-port
make studio-tauri-linux
```

Ou pelo pacote:

```bash
pnpm --filter @iluvcoconut/studio tauri dev
```

No Linux, instale os pré-requisitos do Tauri, incluindo WebKitGTK. No Windows, o runtime usa WebView2.

## Funcionalidades atuais

- Importar PNG, JPEG, WebP e AVIF.
- Criar nova sessão de projeto.
- Definir tipo de jogo: slot, bingo, pachinko ou livre.
- Alternar interface entre português, inglês e espanhol.
- Ajustar recortes por grid manual.
- Detectar figuras automaticamente por conteúdo.
- Alternar entre `Detector leve` no browser e `Coconut Vision` no Tauri.
- Reamostrar cor de fundo.
- Ajustar tolerância e área mínima.
- Selecionar frames no canvas.
- Redimensionar frames detectados com 8 handles.
- Remover frames detectados como falsos positivos.
- Visualizar preview do frame selecionado.
- Alternar fundo claro para revisar bordas e transparência.
- Controlar zoom do canvas.
- Exportar plano JSON para a área de transferência.
