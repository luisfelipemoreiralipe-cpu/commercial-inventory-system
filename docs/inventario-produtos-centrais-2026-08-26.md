# Inventario previo — Produtos centrais

**Executado em:** 2026-08-26
**Modo:** somente leitura
**Migracao aplicada:** nao

## Escopos encontrados

### Organizacao principal — Rede admin Restaurante

| Estabelecimento | Produtos | Fornecedores |
|---|---:|---:|
| commercial | 169 | 10 |
| estabelecimento teste | 84 | 2 |
| ESTABELECIMENTO TESTE 02 | 1 | 1 |
| Lights | 80 | 12 |
| park | 83 | 11 |

Total de 417 produtos.

### Organizacao secundaria — Rede felipe Restaurante

| Estabelecimento | Produtos | Fornecedores |
|---|---:|---:|
| Lights | 1 | 0 |
| park | 0 | 0 |

Esta organizacao nao possui volume suficiente para consolidacao nesta etapa.

## Resultado refinado da organizacao principal

O inventario considera elegivel para o catalogo de fornecedores somente produto:

- ativo;
- do tipo `INVENTORY`;
- com classificacao diferente de `EXCLUDED`.

Resultado:

| Metrica | Quantidade |
|---|---:|
| Produtos totais | 417 |
| Elegiveis para catalogo de fornecedores | 254 |
| Excluidos do escopo do MVP | 163 |
| Grupos candidatos por correspondencia normalizada exata | 26 |
| Grupos isolados | 202 |

Os 163 itens excluidos incluem principalmente produtos de producao, combos, doses e outros registros que nao devem virar automaticamente itens compraveis de fornecedor.

## Interpretacao dos candidatos

Os 26 grupos sao candidatos, nao vinculos aprovados. A chave compara:

- nome normalizado;
- unidade-base;
- unidade de compra;
- quantidade por embalagem.

Foram encontrados pares plausiveis entre `park` e `Lights`, incluindo aguas, energetico, espumantes, garrafas, nao alcoolicos e tequila.

Mesmo os pares exatos exigem revisao operacional. Alguns nomes sao genericos ou possuem dados suspeitos, por exemplo:

- `ESPUMANTE NACIONAL`, sem unidade de compra e com embalagem 660;
- `GARRAFA GIN NACIONAL`, que pode representar marcas diferentes;
- `GARRAFA ORLOFF` e `GARRAFA SMIRNOFF` com embalagem 998;
- `GARRAFA BUCCHANAS`, com grafia inconsistente;
- `PASSPORTE`, possivelmente nome abreviado ou incorreto.

Nenhum desses grupos deve ser vinculado automaticamente apenas pela chave normalizada.

## Estado da migracao

O Prisma reconhece 34 migracoes e informa somente esta como pendente:

`20260826120000_add_organization_products`

O schema Prisma foi validado, mas a migracao nao foi aplicada.

## Backup e decisao de aplicacao

Foi criado um snapshot logico consistente antes da migracao:

- arquivo: `backups/commercial-pre-organization-products-2026-08-26.json`;
- formato: `commercial-logical-snapshot-v1`;
- transacao: `REPEATABLE READ READ ONLY`;
- PostgreSQL de origem: 17.6;
- tabelas: 37;
- linhas: 13.206;
- tamanho: 8.653.230 bytes;
- SHA-256: `967bf865e85bc117dc6cb894a4137feadf07f9d0f97ed8fe7e3c815c2ed804ae`.

O manifesto correspondente esta ao lado do arquivo com sufixo `.manifest.json`. A validacao confirmou formato, hash, tamanho e contagem de todas as tabelas.

O snapshot e uma contingencia logica completa dos dados e metadados relacionais consultaveis. Ele nao substitui backup fisico/PITR do Supabase e ainda nao foi restaurado em staging. Como a migracao proposta e exclusivamente aditiva, o rollback funcional preferencial e remover as novas estruturas sem tocar nos dados anteriores.

**Decisao atual:** backup logico validado; migracao pode seguir para preflight final, mas nao deve ser aplicada junto com vinculacao de produtos.

## Proximo passo recomendado

Confirmar o mecanismo de backup do Supabase e ensaiar a migracao em clone ou staging. Depois disso, aplicar apenas a estrutura opcional, reconciliar as contagens e manter todos os `organizationProductId` nulos ate a revisao operacional dos candidatos.
