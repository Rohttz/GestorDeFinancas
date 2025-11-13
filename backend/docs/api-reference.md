# API Reference

Este documento descreve os principais endpoints expostos pela API do Gestor de Finanças. Todas as rotas seguem convenções REST e aceitam/responder JSON.

> **Autenticação**
> Ainda não foi implementada autenticação. Todos os endpoints estão públicos e assumem que o `usuarioId` seja informado explicitamente, quando necessário.

## Convenções
- `id`: Identificador UUID v4.
- Campos monetários usam ponto como separador decimal e são armazenados em centavos (`numeric(12,2)` no banco).
- Datas são strings ISO-8601 `YYYY-MM-DD`.
- `status` de metas pode ser `ativa`, `concluida` ou `cancelada`.

---

## Usuários

### Criar usuário
`POST /usuarios`

```jsonc
{
  "nome": "Maria Silva",
  "email": "maria@example.com",
  "senha": "senhaSegura123"
}
```

- E-mail único.
- Senha armazenada com hash Argon2.

### Listar usuários
`GET /usuarios`

Query string:
- `ativos` (opcional, boolean) filtra por status ativo.

### Atualizar usuário
`PATCH /usuarios/{id}`

```jsonc
{
  "nome": "Maria Souza",
  "senha": "novaSenha!"
}
```

- Rehash automático da nova senha.
- Atualiza carimbo `updatedAt`.

---

## Contas

### Criar conta
`POST /contas`

```jsonc
{
  "usuarioId": "uuid-usuario",
  "nome": "Conta Corrente",
  "saldoInicial": 2500.50,
  "limiteCredito": 1000
}
```

- Valida saldo inicial >= 0.
- Garante limite consistente com tipo de conta.

### Listar contas
`GET /contas`

Query string obrigatória:
- `usuarioId` (UUID).

### Atualizar conta
`PATCH /contas/{id}`

```jsonc
{
  "nome": "Conta Principal",
  "limiteCredito": 500
}
```

- Recalcula saldo disponível se houver vinculação com metas/parcelas.

---

## Categorias

### Criar categoria
`POST /categorias`

```jsonc
{
  "usuarioId": "uuid-usuario",
  "nome": "Salário",
  "tipo": "RENDA"
}
```

- Tipos válidos: `RENDA`, `DESPESA`, `META`.
- `nome` único por tipo + usuário.

### Excluir categoria
`DELETE /categorias/{id}`

- Bloqueia exclusão se houver metas/lançamentos vinculados.

---

## Rendas

### Criar renda
`POST /rendas`

```jsonc
{
  "usuarioId": "uuid-usuario",
  "contaId": "uuid-conta",
  "categoriaId": "uuid-categoria",
  "valor": 4200,
  "descricao": "Salário mês",
  "dataRecebimento": "2025-10-05"
}
```

- Atualiza saldo da conta.
- Propaga impacto em metas relacionadas à categoria (incrementa progresso).

### Atualizar renda
`PATCH /rendas/{id}`

- Permite reatribuir conta/categoria.
- Reverte saldo anterior antes de aplicar novos valores.

---

## Despesas

### Criar despesa
`POST /despesas`

```jsonc
{
  "usuarioId": "uuid-usuario",
  "contaId": "uuid-conta",
  "categoriaId": "uuid-categoria",
  "valor": 350.75,
  "descricao": "Supermercado",
  "dataPagamento": "2025-10-07",
  "parcelas": 1,
  "metaId": "uuid-meta"
}
```

- Impede lançamento se saldo disponível insuficiente.
- Parcelas > 1 criam lançamentos futuros vinculados.
- Atualiza progresso da meta se informada.

### Atualizar despesa
`PATCH /despesas/{id}`

- Recalcula saldo impactado e metas associadas.
- Permite remarcar parcela ou categoria.

---

## Metas

### Criar meta
`POST /metas`

```jsonc
{
  "usuarioId": "uuid-usuario",
  "categoriaId": "uuid-categoria",
  "descricao": "Reserva de emergência",
  "valorObjetivo": 10000,
  "dataInicio": "2025-01-01",
  "dataFim": "2025-12-31"
}
```

- Apenas uma meta `ativa` por categoria/usuário.
- `dataFim` deve ser maior que `dataInicio`.

### Registrar progresso
`PATCH /metas/{id}`

```jsonc
{
  "valorAcumulado": 2500,
  "status": "ativa"
}
```

- Valor acumulado não pode ultrapassar objetivo.
- Status `concluida` bloqueia novos lançamentos.

---

## Dashboard

### Visão geral
`GET /dashboard`

Query string obrigatória:
- `usuarioId`

Resposta típica:

```jsonc
{
  "saldoTotal": 7200.45,
  "rendasMensais": {
    "mes": "2025-10",
    "total": 4200
  },
  "despesasMensais": {
    "mes": "2025-10",
    "total": 2950
  },
  "metas": [
    {
      "metaId": "uuid-meta",
      "categoria": "Reserva de emergência",
      "progresso": 0.25,
      "status": "ativa"
    }
  ],
  "despesasFuturas": [
    {
      "descricao": "Parcela cartão",
      "valor": 500,
      "dataPagamento": "2025-11-10"
    }
  ]
}
```

---

## Erros
- As violações de regra de negócio lançam `BusinessRuleException` com `statusCode` 400 e mensagem descritiva.
- Validações de DTO (`class-validator`) retornam 422 com detalhes dos campos.
- Erros inesperados retornam 500.
