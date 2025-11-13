# Gestor de Finanças – Backend

Backend NestJS + TypeORM responsável por alimentar o aplicativo Expo/React Native. Este documento consolida a configuração, regras de negócio e rotas do servidor.

---

## 🌐 Arquitetura

| Componente | Descrição |
| ---------- | --------- |
| NestJS | Framework principal (`src/main.ts`, módulos em `src/modules`). |
| TypeORM | ORM com migrations (`src/database/migrations`). |
| PostgreSQL | Banco relacional padrão; conexão configurada via `.env`. |
| Auth | JWT + bcrypt com guards (`src/modules/auth`). |
| Dashboard | Endpoint agregado (`src/modules/dashboard`). |

Módulos CRUD expostos: `accounts`, `categories`, `incomes`, `expenses`, `goals`, `users`. Cada módulo possui entidade, controller, service e DTOs com validações.

---

## ✨ Destaques

- **Regras de negócio**: mais de 15 validações lançando `BusinessRuleException` ou `NotFoundException`, cobrindo limites de contas, categorias, metas e status de usuários.
- **Integração com o app**: respostas de erro estruturadas são consumidas pelo frontend (ver `src/services/api.ts`).
- **Dashboard customizado**: módulo `dashboard` agrega dados de receitas, despesas, contas e metas para exibição na aba inicial.
- **Seeds opcionais**: scripts `npm run seed` e `npm run seed:default-categories` adicionam dados base.
- **Coleção Postman**: disponível em `postman/gestor-financas.postman_collection.json` com cenários de sucesso/erro.

---

## 🚀 Como executar

### 1. Pré-requisitos

- Node.js 18+
- npm 9+
- PostgreSQL 14+

### 2. Instalar dependências

```bash
cd backend
npm install
```

### 3. Configurar variáveis de ambiente

Copie `.env.example` para `.env` ou utilize o template:

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=gestor_financas
DB_SSL=false

JWT_SECRET=super-secret
EXPIRES_IN=1d

EXPO_PUBLIC_API_URL=http://localhost:3000
```

> O frontend consome `EXPO_PUBLIC_API_URL`. Mantenha o valor alinhado ao endereço do backend.

### 4. Preparar o banco

```bash
# cria banco (se habilitado) e executa migrations + categorias padrão
npm run db:prepare

# caso o banco já exista, apenas aplique migrations
npm run migration:run

# opcional: dados de demonstração completos
npm run seed
```

> A migration `1700000000001_remove_meta_account_category.ts` remove vínculos obrigatórios em metas. Execute `npm run migration:run` após atualizar o projeto.

### 5. Subir o servidor

```bash
npm run start:dev
```

Servidor disponível em `http://localhost:3000`.

### 6. Build opcional

```bash
npm run build
npm run start
```

---

## 🧪 Scripts úteis

| Comando | Descrição |
| ------- | --------- |
| `npm run start:dev` | Inicia servidor com hot reload. |
| `npm run start` | Executa em modo produção (build prévio necessário). |
| `npm run build` | Compila TypeScript para `dist`. |
| `npm run lint` | Executa ESLint. |
| `npm run test` | Roda Jest. |
| `npm run migration:run` | Aplica migrations pendentes. |
| `npm run migration:revert` | Reverte última migration. |
| `npm run db:prepare` | Cria banco/migrations + seeds padrão. |
| `npm run seed` | Popula dados de demonstração. |
| `npm run seed:default-categories` | Insere categorias padrão. |

---

## ✅ Checklist de requisitos

| Item | Atendimento |
| ---- | ----------- |
| NestJS + TypeORM + PostgreSQL | ✔️ `app.module.ts`, entidades em `src/modules/**/entities`. |
| 5 CRUDs + página personalizada | ✔️ Módulos `accounts`, `categories`, `incomes`, `expenses`, `goals` + `dashboard`. |
| Migrations TypeORM | ✔️ `1700000000000_initial_schema.ts`, `1700000000001_remove_meta_account_category.ts`. |
| 15+ regras de negócio | ✔️ Validações em services (limite de gastos, usuário inativo, metas concluídas, saldo negativo etc.). |
| Collection Postman | ✔️ `postman/gestor-financas.postman_collection.json`. |
| Integração com aplicativo | ✔️ Serviços frontend consomem API e exibem erros. |
| README de execução | ✔️ Este documento + README raiz orientam setup. |

---

## Endpoints principais

| Recurso | Método | Rota | Destaques de regra |
|---------|--------|------|--------------------|
| Usuários | `POST` | `/usuarios` | E-mail único, senha com hash, status ativo/inativo. |
| Contas | `POST` | `/contas` | Saldo inicial ≥ 0, validação de usuário. |
| Contas | `DELETE` | `/contas/:id` | Bloqueia exclusão sem `cascade` quando há movimentações. |
| Categorias | `POST` | `/categorias` | Tipagem (renda/despesa), limite opcional. |
| Categorias | `DELETE` | `/categorias/:id` | Impede remoção caso usada. |
| Metas | `POST` | `/metas` | Datas válidas, progresso ≤ alvo. |
| Metas | `PATCH` | `/metas/:id` | Mantém consistência de status. |
| Rendas | `POST` | `/rendas` | Usuário ativo, conta válida, metas não concluídas. |
| Rendas | `PATCH` | `/rendas/:id` | Ajusta saldos/metas ao alterar conta/meta. |
| Despesas | `POST` | `/despesas` | Limite de categoria, crédito, vínculo conta OU meta. |
| Despesas | `PATCH` | `/despesas/:id` | Recalcula saldos/metas e parcelas. |
| Dashboard | `GET` | `/dashboard?usuarioId=` | Consolida métricas financeiras. |

---

## Integração com Postman

1. Importe `postman/gestor-financas.postman_collection.json`.
2. Crie ambiente com `baseUrl` (ex.: `http://localhost:3000`).
3. Preencha variáveis `userId`, `accountId`, `incomeCategoryId`, `expenseCategoryId`, `goalId` após executar seeds ou criar dados manualmente.
4. Execute cenários de sucesso e erro para demonstrar regras de negócio.

---

## Referências

- Documentação de rotas: `docs/api-reference.md`
- Arquitetura detalhada: `docs/explicacao.txt`
- Resumo de requisitos: `docs/requirements-overview.md`

---

Executando os passos acima, o backend opera integrado ao aplicativo, evidenciando todos os requisitos do Trabalho 02. Bons testes! 🚀
