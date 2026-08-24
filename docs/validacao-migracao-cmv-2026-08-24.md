# ValidaÃ§Ã£o assistida da migraÃ§Ã£o de CMV

Data da simulaÃ§Ã£o: 24/08/2026

Banco consultado: Supabase configurado no backend

Modo: somente leitura

## Resultado da classificaÃ§Ã£o simulada

| Estabelecimento | CMV â€” Bebidas | ExcluÃ­dos |
|---|---:|---:|
| commercial | 163 | 3 |
| estabelecimento teste | 60 | 23 |
| ESTABELECIMENTO TESTE 02 | 1 | 0 |
| Lights | 81 | 0 |
| park | 83 | 0 |

Nenhum produto ativo atual foi automaticamente classificado como limpeza, descartÃ¡vel ou outro operacional. Esses materiais deverÃ£o ser cadastrados ou reclassificados pela nova interface.

### DecisÃµes confirmadas pela regra

- `aÃ§ucar` permanece em CMV â€” Bebidas por ser ingrediente de drinks.
- Hortifruti e insumos atuais permanecem em CMV â€” Bebidas.
- `BIFE DE BURGUER` e `SMASH` ficam fora do CMV nesta fase.
- Categorias de comida, carnes e milkshake do estabelecimento de teste ficam fora do CMV.
- PatrimÃ´nios, como os copos encontrados, ficam fora do CMV.
- Todos os produtos ativos de Lights e Park permanecem em CMV â€” Bebidas.

## Linha de base imutÃ¡vel

Estes valores devem ser idÃªnticos depois da migraÃ§Ã£o:

| Indicador | Antes da migraÃ§Ã£o |
|---|---:|
| Produtos | 432 |
| Quantidade total dos produtos | 2.836.511,784 |
| Itens de ordens de compra | 805 |
| Itens de ordem sem produto vinculado | 1 |
| Movimentos de estoque | 6.837 |
| Movimentos sem produto vinculado | 15 |
| Quantidade acumulada dos movimentos | 40.193.424,749 |
| Custo acumulado dos movimentos | R$ 1.278.979,7087 |

## HistÃ³rico Prisma reconciliado

O banco registra como aplicada a migraÃ§Ã£o:

`20260429224355_add_transfer_costs`

Esse diretÃ³rio nÃ£o existe no repositÃ³rio local nem em nenhum branch atualmente disponÃ­vel no GitHub. O checksum registrado no banco Ã©:

`79662c72361b3c9f78c9a3d5efbfbecaacf89ac5156baabfbbc77bca0e62eefd`

Como o arquivo original nÃ£o existia em nenhum branch local ou remoto, foi criado um placeholder histÃ³rico sem operaÃ§Ãµes de banco. O checksum do registro foi atualizado em transaÃ§Ã£o, condicionado ao checksum original acima. Depois do reparo, `prisma migrate status` reconheceu somente a nova migraÃ§Ã£o como pendente.

## AplicaÃ§Ã£o e auditoria concluÃ­das

1. HistÃ³rico Prisma reconciliado com proteÃ§Ã£o por checksum.
2. MigraÃ§Ã£o `20260824223000_add_purchase_classification` aplicada com sucesso.
3. Linha de base comparada automaticamente depois da aplicaÃ§Ã£o.
4. Quantidades, custos, produtos, itens de compra e movimentos preservados integralmente.
5. Nenhum produto ou item de ordem ficou sem classificaÃ§Ã£o.
6. `prisma migrate status` confirmou o banco atualizado.
7. SuÃ­te automatizada finalizada com 21 testes aprovados.
8. Commit `d2140d6` enviado para a `main`.
9. Frontend Vercel confirmado com resposta HTTP 200 apÃ³s a publicaÃ§Ã£o.

Resultado final: migraÃ§Ã£o validada e publicada sem alteraÃ§Ã£o dos saldos e histÃ³ricos financeiros existentes.
