# Auditoria de seguranca — Etapa 0 do Portal de Fornecedores

**Data:** 2026-08-26
**Escopo:** API interna existente, antes da criacao do catalogo central.

## Protecoes aplicadas

- O vinculo entre produto e fornecedor valida ambos pelo mesmo `establishmentId` obtido da sessao.
- A remocao do vinculo tambem valida o fornecedor no tenant antes de escrever.
- Criacao, edicao, exclusao e ajuste manual de produto exigem `ADMIN`.
- Adicao e remocao de fornecedor em produto exigem `ADMIN`.
- Edicao de estabelecimento exige `ADMIN`.
- Um estabelecimento sem organizacao lista somente a si proprio; `organizationId = null` nao e usado como agrupador.
- Lancamentos individuais e em lote validam o produto pelo UUID e pelo estabelecimento.
- A API nao aceita um segredo JWT padrao; a inicializacao falha sem `JWT_SECRET`.

## Mapeamento de consultas de produto e fornecedor

As consultas operacionais revisadas usam uma destas fronteiras:

- `Product.id + Product.establishmentId`;
- `Supplier.id + Supplier.establishmentId`;
- relacionamento pai previamente filtrado pelo estabelecimento;
- estabelecimentos explicitamente pertencentes a mesma organizacao em fluxos de rede.

Consultas por ID isolado que ocorrem dentro de uma transacao somente sao consideradas seguras quando o registro pai ja foi carregado com filtro de tenant. Novos fluxos nao devem receber `establishmentId` do corpo ou da query string; o valor efetivo vem de `req.user`.

## Sincronizacao de preco existente

O parametro `syncNetwork` do vinculo produto-fornecedor ainda representa o comportamento legado:

1. identifica os demais estabelecimentos pela organizacao da sessao;
2. procura produto ativo por nome exato em cada estabelecimento;
3. procura fornecedor por nome ou CNPJ;
4. atualiza cada `ProductSupplier` encontrado;
5. uma falha em loja secundaria nao desfaz a atualizacao principal.

Esse fluxo e temporario. Ele nao oferece identidade imutavel, atomicidade entre lojas nem reconciliacao completa. Nao deve ser reutilizado pelo portal externo. A substituicao sera feita por `OrganizationProduct`, `OrganizationSupplier` e propagacao transacional para vinculos locais preexistentes.

## Testes de regressao obrigatorios

- fornecedor de outro estabelecimento nao pode ser associado ao produto;
- fornecedor de outro estabelecimento nao pode ser usado para remover vinculo;
- perfil sem `ADMIN` nao pode executar mutacoes administrativas;
- tenant sem organizacao nao pode listar outros tenants sem organizacao;
- produto de outro estabelecimento nao pode ser usado em lancamentos.

## Pendencias antes da exposicao externa

- separar autenticacao e tokens do portal;
- implementar limitacao de tentativas, bloqueio e revogacao;
- criar auditoria especifica de sessoes externas;
- configurar CORS independente para o portal;
- eliminar a sincronizacao por nome depois da centralizacao;
- revisar o cadastro administrativo publico antes do deploy do portal.
