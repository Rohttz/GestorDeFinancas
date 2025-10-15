import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { contasService } from '@/src/services/api';
import { Conta } from '@/src/types/models';

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

export const fetchContas = createAsyncThunk(
  'contas/fetchAll',
  async () => {
    return await contasService.getAll();
  }
);

export const createConta = createAsyncThunk(
  'contas/create',
  async (conta: Omit<Conta, 'id' | 'created_at' | 'data_atualizacao'>) => {
    return await contasService.create(conta);
  }
);

export const updateConta = createAsyncThunk(
  'contas/update',
  async ({ id, data }: { id: string; data: Partial<Conta> }) => {
    return await contasService.update(id, data);
  }
);

export const deleteConta = createAsyncThunk(
  'contas/delete',
  async (id: string) => {
    await contasService.delete(id);
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
      .addCase(createConta.fulfilled, (state, action: PayloadAction<Conta>) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateConta.fulfilled, (state, action: PayloadAction<Conta>) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteConta.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      });
  },
});

export default contasSlice.reducer;
