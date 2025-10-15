import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { despesasService } from '@/src/services/api';
import { Despesa } from '@/src/types/models';

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

export const fetchDespesas = createAsyncThunk(
  'despesas/fetchAll',
  async () => {
    return await despesasService.getAll();
  }
);

export const createDespesa = createAsyncThunk(
  'despesas/create',
  async (despesa: Omit<Despesa, 'id' | 'created_at'>) => {
    return await despesasService.create(despesa);
  }
);

export const updateDespesa = createAsyncThunk(
  'despesas/update',
  async ({ id, data }: { id: string; data: Partial<Despesa> }) => {
    return await despesasService.update(id, data);
  }
);

export const deleteDespesa = createAsyncThunk(
  'despesas/delete',
  async (id: string) => {
    await despesasService.delete(id);
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
      });
  },
});

export default despesasSlice.reducer;
