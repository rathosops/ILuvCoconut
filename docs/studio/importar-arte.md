# Importar arte

1. No editor, abra a aba de modo `Assets`.
2. Clique em `Importar`.
3. Selecione um arquivo PNG ou WebP.

A imagem aparece no centro do modo Assets, pronta para deteccao.

## Escolher o backend de deteccao

Antes de detectar, alterne o backend:

- `Detector leve`: heuristica que roda no browser. Sempre disponivel.
- `Coconut Vision`: backend Rust, mais reproduzivel. Disponivel apenas no app desktop (Tauri). No navegador, o Studio usa o `Detector leve`.

## Proximo passo

Ajuste os sliders `Tolerancia` e `Area` e clique em `Detectar`. Veja `detectar-figuras.md`.
