import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { categoriasService } from '@/src/services/api';
import { Categoria } from '@/src/types/models';

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

export const fetchCategorias = createAsyncThunk(
  'categorias/fetchAll',
  async () => {
    return await categoriasService.getAll();
  }
);

export const createCategoria = createAsyncThunk(
  'categorias/create',
  async (categoria: Omit<Categoria, 'id' | 'created_at'>) => {
    return await categoriasService.create(categoria);
  }
);

export const updateCategoria = createAsyncThunk(
  'categorias/update',
  async ({ id, data }: { id: string; data: Partial<Categoria> }) => {
    return await categoriasService.update(id, data);
  }
);

export const deleteCategoria = createAsyncThunk(
  'categorias/delete',
  async (id: string) => {
    await categoriasService.delete(id);
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
      .addCase(createCategoria.fulfilled, (state, action: PayloadAction<Categoria>) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateCategoria.fulfilled, (state, action: PayloadAction<Categoria>) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteCategoria.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      });
  },
});

export default categoriasSlice.reducer;
