# Criar um projeto

1. No Launcher, clique em `Novo Projeto`.
2. Escolha o `Tipo de jogo`: `Slot`, `Bingo`, `Pachinko` ou `Projeto Livre`.
3. Preencha o `Nome`. Ele gera o slug `res://games/<slug>`.
4. Escolha o `Template`.
5. Escolha o `Renderer`: `Pixi` ou `Cocos`.
6. Defina a `Resolucao`.
7. Defina o `Idioma base` (pt/en/es). Esse e o idioma do jogo, nao da interface do editor.
8. Clique em `Criar projeto`.

O editor abre no projeto recem-criado.

## Onde o projeto fica

- **App desktop (Tauri)**: o comando Rust `create_project` cria a pasta `games/<slug>/`.
- **Web**: o projeto entra na lista de recentes do navegador (`localStorage`).

## Reabrir um projeto

No Launcher, use a busca e os filtros por tipo (`Todos`, `Slot`, `Bingo`, `Pachinko`) e clique no card do projeto.

## Editar as propriedades do projeto

Na Arvore de Cena, selecione o no do jogo. O Inspector permite editar `nome`, `ID`, `prefixo de asset`, `renderer` e `idioma base`.
