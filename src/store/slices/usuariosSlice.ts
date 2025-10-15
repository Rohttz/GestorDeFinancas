import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { usuariosService } from '@/src/services/api';
import { Usuario } from '@/src/types/models';

interface UsuariosState {
  items: Usuario[];
  loading: boolean;
  error: string | null;
}

const initialState: UsuariosState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchUsuarios = createAsyncThunk(
  'usuarios/fetchAll',
  async () => {
    return await usuariosService.getAll();
  }
);

export const createUsuario = createAsyncThunk(
  'usuarios/create',
  async (usuario: Omit<Usuario, 'id' | 'created_at'>) => {
    return await usuariosService.create(usuario);
  }
);

export const updateUsuario = createAsyncThunk(
  'usuarios/update',
  async ({ id, data }: { id: string; data: Partial<Usuario> }) => {
    return await usuariosService.update(id, data);
  }
);

export const deleteUsuario = createAsyncThunk(
  'usuarios/delete',
  async (id: string) => {
    await usuariosService.delete(id);
    return id;
  }
);

const usuariosSlice = createSlice({
  name: 'usuarios',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsuarios.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsuarios.fulfilled, (state, action: PayloadAction<Usuario[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchUsuarios.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao carregar usuários';
      })
      .addCase(createUsuario.fulfilled, (state, action: PayloadAction<Usuario>) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateUsuario.fulfilled, (state, action: PayloadAction<Usuario>) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteUsuario.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      });
  },
});

export default usuariosSlice.reducer;
