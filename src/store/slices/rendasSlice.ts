import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { rendasService } from '@/src/services/api';
import { Renda } from '@/src/types/models';
import { RootState } from '@/src/store';
import { logout } from '@/src/store/slices/authSlice';

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

export const fetchRendas = createAsyncThunk<Renda[], void, { state: RootState }>(
  'rendas/fetchAll',
  async (_, { getState }) => {
    const userId = getState().auth.user?.id;
    if (!userId) return [];
    return await rendasService.getAll(userId);
  }
);

export const createRenda = createAsyncThunk<Renda | null, Omit<Renda, 'id' | 'created_at' | 'user_id'>, { state: RootState }>(
  'rendas/create',
  async (renda, { getState }) => {
    const userId = getState().auth.user?.id;
    if (!userId) return null;
    return await rendasService.create(userId, renda);
  }
);

export const updateRenda = createAsyncThunk<Renda | null, { id: string; data: Partial<Renda> }, { state: RootState }>(
  'rendas/update',
  async ({ id, data }, { getState }) => {
    const userId = getState().auth.user?.id;
    if (!userId) return null;
    return await rendasService.update(userId, id, data);
  }
);

export const deleteRenda = createAsyncThunk<string, string, { state: RootState }>(
  'rendas/delete',
  async (id, { getState }) => {
    const userId = getState().auth.user?.id;
    if (!userId) return id;
    await rendasService.delete(userId, id);
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
      })
      .addCase(logout.fulfilled, (state) => {
        state.items = [];
        state.loading = false;
        state.error = null;
      });
  },
});

export default rendasSlice.reducer;
