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

export const createDespesa = createAsyncThunk<Despesa | null, Omit<Despesa, 'id' | 'created_at' | 'user_id'>, { state: RootState }>(
  'despesas/create',
  async (despesa, { getState }) => {
    const userId = getState().auth.user?.id;
    if (!userId) return null;
    return await despesasService.create(userId, despesa);
  }
);

export const updateDespesa = createAsyncThunk<Despesa | null, { id: string; data: Partial<Despesa> }, { state: RootState }>(
  'despesas/update',
  async ({ id, data }, { getState }) => {
    const userId = getState().auth.user?.id;
    if (!userId) return null;
    return await despesasService.update(userId, id, data);
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
