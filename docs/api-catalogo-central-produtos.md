# API interna — Catalogo central de produtos

**Base URL:** `/api/organization-products`
**Autenticacao:** token interno
**Tenant:** organizacao resolvida exclusivamente pelo estabelecimento da sessao

## Endpoints

### Consultas autenticadas

| Metodo | Rota | Funcao |
|---|---|---|
| `GET` | `/` | Lista produtos centrais da organizacao e vinculos locais |
| `GET` | `/unlinked-products` | Lista produtos locais elegiveis ainda sem identidade central |
| `GET` | `/review-candidates` | Lista sugestoes normalizadas e decisoes da revisao |
| `GET` | `/:id` | Consulta um produto central da mesma organizacao |

### Operacoes administrativas

| Metodo | Rota | Funcao |
|---|---|---|
| `POST` | `/` | Cria produto central e gera `internalCode` |
| `PUT` | `/:id` | Atualiza campos editaveis |
| `DELETE` | `/:id` | Desativa logicamente o produto central |
| `POST` | `/:id/links` | Vincula produtos locais revisados |
| `DELETE` | `/:id/links/:productId` | Desvincula produto local |
| `POST` | `/review-candidates/approve` | Cria a identidade e aplica os vinculos aprovados de forma idempotente |
| `POST` | `/review-candidates/reject` | Registra a rejeicao da sugestao |

Todas as operacoes de escrita exigem `ADMIN`.

## Criacao

Exemplo:

```json
{
  "name": "Heineken Long Neck 330 ml",
  "brand": "Heineken",
  "baseUnit": "un",
  "barcode": "7890000000000",
  "description": "Garrafa long neck de 330 ml"
}
```

O cliente nao informa `internalCode`. O backend incrementa atomicamente a sequencia da organizacao e gera codigos como `PROD-000001` dentro da mesma transacao da criacao.

## Edicao e desativacao

`internalCode` e `organizationId` nao sao aceitos nos corpos de criacao/edicao. `DELETE` nao remove fisicamente a identidade: apenas define `isActive = false`, preservando codigo e vinculos historicos.

## Vinculacao

```json
{
  "productIds": [
    "uuid-produto-park",
    "uuid-produto-lights"
  ]
}
```

Regras:

- todos os produtos devem pertencer a estabelecimentos da mesma organizacao;
- um produto local nao pode pertencer a duas identidades centrais;
- uma identidade central aceita no maximo um produto local por estabelecimento;
- repetir um vinculo ja existente e idempotente;
- nenhum estoque, custo, preco ou historico e alterado;
- cada operacao cria registro em `AuditLog` no estabelecimento da sessao.

## Produtos elegiveis sem vinculo

`GET /unlinked-products` retorna somente produtos:

- ativos;
- do tipo `INVENTORY`;
- nao classificados como `EXCLUDED`;
- pertencentes a organizacao autenticada;
- com `organizationProductId` nulo.

## Validacao executada

- 54 testes automatizados aprovados;
- smoke test real somente leitura aprovado;
- 0 produtos centrais antes da consolidacao;
- 254 produtos locais elegiveis sem vinculo;
- nenhuma escrita operacional executada pelo smoke test.
