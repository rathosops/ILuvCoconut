# Coconut Cocos Player

Este diretório é reservado para o projeto Cocos Creator.

O Cocos Creator não é a dependência central do ILuvCoconut. Ele é um renderer/editor opcional para times que trabalham em Windows/macOS e precisam de cena visual, prefabs e ferramentas do Creator.

A implementação real do adapter Cocos deve importar o Coconut Core, implementar `ICoconutRenderer` com APIs do módulo `cc`, e manter regras de jogo fora dos componentes Cocos.
