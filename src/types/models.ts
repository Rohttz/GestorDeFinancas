export interface Categoria {
  id?: string;
  nome: string;
  tipo: 'Receita' | 'Despesa';
  cor?: string;
  observacoes?: string;
  created_at?: string;
}

export interface Conta {
  id?: string;
  nome: string;
  tipo: string;
  saldo: number;
  data_atualizacao?: string;
  observacoes?: string;
  created_at?: string;
}

export interface Renda {
  id?: string;
  descricao: string;
  valor: number;
  data_recebimento: string;
  categoria_id?: string;
  conta_id?: string;
  created_at?: string;
}

export interface Despesa {
  id?: string;
  descricao: string;
  valor: number;
  data_pagamento: string;
  categoria_id?: string;
  conta_id?: string;
  pago: boolean;
  created_at?: string;
}

export interface Meta {
  id?: string;
  nome: string;
  valor_alvo: number;
  valor_atual: number;
  prazo_final: string;
  status: 'Em andamento' | 'Concluída' | 'Atrasada';
  created_at?: string;
}

export interface Usuario {
  id?: string;
  nome: string;
  email: string;
  tipo_acesso: 'Administrador' | 'Colaborador';
  status: 'Ativo' | 'Inativo';
  created_at?: string;
}

export interface DashboardData {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  metasProgresso: number;
  receitasPorCategoria: Array<{ categoria: string; valor: number; cor: string }>;
  despesasPorCategoria: Array<{ categoria: string; valor: number; cor: string }>;
}
