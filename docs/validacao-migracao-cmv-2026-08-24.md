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

## Bloqueio encontrado no histÃ³rico Prisma

O banco registra como aplicada a migraÃ§Ã£o:

`20260429224355_add_transfer_costs`

Esse diretÃ³rio nÃ£o existe no repositÃ³rio local nem em nenhum branch atualmente disponÃ­vel no GitHub. O checksum registrado no banco Ã©:

`79662c72361b3c9f78c9a3d5efbfbecaacf89ac5156baabfbbc77bca0e62eefd`

A migraÃ§Ã£o nova `20260824223000_add_purchase_classification` ainda nÃ£o foi aplicada.

## Procedimento seguro antes da aplicaÃ§Ã£o

1. Recuperar o diretÃ³rio original `20260429224355_add_transfer_costs` da mÃ¡quina ou artefato que realizou a implantaÃ§Ã£o de 29/04/2026.
2. Confirmar que o checksum do arquivo recuperado corresponde ao checksum do banco.
3. Executar novamente `prisma migrate status` e exigir histÃ³rico alinhado.
4. Fazer backup do banco imediatamente antes da aplicaÃ§Ã£o.
5. Aplicar `20260824223000_add_purchase_classification`.
6. Executar novamente o script de prÃ©via e comparar integralmente a linha de base.
7. Validar login, produtos, sugestÃ£o de compra, ordens, consumo de materiais e relatÃ³rio financeiro.

NÃ£o aplicar a nova migraÃ§Ã£o enquanto o histÃ³rico estiver divergente.
