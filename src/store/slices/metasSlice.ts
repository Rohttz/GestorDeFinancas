import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { metasService } from '@/src/services/api';
import { Meta } from '@/src/types/models';
import { RootState } from '@/src/store';
import { logout } from '@/src/store/slices/authSlice';

interface MetasState {
  items: Meta[];
  loading: boolean;
  error: string | null;
}

const initialState: MetasState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchMetas = createAsyncThunk<Meta[], void, { state: RootState }>(
  'metas/fetchAll',
  async (_, { getState }) => {
    const userId = getState().auth.user?.id;
    if (!userId) return [];
    return await metasService.getAll(userId);
  }
);

export const createMeta = createAsyncThunk<Meta | null, Omit<Meta, 'id' | 'created_at' | 'user_id'>, { state: RootState }>(
  'metas/create',
  async (meta, { getState }) => {
    const userId = getState().auth.user?.id;
    if (!userId) return null;
    return await metasService.create(userId, meta);
  }
);

export const updateMeta = createAsyncThunk<Meta | null, { id: string; data: Partial<Meta> }, { state: RootState }>(
  'metas/update',
  async ({ id, data }, { getState }) => {
    const userId = getState().auth.user?.id;
    if (!userId) return null;
    return await metasService.update(userId, id, data);
  }
);

export const deleteMeta = createAsyncThunk<string, string, { state: RootState }>(
  'metas/delete',
  async (id, { getState }) => {
    const userId = getState().auth.user?.id;
    if (!userId) return id;
    await metasService.delete(userId, id);
    return id;
  }
);

const metasSlice = createSlice({
  name: 'metas',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMetas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMetas.fulfilled, (state, action: PayloadAction<Meta[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchMetas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao carregar metas';
      })
      .addCase(createMeta.fulfilled, (state, action: PayloadAction<Meta | null>) => {
        if (!action.payload) return;
        state.items.unshift(action.payload);
      })
      .addCase(updateMeta.fulfilled, (state, action: PayloadAction<Meta | null>) => {
        if (!action.payload) return;
        const index = state.items.findIndex((item) => item.id === action.payload!.id);
        if (index !== -1) {
          state.items[index] = action.payload!;
        }
      })
      .addCase(deleteMeta.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      })
      .addCase(logout.fulfilled, (state) => {
        state.items = [];
        state.loading = false;
        state.error = null;
      });
  },
});

export default metasSlice.reducer;
