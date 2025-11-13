# Gestor de Finanças - Backend

API construída com [NestJS](https://nestjs.com/) e [TypeORM](https://typeorm.io/) para suportar o aplicativo Gestor de Finanças.

## Requisitos
- Node.js 18+
- PostgreSQL 13+

## Configuração
1. Copie `.env.example` para `.env` e ajuste as variáveis de banco ou utilize o bloco abaixo como base:
   ```env
   NODE_ENV=development
   PORT=3000
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=postgres
   DB_NAME=finance
   DB_SSL=false
   ```
2. Instale dependências:
   ```bash
   npm install
   ```
3. Gere o build (necessário para executar com Node em produção):
   ```bash
   npm run build
   ```
4. Execute as migrations para preparar o banco:
   ```bash
   npm run migration:run
   ```
5. (Opcional) Popule dados demo:
   ```bash
   npm run seed
   ```
6. Inicie a API em modo desenvolvimento (watch) ou produção:
   ```bash
   npm run start:dev
   # ou
   npm run start
   ```

A API estará disponível em `http://localhost:3000` por padrão.

### Integração com Postman
1. Abra o Postman e importe `postman/gestor-financas.postman_collection.json`.
2. Crie um ambiente com a variável `baseUrl` apontando para a URL da API (ex.: `http://localhost:3000`).
3. Após executar as migrations/seed, preencha as variáveis `userId`, `accountId`, `incomeCategoryId`, `expenseCategoryId` e `goalCategoryId` com os IDs retornados nas rotas de listagem ou seeds.
4. Execute as requisições CRUD conforme necessidade. Os endpoints seguem a convenção REST descrita abaixo.

## Estrutura Principal
- `src/modules`: módulos por domínio (usuários, contas, categorias, rendas, despesas, metas, dashboard).
- `src/database`: configuração do TypeORM, migrações e seeds.
- `src/common`: componentes compartilhados (entidades base, enums, exceções).

## Endpoints Principais

| Recurso | Método | Rota | Descrição |
|---------|--------|------|-----------|
| Usuários | `POST` | `/usuarios` | Cria um usuário com validação de e-mail único e senha hash.
| Usuários | `GET` | `/usuarios` | Lista todos os usuários ativos/inativos.
| Usuários | `GET` | `/usuarios/:id` | Retorna um usuário específico.
| Usuários | `PATCH` | `/usuarios/:id` | Atualiza dados gerais e senha (rehash automático).
| Usuários | `DELETE` | `/usuarios/:id` | Remove usuário e dados associados.
| Contas | `POST` | `/contas` | Cria conta para um usuário garantindo saldo inicial não negativo.
| Contas | `GET` | `/contas?usuarioId=UUID` | Lista contas de um usuário.
| Contas | `PATCH` | `/contas/:id` | Atualiza dados, muda titular e valida limites.
| Contas | `DELETE` | `/contas/:id` | Remove conta (exige `cascade=true` se houver vínculos).
| Categorias | `POST` | `/categorias` | Cadastra categoria de renda/despesa/meta.
| Categorias | `DELETE` | `/categorias/:id` | Bloqueia exclusão quando há metas vinculadas.
| Metas | `POST` | `/metas` | Cria meta garantindo datas válidas e apenas uma ativa por categoria.
| Metas | `PATCH` | `/metas/:id` | Ajusta progresso respeitando limites e status.
| Rendas | `POST` | `/rendas` | Lança renda atualizando saldo e metas.
| Rendas | `PATCH` | `/rendas/:id` | Reatribui categoria/conta/meta com ajustes de saldo.
| Despesas | `POST` | `/despesas` | Registra despesa com controle de parcelamento e limites.
| Despesas | `PATCH` | `/despesas/:id` | Recalcula saldos e metas ao editar.
| Dashboard | `GET` | `/dashboard?usuarioId=UUID` | Retorna saldo total, somas mensais, progresso de metas e próximas despesas.

## Scripts NPM
- `start`: inicia a API em modo produção
- `start:dev`: inicia com hot reload
- `build`: compila o projeto
- `lint`: executa ESLint
- `test`: executa Jest
- `migration:*`: utilitários TypeORM
- `seed`: popula o banco com dados de exemplo

## Postman Collection
O arquivo `postman/gestor-financas.postman_collection.json` contém requisições prontas para testes da API. Após importar, ajuste as variáveis do ambiente conforme IDs reais retornados pelas requisições de criação/listagem.

## Regras de Negócio Cobertas
1. Usuários têm e-mails únicos.
2. Despesas não deixam o saldo da conta negativo.
3. Rendas incrementam o saldo da conta.
4. Despesas respeitam limites de categoria.
5. Metas não ultrapassam o valor objetivo.
6. Exclusão de conta com movimentações exige confirmação (`cascade`).
7. Metas têm data inicial anterior à final.
8. Rendas recorrentes exigem intervalo.
9. Despesas parceladas possuem número de parcelas ≥ 1.
10. Categorias com metas não podem ser excluídas.
11. Usuários inativos não lançam movimentações.
12. Saldo inicial da conta é não negativo.
13. Despesas vinculam-se a conta **ou** meta.
14. Rendas não alimentam metas concluídas.
15. Usuário só mantém uma meta ativa por categoria.

## Dashboard
Endpoint `GET /dashboard?usuarioId=<uuid>` provê:
- Saldo total consolidado
- Totais de receitas e despesas no mês corrente
- Progresso das metas
- Próximas 5 despesas

## Testes
Execute `npm test` para rodar a suíte. Adicione testes unitários/integração conforme evoluir.
