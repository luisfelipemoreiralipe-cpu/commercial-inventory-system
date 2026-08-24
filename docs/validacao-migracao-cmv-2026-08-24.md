# Validação assistida da migração de CMV

Data da simulação: 24/08/2026

Banco consultado: Supabase configurado no backend

Modo: somente leitura

## Resultado da classificação simulada

| Estabelecimento | CMV — Bebidas | Excluídos |
|---|---:|---:|
| commercial | 163 | 3 |
| estabelecimento teste | 60 | 23 |
| ESTABELECIMENTO TESTE 02 | 1 | 0 |
| Lights | 81 | 0 |
| park | 83 | 0 |

Nenhum produto ativo atual foi automaticamente classificado como limpeza, descartável ou outro operacional. Esses materiais deverão ser cadastrados ou reclassificados pela nova interface.

### Decisões confirmadas pela regra

- `açucar` permanece em CMV — Bebidas por ser ingrediente de drinks.
- Hortifruti e insumos atuais permanecem em CMV — Bebidas.
- `BIFE DE BURGUER` e `SMASH` ficam fora do CMV nesta fase.
- Categorias de comida, carnes e milkshake do estabelecimento de teste ficam fora do CMV.
- Patrimônios, como os copos encontrados, ficam fora do CMV.
- Todos os produtos ativos de Lights e Park permanecem em CMV — Bebidas.

## Linha de base imutável

Estes valores devem ser idênticos depois da migração:

| Indicador | Antes da migração |
|---|---:|
| Produtos | 432 |
| Quantidade total dos produtos | 2.836.511,784 |
| Itens de ordens de compra | 805 |
| Itens de ordem sem produto vinculado | 1 |
| Movimentos de estoque | 6.837 |
| Movimentos sem produto vinculado | 15 |
| Quantidade acumulada dos movimentos | 40.193.424,749 |
| Custo acumulado dos movimentos | R$ 1.278.979,7087 |

## Histórico Prisma reconciliado

O banco registra como aplicada a migração:

`20260429224355_add_transfer_costs`

Esse diretório não existe no repositório local nem em nenhum branch atualmente disponível no GitHub. O checksum registrado no banco é:

`79662c72361b3c9f78c9a3d5efbfbecaacf89ac5156baabfbbc77bca0e62eefd`

Como o arquivo original não existia em nenhum branch local ou remoto, foi criado um placeholder histórico sem operações de banco. O checksum do registro foi atualizado em transação, condicionado ao checksum original acima. Depois do reparo, `prisma migrate status` reconheceu somente a nova migração como pendente.

## Aplicação e auditoria concluídas

1. Histórico Prisma reconciliado com proteção por checksum.
2. Migração `20260824223000_add_purchase_classification` aplicada com sucesso.
3. Linha de base comparada automaticamente depois da aplicação.
4. Quantidades, custos, produtos, itens de compra e movimentos preservados integralmente.
5. Nenhum produto ou item de ordem ficou sem classificação.
6. `prisma migrate status` confirmou o banco atualizado.
7. Suíte automatizada finalizada com 21 testes aprovados.
8. Commit `d2140d6` enviado para a `main`.
9. Frontend Vercel confirmado com resposta HTTP 200 após a publicação.

Resultado final: migração validada e publicada sem alteração dos saldos e históricos financeiros existentes.
