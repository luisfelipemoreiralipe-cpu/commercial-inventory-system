# Backup previo a migracao de produtos centrais

## Artefatos

Os arquivos ficam em `backups/` e estao ignorados pelo Git por conterem dados operacionais:

- `commercial-pre-organization-products-2026-08-26.json`;
- `commercial-pre-organization-products-2026-08-26.json.manifest.json`.

## Garantias da captura

- todas as 37 tabelas publicas foram lidas na mesma transacao;
- a transacao foi marcada como `REPEATABLE READ READ ONLY`;
- 13.206 linhas foram serializadas;
- colunas e constraints do `information_schema` foram incluidas;
- valores `BigInt`, `Decimal` e binarios possuem representacao tipada;
- o manifesto possui tamanho e SHA-256 do arquivo principal.

## Validacao

Executar a partir de `backend`:

```powershell
npm.cmd run backup:validate -- "..\backups\commercial-pre-organization-products-2026-08-26.json"
```

Resultado esperado:

```text
valid: true
tables: 37
rows: 13206
sha256: 967bf865e85bc117dc6cb894a4137feadf07f9d0f97ed8fe7e3c815c2ed804ae
```

## Recuperacao relacionada a esta migracao

A migracao `20260826120000_add_organization_products` e aditiva: cria duas tabelas, uma coluna opcional, indices e chaves estrangeiras. Ela nao atualiza nem exclui linhas existentes.

Se houver falha antes de qualquer vinculacao:

1. interromper novos deploys;
2. registrar o erro e o estado de `_prisma_migrations`;
3. nao editar produtos existentes;
4. reverter somente as novas estruturas em uma migracao corretiva revisada;
5. validar que as 37 tabelas anteriores mantiveram suas contagens.

Se houver suspeita de alteracao nos dados anteriores, nao executar restauracao direta em producao. Primeiro importar o snapshot em banco isolado, reconciliar contagens e gerar um plano de restauracao por tabela.

## Limitacao conhecida

O snapshot foi validado estruturalmente, mas ainda nao foi restaurado em um ambiente staging. Um dump nativo com `pg_dump` nao foi produzido porque os binarios oficiais foram bloqueados pelo provedor de download e o primeiro cliente portatil disponivel era PostgreSQL 16, incompatível com o servidor PostgreSQL 17.6.
