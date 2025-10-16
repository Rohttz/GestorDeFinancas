import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { contasService } from '@/src/services/api';
import { Conta } from '@/src/types/models';
import { RootState } from '@/src/store';
import { logout } from '@/src/store/slices/authSlice';

interface ContasState {
  items: Conta[];
  loading: boolean;
  error: string | null;
}

const initialState: ContasState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchContas = createAsyncThunk<Conta[], void, { state: RootState }>(
  'contas/fetchAll',
  async (_, { getState }) => {
    const userId = getState().auth.user?.id;
    if (!userId) return [];
    return await contasService.getAll(userId);
  }
);

export const createConta = createAsyncThunk<
  Conta | null,
  Omit<Conta, 'id' | 'created_at' | 'data_atualizacao' | 'user_id'>,
  { state: RootState }
>(
  'contas/create',
  async (conta, { getState }) => {
    const userId = getState().auth.user?.id;
    if (!userId) return null;
    return await contasService.create(userId, conta);
  }
);

export const updateConta = createAsyncThunk<Conta | null, { id: string; data: Partial<Conta> }, { state: RootState }>(
  'contas/update',
  async ({ id, data }, { getState }) => {
    const userId = getState().auth.user?.id;
    if (!userId) return null;
    return await contasService.update(userId, id, data);
  }
);

export const deleteConta = createAsyncThunk<string, string, { state: RootState }>(
  'contas/delete',
  async (id, { getState }) => {
    const userId = getState().auth.user?.id;
    if (!userId) return id;
    await contasService.delete(userId, id);
    return id;
  }
);

const contasSlice = createSlice({
  name: 'contas',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchContas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContas.fulfilled, (state, action: PayloadAction<Conta[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchContas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao carregar contas';
      })
      .addCase(createConta.fulfilled, (state, action: PayloadAction<Conta | null>) => {
        if (!action.payload) return;
        state.items.unshift(action.payload);
      })
      .addCase(updateConta.fulfilled, (state, action: PayloadAction<Conta | null>) => {
        if (!action.payload) return;
        const index = state.items.findIndex((item) => item.id === action.payload!.id);
        if (index !== -1) {
          state.items[index] = action.payload!;
        }
      })
      .addCase(deleteConta.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      })
      .addCase(logout.fulfilled, (state) => {
        state.items = [];
        state.loading = false;
        state.error = null;
      });
  },
});

export default contasSlice.reducer;
