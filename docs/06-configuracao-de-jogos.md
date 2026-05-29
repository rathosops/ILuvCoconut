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

## fixtures

Fixtures são essenciais para QA visual:

- no-win;
- small-win;
- big-win;
- scatter anticipation;
- free-spins;
- erro de provider.

## Regra

O player deve conseguir executar fixtures específicas por query string no futuro:

```txt
?fixture=big-win
?quality=low
?debug=1
```
