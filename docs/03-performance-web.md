# Performance web

O ILuvCoconut deve ser otimizado para carregamento rápido e fluidez visual. Slots são jogos simples em aparência, mas exigem consistência: frame spikes durante spin ou big win prejudicam a percepção de qualidade.

## Regras principais

1. Carregar pouco no início.
2. Carregar features sob demanda.
3. Usar spritesheets/atlases sempre que possível.
4. Evitar criar/destruir objetos durante spin.
5. Usar pools para símbolos e elementos recorrentes.
6. Evitar layout recalculado por frame.
7. Controlar descarregamento de texturas em telas seguras.
8. Ter perfis de qualidade.

## Loading em camadas

```txt
Stage 0 — Boot mínimo
  logo, loader, config, manifest

Stage 1 — Base game
  símbolos base, reels, UI principal, sons essenciais

Stage 2 — Nice-to-have
  big win, paytable detalhada, animações extras

Stage 3 — Feature lazy load
  free spins, bônus, cutscenes, partículas pesadas
```

## Budgets iniciais

```txt
Initial JS bundle:
  ideal: < 400 KB gzip
  alerta: > 700 KB gzip
  falha: > 1 MB gzip

Base game assets:
  ideal: < 8 MB
  alerta: > 15 MB
  falha: > 25 MB

Time to playable:
  ideal: < 3s
  alerta: > 5s
  falha: > 8s

FPS:
  alvo: 60
  mínimo aceitável: 30
```

## PixiJS

Para PixiJS, o projeto deve priorizar spritesheets, ordem de renderização favorável a batching, `antialias: false`, controle de resolução e descarte explícito de recursos fora de momentos críticos.

## Cocos

Para Cocos, usar Asset Bundles para reduzir carregamento inicial, separar assets comuns de assets por jogo, e preferir bundles remotos/versionados quando a estratégia de deploy exigir CDN.
