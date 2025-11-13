import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessRuleException } from '../../common/exceptions/business-rule.exception';
import { AccountType } from '../../common/enums/account-type.enum';
import { CategoryType } from '../../common/enums/category-type.enum';
import { GoalStatus } from '../../common/enums/goal-status.enum';
import { Account } from '../accounts/entities/account.entity';
import { Category } from '../categories/entities/category.entity';
import { Goal } from '../goals/entities/goal.entity';
import { User } from '../users/entities/user.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Expense } from './entities/expense.entity';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    @InjectRepository(Goal)
    private readonly goalsRepository: Repository<Goal>,
  ) {}

  private toNumber(value: number | string | null | undefined): number {
    if (value === null || value === undefined) {
      return 0;
    }
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }
    const parsed = Number(String(value).replace(/\s/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private roundCurrency(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private addCurrency(
    base: number | string | null | undefined,
    delta: number | string | null | undefined,
  ): number {
    const result = this.toNumber(base) + this.toNumber(delta);
    return this.roundCurrency(result);
  }

  private increaseGoalProgress(goal: Goal, amount: number | string) {
    const targetValue = this.roundCurrency(this.toNumber(goal.targetValue));

    const nextValue = this.addCurrency(goal.currentValue, amount);

    if (targetValue <= 0) {
      goal.currentValue = Math.max(nextValue, 0);
      if (goal.status === GoalStatus.Completed && goal.currentValue + 0.005 < targetValue) {
        goal.status = GoalStatus.Active;
      }
      return;
    }

    const normalized = Math.min(nextValue, targetValue);
    goal.currentValue = normalized;

    if (Math.abs(normalized - targetValue) <= 0.005) {
      goal.currentValue = targetValue;
      goal.status = GoalStatus.Completed;
    } else if (goal.status === GoalStatus.Completed && normalized + 0.005 < targetValue) {
      goal.status = GoalStatus.Active;
    }
  }

  private ensureSingleBinding(account?: Account | null, goal?: Goal | null) {
    if ((account && goal) || (!account && !goal)) {
      throw new BusinessRuleException(
        'A despesa deve estar vinculada a uma conta ou uma meta, mas não ambas.',
      );
    }
  }

  private ensureInstallmentsValidity(installments?: number) {
    if (installments !== undefined && installments < 1) {
      throw new BusinessRuleException('O número de parcelas deve ser no mínimo 1.');
    }
  }

  private getMonthRange(dateStr: string) {
    const date = new Date(dateStr);
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start: start.toISOString(), end: end.toISOString() };
  }

  private async enforceSpendingLimit(
    category: Category,
    amount: number,
    date: string,
    excludeExpenseId?: string,
  ) {
    if (!category.spendingLimit) {
      return;
    }

    const { start, end } = this.getMonthRange(date);

    const qb = this.expensesRepository
      .createQueryBuilder('expense')
      .select('COALESCE(SUM(expense.amount), 0)', 'total')
      .where('expense.categoryId = :categoryId', { categoryId: category.id })
      .andWhere('expense.date BETWEEN :start AND :end', { start, end });

    if (excludeExpenseId) {
      qb.andWhere('expense.id != :excludeId', { excludeId: excludeExpenseId });
    }

    const result = await qb.getRawOne<{ total: string }>();
    const currentTotal = Number(result?.total ?? 0);

    if (currentTotal + amount > Number(category.spendingLimit)) {
      throw new BusinessRuleException(
        'O valor excede o limite de gastos configurado para a categoria.',
      );
    }
  }

  private adjustAccountBalance(account: Account, delta: number | string) {
    const normalizedDelta = this.roundCurrency(this.toNumber(delta));
    const newBalance = this.addCurrency(account.balance, normalizedDelta);

    if (normalizedDelta < 0) {
      if (account.type === AccountType.Credit) {
        const creditLimit = this.toNumber(account.creditLimit);
        if (creditLimit > 0 && Math.abs(newBalance) - creditLimit > 0.005) {
          throw new BusinessRuleException('Limite de crédito excedido.');
        }
      }
    }

    account.balance = newBalance >= -0.005 && newBalance <= 0.005 ? 0 : newBalance;
  }

  private async loadUser(userId: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    if (!user.active) {
      throw new BusinessRuleException('Usuário inativo não pode registrar despesas.');
    }
    return user;
  }

  private async resolveAccount(accountId: string, user: User): Promise<Account> {
    const account = await this.accountsRepository.findOne({
      where: { id: accountId },
      relations: ['user'],
    });
    if (!account || account.user.id !== user.id) {
      throw new BusinessRuleException('Conta inválida para o usuário informado.');
    }
    return account;
  }

  private async resolveCategory(categoryId: string, user: User): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id: categoryId },
      relations: ['user'],
    });
    if (!category || category.user.id !== user.id) {
      throw new BusinessRuleException('Categoria inválida para o usuário informado.');
    }
    if (category.type !== CategoryType.Expense) {
      throw new BusinessRuleException('Categoria deve ser do tipo despesa.');
    }
    return category;
  }

  private async resolveGoal(goalId: string, user: User): Promise<Goal> {
    const goal = await this.goalsRepository.findOne({
      where: { id: goalId },
      relations: ['user'],
    });
    if (!goal || goal.user.id !== user.id) {
      throw new BusinessRuleException('Meta inválida para o usuário informado.');
    }
    if (goal.status === GoalStatus.Completed) {
      throw new BusinessRuleException('Não é possível registrar despesas em meta concluída.');
    }
    return goal;
  }

  private decreaseGoalProgress(goal: Goal, amount: number | string) {
    const currentValue = this.roundCurrency(this.toNumber(goal.currentValue));
    const normalizedAmount = this.roundCurrency(this.toNumber(amount));
    const nextValue = this.roundCurrency(currentValue - normalizedAmount);
    if (nextValue < 0) {
      throw new BusinessRuleException('O valor não pode deixar o progresso da meta negativo.');
    }
    goal.currentValue = nextValue;
    const targetValue = this.roundCurrency(this.toNumber(goal.targetValue));
    if (goal.status === GoalStatus.Completed && goal.currentValue < targetValue) {
      goal.status = GoalStatus.Active;
    }
  }

  async create(dto: CreateExpenseDto): Promise<Expense> {
    const user = await this.loadUser(dto.userId);

    const account = dto.accountId ? await this.resolveAccount(dto.accountId, user) : null;
    const goal: Goal | null = dto.goalId ? await this.resolveGoal(dto.goalId, user) : null;

    this.ensureSingleBinding(account, goal);
    this.ensureInstallmentsValidity(dto.installments);

    const amount = this.roundCurrency(this.toNumber(dto.amount));

    let category: Category | null = null;
    if (dto.categoryId) {
      category = await this.resolveCategory(dto.categoryId, user);
      await this.enforceSpendingLimit(category, amount, dto.date);
    }

    if (account) {
      this.adjustAccountBalance(account, -amount);
    }

    if (goal) {
      this.decreaseGoalProgress(goal, amount);
    }

    const expense = this.expensesRepository.create({
      description: dto.description,
      amount,
      date: dto.date,
      installments: dto.installments ?? 1,
      paidInstallments: dto.paidInstallments ?? 0,
      recurrent: dto.recurrent ?? false,
      user,
      account,
      goal,
      category,
    });

    if (account) {
      await this.accountsRepository.save(account);
    }
    if (goal) {
      await this.goalsRepository.save(goal);
    }

    return this.expensesRepository.save(expense);
  }

  async findAll(userId?: string): Promise<Expense[]> {
    return this.expensesRepository.find({
      relations: ['user', 'account', 'goal', 'category'],
      where: userId ? { user: { id: userId } } : {},
    });
  }

  async findOne(id: string): Promise<Expense> {
    const expense = await this.expensesRepository.findOne({
      where: { id },
      relations: ['user', 'account', 'goal', 'category'],
    });
    if (!expense) {
      throw new NotFoundException('Despesa não encontrada.');
    }
    return expense;
  }

  async update(id: string, dto: UpdateExpenseDto): Promise<Expense> {
    const expense = await this.findOne(id);
    const user = dto.userId ? await this.loadUser(dto.userId) : expense.user;

    const originalAccount = expense.account
      ? await this.resolveAccount(expense.account.id, expense.user)
      : null;
    const originalGoal = expense.goal
      ? await this.resolveGoal(expense.goal.id, expense.user)
      : null;

    const targetAccount = dto.accountId
      ? await this.resolveAccount(dto.accountId, user)
      : dto.accountId === null
        ? null
        : expense.account;

    const targetGoal = dto.goalId
      ? await this.resolveGoal(dto.goalId, user)
      : dto.goalId === null
        ? null
        : expense.goal;

    this.ensureSingleBinding(targetAccount, targetGoal);
    this.ensureInstallmentsValidity(dto.installments);

    let category = expense.category;
    if (dto.categoryId) {
      category = await this.resolveCategory(dto.categoryId, user);
    }

    const previousAmount = this.roundCurrency(this.toNumber(expense.amount));
    const amount =
      dto.amount !== undefined
        ? this.roundCurrency(this.toNumber(dto.amount))
        : previousAmount;
    const date = dto.date ?? expense.date;

    if (category) {
      await this.enforceSpendingLimit(category, amount, date, expense.id);
    }

    if (originalAccount) {
      this.adjustAccountBalance(originalAccount, previousAmount);
    }
    if (originalGoal) {
      this.increaseGoalProgress(originalGoal, previousAmount);
    }

    if (targetAccount) {
      this.adjustAccountBalance(targetAccount, -amount);
    }
    if (targetGoal) {
      this.decreaseGoalProgress(targetGoal, amount);
    }

    const updatePayload: Partial<Expense> = { ...dto } as Partial<Expense>;
    delete (updatePayload as Record<string, unknown>).amount;
    delete (updatePayload as Record<string, unknown>).date;

    Object.assign(expense, updatePayload, {
      amount,
      date,
      account: targetAccount,
      goal: targetGoal,
      category,
      user,
    });

    if (originalAccount) {
      await this.accountsRepository.save(originalAccount);
    }
    if (originalGoal) {
      await this.goalsRepository.save(originalGoal);
    }
    if (targetAccount) {
      await this.accountsRepository.save(targetAccount);
    }
    if (targetGoal) {
      await this.goalsRepository.save(targetGoal);
    }

    return this.expensesRepository.save(expense);
  }

  async remove(id: string): Promise<void> {
    const expense = await this.findOne(id);
    const expenseAmount = this.roundCurrency(this.toNumber(expense.amount));

    if (expense.account) {
      const account = await this.accountsRepository.findOne({ where: { id: expense.account.id } });
      if (account) {
        this.adjustAccountBalance(account, expenseAmount);
        await this.accountsRepository.save(account);
      }
    }

    if (expense.goal) {
      const goal = await this.goalsRepository.findOne({ where: { id: expense.goal.id } });
      if (goal) {
        this.increaseGoalProgress(goal, expenseAmount);
        await this.goalsRepository.save(goal);
      }
    }

    await this.expensesRepository.remove(expense);
  }
}
