import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { metasService } from '@/src/services/api';
import { Meta } from '@/src/types/models';

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

export const fetchMetas = createAsyncThunk(
  'metas/fetchAll',
  async () => {
    return await metasService.getAll();
  }
);

export const createMeta = createAsyncThunk(
  'metas/create',
  async (meta: Omit<Meta, 'id' | 'created_at'>) => {
    return await metasService.create(meta);
  }
);

export const updateMeta = createAsyncThunk(
  'metas/update',
  async ({ id, data }: { id: string; data: Partial<Meta> }) => {
    return await metasService.update(id, data);
  }
);

export const deleteMeta = createAsyncThunk(
  'metas/delete',
  async (id: string) => {
    await metasService.delete(id);
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
      .addCase(createMeta.fulfilled, (state, action: PayloadAction<Meta>) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateMeta.fulfilled, (state, action: PayloadAction<Meta>) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteMeta.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      });
  },
});

export default metasSlice.reducer;
