import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../accounts/entities/account.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Goal } from '../goals/entities/goal.entity';
import { Income } from '../incomes/entities/income.entity';
import { User } from '../users/entities/user.entity';

export interface GoalSummary {
  id: string;
  name: string;
  progress: number;
}

export interface DashboardSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  goals: GoalSummary[];
  upcomingExpenses: Expense[];
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    @InjectRepository(Income)
    private readonly incomesRepository: Repository<Income>,
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>,
    @InjectRepository(Goal)
    private readonly goalsRepository: Repository<Goal>,
  ) {}

  private getMonthRange(reference: Date) {
    const start = new Date(reference.getFullYear(), reference.getMonth(), 1);
    const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start: start.toISOString(), end: end.toISOString() };
  }

  async getSummary(userId: string): Promise<DashboardSummary> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const accounts = await this.accountsRepository.find({
      where: { user: { id: userId } },
    });
    const totalBalance = accounts.reduce((acc, account) => acc + Number(account.balance), 0);

    const { start, end } = this.getMonthRange(new Date());

    const monthlyIncomeRaw = await this.incomesRepository
      .createQueryBuilder('income')
      .select('COALESCE(SUM(income.amount), 0)', 'total')
      .where('income.userId = :userId', { userId })
      .andWhere('income.date BETWEEN :start AND :end', { start, end })
      .getRawOne<{ total: string }>();

    const monthlyExpenseRaw = await this.expensesRepository
      .createQueryBuilder('expense')
      .select('COALESCE(SUM(expense.amount), 0)', 'total')
      .where('expense.userId = :userId', { userId })
      .andWhere('expense.date BETWEEN :start AND :end', { start, end })
      .getRawOne<{ total: string }>();

    const goals = await this.goalsRepository.find({
      where: { user: { id: userId } },
    });

    const goalSummaries: GoalSummary[] = goals.map((goal) => ({
      id: goal.id,
      name: goal.name,
      progress: goal.targetValue === 0 ? 0 : Number(goal.currentValue) / Number(goal.targetValue),
    }));

    const upcomingExpenses = await this.expensesRepository.find({
      where: { user: { id: userId } },
      order: { date: 'ASC' },
      take: 5,
    });

    return {
      totalBalance,
      monthlyIncome: Number(monthlyIncomeRaw?.total ?? 0),
      monthlyExpense: Number(monthlyExpenseRaw?.total ?? 0),
      goals: goalSummaries,
      upcomingExpenses,
    };
  }
}
