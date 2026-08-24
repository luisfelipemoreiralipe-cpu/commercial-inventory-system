# Plano de Implementação — CMV e Compras Operacionais

## 1. Objetivo

Evoluir o sistema para separar corretamente:

- CMV dos produtos atualmente controlados, principalmente bebidas, drinks e seus ingredientes;
- materiais de limpeza;
- descartáveis;
- outros custos operacionais;
- itens que não devem participar do CMV.

Nesta primeira fase, alimentos não serão lançados nem considerados no cálculo de CMV.

## 2. Princípios do projeto

1. Material de limpeza não entra no CMV de bebidas.
2. Compras operacionais podem ter controle de estoque.
3. O consumo de limpeza será registrado separadamente como consumo operacional.
4. A sugestão de compra de bebidas não será misturada com limpeza ou descartáveis.
5. Alterações futuras no cadastro não poderão modificar classificações históricas das ordens.
6. Todas as informações devem permanecer isoladas por estabelecimento.
7. Unidades de compra e unidades-base de estoque devem continuar sendo respeitadas.

## 3. Classificações financeiras e de compra

Cada produto deverá possuir uma classificação obrigatória:

| Classificação | Utilização |
|---|---|
| CMV — Bebidas | Bebidas, drinks, insumos e ingredientes atualmente controlados |
| Material de limpeza | Detergentes, desinfetantes, papel, sacos de lixo e similares |
| Descartáveis | Copos, canudos, guardanapos, embalagens e similares |
| Outros custos operacionais | Manutenção, materiais administrativos e demais consumos |
| Não contabilizar no CMV | Itens sem impacto no CMV ou controlados por outro processo |

Quando alimentos forem incorporados, será criada a classificação `CMV — Alimentos`, sem alterar dados históricos.

## 4. Alterações no banco de dados

### 4.1 Produto

Adicionar ao produto:

- classificação financeira/de compra;
- frequência de reposição: semanal, quinzenal, mensal ou sob demanda;
- quantidade ideal de estoque;
- indicação de controle de estoque ou despesa direta;
- setor responsável, quando aplicável.

Os campos atuais de estoque mínimo, unidade de compra e quantidade por embalagem continuarão sendo utilizados.

### 4.2 Item da ordem de compra

Salvar uma fotografia da classificação no item da ordem. Isso garante que uma alteração futura no produto não modifique relatórios antigos.

### 4.3 Consumo operacional

O registro de consumo deverá armazenar:

- produto;
- quantidade utilizada;
- custo unitário no momento da baixa;
- custo total;
- classificação;
- setor;
- motivo;
- observação;
- data;
- local de estoque;
- usuário;
- estabelecimento.

## 5. Migração dos dados atuais

1. Classificar inicialmente os produtos atuais elegíveis como `CMV — Bebidas`.
2. Manter ativos e patrimônios fora do CMV.
3. Não criar nem classificar alimentos nesta fase.
4. Identificar produtos de limpeza, descartáveis e itens ambíguos.
5. Apresentar itens ambíguos para revisão antes da classificação definitiva.
6. Validar que a migração não altera quantidades, custos ou históricos.

## 6. Cadastro de produtos

O formulário de produtos deverá permitir informar:

- classificação financeira/de compra;
- categoria;
- frequência de reposição;
- estoque mínimo;
- estoque ideal;
- unidade de compra;
- quantidade por embalagem;
- controle em estoque ou despesa direta;
- setor responsável.

O sistema deverá validar combinações inválidas, como produto controlado em estoque sem unidade ou local definido.

## 7. Sugestão de compra

### 7.1 Organização da tela

A tela terá abas independentes:

```text
Bebidas e insumos | Limpeza | Descartáveis | Outros operacionais
```

A aba inicial será sempre `Bebidas e insumos`. As demais exibirão contadores, mas não poluirão a lista principal.

### 7.2 Filtros

- classificação;
- categoria;
- fornecedor;
- produto;
- estabelecimento;
- abaixo do mínimo;
- frequência de reposição.

### 7.3 Regra de sugestão

Para materiais operacionais:

```text
Quantidade sugerida = estoque ideal - saldo disponível
```

Somente valores positivos serão apresentados.

Em uma evolução futura, a sugestão poderá considerar consumo médio e cobertura em dias:

```text
Sugestão = necessidade do período + estoque de segurança - saldo disponível
```

## 8. Ordens de compra

### 8.1 Geração automática

- separar ordens por fornecedor;
- separar ordens por classificação;
- não misturar automaticamente bebidas com limpeza;
- não misturar automaticamente limpeza com descartáveis;
- preservar a classificação em cada item.

### 8.2 Ordem manual

Uma ordem manual poderá conter classificações diferentes, mas deverá:

- mostrar a classificação de cada item;
- apresentar subtotal por classificação;
- manter os itens separados nos relatórios.

### 8.3 Filtros da listagem

- classificação;
- categoria;
- fornecedor;
- produto;
- status;
- período;
- estabelecimento.

## 9. Controle de materiais de limpeza

### 9.1 Entrada

1. O material é comprado por uma ordem de compra.
2. A conclusão da ordem adiciona a quantidade ao estoque.
3. O custo unitário é atualizado normalmente.

### 9.2 Baixa semanal

Será criada uma área chamada `Consumo de materiais`.

O usuário informará:

- período;
- produto;
- quantidade utilizada;
- local de estoque;
- setor;
- motivo;
- observação.

A baixa será registrada como `Consumo operacional — Limpeza` e não como venda.

### 9.3 Modalidades de controle

| Modalidade | Exemplos | Tratamento |
|---|---|---|
| Controle por quantidade | detergente, álcool, papel, sacos de lixo, luvas | entrada e baixa de estoque |
| Despesa direta | itens pequenos cujo saldo não compensa controlar | registra custo sem saldo físico |

A recomendação inicial é realizar baixa consolidada semanal e inventário físico mensal.

## 10. CMV e relatórios financeiros

### 10.1 Escopo inicial

O CMV contemplará somente os produtos atuais do sistema classificados como `CMV — Bebidas`.

Alimentos permanecerão fora do cálculo até uma fase futura.

### 10.2 Indicadores

- faturamento das vendas importadas;
- CMV de bebidas em reais;
- CMV percentual de bebidas;
- lucro bruto de bebidas;
- margem bruta de bebidas;
- consumo de material de limpeza;
- consumo de descartáveis;
- outros custos operacionais;
- perdas;
- compras por classificação.

### 10.3 Fórmulas

```text
Receita líquida = quantidade vendida × preço de venda - descontos
CMV de bebidas = soma dos custos congelados das vendas
Lucro bruto = receita líquida - CMV de bebidas
CMV % = CMV de bebidas / receita líquida × 100
Margem bruta % = lucro bruto / receita líquida × 100
```

Os custos deverão ser congelados no momento da venda para que alterações posteriores não modifiquem relatórios históricos.

## 11. Integração futura com PDV

Para calcular receita, margem e CMV percentual, será necessário registrar:

- código único da venda no PDV;
- produto vendido;
- quantidade;
- preço unitário de venda;
- desconto;
- valor líquido;
- data e hora;
- estabelecimento;
- custo do produto no momento da venda;
- origem da importação.

Cada arquivo ou venda deverá possuir identificação única para impedir baixas duplicadas.

## 12. Regras de segurança

- impedir reprocessamento do mesmo arquivo do PDV;
- validar produto, local e fornecedor pelo estabelecimento;
- impedir mistura automática de classificações nas ordens;
- impedir que limpeza entre no CMV;
- preservar a classificação histórica das ordens;
- executar entradas e baixas em transações;
- manter o saldo global consistente com os saldos por local;
- registrar usuário, data e motivo das baixas.

## 13. Testes necessários

### Backend

- migração e valores padrão;
- classificação por estabelecimento;
- criação e conclusão de ordens;
- separação por fornecedor e classificação;
- cálculo da sugestão por estoque ideal;
- baixa semanal de limpeza;
- custo operacional separado do CMV;
- proteção contra duplicidade;
- conversão de embalagens e unidades;
- concorrência e idempotência.

### Frontend

- abas e contadores da sugestão;
- filtros das ordens;
- subtotais por classificação;
- formulário de consumo;
- mensagens de validação;
- relatórios e períodos.

## 14. Etapas de implementação

1. Criar classificações e campos no banco.
2. Implementar migração segura dos produtos atuais.
3. Atualizar backend e validações de produtos.
4. Atualizar formulário de cadastro de produtos.
5. Separar a sugestão de compra por abas.
6. Separar a geração automática de ordens.
7. Adicionar filtros e subtotais às ordens.
8. Criar o fluxo de consumo semanal.
9. Atualizar relatórios financeiros.
10. Implementar testes automatizados.
11. Validar dados em ambiente controlado.
12. Publicar por etapas e acompanhar produção.

## 15. Critérios de aceite

- bebidas aparecem por padrão na sugestão de compra;
- limpeza não aparece misturada com bebidas;
- ordens automáticas não misturam classificações;
- materiais de limpeza entram no estoque após a compra;
- baixa semanal reduz corretamente o estoque;
- consumo de limpeza aparece como custo operacional;
- limpeza nunca aumenta o CMV de bebidas;
- alimentos não aparecem no CMV nesta fase;
- filtros funcionam por classificação, categoria, fornecedor, produto, status e período;
- relatórios históricos não mudam quando um produto é reclassificado;
- nenhum saldo global diverge da soma dos locais.

## 16. Estratégia de implantação

### Fase 1 — Estrutura

- banco de dados;
- backend;
- migração de classificação;
- testes de regressão.

### Fase 2 — Compras

- cadastro de produtos;
- sugestão de compra;
- ordens e filtros.

### Fase 3 — Consumo

- baixa semanal;
- histórico de consumo operacional;
- inventário de materiais.

### Fase 4 — Financeiro

- CMV de bebidas;
- custos operacionais;
- relatórios e indicadores.

### Fase 5 — PDV

- importação de vendas com preços;
- bloqueio de duplicidade;
- faturamento, margem e CMV percentual.
