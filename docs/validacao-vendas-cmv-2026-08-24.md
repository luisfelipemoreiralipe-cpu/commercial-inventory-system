# Validação da receita e do CMV percentual

Data: 24/08/2026

Banco: Supabase configurado no backend

Estabelecimento: `estabelecimento teste` (`32638f69-422d-4d02-84f0-40b7ec68cae4`)

## Implantação

- Migration aplicada: `20260825010000_add_sales_financial_data`.
- `prisma migrate status`: banco atualizado, 32 migrations reconhecidas.
- As tabelas `sales` e `sale_items`, o vínculo `stock_movements.saleId` e os índices foram criados.
- A linha de base anterior à venda permaneceu integralmente preservada após a alteração estrutural.

## Venda controlada

Identificador idempotente: `cmv-validation-20260824-absolut-v1`

| Campo | Valor |
|---|---:|
| Produto | absolut |
| Quantidade comercial | 0,01 |
| Conversão de embalagem | 750 |
| Quantidade baixada do estoque | 7,5 |
| Faturamento bruto | R$ 1,00 |
| Desconto | R$ 0,00 |
| Receita líquida | R$ 1,00 |
| Custo congelado | R$ 0,8990 |
| CMV percentual | 89,90% |
| Lucro bruto | R$ 0,1010 |
| Margem bruta | 10,10% |

O estabelecimento de teste não possuía saldo de Absolut antes do teste. Como o fluxo atual de vendas permite estoque negativo, o saldo global e o saldo do local passaram de `0` para `-7,5`. Essa variação foi intencional, limitada ao estabelecimento de teste e reconciliada com o movimento criado.

## Critérios validados

- A venda e a baixa foram concluídas na mesma operação.
- Foi criado exatamente um `SaleItem`.
- Foi criado exatamente um movimento com o `saleId` da venda.
- O custo da venda é idêntico à soma dos movimentos vinculados: R$ 0,8990.
- O saldo global e o saldo local baixaram exatamente 7,5.
- O relatório retornou receita, CMV, lucro e margem corretos.
- A repetição com o mesmo identificador retornou HTTP 409.
- A tentativa duplicada não criou outra venda, item ou movimento e não alterou novamente o estoque.

## Reconciliação final

As diferenças contra a linha de base são exatamente as geradas pelo teste:

- produtos: sem alteração na quantidade de registros;
- quantidade global: `-7,5`;
- movimentos: `+1`;
- quantidade acumulada dos movimentos: `+7,5`;
- custo acumulado dos movimentos: `+0,8990`;
- vendas: `+1`;
- itens de venda: `+1`;
- movimentos vinculados a venda: `+1`.

Resultado: fluxo financeiro de vendas e CMV percentual validado de ponta a ponta no estabelecimento de teste.
