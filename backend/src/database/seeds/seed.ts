import AppDataSource from '../data-source';
import { User } from '../../modules/users/entities/user.entity';
import { Account } from '../../modules/accounts/entities/account.entity';
import { Category } from '../../modules/categories/entities/category.entity';
import { Goal } from '../../modules/goals/entities/goal.entity';
import { Income } from '../../modules/incomes/entities/income.entity';
import { Expense } from '../../modules/expenses/entities/expense.entity';
import { AccountType } from '../../common/enums/account-type.enum';
import { CategoryType } from '../../common/enums/category-type.enum';
import { GoalStatus } from '../../common/enums/goal-status.enum';
import { RecurrenceInterval } from '../../common/enums/recurrence-interval.enum';
import * as bcrypt from 'bcryptjs';

async function seed() {
  await AppDataSource.initialize();

  const userRepository = AppDataSource.getRepository(User);
  const accountRepository = AppDataSource.getRepository(Account);
  const categoryRepository = AppDataSource.getRepository(Category);
  const goalRepository = AppDataSource.getRepository(Goal);
  const incomeRepository = AppDataSource.getRepository(Income);
  const expenseRepository = AppDataSource.getRepository(Expense);

  const existing = await userRepository.findOne({ where: { email: 'demo@financas.com' } });
  if (existing) {
    console.log('Seed data already exists.');
    await AppDataSource.destroy();
    return;
  }

  const passwordHash = await bcrypt.hash('123456', 10);
  const user = userRepository.create({
    name: 'Usuário Demo',
    email: 'demo@financas.com',
    passwordHash,
    active: true,
  });
  await userRepository.save(user);

  const conta = accountRepository.create({
    name: 'Conta Corrente',
    type: AccountType.Checking,
    initialBalance: 5000,
    balance: 5000,
    user,
    active: true,
  });
  await accountRepository.save(conta);

  const categoriaRenda = categoryRepository.create({
    name: 'Salário',
    type: CategoryType.Income,
    user,
  });
  await categoryRepository.save(categoriaRenda);

  const categoriaDespesa = categoryRepository.create({
    name: 'Alimentação',
    type: CategoryType.Expense,
    spendingLimit: 1500,
    user,
  });
  await categoryRepository.save(categoriaDespesa);

  const goal = goalRepository.create({
    name: 'Montar reserva',
    description: 'Objetivo para reserva de emergência',
    targetValue: 10000,
    currentValue: 2500,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 12)).toISOString().slice(0, 10),
    status: GoalStatus.Active,
    user,
  });
  await goalRepository.save(goal);

  const income = incomeRepository.create({
    description: 'Salário Mensal',
    amount: 5000,
    date: new Date().toISOString().slice(0, 10),
    recurrence: RecurrenceInterval.Monthly,
    user,
    account: conta,
    category: categoriaRenda,
  });
  await incomeRepository.save(income);

  conta.balance += income.amount;
  await accountRepository.save(conta);

  const expense = expenseRepository.create({
    description: 'Supermercado',
    amount: 350,
    date: new Date().toISOString().slice(0, 10),
    installments: 1,
    paidInstallments: 1,
    recurrent: true,
    user,
    account: conta,
    category: categoriaDespesa,
  });
  await expenseRepository.save(expense);

  conta.balance -= expense.amount;
  await accountRepository.save(conta);

  console.log('Seed data generated successfully.');
  await AppDataSource.destroy();
}

seed().catch(async (error) => {
  console.error(error);
  await AppDataSource.destroy();
  process.exit(1);
});
