# Gestor de Finanças

Aplicativo de gestão financeira pessoal construído com **Expo (React Native)** no frontend e **NestJS + TypeORM** no backend. O projeto oferece CRUD completo para contas, categorias, rendas, despesas, metas e usuários, além de um dashboard analítico com gráficos, filtros e suporte a tema claro/escuro.

---

## 🌐 Arquitetura

| Camada | Diretório | Destaques |
| ------ | --------- | --------- |
| Aplicativo móvel/web (Expo Router) | `app/`, `src/` | Navegação em abas, formulários com React Hook Form + Yup, componentes reutilizáveis (botões, inputs mascarados, pickers), integração com API REST. |
| Backend (NestJS) | `backend/` | Módulos independentes para `contas`, `categorias`, `rendas`, `despesas`, `metas`, `usuarios`, `auth`, `dashboard`; validação com class-validator; regras de negócio para atualização de saldos/metas; comunicação com Postgres via TypeORM. |
| Banco de dados | Postgres | Migrations em `backend/src/database/migrations`. Seeds utilitárias para dados iniciais (`npm run seed`, `npm run seed:default-categories`). |

Documentação detalhada dos endpoints está em `backend/docs/api-reference.md`; há também uma coleção Postman em `backend/postman/gestor-financas.postman_collection.json`.

---

## ✨ Funcionalidades

- **Dashboard analítico** com gráficos (`react-native-chart-kit`), métricas e alternância de tema animada.
- **CRUDs completos** para rendas, despesas, metas, categorias, contas e usuários, todos com validações ricas, máscaras de entrada e feedback contextual.
- **Regras financeiras** no backend: atualização de saldo das contas, controle de limites de categorias, progresso de metas e consistência entre lançamentos.
- **Arquitetura modular** com slices Redux Toolkit para cada domínio (`src/store/slices/*`) e serviços centralizados em `src/services/api.ts`.
- **Tema persistente** via `ThemeContext` e integração com AsyncStorage.
- **Autenticação** (login/logout) com persistência de sessão e guardas de rota.

---

## 🧰 Stack principal

- **Frontend:** Expo, React Native, Expo Router, React Hook Form, Yup, Redux Toolkit, AsyncStorage, `lucide-react-native`, `expo-linear-gradient`.
- **Backend:** NestJS, TypeORM, PostgreSQL, class-validator, bcrypt, JWT (via módulo de auth), scripts de seed/migration.

---

## 🚀 Como executar

### 1. Pré-requisitos

- Node.js 18+
- npm 9+
- PostgreSQL 14+ disponível na máquina local

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz (já existe um exemplo) com, pelo menos:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=gestor_financas

JWT_SECRET=super-secret
```

> O backend também aceita aliases `DATABASE_*`; mantenha os valores sincronizados.

### 3. Instalar dependências

```bash
# instalar dependências do app (pasta raiz)


# instalar dependências do backend
cd backend
npm install
cd ..
```

### 4. Preparar o banco

No diretório `backend/`:

```bash
cd backend

# cria banco (script usa as variáveis do .env) e executa migrations + categorias padrão
npm run db:prepare

# caso já esteja com o banco criado, execute apenas as migrations mais recentes
npm run migration:run

# opcional: popula dados demo adicionais
npm run seed
```

> ⚠️ Após esta atualização foi adicionada a migration `1700000000001_remove_meta_account_category.ts`, que remove as colunas `accountId` e `categoryId` de `metas`. Execute `npm run migration:run` para evitar erros 500 ao criar metas.

### 5. Subir os serviços

```bash
# backend (NestJS)
cd backend
npm run start:dev

# em outro terminal, na raiz
npm run dev
```

O Expo abrirá o Metro bundler; utilize Expo Go ou um emulador para testar. A API ficará disponível em `http://localhost:3000`.

---

## 🧪 Scripts úteis

| Comando | Local | Descrição |
| ------- | ----- | --------- |
| `npm run dev` | raiz | Inicia o app Expo (web, Android e iOS via Metro). |
| `npm run lint` | raiz | Executa lint do frontend com Expo. |
| `npm run build` | `backend/` | Compila o backend NestJS. |
| `npm run start:dev` | `backend/` | Sobe o servidor com hot reload. |
| `npm run migration:run` | `backend/` | Aplica migrations pendentes. |
| `npm run migration:revert` | `backend/` | Reverte a última migration aplicada. |
| `npm run seed` | `backend/` | Insere dados demo completos. |
| `npm run seed:default-categories` | `backend/` | Popula categorias base para qualquer usuário. |

---

## 📂 Estrutura resumida

```
GestorDeFinancas/
├── app/                           # Rotas Expo Router
├── src/
│   ├── components/                # Componentes reutilizáveis (Button, Card, InputMask ...)
│   ├── contexts/                  # ThemeContext, DialogContext
│   ├── features/                  # Fluxos de domínio (dashboard, despesas, metas, rendas ...)
│   ├── services/api.ts            # Cliente HTTP centralizado
│   └── store/                     # Redux Toolkit (slices, hooks)
├── backend/
│   ├── src/modules/               # Módulos NestJS (accounts, categories, expenses, goals ...)
│   ├── src/database/migrations/   # Migrations TypeORM (inclui 1700000000001_remove_meta_account_category)
│   ├── docs/                      # Documentação e coleção Postman
│   └── package.json
└── README.md
```

---

## ✅ Como validar rapidamente

1. **Dashboard:** acessar a aba inicial para visualizar gráficos, filtros e alternar o tema.
2. **Rendas/Despesas:** criar, editar e excluir lançamentos; observe atualizações de saldo e validações (ex.: valor obrigatório, data coerente).
3. **Metas:** criar metas sem vincular conta/categoria (novo comportamento após migration). O progresso e status são verificados no backend.
4. **Configurações:** gerenciar contas, categorias e usuários, todos com formulários completos.
5. **Autenticação:** realizar login e logout para testar persistência de sessão.

---

## � Referências adicionais

- Documentação da API: `backend/docs/api-reference.md`
- Arquitetura detalhada: `backend/docs/explicacao.txt`
- Requisitos consolidados: `backend/docs/requirements-overview.md`
- Coleção Postman: `backend/postman/gestor-financas.postman_collection.json`

---

Qualquer dúvida ou bug encontrado, abra uma issue ou entre em contato com a equipe. Bons testes! �
