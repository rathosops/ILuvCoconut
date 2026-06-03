# Detectar figuras

Cada figura detectada na arte vira um simbolo do jogo.

1. No modo `Assets`, com a imagem ja importada, escolha o backend (`Detector leve` ou `Coconut Vision`).
2. Ajuste os sliders:
   - `Tolerancia`: o quanto a cor de um pixel pode diferir do fundo para virar figura.
   - `Area`: o tamanho minimo de uma figura, para descartar ruido.
3. Clique em `Detectar`.

O Studio cria um frame para cada figura encontrada e um simbolo correspondente.

## Ajustar um frame

1. Clique num frame para seleciona-lo.
2. Arraste as alcas para redimensionar.
3. No Inspector do frame, edite `X`, `Y`, `Largura` e `Altura`.

## Remover um falso positivo

Selecione o frame e clique em `Descartar` no Inspector.

## Backends

- `Detector leve`: rapido, bom para previa e revisao visual. Exige conferencia.
- `Coconut Vision` (Tauri): caminho preferido para producao, por ser reproduzivel. Indisponivel no navegador, que cai no `Detector leve`.

Os simbolos resultantes aparecem na aba `Simbolos` do BottomPanel e sao usados nos modos Reels, Paytable e Preview.
