import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { despesasService } from '@/src/services/api';
import { Despesa } from '@/src/types/models';
import { RootState } from '@/src/store';
import { logout } from '@/src/store/slices/authSlice';

interface DespesasState {
  items: Despesa[];
  loading: boolean;
  error: string | null;
}

const initialState: DespesasState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchDespesas = createAsyncThunk<Despesa[], void, { state: RootState }>(
  'despesas/fetchAll',
  async (_, { getState }) => {
    const userId = getState().auth.user?.id;
    if (!userId) return [];
    return await despesasService.getAll(userId);
  }
);

const sanitizeId = (value?: string | null) => {
  if (!value) return undefined;
  const trimmed = String(value).trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') {
    return undefined;
  }
  return trimmed;
};

const normalizeCurrency = (value: unknown) => {
  const parsed = Number.parseFloat(String(value ?? '').replace(/[^0-9,.-]/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeDia = (value: unknown) => {
  const numeric = Number.parseInt(String(value ?? '').replace(/\D/g, ''), 10);
  return Number.isFinite(numeric) && numeric >= 1 && numeric <= 31 ? numeric : undefined;
};

const normalizeDate = (value: unknown) => {
  if (!value) return undefined;
  const str = String(value).trim();
  if (!str) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
    const [d, m, y] = str.split('-');
    return `${y}-${m}-${d}`;
  }
  return undefined;
};

const normalizeDespesaPayload = (
  despesa: Omit<Despesa, 'id' | 'created_at' | 'user_id'>,
): Omit<Despesa, 'id' | 'created_at' | 'user_id'> => {
  const tipo = despesa.tipo ?? 'Unica';
  return {
    ...despesa,
    tipo,
    valor: normalizeCurrency(despesa.valor),
    categoria_id: sanitizeId(despesa.categoria_id),
    conta_id: sanitizeId(despesa.conta_id),
    dia_pagamento: tipo === 'Mensal' ? normalizeDia(despesa.dia_pagamento) : undefined,
    data_pagamento: tipo === 'Unica' ? normalizeDate(despesa.data_pagamento) : undefined,
    pago: Boolean(despesa.pago),
  };
};

export const createDespesa = createAsyncThunk<
  Despesa | null,
  Omit<Despesa, 'id' | 'created_at' | 'user_id'>,
  { state: RootState }
>(
  'despesas/create',
  async (despesa, { getState }) => {
    const userId = getState().auth.user?.id;
    if (!userId) return null;
    return await despesasService.create(userId, normalizeDespesaPayload(despesa));
  }
);

const normalizePartialDespesa = (data: Partial<Despesa>): Partial<Despesa> => {
  const normalized: Partial<Despesa> = { ...data };

  if (normalized.valor !== undefined) {
    normalized.valor = normalizeCurrency(normalized.valor);
  }

  if (normalized.categoria_id !== undefined) {
    normalized.categoria_id = sanitizeId(normalized.categoria_id);
  }

  if (normalized.conta_id !== undefined) {
    normalized.conta_id = sanitizeId(normalized.conta_id);
  }

  if (normalized.tipo !== undefined) {
    normalized.tipo = normalized.tipo || undefined;
  }

  if (normalized.tipo === 'Mensal') {
    if (normalized.dia_pagamento !== undefined) {
      normalized.dia_pagamento = normalizeDia(normalized.dia_pagamento);
    }
    normalized.data_pagamento = undefined;
  } else if (normalized.tipo === 'Unica') {
    if (normalized.data_pagamento !== undefined) {
      normalized.data_pagamento = normalizeDate(normalized.data_pagamento);
    }
    if (normalized.dia_pagamento !== undefined) {
      normalized.dia_pagamento = undefined;
    }
  }

  if (normalized.pago !== undefined) {
    normalized.pago = Boolean(normalized.pago);
  }

  return normalized;
};

export const updateDespesa = createAsyncThunk<
  Despesa | null,
  { id: string; data: Partial<Despesa> },
  { state: RootState }
>(
  'despesas/update',
  async ({ id, data }, { getState }) => {
    const userId = getState().auth.user?.id;
    if (!userId) return null;
    return await despesasService.update(userId, id, normalizePartialDespesa(data));
  }
);

export const deleteDespesa = createAsyncThunk<string, string, { state: RootState }>(
  'despesas/delete',
  async (id, { getState }) => {
    const userId = getState().auth.user?.id;
    if (!userId) return id;
    await despesasService.delete(userId, id);
    return id;
  }
);

const despesasSlice = createSlice({
  name: 'despesas',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDespesas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDespesas.fulfilled, (state, action: PayloadAction<Despesa[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchDespesas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao carregar despesas';
      })
      .addCase(createDespesa.fulfilled, (state, action: PayloadAction<Despesa | null>) => {
        if (!action.payload) return;
        state.items.unshift(action.payload);
      })
      .addCase(updateDespesa.fulfilled, (state, action: PayloadAction<Despesa | null>) => {
        if (!action.payload) return;
        const index = state.items.findIndex((item) => item.id === action.payload!.id);
        if (index !== -1) {
          state.items[index] = action.payload!;
        }
      })
      .addCase(deleteDespesa.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      })
      .addCase(logout.fulfilled, (state) => {
        state.items = [];
        state.loading = false;
        state.error = null;
      });
  },
});

export default despesasSlice.reducer;
