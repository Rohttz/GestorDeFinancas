import { configureStore } from '@reduxjs/toolkit';
import categoriasReducer from './slices/categoriasSlice';
import contasReducer from './slices/contasSlice';
import rendasReducer from './slices/rendasSlice';
import despesasReducer from './slices/despesasSlice';
import metasReducer from './slices/metasSlice';
import usuariosReducer from './slices/usuariosSlice';
import themeReducer from './slices/themeSlice';

export const store = configureStore({
  reducer: {
    categorias: categoriasReducer,
    contas: contasReducer,
    rendas: rendasReducer,
    despesas: despesasReducer,
    metas: metasReducer,
    usuarios: usuariosReducer,
    theme: themeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
