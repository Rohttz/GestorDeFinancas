# Backend Requirements Overview

## CRUD Resources
- **Usuarios**: register users and manage authentication metadata.
- **Contas**: manage financial accounts with balances and account types.
- **Categorias**: classify transactions for despesas and rendas.
- **Rendas**: record income entries with recurrence support.
- **Despesas**: record expense entries with optional installments.
- **Metas**: track savings goals linked to contas and categorias.

## Business Rules (Draft)
1. Users must have a unique email.
2. Account balance cannot drop below zero when registering a despesa.
3. Account balance must increase when a renda is recorded.
4. Despesa value cannot exceed configured spending limit for its categoria if defined.
5. Meta progress cannot exceed meta target value.
6. Deleting a conta with associated transactions is blocked unless forced via cascade flag.
7. Metas require start date before end date.
8. Rendas with recurrence must include recurrence interval.
9. Despesas with installments must specify total installments >= 1.
10. Categoria cannot be deleted if associated metas exist.
11. Only active users may create transactions.
12. Account initial balance must be non-negative.
13. Expenses must be associated with either a conta or a meta but not both simultaneously.
14. Income entries cannot be associated with metas marked as completed.
15. User cannot have more than one active meta per categoria.

## Additional Deliverables
- TypeORM migrations and seeds.
- Aggregated dashboard endpoint with balance summary.
- Postman collection for API endpoints.
- Backend README with setup instructions.
- TXT explanation summarizing architecture decisions.
- Frontend adjustments for backend error handling where appropriate.
