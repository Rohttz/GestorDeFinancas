import { Categoria, Conta, Despesa, Meta, Renda, Usuario } from '@/src/types/models';
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '@/src/constants/defaults';
import {
  deleteMetadata,
  getAllMetadata,
  getMetadata,
  replaceMetadata,
  upsertMetadata,
} from './metadata';

const API_BASE_URL = (() => {
  const base = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
  return base.endsWith('/') ? base.slice(0, -1) : base;
})();

const buildUrl = (path: string) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    ...(init.headers as Record<string, string> | undefined),
  };

  const response = await fetch(buildUrl(path), {
    ...init,
    headers,
  });

  let payload: any = undefined;
  if (response.status !== 204) {
    const text = await response.text();
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = text;
      }
    }
  }

  if (!response.ok) {
    const message =
      typeof payload === 'string'
        ? payload
        : payload?.message
        ? Array.isArray(payload.message)
          ? payload.message.join(', ')
          : payload.message
        : response.statusText;
    throw new Error(message || 'Erro ao comunicar com a API.');
  }

  return payload as T;
}

const METADATA_KEYS = {
  categorias: 'categorias',
  contas: 'contas',
  usuarios: 'usuarios',
  rendas: 'rendas',
  despesas: 'despesas',
} as const;

type CategoriaMetadata = { cor?: string; observacoes?: string };
type ContaMetadata = { tipo?: string; observacoes?: string };
type UsuarioMetadata = { sobrenome?: string; tipo_acesso?: Usuario['tipo_acesso'] };
type RendaMetadata = { dia_recebimento?: number };
type DespesaMetadata = { dia_pagamento?: number };

type ApiRelation = { id: string } | null;

type ApiCategory = {
  id: string;
  name: string;
  type: 'income' | 'expense' | string;
  user?: ApiRelation;
  createdAt?: string;
  updatedAt?: string;
};

type ApiAccount = {
  id: string;
  name: string;
  type: string;
  balance: string | number;
  initialBalance?: string | number;
  creditLimit?: string | number | null;
  active: boolean;
  user?: ApiRelation;
  createdAt?: string;
  updatedAt?: string;
};

type ApiIncome = {
  id: string;
  description: string;
  amount: string | number;
  date: string;
  recurrence: string;
  account?: ApiRelation;
  category?: ApiRelation;
  goal?: ApiRelation;
  user?: ApiRelation;
  createdAt?: string;
  updatedAt?: string;
};

type ApiExpense = {
  id: string;
  description: string;
  amount: string | number;
  date: string;
  installments?: number;
  paidInstallments?: number;
  recurrent?: boolean;
  account?: ApiRelation;
  category?: ApiRelation;
  goal?: ApiRelation;
  user?: ApiRelation;
  createdAt?: string;
  updatedAt?: string;
};

type ApiGoal = {
  id: string;
  name: string;
  description?: string | null;
  targetValue: string | number;
  currentValue: string | number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'cancelled';
  user?: ApiRelation;
  account?: ApiRelation;
  category?: ApiRelation;
  createdAt?: string;
  updatedAt?: string;
};

type ApiUser = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const toNumber = (value: string | number | undefined | null) => Number(value ?? 0);

const categoryTypeToLabel = (type: ApiCategory['type']): Categoria['tipo'] => {
  switch (type) {
    case 'income':
      return 'Receita';
    case 'goal':
      return 'Meta';
    default:
      return 'Despesa';
  }
};

const categoryLabelToType = (label: Categoria['tipo']) => {
  switch (label) {
    case 'Receita':
      return 'income';
    case 'Meta':
      return 'goal';
    default:
      return 'expense';
  }
};

const fallbackCategoriaMetadata = (nome: string, tipo: Categoria['tipo']): CategoriaMetadata => {
  const list = tipo === 'Receita' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;
  const match = list.find((item) => item.nome.toLowerCase() === nome.toLowerCase());
  return {
    cor:
      match?.cor ??
      (tipo === 'Receita'
        ? '#2563EB'
        : tipo === 'Meta'
        ? '#6366F1'
        : '#EF4444'),
    observacoes: match?.observacoes ?? (tipo === 'Meta' ? 'Categoria destinada às metas.' : ''),
  };
};

const accountTypeToLabel = (type: string | undefined): string => {
  switch ((type ?? '').toLowerCase()) {
    case 'checking':
      return 'Conta Corrente';
    case 'savings':
      return 'Conta Poupança';
    case 'investment':
      return 'Conta Investimento';
    case 'credit':
      return 'Cartão de Crédito';
    case 'cash':
      return 'Dinheiro em espécie';
    default:
      return 'Conta';
  }
};

const inferAccountType = (label?: string): string => {
  const value = (label ?? '').toLowerCase();
  if (value.includes('poup')) return 'savings';
  if (value.includes('invest')) return 'investment';
  if (value.includes('cred') || value.includes('cart')) return 'credit';
  if (value.includes('cash') || value.includes('espécie') || value.includes('dinheiro')) return 'cash';
  return 'checking';
};

const recurrenceToTipo = (recurrence?: string): Renda['tipo'] => (recurrence === 'monthly' ? 'Mensal' : 'Unica');
const tipoToRecurrence = (tipo?: Renda['tipo']) => (tipo === 'Mensal' ? 'monthly' : 'none');

const expenseTipoFromApi = (recurrent?: boolean): Despesa['tipo'] => (recurrent ? 'Mensal' : 'Unica');

const goalStatusFromApi = (status: ApiGoal['status']): Meta['status'] => {
  switch (status) {
    case 'completed':
      return 'Concluída';
    case 'cancelled':
      return 'Atrasada';
    default:
      return 'Em andamento';
  }
};

const goalStatusToApi = (status: Meta['status']): ApiGoal['status'] => {
  switch (status) {
    case 'Concluída':
      return 'completed';
    case 'Atrasada':
      return 'cancelled';
    default:
      return 'active';
  }
};

const ensureIsoDate = (value?: string) => {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
    const [d, m, y] = value.split('-');
    return `${y}-${m}-${d}`;
  }
  return new Date(value).toISOString().slice(0, 10);
};

const buildMonthlyDate = (day?: number) => {
  const now = new Date();
  const safeDay = Math.min(Math.max(day ?? now.getDate(), 1), 28);
  const target = new Date(now.getFullYear(), now.getMonth(), safeDay);
  return target.toISOString().slice(0, 10);
};

const addDays = (iso: string, days: number) => {
  const base = new Date(iso);
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
};

const extractDayFromDate = (value?: string): number | undefined => {
  if (!value) return undefined;
  const normalized = value.length >= 10 ? value : ensureIsoDate(value);
  const match = normalized.match(/\d{4}-\d{2}-\d{2}/);
  if (!match) return undefined;
  return Number.parseInt(match[0].slice(8, 10), 10);
};

const mapCategoria = (entity: ApiCategory, metadata?: CategoriaMetadata): Categoria => {
  const tipo = categoryTypeToLabel(entity.type);
  const fallback = metadata || fallbackCategoriaMetadata(entity.name, tipo);
  return {
    id: entity.id,
    nome: entity.name,
    tipo,
    cor: fallback.cor,
    observacoes: fallback.observacoes,
    created_at: entity.createdAt,
    user_id: entity.user?.id,
  };
};

const mapConta = (entity: ApiAccount, metadata?: ContaMetadata): Conta => {
  const displayType = metadata?.tipo ?? accountTypeToLabel(entity.type);
  return {
    id: entity.id,
    nome: entity.name,
    tipo: displayType,
    saldo: toNumber(entity.balance),
    observacoes: metadata?.observacoes,
    data_atualizacao: entity.updatedAt,
    created_at: entity.createdAt,
    user_id: entity.user?.id,
  };
};

const mapRenda = (entity: ApiIncome, metadata?: RendaMetadata): Renda => {
  const tipo = recurrenceToTipo(entity.recurrence);
  const defaultDay = extractDayFromDate(entity.date);
  return {
    id: entity.id,
    descricao: entity.description,
    valor: toNumber(entity.amount),
    data_recebimento: entity.date,
    tipo,
    dia_recebimento: metadata?.dia_recebimento ?? (tipo === 'Mensal' ? defaultDay : undefined),
    categoria_id: entity.category?.id ?? undefined,
    conta_id: entity.account?.id ?? undefined,
    created_at: entity.createdAt,
    user_id: entity.user?.id,
  };
};

const mapDespesa = (entity: ApiExpense, metadata?: DespesaMetadata): Despesa => {
  const tipo = expenseTipoFromApi(entity.recurrent);
  const defaultDay = extractDayFromDate(entity.date);
  const parcelas = entity.installments ?? 1;
  const pagas = entity.paidInstallments ?? 0;
  return {
    id: entity.id,
    descricao: entity.description,
    valor: toNumber(entity.amount),
    data_pagamento: entity.date,
    tipo,
    dia_pagamento: metadata?.dia_pagamento ?? (tipo === 'Mensal' ? defaultDay : undefined),
    categoria_id: entity.category?.id ?? undefined,
    conta_id: entity.account?.id ?? undefined,
    pago: pagas >= parcelas,
    created_at: entity.createdAt,
    user_id: entity.user?.id,
  };
};

const mapMeta = (entity: ApiGoal): Meta => ({
  id: entity.id,
  nome: entity.name,
  valor_alvo: toNumber(entity.targetValue),
  valor_atual: toNumber(entity.currentValue),
  prazo_final: entity.endDate,
  status: goalStatusFromApi(entity.status),
  created_at: entity.createdAt,
  user_id: entity.user?.id,
});

const mapUsuario = (entity: ApiUser, metadata?: UsuarioMetadata): Usuario => ({
  id: entity.id,
  nome: entity.name,
  sobrenome: metadata?.sobrenome,
  email: entity.email,
  tipo_acesso: metadata?.tipo_acesso ?? 'Colaborador',
  status: entity.active ? 'Ativo' : 'Inativo',
  created_at: entity.createdAt,
});

export const categoriasService = {
  getAll: async (userId: string) => {
    if (!userId) return [];
    const [apiCategories, metadata] = await Promise.all([
      request<ApiCategory[]>(`/categorias?usuarioId=${encodeURIComponent(userId)}`),
      getAllMetadata<CategoriaMetadata>(METADATA_KEYS.categorias),
    ]);

  const toPersist: Promise<void>[] = [];
    const mapped = apiCategories.map((item) => {
      const meta = metadata[item.id];
      const categoria = mapCategoria(item, meta);
      if (!meta || meta.cor !== categoria.cor || meta.observacoes !== categoria.observacoes) {
        toPersist.push(upsertMetadata(METADATA_KEYS.categorias, item.id, {
          cor: categoria.cor,
          observacoes: categoria.observacoes,
        }));
      }
      return categoria;
    });

    if (toPersist.length) {
      await Promise.all(toPersist);
    }

    return mapped;
  },
  getById: async (_userId: string, id: string) => {
    const [item, meta] = await Promise.all([
      request<ApiCategory>(`/categorias/${id}`),
      getMetadata<CategoriaMetadata>(METADATA_KEYS.categorias, id),
    ]);
    return mapCategoria(item, meta);
  },
  create: async (userId: string, categoria: Omit<Categoria, 'id' | 'created_at' | 'user_id'>) => {
    const payload = {
      name: categoria.nome,
      type: categoryLabelToType(categoria.tipo),
      userId,
    };
    const created = await request<ApiCategory>('/categorias', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    await replaceMetadata<CategoriaMetadata>(METADATA_KEYS.categorias, created.id, {
      cor: categoria.cor,
      observacoes: categoria.observacoes,
    });

    return mapCategoria(created, {
      cor: categoria.cor,
      observacoes: categoria.observacoes,
    });
  },
  update: async (_userId: string, id: string, categoria: Partial<Categoria>) => {
    const payload: Record<string, unknown> = {};
    if (categoria.nome) payload.name = categoria.nome;
    if (categoria.tipo) payload.type = categoryLabelToType(categoria.tipo as Categoria['tipo']);
    if (Object.keys(payload).length) {
      await request<ApiCategory>(`/categorias/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    }

    if (categoria.cor !== undefined || categoria.observacoes !== undefined) {
      await upsertMetadata<CategoriaMetadata>(METADATA_KEYS.categorias, id, {
        ...(categoria.cor !== undefined ? { cor: categoria.cor } : {}),
        ...(categoria.observacoes !== undefined ? { observacoes: categoria.observacoes } : {}),
      });
    }

    return categoriasService.getById('', id);
  },
  delete: async (_userId: string, id: string) => {
    await request<void>(`/categorias/${id}`, { method: 'DELETE' });
    await deleteMetadata(METADATA_KEYS.categorias, id);
  },
};

export const contasService = {
  getAll: async (userId: string) => {
    if (!userId) return [];
    const [apiAccounts, metadata] = await Promise.all([
      request<ApiAccount[]>(`/contas?usuarioId=${encodeURIComponent(userId)}`),
      getAllMetadata<ContaMetadata>(METADATA_KEYS.contas),
    ]);

    const mapped = apiAccounts.map((account) => mapConta(account, metadata[account.id]));
    return mapped;
  },
  getById: async (_userId: string, id: string) => {
    const [account, meta] = await Promise.all([
      request<ApiAccount>(`/contas/${id}`),
      getMetadata<ContaMetadata>(METADATA_KEYS.contas, id),
    ]);
    return mapConta(account, meta);
  },
  create: async (userId: string, conta: Omit<Conta, 'id' | 'created_at' | 'data_atualizacao' | 'user_id'>) => {
    const payload = {
      name: conta.nome,
      type: inferAccountType(conta.tipo),
      initialBalance: conta.saldo ?? 0,
      userId,
    };

    const created = await request<ApiAccount>('/contas', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    await replaceMetadata<ContaMetadata>(METADATA_KEYS.contas, created.id, {
      tipo: conta.tipo,
      observacoes: conta.observacoes,
    });

    return mapConta(created, {
      tipo: conta.tipo,
      observacoes: conta.observacoes,
    });
  },
  update: async (_userId: string, id: string, conta: Partial<Conta>) => {
    const payload: Record<string, unknown> = {};
    if (conta.nome) payload.name = conta.nome;
    if (conta.saldo !== undefined) payload.balance = conta.saldo;
    if (conta.tipo) payload.type = inferAccountType(conta.tipo);

    if (Object.keys(payload).length) {
      await request<ApiAccount>(`/contas/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    }

    if (conta.tipo !== undefined || conta.observacoes !== undefined) {
      await upsertMetadata<ContaMetadata>(METADATA_KEYS.contas, id, {
        ...(conta.tipo !== undefined ? { tipo: conta.tipo } : {}),
        ...(conta.observacoes !== undefined ? { observacoes: conta.observacoes } : {}),
      });
    }

    return contasService.getById('', id);
  },
  delete: async (_userId: string, id: string) => {
    await request<void>(`/contas/${id}`, { method: 'DELETE' });
    await deleteMetadata(METADATA_KEYS.contas, id);
  },
};

export const rendasService = {
  getAll: async (userId: string) => {
    if (!userId) return [];
    const [apiIncomes, metadata] = await Promise.all([
      request<ApiIncome[]>(`/rendas?usuarioId=${encodeURIComponent(userId)}`),
      getAllMetadata<RendaMetadata>(METADATA_KEYS.rendas),
    ]);

    return apiIncomes.map((income) => mapRenda(income, metadata[income.id]));
  },
  getById: async (_userId: string, id: string) => {
    const [income, meta] = await Promise.all([
      request<ApiIncome>(`/rendas/${id}`),
      getMetadata<RendaMetadata>(METADATA_KEYS.rendas, id),
    ]);
    return mapRenda(income, meta);
  },
  create: async (userId: string, renda: Omit<Renda, 'id' | 'created_at' | 'user_id'>) => {
    const recurrence = tipoToRecurrence(renda.tipo);
    const payload = {
      description: renda.descricao,
      amount: renda.valor,
      date: recurrence === 'monthly' ? buildMonthlyDate(renda.dia_recebimento ?? undefined) : ensureIsoDate(renda.data_recebimento),
      recurrence,
      userId,
      accountId: renda.conta_id,
      categoryId: renda.categoria_id,
    };

    const created = await request<ApiIncome>('/rendas', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (recurrence === 'monthly') {
      await replaceMetadata<RendaMetadata>(METADATA_KEYS.rendas, created.id, {
        dia_recebimento: renda.dia_recebimento,
      });
    }

    return mapRenda(created, recurrence === 'monthly' ? { dia_recebimento: renda.dia_recebimento } : undefined);
  },
  update: async (_userId: string, id: string, renda: Partial<Renda>) => {
    const payload: Record<string, unknown> = {};

    if (renda.descricao !== undefined) payload.description = renda.descricao;
    if (renda.valor !== undefined) payload.amount = renda.valor;
    if (renda.conta_id !== undefined) payload.accountId = renda.conta_id;
    if (renda.categoria_id !== undefined) payload.categoryId = renda.categoria_id;
    if (renda.tipo !== undefined) payload.recurrence = tipoToRecurrence(renda.tipo);
    if (renda.data_recebimento !== undefined) payload.date = ensureIsoDate(renda.data_recebimento);

    if (payload.recurrence === 'monthly' && renda.dia_recebimento !== undefined) {
      payload.date = buildMonthlyDate(renda.dia_recebimento);
    }

    if (Object.keys(payload).length) {
      await request<ApiIncome>(`/rendas/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    }

    if (renda.dia_recebimento !== undefined || (renda.tipo && renda.tipo !== 'Mensal')) {
      if (renda.tipo && renda.tipo !== 'Mensal') {
        await deleteMetadata(METADATA_KEYS.rendas, id);
      } else {
        await upsertMetadata<RendaMetadata>(METADATA_KEYS.rendas, id, {
          dia_recebimento: renda.dia_recebimento,
        });
      }
    }

    return rendasService.getById('', id);
  },
  delete: async (_userId: string, id: string) => {
    await request<void>(`/rendas/${id}`, { method: 'DELETE' });
    await deleteMetadata(METADATA_KEYS.rendas, id);
  },
};

export const despesasService = {
  getAll: async (userId: string) => {
    if (!userId) return [];
    const [apiExpenses, metadata] = await Promise.all([
      request<ApiExpense[]>(`/despesas?usuarioId=${encodeURIComponent(userId)}`),
      getAllMetadata<DespesaMetadata>(METADATA_KEYS.despesas),
    ]);

    return apiExpenses.map((expense) => mapDespesa(expense, metadata[expense.id]));
  },
  getById: async (_userId: string, id: string) => {
    const [expense, meta] = await Promise.all([
      request<ApiExpense>(`/despesas/${id}`),
      getMetadata<DespesaMetadata>(METADATA_KEYS.despesas, id),
    ]);
    return mapDespesa(expense, meta);
  },
  create: async (userId: string, despesa: Omit<Despesa, 'id' | 'created_at' | 'user_id'>) => {
    const isMensal = despesa.tipo === 'Mensal';
    const payload = {
      description: despesa.descricao,
      amount: despesa.valor,
      date: isMensal ? buildMonthlyDate(despesa.dia_pagamento ?? undefined) : ensureIsoDate(despesa.data_pagamento),
      installments: 1,
      paidInstallments: despesa.pago ? 1 : 0,
      recurrent: isMensal,
      userId,
      accountId: despesa.conta_id,
      categoryId: despesa.categoria_id,
    };

    const created = await request<ApiExpense>('/despesas', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (isMensal) {
      await replaceMetadata<DespesaMetadata>(METADATA_KEYS.despesas, created.id, {
        dia_pagamento: despesa.dia_pagamento,
      });
    }

    return mapDespesa(created, isMensal ? { dia_pagamento: despesa.dia_pagamento } : undefined);
  },
  update: async (_userId: string, id: string, despesa: Partial<Despesa>) => {
    const payload: Record<string, unknown> = {};

    if (despesa.descricao !== undefined) payload.description = despesa.descricao;
    if (despesa.valor !== undefined) payload.amount = despesa.valor;
    if (despesa.categoria_id !== undefined) payload.categoryId = despesa.categoria_id;
    if (despesa.conta_id !== undefined) payload.accountId = despesa.conta_id;
    if (despesa.pago !== undefined) payload.paidInstallments = despesa.pago ? 1 : 0;
    if (despesa.tipo !== undefined) payload.recurrent = despesa.tipo === 'Mensal';
    if (despesa.data_pagamento !== undefined) payload.date = ensureIsoDate(despesa.data_pagamento);
    if (despesa.tipo === 'Mensal' && despesa.dia_pagamento !== undefined) {
      payload.date = buildMonthlyDate(despesa.dia_pagamento);
    }

    if (Object.keys(payload).length) {
      await request<ApiExpense>(`/despesas/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    }

    if (despesa.tipo && despesa.tipo !== 'Mensal') {
      await deleteMetadata(METADATA_KEYS.despesas, id);
    } else if (despesa.dia_pagamento !== undefined) {
      await upsertMetadata<DespesaMetadata>(METADATA_KEYS.despesas, id, {
        dia_pagamento: despesa.dia_pagamento,
      });
    }

    return despesasService.getById('', id);
  },
  delete: async (_userId: string, id: string) => {
    await request<void>(`/despesas/${id}`, { method: 'DELETE' });
    await deleteMetadata(METADATA_KEYS.despesas, id);
  },
};

interface MetaCreateOptions {
  startDate?: string;
}

export const metasService = {
  getAll: async (userId: string) => {
    if (!userId) return [];
    const metas = await request<ApiGoal[]>(`/metas?usuarioId=${encodeURIComponent(userId)}`);
    return metas.map(mapMeta);
  },
  getById: async (_userId: string, id: string) => mapMeta(await request<ApiGoal>(`/metas/${id}`)),
  create: async (userId: string, meta: Omit<Meta, 'id' | 'created_at' | 'user_id'>, options: MetaCreateOptions = {}) => {
    const startDate = ensureIsoDate(options.startDate);
    const endDate = meta.prazo_final ? ensureIsoDate(meta.prazo_final) : addDays(startDate, 30);

    const payload = {
      name: meta.nome,
      targetValue: meta.valor_alvo,
      currentValue: meta.valor_atual,
      startDate,
      endDate,
      status: goalStatusToApi(meta.status),
      userId,
    };

    const created = await request<ApiGoal>('/metas', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return mapMeta(created);
  },
  update: async (_userId: string, id: string, meta: Partial<Meta>) => {
    const payload: Record<string, unknown> = {};

    if (meta.nome !== undefined) payload.name = meta.nome;
    if (meta.valor_alvo !== undefined) payload.targetValue = meta.valor_alvo;
    if (meta.valor_atual !== undefined) payload.currentValue = meta.valor_atual;
    if (meta.prazo_final !== undefined) payload.endDate = ensureIsoDate(meta.prazo_final);
    if (meta.status !== undefined) payload.status = goalStatusToApi(meta.status);

    if (Object.keys(payload).length) {
      await request<ApiGoal>(`/metas/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    }

    return metasService.getById('', id);
  },
  delete: async (_userId: string, id: string) => {
    await request<void>(`/metas/${id}`, { method: 'DELETE' });
  },
};

export const usuariosService = {
  getAll: async () => {
    const [usuarios, metadata] = await Promise.all([
      request<ApiUser[]>('/usuarios'),
      getAllMetadata<UsuarioMetadata>(METADATA_KEYS.usuarios),
    ]);
    return usuarios.map((usuario) => mapUsuario(usuario, metadata[usuario.id]));
  },
  getById: async (id: string) => {
    const [usuario, metadata] = await Promise.all([
      request<ApiUser>(`/usuarios/${id}`),
      getMetadata<UsuarioMetadata>(METADATA_KEYS.usuarios, id),
    ]);
    return mapUsuario(usuario, metadata);
  },
  findByEmail: async (email: string) => {
    if (!email) return null;
    const response = await request<ApiUser | null>(`/usuarios?email=${encodeURIComponent(email)}`);
    if (!response) return null;
    const metadata = await getMetadata<UsuarioMetadata>(METADATA_KEYS.usuarios, response.id);
    return mapUsuario(response, metadata);
  },
  login: async (email: string, password: string) => {
    const user = await request<ApiUser>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const metadata = await getMetadata<UsuarioMetadata>(METADATA_KEYS.usuarios, user.id);
    return mapUsuario(user, metadata);
  },
  create: async (usuario: Omit<Usuario, 'id' | 'created_at'>) => {
    const payload = {
      name: usuario.sobrenome ? `${usuario.nome} ${usuario.sobrenome}` : usuario.nome,
      email: usuario.email,
      password: usuario.senha ?? '123456',
      active: usuario.status !== 'Inativo',
    };

    const created = await request<ApiUser>('/usuarios', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    await replaceMetadata<UsuarioMetadata>(METADATA_KEYS.usuarios, created.id, {
      sobrenome: usuario.sobrenome,
      tipo_acesso: usuario.tipo_acesso,
    });

    return mapUsuario(created, {
      sobrenome: usuario.sobrenome,
      tipo_acesso: usuario.tipo_acesso,
    });
  },
  update: async (id: string, usuario: Partial<Usuario>) => {
    const payload: Record<string, unknown> = {};

    if (usuario.nome !== undefined || usuario.sobrenome !== undefined) {
      const existing = await usuariosService.getById(id);
      const nome = usuario.nome ?? existing.nome;
      const sobrenome = usuario.sobrenome ?? existing.sobrenome ?? '';
      payload.name = sobrenome ? `${nome} ${sobrenome}` : nome;
    }
    if (usuario.email !== undefined) payload.email = usuario.email;
    if (usuario.senha !== undefined) payload.password = usuario.senha;
    if (usuario.status !== undefined) payload.active = usuario.status === 'Ativo';

    if (Object.keys(payload).length) {
      await request<ApiUser>(`/usuarios/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    }

    if (usuario.sobrenome !== undefined || usuario.tipo_acesso !== undefined) {
      await upsertMetadata<UsuarioMetadata>(METADATA_KEYS.usuarios, id, {
        ...(usuario.sobrenome !== undefined ? { sobrenome: usuario.sobrenome } : {}),
        ...(usuario.tipo_acesso !== undefined ? { tipo_acesso: usuario.tipo_acesso } : {}),
      });
    }

    return usuariosService.getById(id);
  },
  delete: async (id: string) => {
    await request<void>(`/usuarios/${id}`, { method: 'DELETE' });
    await deleteMetadata(METADATA_KEYS.usuarios, id);
  },
};
