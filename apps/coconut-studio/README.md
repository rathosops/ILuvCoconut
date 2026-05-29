# ILuvCoconut Studio

Interface local/web para preparar assets e montar slots.

## Desenvolvimento web

```bash
pnpm --filter @iluvcoconut/studio dev
```

Abre em `http://localhost:5174`.

## Desktop local

O shell desktop usa Tauri v2: frontend TypeScript/Vite e backend Rust mínimo.

```bash
pnpm --filter @iluvcoconut/studio tauri dev
```

No Linux, instale os pré-requisitos do Tauri, incluindo WebKitGTK. No Windows, o runtime usa WebView2.
