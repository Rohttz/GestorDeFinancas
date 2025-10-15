import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { rendasService } from '@/src/services/api';
import { Renda } from '@/src/types/models';

interface RendasState {
  items: Renda[];
  loading: boolean;
  error: string | null;
}

const initialState: RendasState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchRendas = createAsyncThunk(
  'rendas/fetchAll',
  async () => {
    return await rendasService.getAll();
  }
);

export const createRenda = createAsyncThunk(
  'rendas/create',
  async (renda: Omit<Renda, 'id' | 'created_at'>) => {
    return await rendasService.create(renda);
  }
);

export const updateRenda = createAsyncThunk(
  'rendas/update',
  async ({ id, data }: { id: string; data: Partial<Renda> }) => {
    return await rendasService.update(id, data);
  }
);

export const deleteRenda = createAsyncThunk(
  'rendas/delete',
  async (id: string) => {
    await rendasService.delete(id);
    return id;
  }
);

const rendasSlice = createSlice({
  name: 'rendas',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRendas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRendas.fulfilled, (state, action: PayloadAction<Renda[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchRendas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao carregar rendas';
      })
      .addCase(createRenda.fulfilled, (state, action: PayloadAction<Renda | null>) => {
        if (!action.payload) return;
        state.items.unshift(action.payload);
      })
      .addCase(updateRenda.fulfilled, (state, action: PayloadAction<Renda | null>) => {
        if (!action.payload) return;
        const index = state.items.findIndex((item) => item.id === action.payload!.id);
        if (index !== -1) {
          state.items[index] = action.payload!;
        }
      })
      .addCase(deleteRenda.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      });
  },
});

export default rendasSlice.reducer;
