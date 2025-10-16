import { Categoria } from '@/src/types/models';

type CategoriaSeed = Omit<Categoria, 'id' | 'created_at' | 'user_id'>;

export const DEFAULT_INCOME_CATEGORIES: CategoriaSeed[] = [
  {
    nome: 'Salário',
    tipo: 'Receita',
    cor: '#2563EB',
    observacoes: 'Pagamentos recorrentes do trabalho principal.',
  },
  {
    nome: 'Freelance',
    tipo: 'Receita',
    cor: '#22C55E',
    observacoes: 'Projetos e serviços realizados de forma pontual.',
  },
  {
    nome: 'Aluguel Recebido',
    tipo: 'Receita',
    cor: '#F97316',
    observacoes: 'Valores provenientes de imóveis alugados.',
  },
];

export const DEFAULT_EXPENSE_CATEGORIES: CategoriaSeed[] = [
  {
    nome: 'Aluguel',
    tipo: 'Despesa',
    cor: '#EF4444',
    observacoes: 'Pagamentos mensais de aluguel ou financiamento.',
  },
  {
    nome: 'Transporte',
    tipo: 'Despesa',
    cor: '#8B5CF6',
    observacoes: 'Custos com combustível, transporte público ou aplicativos.',
  },
  {
    nome: 'Lazer',
    tipo: 'Despesa',
    cor: '#14B8A6',
    observacoes: 'Passeios, cinemas, jogos e atividades recreativas.',
  },
  {
    nome: 'Conta',
    tipo: 'Despesa',
    cor: '#F59E0B',
    observacoes: 'Contas fixas como água, luz, internet e telefone.',
  },
];
