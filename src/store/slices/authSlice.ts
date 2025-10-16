import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usuariosService } from '@/src/services/api';
import { Usuario } from '@/src/types/models';
import { RootState } from '@/src/store';

const SESSION_KEY = 'auth:session';

export interface AuthUser {
  id: string;
  nome: string;
  sobrenome?: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  initializing: boolean;
  loading: boolean;
  error: string | null;
  resetRequest: { email: string; code: string } | null;
}

const initialState: AuthState = {
  user: null,
  initializing: true,
  loading: false,
  error: null,
  resetRequest: null,
};

const sanitizeUser = (usuario: Usuario): AuthUser => ({
  id: usuario.id!,
  nome: usuario.nome,
  sobrenome: usuario.sobrenome,
  email: usuario.email,
});

export const bootstrapSession = createAsyncThunk<AuthUser | null>(
  'auth/bootstrapSession',
  async () => {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      const session = JSON.parse(raw) as { userId: string };
      if (!session?.userId) return null;
      const usuario = await usuariosService.getById(session.userId);
      if (!usuario) {
        await AsyncStorage.removeItem(SESSION_KEY);
        return null;
      }
      return sanitizeUser(usuario);
    } catch (error) {
      await AsyncStorage.removeItem(SESSION_KEY);
      return null;
    }
  }
);

export const login = createAsyncThunk<
  AuthUser,
  { email: string; senha: string; remember: boolean }
>('auth/login', async ({ email, senha, remember }, { rejectWithValue }) => {
  const usuario = await usuariosService.findByEmail(email.trim());
  if (!usuario || usuario.senha !== senha) {
    return rejectWithValue('Email ou senha inválidos.');
  }

  const user = sanitizeUser(usuario);

  if (remember) {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id }));
  } else {
    await AsyncStorage.removeItem(SESSION_KEY);
  }

  return user;
});

export const register = createAsyncThunk<
  AuthUser,
  { nome: string; sobrenome: string; email: string; senha: string }
>('auth/register', async ({ nome, sobrenome, email, senha }, { rejectWithValue }) => {
  const existing = await usuariosService.findByEmail(email.trim());
  if (existing) {
    return rejectWithValue('Este e-mail já está cadastrado.');
  }

  const novoUsuario = await usuariosService.create({
    nome,
    sobrenome,
    email: email.trim(),
    senha,
    tipo_acesso: 'Colaborador',
    status: 'Ativo',
  });

  if (!novoUsuario?.id) {
    return rejectWithValue('Não foi possível criar o usuário.');
  }

  const user = sanitizeUser(novoUsuario);
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id }));

  return user;
});

export const logout = createAsyncThunk('auth/logout', async () => {
  await AsyncStorage.removeItem(SESSION_KEY);
});

export const requestPasswordReset = createAsyncThunk<
  { email: string; code: string },
  { email: string }
>('auth/requestPasswordReset', async ({ email }, { rejectWithValue }) => {
  const usuario = await usuariosService.findByEmail(email.trim());
  if (!usuario) {
    return rejectWithValue('Usuário não encontrado para o e-mail informado.');
  }

  const code = Math.floor(10000 + Math.random() * 90000).toString();
  return { email: usuario.email, code };
});

export const confirmPasswordReset = createAsyncThunk<
  void,
  { email: string; code: string; senha: string },
  { state: RootState }
>('auth/confirmPasswordReset', async ({ email, code, senha }, { getState, rejectWithValue }) => {
  const { resetRequest } = getState().auth;
  if (!resetRequest || resetRequest.email.toLowerCase() !== email.trim().toLowerCase()) {
    return rejectWithValue('Nenhum código foi solicitado para este e-mail.');
  }

  if (resetRequest.code !== code.trim()) {
    return rejectWithValue('Código inválido.');
  }

  const usuario = await usuariosService.findByEmail(email.trim());
  if (!usuario?.id) {
    return rejectWithValue('Usuário não encontrado.');
  }

  await usuariosService.update(usuario.id, { senha });
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapSession.fulfilled, (state, action: PayloadAction<AuthUser | null>) => {
        state.user = action.payload;
        state.initializing = false;
      })
      .addCase(bootstrapSession.rejected, (state) => {
        state.initializing = false;
      })
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<AuthUser>) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || 'Erro ao realizar login.';
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action: PayloadAction<AuthUser>) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || 'Erro ao cadastrar.';
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
      })
      .addCase(requestPasswordReset.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(requestPasswordReset.fulfilled, (state, action: PayloadAction<{ email: string; code: string }>) => {
        state.loading = false;
        state.resetRequest = action.payload;
      })
      .addCase(requestPasswordReset.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || 'Erro ao gerar código.';
      })
      .addCase(confirmPasswordReset.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(confirmPasswordReset.fulfilled, (state) => {
        state.loading = false;
        state.resetRequest = null;
      })
      .addCase(confirmPasswordReset.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || 'Erro ao redefinir senha.';
      });
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;