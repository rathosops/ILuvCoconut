# Visão geral do ILuvCoconut

O ILuvCoconut é uma engine frontend para produção em massa de slots web. O projeto não deve ser apenas um jogo; ele deve ser uma base reutilizável para criar vários jogos com variações de tema, grade, paytable, animação e apresentação.

## Decisão principal

ILuvCoconut será uma engine própria, não um projeto preso a um framework específico.

```txt
ILuvCoconut Core
  -> define estado, contratos, timeline, layout, assets e eventos

Coconut Pixi
  -> desenha usando PixiJS

Coconut Cocos
  -> desenha usando Cocos Creator
```

## Por que PixiJS e Cocos

PixiJS é o renderer principal porque é web-native, funciona em Linux, funciona em CI/CD e é orientado a renderização 2D acelerada por GPU. A documentação oficial descreve PixiJS como uma engine HTML5 com renderizador 2D WebGL flexível e rápido, e a arquitetura v8 usa renderer com WebGPU ou WebGL sob o capô.

Cocos Creator entra como renderer/editor opcional para times que precisam de cena visual, prefabs e autoria no editor. Porém, o projeto não pode depender dele como pipeline principal, porque o Creator/Dashboard é suportado oficialmente em Windows/macOS, não como fluxo Linux-first.

## Fronteira do projeto

O ILuvCoconut cuida de:

- runtime frontend;
- renderização;
- criação de cenas/reels/símbolos;
- configuração de jogos;
- assets e manifests;
- detecção e crop de símbolos brutos via Coconut Vision;
- fixtures e mocks;
- build web;
- QA visual;
- CI/CD frontend.

O ILuvCoconut não cuida, neste momento, de:

- RGS;
- wallet;
- autenticação;
- débito/crédito;
- RNG real;
- liquidação de rodada;
- operação de cassino.

Essas partes devem ser integradas futuramente por contratos como `SpinProvider`, sem reescrever o frontend.
