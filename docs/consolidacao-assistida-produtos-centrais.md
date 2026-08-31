# Consolidação assistida de produtos centrais

## Escopo

A revisão agrupa somente produtos locais ativos, de estoque e não classificados como `EXCLUDED`. A correspondência exata considera nome normalizado, unidade, unidade de compra e quantidade da embalagem.

Uma sugestão nunca cria vínculos automaticamente. Apenas usuários `ADMIN` podem aprovar ou rejeitar.

## Fluxo de revisão

1. Abrir **Catálogo Central** e selecionar **Revisar sugestões**.
2. Conferir os produtos e respectivos estabelecimentos.
3. Em **Revisar e aprovar**, remover qualquer item ambíguo e ajustar nome, marca, unidade-base, EAN e descrição.
4. Confirmar **Criar e vincular**.

A aprovação ocorre em uma transação: gera o código central, cria a identidade, vincula os produtos, registra a decisão e grava auditoria. Estoque, custos, preços, categorias e históricos não são alterados.

Sugestões rejeitadas ficam registradas e podem ser exibidas novamente pelo filtro da tela. Uma rejeição ainda pode ser revisada e aprovada posteriormente.

## Idempotência e conflitos

- cada organização possui no máximo uma decisão por chave candidata;
- repetir uma aprovação aplicada retorna o mesmo produto central;
- produtos já vinculados, de outra organização ou duplicados no mesmo estabelecimento são recusados;
- se os dados que formam a chave candidata mudarem, a aprovação é recusada e a lista deve ser atualizada.

## Reconciliação

O comando abaixo é somente leitura:

```powershell
npm run catalog:reconcile -- <establishmentId>
```

Ele informa decisões aplicadas, rejeitadas e revertidas, produtos centrais, vínculos locais, elegíveis sem vínculo e referências aplicadas sem identidade central correspondente.

## Rollback operacional

Primeiro gere a prévia, sem escrita:

```powershell
npm run catalog:reconcile -- <establishmentId> --rollback <reviewId>
```

Após conferir os IDs exatos, aplique explicitamente:

```powershell
npm run catalog:reconcile -- <establishmentId> --rollback <reviewId> --apply
```

O rollback desvincula apenas os produtos registrados naquela decisão, desativa a identidade central, marca a revisão como `ROLLED_BACK` e cria auditoria. Ele não apaga produtos nem altera movimentações, estoque, custo, preço ou histórico. Repetir um rollback concluído é idempotente.
