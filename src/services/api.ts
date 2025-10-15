import AsyncStorage from '@react-native-async-storage/async-storage';
import { Categoria, Conta, Renda, Despesa, Meta, Usuario } from '@/src/types/models';

// Simple local DB helper using AsyncStorage. Collections are stored under key `db:<collection>` as JSON arrays.
const COLLECTION_PREFIX = 'db:';

const makeId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

async function readCollection<T>(name: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(COLLECTION_PREFIX + name);
    if (!raw) return [];
    return JSON.parse(raw) as T[];
  } catch (e) {
    console.error('readCollection error', e);
    return [];
  }
}

async function writeCollection<T>(name: string, data: T[]) {
  await AsyncStorage.setItem(COLLECTION_PREFIX + name, JSON.stringify(data));
}

// Generic helpers used by services
async function getAllOrdered<T extends { created_at?: string }>(name: string, orderKey = 'created_at') {
  const items = await readCollection<T>(name);
  return items.sort((a: any, b: any) => {
    const va = a[orderKey] || '';
    const vb = b[orderKey] || '';
    return vb.localeCompare(va);
  });
}

async function getById<T extends { id?: string }>(name: string, id: string) {
  const items = await readCollection<T>(name);
  return items.find((i) => i.id === id) || null;
}

async function createItem<T extends { id?: string; created_at?: string }>(name: string, item: Omit<T, 'id' | 'created_at'>) {
  const items = await readCollection<T>(name);
  const newItem = { ...(item as object), id: makeId(), created_at: new Date().toISOString() } as T;
  items.unshift(newItem);
  await writeCollection(name, items);
  return newItem;
}

async function updateItem<T extends { id?: string; created_at?: string }>(name: string, id: string, patch: Partial<T>) {
  const items = await readCollection<T>(name);
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  const updated = { ...items[idx], ...patch } as T;
  items[idx] = updated;
  await writeCollection(name, items);
  return updated;
}

async function deleteItem(name: string, id: string) {
  const items = await readCollection<any>(name);
  const filtered = items.filter((i) => i.id !== id);
  await writeCollection(name, filtered);
}

export const categoriasService = {
  getAll: async () => getAllOrdered<Categoria>('categorias', 'created_at'),
  getById: async (id: string) => getById<Categoria>('categorias', id),
  create: async (categoria: Omit<Categoria, 'id' | 'created_at'>) => createItem<Categoria>('categorias', categoria),
  update: async (id: string, categoria: Partial<Categoria>) => updateItem<Categoria>('categorias', id, categoria),
  delete: async (id: string) => deleteItem('categorias', id),
};

export const contasService = {
  getAll: async () => getAllOrdered<Conta>('contas', 'created_at'),
  getById: async (id: string) => getById<Conta>('contas', id),
  create: async (conta: Omit<Conta, 'id' | 'created_at' | 'data_atualizacao'>) => createItem<Conta>('contas', conta),
  update: async (id: string, conta: Partial<Conta>) => {
    const patch = { ...conta, data_atualizacao: new Date().toISOString() } as Partial<Conta>;
    return updateItem<Conta>('contas', id, patch);
  },
  delete: async (id: string) => deleteItem('contas', id),
};

export const rendasService = {
  getAll: async () => getAllOrdered<Renda>('rendas', 'data_recebimento'),
  getById: async (id: string) => getById<Renda>('rendas', id),
  create: async (renda: Omit<Renda, 'id' | 'created_at'>) => createItem<Renda>('rendas', renda),
  update: async (id: string, renda: Partial<Renda>) => updateItem<Renda>('rendas', id, renda),
  delete: async (id: string) => deleteItem('rendas', id),
};

export const despesasService = {
  getAll: async () => getAllOrdered<Despesa>('despesas', 'data_pagamento'),
  getById: async (id: string) => getById<Despesa>('despesas', id),
  create: async (despesa: Omit<Despesa, 'id' | 'created_at'>) => createItem<Despesa>('despesas', despesa),
  update: async (id: string, despesa: Partial<Despesa>) => updateItem<Despesa>('despesas', id, despesa),
  delete: async (id: string) => deleteItem('despesas', id),
};

export const metasService = {
  getAll: async () => getAllOrdered<Meta>('metas', 'created_at'),
  getById: async (id: string) => getById<Meta>('metas', id),
  create: async (meta: Omit<Meta, 'id' | 'created_at'>) => createItem<Meta>('metas', meta),
  update: async (id: string, meta: Partial<Meta>) => updateItem<Meta>('metas', id, meta),
  delete: async (id: string) => deleteItem('metas', id),
};

export const usuariosService = {
  getAll: async () => getAllOrdered<Usuario>('usuarios', 'created_at'),
  getById: async (id: string) => getById<Usuario>('usuarios', id),
  create: async (usuario: Omit<Usuario, 'id' | 'created_at'>) => createItem<Usuario>('usuarios', usuario),
  update: async (id: string, usuario: Partial<Usuario>) => updateItem<Usuario>('usuarios', id, usuario),
  delete: async (id: string) => deleteItem('usuarios', id),
};
