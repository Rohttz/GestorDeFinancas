import { CategoryType } from '../../common/enums/category-type.enum';

export interface DefaultCategorySeed {
  name: string;
  type: CategoryType;
  spendingLimit?: number;
}

export const DEFAULT_CATEGORY_SEEDS: DefaultCategorySeed[] = [
  {
    name: 'Salário',
    type: CategoryType.Income,
  },
  {
    name: 'Freelance',
    type: CategoryType.Income,
  },
  {
    name: 'Aluguel Recebido',
    type: CategoryType.Income,
  },
  {
    name: 'Aluguel',
    type: CategoryType.Expense,
    spendingLimit: 2000,
  },
  {
    name: 'Transporte',
    type: CategoryType.Expense,
    spendingLimit: 500,
  },
  {
    name: 'Lazer',
    type: CategoryType.Expense,
    spendingLimit: 800,
  },
  {
    name: 'Conta',
    type: CategoryType.Expense,
    spendingLimit: 1200,
  },
];
