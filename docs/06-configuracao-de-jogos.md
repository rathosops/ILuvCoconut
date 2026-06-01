# Configuração de jogos

Novo jogo deve ser criado com configuração, assets e fixtures, não com cópia de código.

## Arquivos principais

```txt
games/<game-id>/
  game.config.json
  theme.config.json
  paytable.config.json
  fixtures/
  assets/
```

## game.config.json

Define grade, símbolos, apostas e comportamento visual básico.

## theme.config.json

Mapeia símbolos, fundos, UI e áudio.

## paytable.config.json

Define linhas, formas de pagamento e multiplicadores. No momento, este arquivo é frontend/demo; matemática real e certificada pertence ao RGS futuro.

O Coconut Studio já possui autoria inicial de paytable demo, incluindo line bet, regras, payouts por símbolo, paylines e fixtures básicas `noWin`, `smallWin` e `bigWin` no preview JSON. A evolução planejada para autoria visual completa de slot, runtime e validações está detalhada em `docs/20-sdd-montagem-slots-paytable-runtime.md`.

## fixtures

Fixtures são essenciais para QA visual:

- no-win;
- small-win;
- big-win;
- scatter anticipation;
- free-spins;
- erro de provider.

## Regra

O player Pixi carrega configs e fixtures por query string:

```txt
?game=fruit-classic
?fixture=big-win
?quality=low
?debug=1
```

Durante desenvolvimento, `apps/player-pixi` serve `/games/<game-id>/...` a partir da pasta `games/` do repositório para manter o runtime desacoplado do Studio.
