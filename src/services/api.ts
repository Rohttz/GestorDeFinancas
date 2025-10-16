import AsyncStorage from '@react-native-async-storage/async-storage';
import { Categoria, Conta, Renda, Despesa, Meta, Usuario } from '@/src/types/models';
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '@/src/constants/defaults';

// Simple local DB helper using AsyncStorage. Collections are stored under key `db:<collection>` as JSON arrays.
const COLLECTION_PREFIX = 'db:';

const makeId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

const collectionKey = (name: string, scope?: string) => `${COLLECTION_PREFIX}${name}${scope ? `:${scope}` : ''}`;
const incomeSeedKey = (userId: string) => collectionKey('categorias:seeded:receita', userId);
const expenseSeedKey = (userId: string) => collectionKey('categorias:seeded:despesa', userId);

async function readCollection<T>(name: string, scope?: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(collectionKey(name, scope));
    if (!raw) return [];
    return JSON.parse(raw) as T[];
  } catch (e) {
    console.error('readCollection error', e);
    return [];
  }
}

async function writeCollection<T>(name: string, data: T[], scope?: string) {
  await AsyncStorage.setItem(collectionKey(name, scope), JSON.stringify(data));
}

// Generic helpers used by services
async function getAllOrdered<T extends { created_at?: string }>(name: string, orderKey = 'created_at', scope?: string) {
  const items = await readCollection<T>(name, scope);
  return items.sort((a: any, b: any) => {
    const va = a[orderKey] || '';
    const vb = b[orderKey] || '';
    return vb.localeCompare(va);
  });
}

async function getById<T extends { id?: string }>(name: string, id: string, scope?: string) {
  const items = await readCollection<T>(name, scope);
  return items.find((i) => i.id === id) || null;
}

async function createItem<T extends { id?: string; created_at?: string }>(
  name: string,
  item: Omit<T, 'id' | 'created_at'>,
  scope?: string
) {
  const items = await readCollection<T>(name, scope);
  const newItem = { ...(item as object), id: makeId(), created_at: new Date().toISOString() } as T;
  items.unshift(newItem);
  await writeCollection(name, items, scope);
  return newItem;
}

async function updateItem<T extends { id?: string; created_at?: string }>(
  name: string,
  id: string,
  patch: Partial<T>,
  scope?: string
) {
  const items = await readCollection<T>(name, scope);
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  const updated = { ...items[idx], ...patch } as T;
  items[idx] = updated;
  await writeCollection(name, items, scope);
  return updated;
}

async function deleteItem(name: string, id: string, scope?: string) {
  const items = await readCollection<any>(name, scope);
  const filtered = items.filter((i) => i.id !== id);
  await writeCollection(name, filtered, scope);
}

export const categoriasService = {
  getAll: async (userId: string) => {
    let items = await getAllOrdered<Categoria>('categorias', 'created_at', userId);

    const incomeCategories = items.filter((categoria) => categoria.tipo === 'Receita');

    if (incomeCategories.length === 0) {
      const seeded = await AsyncStorage.getItem(incomeSeedKey(userId));
      if (!seeded) {
        const incomeNames = new Set<string>();
        const toCreate = DEFAULT_INCOME_CATEGORIES.filter((categoria) => {
          const normalized = categoria.nome.trim().toLowerCase();
          if (incomeNames.has(normalized)) return false;
          incomeNames.add(normalized);
          return true;
        });

        for (const categoria of [...toCreate].reverse()) {
          await createItem<Categoria>('categorias', { ...categoria, user_id: userId }, userId);
        }

        await AsyncStorage.setItem(incomeSeedKey(userId), 'true');
        items = await getAllOrdered<Categoria>('categorias', 'created_at', userId);
      }
    }

    const expenseCategories = items.filter((categoria) => categoria.tipo === 'Despesa');

    if (expenseCategories.length === 0) {
      const seeded = await AsyncStorage.getItem(expenseSeedKey(userId));
      if (!seeded) {
        const expenseNames = new Set<string>();
        const toCreate = DEFAULT_EXPENSE_CATEGORIES.filter((categoria) => {
          const normalized = categoria.nome.trim().toLowerCase();
          if (expenseNames.has(normalized)) return false;
          expenseNames.add(normalized);
          return true;
        });

        for (const categoria of [...toCreate].reverse()) {
          await createItem<Categoria>('categorias', { ...categoria, user_id: userId }, userId);
        }

        await AsyncStorage.setItem(expenseSeedKey(userId), 'true');
        items = await getAllOrdered<Categoria>('categorias', 'created_at', userId);
      }
    }

    return items;
  },
  getById: async (userId: string, id: string) => getById<Categoria>('categorias', id, userId),
  create: async (userId: string, categoria: Omit<Categoria, 'id' | 'created_at'>) =>
    createItem<Categoria>('categorias', { ...categoria, user_id: userId }, userId),
  update: async (userId: string, id: string, categoria: Partial<Categoria>) =>
    updateItem<Categoria>('categorias', id, categoria, userId),
  delete: async (userId: string, id: string) => deleteItem('categorias', id, userId),
};

export const contasService = {
  getAll: async (userId: string) => getAllOrdered<Conta>('contas', 'created_at', userId),
  getById: async (userId: string, id: string) => getById<Conta>('contas', id, userId),
  create: async (userId: string, conta: Omit<Conta, 'id' | 'created_at' | 'data_atualizacao'>) =>
    createItem<Conta>('contas', { ...conta, user_id: userId }, userId),
  update: async (userId: string, id: string, conta: Partial<Conta>) => {
    const patch = { ...conta, data_atualizacao: new Date().toISOString() } as Partial<Conta>;
    return updateItem<Conta>('contas', id, patch, userId);
  },
  delete: async (userId: string, id: string) => deleteItem('contas', id, userId),
};

export const rendasService = {
  getAll: async (userId: string) => getAllOrdered<Renda>('rendas', 'data_recebimento', userId),
  getById: async (userId: string, id: string) => getById<Renda>('rendas', id, userId),
  create: async (userId: string, renda: Omit<Renda, 'id' | 'created_at'>) =>
    createItem<Renda>('rendas', { ...renda, user_id: userId }, userId),
  update: async (userId: string, id: string, renda: Partial<Renda>) => updateItem<Renda>('rendas', id, renda, userId),
  delete: async (userId: string, id: string) => deleteItem('rendas', id, userId),
};

export const despesasService = {
  getAll: async (userId: string) => getAllOrdered<Despesa>('despesas', 'data_pagamento', userId),
  getById: async (userId: string, id: string) => getById<Despesa>('despesas', id, userId),
  create: async (userId: string, despesa: Omit<Despesa, 'id' | 'created_at'>) =>
    createItem<Despesa>('despesas', { ...despesa, user_id: userId }, userId),
  update: async (userId: string, id: string, despesa: Partial<Despesa>) => updateItem<Despesa>('despesas', id, despesa, userId),
  delete: async (userId: string, id: string) => deleteItem('despesas', id, userId),
};

export const metasService = {
  getAll: async (userId: string) => getAllOrdered<Meta>('metas', 'created_at', userId),
  getById: async (userId: string, id: string) => getById<Meta>('metas', id, userId),
  create: async (userId: string, meta: Omit<Meta, 'id' | 'created_at'>) =>
    createItem<Meta>('metas', { ...meta, user_id: userId }, userId),
  update: async (userId: string, id: string, meta: Partial<Meta>) => updateItem<Meta>('metas', id, meta, userId),
  delete: async (userId: string, id: string) => deleteItem('metas', id, userId),
};

export const usuariosService = {
  getAll: async () => getAllOrdered<Usuario>('usuarios', 'created_at'),
  getById: async (id: string) => getById<Usuario>('usuarios', id),
  findByEmail: async (email: string) => {
    const users = await readCollection<Usuario>('usuarios');
    return users.find((user) => user.email.toLowerCase() === email.toLowerCase()) || null;
  },
  create: async (usuario: Omit<Usuario, 'id' | 'created_at'>) => createItem<Usuario>('usuarios', usuario),
  update: async (id: string, usuario: Partial<Usuario>) => updateItem<Usuario>('usuarios', id, usuario),
  delete: async (id: string) => deleteItem('usuarios', id),
};
