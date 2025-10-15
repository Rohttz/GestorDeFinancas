import { supabase } from '@/src/lib/supabase';
import { Categoria, Conta, Renda, Despesa, Meta, Usuario } from '@/src/types/models';

export const categoriasService = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Categoria[];
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as Categoria | null;
  },

  create: async (categoria: Omit<Categoria, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('categorias')
      .insert(categoria)
      .select()
      .single();
    if (error) throw error;
    return data as Categoria;
  },

  update: async (id: string, categoria: Partial<Categoria>) => {
    const { data, error } = await supabase
      .from('categorias')
      .update(categoria)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Categoria;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('categorias')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

export const contasService = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('contas')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Conta[];
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('contas')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as Conta | null;
  },

  create: async (conta: Omit<Conta, 'id' | 'created_at' | 'data_atualizacao'>) => {
    const { data, error } = await supabase
      .from('contas')
      .insert(conta)
      .select()
      .single();
    if (error) throw error;
    return data as Conta;
  },

  update: async (id: string, conta: Partial<Conta>) => {
    const { data, error } = await supabase
      .from('contas')
      .update({ ...conta, data_atualizacao: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Conta;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('contas')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

export const rendasService = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('rendas')
      .select('*')
      .order('data_recebimento', { ascending: false });
    if (error) throw error;
    return data as Renda[];
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('rendas')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as Renda | null;
  },

  create: async (renda: Omit<Renda, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('rendas')
      .insert(renda)
      .select()
      .single();
    if (error) throw error;
    return data as Renda;
  },

  update: async (id: string, renda: Partial<Renda>) => {
    const { data, error } = await supabase
      .from('rendas')
      .update(renda)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Renda;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('rendas')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

export const despesasService = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('despesas')
      .select('*')
      .order('data_pagamento', { ascending: false });
    if (error) throw error;
    return data as Despesa[];
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('despesas')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as Despesa | null;
  },

  create: async (despesa: Omit<Despesa, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('despesas')
      .insert(despesa)
      .select()
      .single();
    if (error) throw error;
    return data as Despesa;
  },

  update: async (id: string, despesa: Partial<Despesa>) => {
    const { data, error } = await supabase
      .from('despesas')
      .update(despesa)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Despesa;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('despesas')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

export const metasService = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('metas')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Meta[];
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('metas')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as Meta | null;
  },

  create: async (meta: Omit<Meta, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('metas')
      .insert(meta)
      .select()
      .single();
    if (error) throw error;
    return data as Meta;
  },

  update: async (id: string, meta: Partial<Meta>) => {
    const { data, error } = await supabase
      .from('metas')
      .update(meta)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Meta;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('metas')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

export const usuariosService = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Usuario[];
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as Usuario | null;
  },

  create: async (usuario: Omit<Usuario, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('usuarios')
      .insert(usuario)
      .select()
      .single();
    if (error) throw error;
    return data as Usuario;
  },

  update: async (id: string, usuario: Partial<Usuario>) => {
    const { data, error } = await supabase
      .from('usuarios')
      .update(usuario)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Usuario;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
