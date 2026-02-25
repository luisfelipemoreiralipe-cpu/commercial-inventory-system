# Commercial Backend API

Esta é a API backend completa para o sistema de gestão de estoque interno ("Commercial"). Construída com Node.js, Express, PostgreSQL, Prisma e padrão Clean Architecture (Controller -> Service -> Repository).

---

## 🚀 Como instalar e executar localmente

### 1. Pré-requisitos
- **Node.js**: `v18.0.0` ou superior.
- **PostgreSQL**: Rodando localmente ou em conteiner (porta padrão `5432`).

### 2. Instalação
Na pasta raiz do backend, instale as dependências:
```bash
npm install
```

### 3. Configuração de Variáveis de Ambiente
Crie um arquivo `.env` na raiz do backend baseado no `.env.example`:
```bash
cp .env.example .env
```
Abra o `.env` e **configure `DATABASE_URL`** com as credenciais do seu banco de dados PostgreSQL. Exemplo:
`DATABASE_URL="postgresql://postgres:sua_senha@localhost:5432/commercial?schema=public"`

### 4. Setup do Banco de Dados
Para rodar as migrações (criar as tabelas e relações no banco de dados) e gerar o Prisma Client:
```bash
npm run db:migrate
```

*(Opcional) Visualizar o banco de dados localmente (Studio):*
```bash
npm run db:studio
```

### 5. Iniciar o Servidor
Para ambiente de desenvolvimento (com reload automático ao salvar):
```bash
npm run dev
```

O servidor será iniciado em `http://localhost:3333`.

---

## 🏗️ Estrutura Arquitetural

Toda a lógica foi estritamente dividida para manutenção escalável:

- `src/validations`: Schemas do **Zod** garantem que todos os bodys/inputs das requisições sejam validados **antes** de entrarem no controlador.
- `src/controllers`: Recebem o "request", invocam o "service" correspondente e estruturam a resposta JSON do "response". Não possuem regras de negócio.
- `src/services`: **Coração da API onde residem as regras de negócio cruciais** (ex: ao concluir uma ordem de compra, abate estoque, cria `StockMovement` de entrada e cria um registro `AuditLog` – tudo via $transaction para evitar instabilidade).
- `src/repositories`: Única camada que conversa diretamente com o ORM (Prisma). Sem regra de negócio.

---

## 🔒 Tratamento de Erros

Um middleware central captura todos os erros.
Erros provenientes de lógica interna mapeados disparam uma flag de classe nativa `AppError(message, statusCode)`.
Exceções cruciais SQL do Prisma (ex: Quebra de constraints únicas como `P2002`, `P2003`) também foram inteiramente mapeadas para não exporem detalhes sensíveis ("stack tracings") da base ao front-end ou clientes da API REST.
