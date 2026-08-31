# Plano de Implementacao — Catalogo Central e Portal de Fornecedores

**Status:** planejamento
**Data de criacao:** 2026-08-25
**Escopo desta fase:** documentacao; nenhuma alteracao funcional ou de banco foi executada.

## 1. Objetivo

Criar uma estrutura segura para que fornecedores recorrentes possam manter seu catalogo e seus precos atualizados por meio de um portal externo, propagando os valores aprovados para todos os estabelecimentos da mesma organizacao que utilizem a mesma combinacao de produto e fornecedor.

A solucao deve:

- reduzir o trabalho manual de cotacao e atualizacao de precos;
- manter uma identidade unica para cada produto dentro da organizacao;
- manter uma identidade unica para cada fornecedor dentro da organizacao;
- preservar estoques, categorias e configuracoes locais dos estabelecimentos;
- impedir que um fornecedor veja dados de concorrentes ou informacoes internas;
- impedir acesso entre organizacoes;
- manter historico e autoria de todas as alteracoes;
- permitir que o fornecedor sugira novos produtos sem cria-los diretamente no estoque.

## 2. Situacao atual

O sistema ja possui:

- organizacoes e estabelecimentos vinculados por `organizationId`;
- produtos locais por estabelecimento;
- fornecedores locais por estabelecimento;
- vinculo `ProductSupplier` com preco por produto e fornecedor;
- historico `SupplierPriceHistory`;
- sugestoes e pedidos de compra;
- autenticacao de usuarios internos;
- trilha de auditoria;
- opcao de sincronizar precos com outros estabelecimentos da organizacao.

### 2.1 Limitacao da sincronizacao atual

A sincronizacao existente procura produtos pelo nome e fornecedores pelo nome ou CNPJ nos demais estabelecimentos. Isso e util como comportamento inicial, mas nao e seguro o suficiente para um portal externo, pois:

- nomes podem variar entre estabelecimentos;
- produtos diferentes podem ter nomes semelhantes;
- caixa, fardo e unidade podem ser confundidos;
- um fornecedor pode estar cadastrado com pequenas variacoes de nome;
- nao existe identidade central e imutavel para a combinacao.

### 2.2 Ajustes de seguranca identificados

Antes de abrir qualquer acesso externo, devem ser corrigidos os seguintes pontos:

- validar o fornecedor simultaneamente por `supplierId` e `establishmentId` ao criar ou remover vinculos;
- exigir funcoes internas adequadas nas rotas que criam, alteram ou removem produtos e vinculos;
- eliminar consultas que aceitem apenas um ID sem validar organizacao ou estabelecimento;
- adicionar testes de acesso cruzado entre estabelecimentos, organizacoes e fornecedores;
- garantir que o frontend nunca determine o tenant efetivo de uma operacao.

## 3. Decisoes de arquitetura

### 3.1 Produto central da organizacao

Criar `OrganizationProduct` como identidade compartilhada. O produto atual continuara representando o item local de cada estabelecimento.

```text
OrganizationProduct PROD-000184
|-- Product do BDS Park
|-- Product do BDS Lights
`-- Product de outro estabelecimento
```

Permanecem locais no modelo `Product`:

- estoque e locais de estoque;
- estoque minimo e ideal;
- categoria local;
- classificacao de compra;
- frequencia de reposicao;
- setor responsavel;
- fichas tecnicas e movimentacoes;
- estado ativo/inativo no estabelecimento.

Ficam centralizados no `OrganizationProduct`:

- codigo interno imutavel;
- nome padronizado;
- marca;
- unidade-base;
- EAN/codigo de barras, quando existente;
- descricao ou apresentacao de referencia;
- estado ativo/inativo no catalogo da organizacao.

### 3.2 Codigos de produto

Nao utilizar EAN como unica identidade. Serao suportados:

- `internalCode`: codigo oficial e imutavel da organizacao, por exemplo `PROD-000184`;
- `barcode`: EAN/GTIN opcional;
- `supplierCode`: codigo utilizado pelo fornecedor em seu proprio catalogo.

Restricoes recomendadas:

- `internalCode` unico dentro da organizacao;
- `barcode` normalizado e indexado, mas opcional;
- `supplierCode` unico por fornecedor quando preenchido;
- o vinculo tecnico sera sempre realizado por IDs, nunca por nomes.

### 3.3 Fornecedor central

Criar `OrganizationSupplier` como identidade do fornecedor na organizacao. Os registros atuais de `Supplier` permanecem locais e passam a apontar para ele.

```text
OrganizationSupplier Sanguine
|-- Supplier do BDS Park
|-- Supplier do BDS Lights
`-- Supplier de outro estabelecimento
```

O CNPJ ajudara na consolidacao, mas a vinculacao final sera feita por ID. Deve ser possivel tratar filiais ou distribuidores diferentes como fornecedores centrais distintos, mesmo quando pertencerem ao mesmo grupo comercial.

### 3.4 Catalogo central do fornecedor

Criar `SupplierCatalogItem` para representar a oferta do fornecedor:

- fornecedor central;
- produto central;
- codigo do produto no fornecedor;
- unidade comercial;
- quantidade de unidades-base na embalagem;
- preco comercial informado;
- preco normalizado por unidade-base;
- disponibilidade;
- pedido minimo;
- prazo de entrega;
- validade do preco;
- ultima atualizacao;
- status do item.

Exemplo:

```text
Produto central: PROD-000184 — Heineken Long Neck 330 ml
Fornecedor: Sanguine
Apresentacao: caixa com 24 unidades
Preco informado: R$ 144,00 por caixa
Preco comparavel: R$ 6,00 por unidade
```

O preco informado e o preco normalizado devem ser armazenados. A conversao nunca deve depender apenas de texto livre.

### 3.5 Preco central e excecoes locais

O preco do catalogo representa o valor padrao do fornecedor para a organizacao. Na primeira versao, ele sera propagado somente aos vinculos locais ja autorizados.

O desenho deve permitir futuramente:

- preco diferente por estabelecimento;
- preco promocional com vigencia;
- preco por faixa de quantidade;
- restricao de entrega por estabelecimento.

Essas excecoes nao fazem parte do MVP, mas o modelo nao deve impedi-las.

## 4. Modelo de dados proposto

Os nomes finais podem ser ajustados durante a implementacao, mas as responsabilidades devem ser preservadas.

### 4.1 `OrganizationProduct`

Campos principais:

- `id` UUID;
- `organizationId`;
- `internalCode`;
- `name`;
- `brand` opcional;
- `baseUnit`;
- `barcode` opcional;
- `description` opcional;
- `isActive`;
- `createdAt` e `updatedAt`.

Restricoes:

- unico por `(organizationId, internalCode)`;
- indice por `(organizationId, barcode)`;
- todos os acessos filtrados pela organizacao autenticada.

### 4.2 Alteracao em `Product`

Adicionar:

- `organizationProductId`, inicialmente opcional;
- relacao com `OrganizationProduct`;
- indice por `organizationProductId`;
- unicidade recomendada por `(establishmentId, organizationProductId)`.

A unicidade evita dois produtos locais ativos representando acidentalmente o mesmo produto central. Casos legitimos de apresentacoes diferentes devem possuir produtos centrais diferentes.

### 4.3 `OrganizationSupplier`

Campos principais:

- `id` UUID;
- `organizationId`;
- `name`;
- `legalName` opcional;
- `cnpj` opcional;
- `isActive`;
- `createdAt` e `updatedAt`.

Restricoes:

- indice por organizacao;
- CNPJ normalizado;
- regra de duplicidade revisada, considerando distribuidores e filiais.

### 4.4 Alteracao em `Supplier`

Adicionar:

- `organizationSupplierId`, inicialmente opcional;
- relacao com `OrganizationSupplier`;
- indice por `organizationSupplierId`;
- unicidade recomendada por `(establishmentId, organizationSupplierId)`.

### 4.5 `SupplierCatalogItem`

Campos principais:

- `id` UUID;
- `organizationSupplierId`;
- `organizationProductId`;
- `supplierCode` opcional;
- `commercialUnit`;
- `unitsPerPackage` decimal positivo;
- `packagePrice` decimal positivo;
- `normalizedUnitPrice` decimal positivo;
- `available`;
- `minimumOrder` opcional;
- `deliveryLeadDays` opcional;
- `validUntil` opcional;
- `status`;
- `createdAt`, `updatedAt` e `lastSubmittedAt`.

Restricoes:

- unico por `(organizationSupplierId, organizationProductId)` no MVP;
- todos os relacionamentos devem pertencer a mesma organizacao;
- valores monetarios armazenados como `Decimal`, nunca `Float`.

### 4.6 `SupplierPriceUpdate`

Representa um envio ou lote de alteracoes do fornecedor:

- fornecedor central;
- usuario externo autor;
- status: `DRAFT`, `SUBMITTED`, `PARTIALLY_APPROVED`, `APPROVED`, `REJECTED`, `APPLIED`;
- data de envio, aprovacao e aplicacao;
- usuario interno aprovador;
- observacao.

### 4.7 `SupplierPriceUpdateItem`

Guarda a alteracao individual e preserva o historico:

- lote de atualizacao;
- item do catalogo;
- preco anterior e novo;
- unidade e embalagem informadas;
- preco normalizado anterior e novo;
- disponibilidade e prazo;
- status individual;
- justificativa de rejeicao;
- quantidade de estabelecimentos afetados.

### 4.8 `SupplierPortalUser`

Campos principais:

- `id` UUID;
- `organizationSupplierId`;
- nome;
- e-mail ou identificador de acesso;
- senha com hash forte;
- estado ativo/bloqueado;
- quantidade e data das tentativas falhas;
- ultimo acesso;
- data de revogacao;
- `createdAt` e `updatedAt`.

Uma conta pertence a exatamente um fornecedor central. O modelo deve aceitar varios vendedores por fornecedor, ainda que o MVP comece com apenas um.

### 4.9 `SupplierProductSuggestion`

Campos principais:

- fornecedor central;
- usuario externo autor;
- nome, marca e descricao;
- EAN e codigo do fornecedor;
- unidade comercial e unidades por embalagem;
- preco;
- status: `PENDING`, `LINKED`, `APPROVED`, `REJECTED`, `NEEDS_INFORMATION`;
- produto central vinculado, quando aprovado;
- responsavel interno e observacao da revisao.

O fornecedor nunca criara diretamente um `Product` ou `OrganizationProduct` ativo.

## 5. Fluxos funcionais

### 5.1 Consolidacao interna de produtos

1. O sistema agrupa candidatos dentro da mesma organizacao.
2. Classifica cada grupo como correspondencia segura, provavel, conflito ou item isolado.
3. A operacao revisa os casos nao seguros.
4. Um produto central e criado.
5. Cada produto local selecionado recebe `organizationProductId`.
6. Estoques e historicos permanecem inalterados.

### 5.2 Consolidacao interna de fornecedores

1. Agrupar candidatos por CNPJ normalizado.
2. Utilizar nome e contatos apenas como apoio.
3. Exigir revisao quando nao houver CNPJ ou houver divergencia.
4. Criar o fornecedor central.
5. Vincular os registros locais selecionados.

### 5.3 Atualizacao de preco pelo fornecedor

1. Usuario externo autentica no portal do seu fornecedor.
2. O backend obtem organizacao e fornecedor exclusivamente da sessao.
3. O portal lista apenas `SupplierCatalogItem` daquele fornecedor.
4. O vendedor altera preco, disponibilidade e prazo.
5. O sistema calcula o preco normalizado e mostra uma previa.
6. O vendedor salva rascunho ou envia para analise.
7. A operacao aprova ou rejeita cada alteracao.
8. O backend calcula os vinculos locais afetados.
9. A aplicacao ocorre em uma unica transacao.
10. Historico e auditoria sao registrados.

### 5.4 Propagacao do preco aprovado

Para cada item aprovado:

1. validar que produto e fornecedor centrais pertencem a mesma organizacao;
2. localizar todos os `Product` vinculados ao produto central;
3. localizar o `Supplier` central correspondente em cada estabelecimento;
4. atualizar somente `ProductSupplier` ja existente e autorizado;
5. registrar preco anterior e novo por estabelecimento;
6. nao alterar `Product.currentCost`, estoque ou custo de fichas tecnicas;
7. marcar o lote como aplicado somente ao final da transacao.

O MVP nao deve criar automaticamente um vinculo local entre produto e fornecedor. Se o estabelecimento ainda nao compra aquele item daquele fornecedor, a operacao devera autorizar o vinculo.

### 5.5 Sugestao de produto novo

1. Fornecedor envia a sugestao.
2. Sistema procura EAN, codigo do fornecedor e possiveis nomes semelhantes.
3. Operacao pode vincular a produto existente, criar produto central, pedir correcao ou rejeitar.
4. Ao aprovar um produto central, a operacao escolhe os estabelecimentos onde o produto local sera criado ou vinculado.
5. Estoque inicial permanece zero e nenhuma movimentacao e criada sem acao interna explicita.

## 6. Regras de aprovacao

O primeiro release utilizara aprovacao interna obrigatoria para toda alteracao externa.

Depois da estabilizacao, podera ser configurada aprovacao automatica:

- variacao dentro de um limite percentual;
- reducao de preco;
- fornecedor previamente classificado como confiavel;
- nenhuma mudanca de embalagem, unidade ou quantidade por pacote.

Sempre exigirao aprovacao manual:

- produto novo;
- mudanca de unidade comercial;
- mudanca em `unitsPerPackage`;
- variacao fora do limite;
- item anteriormente descontinuado;
- tentativa de atingir novos estabelecimentos.

Os limites devem ser configuraveis e nao codificados diretamente na interface.

## 7. Seguranca e isolamento

### 7.1 Portal externo

- rotas e autenticacao separadas do painel interno;
- senhas armazenadas apenas com hash forte;
- tokens de sessao com publico, finalidade e expiracao proprios;
- sessao externa nunca aceita `organizationId`, `supplierId` ou `establishmentId` do frontend;
- recuperacao de senha por token curto e descartavel;
- limitacao de tentativas por conta e origem;
- bloqueio temporario e revogacao administrativa;
- mensagens de login que nao confirmem se um fornecedor ou usuario existe;
- cookies seguros ou armazenamento de token definido conforme a arquitetura de deploy;
- politica de CORS separada e restritiva para o portal.

### 7.2 Autorizacao

Toda consulta externa deve partir do `organizationSupplierId` resolvido pela sessao. Nao e suficiente consultar um registro pelo UUID e verificar depois.

Testes obrigatorios:

- fornecedor A tentando ler ou alterar item do fornecedor B;
- fornecedor de uma organizacao tentando acessar outra organizacao;
- usuario revogado tentando reutilizar sessao;
- manipulacao de IDs no corpo, URL e query string;
- tentativa de criar produto ativo diretamente;
- tentativa de atualizar um estabelecimento nao vinculado.

### 7.3 Dados que nunca serao expostos

- precos de outros fornecedores;
- comparativos internos;
- estoque, consumo ou minimo de estoque;
- vendas, CMV, faturamento ou margem;
- acordos comerciais de concorrentes;
- usuarios internos;
- lista completa de estabelecimentos, salvo decisao explicita da operacao.

### 7.4 Auditoria

Registrar:

- login, falha de login e revogacao;
- criacao e envio de lote;
- preco anterior e novo;
- alteracoes de unidade e embalagem;
- aprovacao ou rejeicao;
- usuario externo autor e usuario interno aprovador;
- estabelecimentos e vinculos efetivamente afetados;
- falha ou reversao da aplicacao.

Segredos, senhas e tokens nunca devem aparecer nos logs.

## 8. Experiencia do usuario

### 8.1 Painel interno

Novas areas:

- **Catalogo central:** produtos da organizacao e seus vinculos locais;
- **Consolidar produtos:** revisao de correspondencias;
- **Fornecedores centrais:** consolidacao e contas externas;
- **Catalogos dos fornecedores:** ofertas e apresentacoes;
- **Atualizacoes de preco:** fila de aprovacao;
- **Produtos sugeridos:** revisao das sugestoes externas.

### 8.2 Portal do fornecedor

Priorizar celular e operacao simples:

- URL propria ou identificador do fornecedor sem lista publica completa;
- login por usuario e senha;
- pesquisa por nome, EAN e codigo do fornecedor;
- edicao rapida em formato de tabela/cartoes;
- salvamento automatico como rascunho;
- acao de repetir preco anterior;
- marcacao de indisponibilidade;
- previa das alteracoes antes do envio;
- confirmacao e comprovante do lote enviado;
- historico apenas das proprias alteracoes.

## 9. Estrategia de migracao

A migracao sera progressiva e reversivel no nivel funcional.

### Fase A — Estrutura opcional

- criar tabelas centrais;
- adicionar chaves opcionais a `Product` e `Supplier`;
- manter todos os fluxos atuais funcionando;
- nao substituir a sincronizacao atual ainda.

### Fase B — Preenchimento assistido

- criar script de inventario, sem escrita, para detectar candidatos;
- classificar correspondencias por nome normalizado, unidade, embalagem e EAN;
- revisar o relatorio com a operacao;
- executar vinculacao apenas dos grupos aprovados;
- produzir relatorio antes/depois e contagens de reconciliacao.

### Fase C — Fluxo duplo controlado

- novos fluxos utilizam IDs centrais quando disponiveis;
- itens ainda nao migrados continuam funcionando localmente;
- monitorar divergencias sem alterar dados automaticamente.

### Fase D — Centralizacao obrigatoria

- impedir novos produtos ou fornecedores sem identidade central adequada;
- remover a propagacao por coincidencia de nomes;
- manter compatibilidade de leitura do historico antigo.

Nenhuma migracao deve apagar produtos, fornecedores, movimentos, pedidos ou historicos existentes.

## 10. Etapas de implementacao

### Etapa 0 — Auditoria e protecoes previas

Entregas:

- corrigir isolamento nos servicos de produto-fornecedor;
- adicionar controle de funcao nas rotas mutaveis;
- mapear todas as consultas de produto e fornecedor sem filtro de tenant;
- criar testes de seguranca multi-tenant;
- documentar comportamento atual da sincronizacao.

Saida esperada: base interna segura antes da exposicao externa.

### Etapa 1 — Produto central

Entregas:

- migracao Prisma de `OrganizationProduct`;
- vinculo opcional em `Product`;
- gerador transacional de `internalCode` por organizacao;
- APIs internas de consulta, criacao, edicao e vinculacao;
- tela de catalogo central;
- testes de unicidade e isolamento.

Saida esperada: produtos locais podem compartilhar identidade sem mudar o estoque.

### Etapa 2 — Consolidacao e migracao dos produtos atuais

Entregas:

- relatorio somente leitura de candidatos;
- regras de normalizacao;
- tela ou processo de revisao;
- script idempotente de aplicacao dos vinculos aprovados;
- reconciliacao de contagens e conflitos;
- plano documentado de rollback dos vinculos.

Saida esperada: catalogo atual vinculado com ambiguidades explicitamente revisadas.

### Etapa 3 — Fornecedor central

Entregas:

- migracao Prisma de `OrganizationSupplier`;
- vinculo opcional em `Supplier`;
- consolidacao assistida por CNPJ;
- tela de revisao;
- substituicao gradual de busca por nome/CNPJ por relacionamento central.

Saida esperada: cada fornecedor recorrente possui identidade unica na organizacao.

### Etapa 4 — Catalogo e atualizacao central de precos

Entregas:

- `SupplierCatalogItem`;
- `SupplierPriceUpdate` e seus itens;
- calculo e validacao de conversao de unidades;
- fila interna de aprovacao;
- previa dos estabelecimentos e vinculos afetados;
- propagacao transacional para `ProductSupplier`;
- historico e auditoria;
- alertas de variacao.

Saida esperada: a propria operacao consegue testar todo o fluxo central antes do portal.

### Etapa 5 — Autenticacao e portal do fornecedor

Entregas:

- `SupplierPortalUser`;
- login, logout, recuperacao e revogacao;
- middlewares exclusivos do portal;
- tela responsiva do catalogo;
- rascunho e envio em lote;
- historico do fornecedor;
- testes de penetracao logica e isolamento.

Saida esperada: fornecedor piloto atualiza precos sem acesso ao painel interno.

### Etapa 6 — Sugestao de novos produtos

Entregas:

- `SupplierProductSuggestion`;
- formulario externo;
- deteccao de possiveis duplicidades;
- fila interna de revisao;
- vinculo a produto existente ou criacao central aprovada;
- selecao explicita dos estabelecimentos locais.

Saida esperada: fornecedor amplia seu catalogo sem alterar diretamente estoque ou CMV.

### Etapa 7 — Automacoes posteriores

Entregas opcionais:

- aprovacao automatica por regras;
- notificacoes semanais;
- importacao controlada de planilha;
- vigencia promocional;
- excecao de preco por estabelecimento;
- faixas de quantidade;
- indicadores de pontualidade e confiabilidade.

## 11. Estrategia de testes

### 11.1 Testes unitarios

- geracao e unicidade do codigo central;
- normalizacao de EAN, CNPJ e unidades;
- calculo de preco normalizado;
- limites de variacao;
- regras de aprovacao;
- deteccao de correspondencias ambiguas.

### 11.2 Testes de servico e repositorio

- toda leitura e escrita filtrada por organizacao/estabelecimento;
- propagacao somente para vinculos existentes;
- transacao integral em caso de falha;
- historico correto por estabelecimento;
- idempotencia de migracoes e aplicacoes;
- nenhum efeito em estoque ou `currentCost`.

### 11.3 Testes de integracao

- fluxo completo de criacao central e vinculacao local;
- envio, aprovacao e aplicacao de preco;
- rejeicao de lote;
- produto sugerido vinculado a item existente;
- usuario revogado e sessao expirada;
- dois fornecedores com o mesmo produto e precos independentes.

### 11.4 Validacao operacional

Executar piloto com:

- uma organizacao;
- dois estabelecimentos;
- um fornecedor recorrente;
- um conjunto pequeno de produtos com unidade e embalagem revisadas.

Comparar manualmente os precos antes e depois, os vinculos afetados e o historico produzido.

## 12. Criterios de aceite

- produto central identifica corretamente o mesmo item em estabelecimentos distintos;
- produtos apenas semelhantes nao sao vinculados automaticamente;
- fornecedor central identifica corretamente seus registros locais;
- preco aprovado chega a todos e somente aos vinculos autorizados;
- falha em um item nao deixa atualizacao parcial silenciosa;
- fornecedor nao consulta estoque, CMV, vendas ou concorrentes;
- fornecedor A nao acessa dados do fornecedor B;
- organizacao A nao acessa dados da organizacao B;
- produto sugerido nao vira produto ativo sem aprovacao;
- alteracao de embalagem sempre passa por revisao;
- toda alteracao possui autor, data, valor anterior e valor novo;
- estoque, custo atual e historico de compras permanecem preservados durante a migracao;
- sincronizacao por nome deixa de ser usada apos a centralizacao completa.

## 13. Observabilidade e operacao

Criar indicadores internos para acompanhar:

- produtos locais ainda sem vinculo central;
- fornecedores locais ainda sem vinculo central;
- atualizacoes aguardando aprovacao;
- falhas de propagacao;
- itens com conversao de unidade inconsistente;
- acessos externos bloqueados;
- precos vencidos ou nao atualizados ha muito tempo.

Erros devem gerar um identificador de ocorrencia, sem expor detalhes internos ao fornecedor.

## 14. Riscos e mitigacoes

### Vinculacao incorreta de produtos

**Risco:** atualizar o preco de um produto diferente.
**Mitigacao:** IDs centrais, revisao de ambiguidades, unidade e embalagem obrigatorias.

### Duplicidade durante a migracao

**Risco:** dois produtos centrais para o mesmo item.
**Mitigacao:** relatorio previo, EAN como sinal auxiliar, revisao e operacao idempotente de mesclagem.

### Credencial compartilhada

**Risco:** impossibilidade de identificar o vendedor.
**Mitigacao:** suportar varios usuarios por fornecedor e revogacao individual.

### Preco digitado incorretamente

**Risco:** impacto nas compras.
**Mitigacao:** previa, alerta de variacao e aprovacao interna no primeiro release.

### Confusao entre caixa e unidade

**Risco:** comparacao e pedido incorreto.
**Mitigacao:** campos estruturados e preco normalizado calculado no backend.

### Atualizacao parcial entre estabelecimentos

**Risco:** lojas com precos divergentes.
**Mitigacao:** transacao, auditoria por destino e reconciliacao posterior.

## 15. Decisoes recomendadas para o MVP

- manter aprovacao interna obrigatoria;
- atualizar apenas `ProductSupplier.price` e historico, nunca `Product.currentCost`;
- atualizar apenas vinculos locais preexistentes;
- utilizar um usuario individual por vendedor sempre que possivel;
- nao mostrar uma lista publica de fornecedores no login;
- permitir sugestao, mas nao criacao direta de produto ativo;
- iniciar com uma unica combinacao de preco por fornecedor e produto central;
- executar piloto pequeno antes da migracao completa;
- manter as novas chaves opcionais durante toda a fase de transicao.

## 16. Decisoes que podem ser tomadas durante a implementacao

Estas escolhas nao bloqueiam a Etapa 0 nem a modelagem inicial:

- formato visual do `internalCode`;
- se o fornecedor vera os nomes dos estabelecimentos afetados;
- limite percentual futuro para aprovacao automatica;
- envio de recuperacao por e-mail, WhatsApp ou ambos;
- suporte a foto no primeiro release de sugestao de produto;
- tratamento de preco promocional no MVP ou em etapa posterior.

## 17. Ordem recomendada de execucao

```text
Protecoes multi-tenant
        |
        v
Produto central -> Migracao assistida
        |
        v
Fornecedor central -> Catalogo e precos centrais
        |
        v
Teste interno completo
        |
        v
Portal do fornecedor
        |
        v
Sugestao de produtos e automacoes
```

O portal nao deve ser iniciado antes de o produto central, o fornecedor central e a propagacao transacional estarem funcionando e testados internamente.

## 18. Primeiro passo ao iniciar a implementacao

Comecar pela **Etapa 0 — Auditoria e protecoes previas**. Depois, preparar uma proposta de migracao Prisma apenas para `OrganizationProduct` e o vinculo opcional em `Product`, acompanhada de testes e de um inventario somente leitura dos produtos atuais. A migracao nao devera ser aplicada em producao antes da revisao do inventario e de um backup validado.
