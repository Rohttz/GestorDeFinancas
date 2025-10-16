import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { categoriasService } from '@/src/services/api';
import { Categoria } from '@/src/types/models';
import { RootState } from '@/src/store';
import { logout } from '@/src/store/slices/authSlice';

interface CategoriasState {
  items: Categoria[];
  loading: boolean;
  error: string | null;
}

const initialState: CategoriasState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchCategorias = createAsyncThunk<Categoria[], void, { state: RootState }>(
  'categorias/fetchAll',
  async (_, { getState }) => {
    const userId = getState().auth.user?.id;
    if (!userId) return [];
    return await categoriasService.getAll(userId);
  }
);

export const createCategoria = createAsyncThunk<Categoria | null, Omit<Categoria, 'id' | 'created_at' | 'user_id'>, { state: RootState }>(
  'categorias/create',
  async (categoria, { getState }) => {
    const userId = getState().auth.user?.id;
    if (!userId) return null;
    return await categoriasService.create(userId, categoria);
  }
);

export const updateCategoria = createAsyncThunk<Categoria | null, { id: string; data: Partial<Categoria> }, { state: RootState }>(
  'categorias/update',
  async ({ id, data }, { getState }) => {
    const userId = getState().auth.user?.id;
    if (!userId) return null;
    return await categoriasService.update(userId, id, data);
  }
);

export const deleteCategoria = createAsyncThunk<string, string, { state: RootState }>(
  'categorias/delete',
  async (id, { getState }) => {
    const userId = getState().auth.user?.id;
    if (!userId) return id;
    await categoriasService.delete(userId, id);
    return id;
  }
);

const categoriasSlice = createSlice({
  name: 'categorias',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategorias.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategorias.fulfilled, (state, action: PayloadAction<Categoria[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCategorias.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao carregar categorias';
      })
      .addCase(createCategoria.fulfilled, (state, action: PayloadAction<Categoria | null>) => {
        if (!action.payload) return;
        state.items.unshift(action.payload);
      })
      .addCase(updateCategoria.fulfilled, (state, action: PayloadAction<Categoria | null>) => {
        if (!action.payload) return;
        const index = state.items.findIndex((item) => item.id === action.payload!.id);
        if (index !== -1) {
          state.items[index] = action.payload!;
        }
      })
      .addCase(deleteCategoria.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      })
      .addCase(logout.fulfilled, (state) => {
        state.items = [];
        state.loading = false;
        state.error = null;
      });
  },
});

export default categoriasSlice.reducer;
