import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessRuleException } from '../../common/exceptions/business-rule.exception';
import { CategoryType } from '../../common/enums/category-type.enum';
import { GoalStatus } from '../../common/enums/goal-status.enum';
import { RecurrenceInterval } from '../../common/enums/recurrence-interval.enum';
import { Account } from '../accounts/entities/account.entity';
import { Category } from '../categories/entities/category.entity';
import { Goal } from '../goals/entities/goal.entity';
import { User } from '../users/entities/user.entity';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { Income } from './entities/income.entity';

@Injectable()
export class IncomesService {
  constructor(
    @InjectRepository(Income)
    private readonly incomesRepository: Repository<Income>,
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
      return value;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private roundCurrency(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private addCurrency(base: number | string | null | undefined, delta: number): number {
    return this.roundCurrency(this.toNumber(base) + delta);
  }

  private areCurrencyEqual(a: number, b: number): boolean {
    return Math.abs(a - b) < 0.005;
  }

  private increaseGoalProgress(goal: Goal, amount: number) {
    const targetValue = this.roundCurrency(this.toNumber(goal.targetValue));
    const nextValue = this.addCurrency(goal.currentValue, amount);
    if (nextValue > targetValue) {
      throw new BusinessRuleException('O progresso da meta não pode exceder o valor alvo.');
    }
    goal.currentValue = nextValue;
    if (this.areCurrencyEqual(goal.currentValue, targetValue)) {
      goal.status = GoalStatus.Completed;
    }
  }

  private decreaseGoalProgress(goal: Goal, amount: number) {
    const targetValue = this.roundCurrency(this.toNumber(goal.targetValue));
    const nextValue = this.addCurrency(goal.currentValue, -amount);
    goal.currentValue = nextValue < 0 ? 0 : nextValue;
    if (goal.status === GoalStatus.Completed && goal.currentValue < targetValue) {
      goal.status = GoalStatus.Active;
    }
  }

  private ensureRecurringValidity(recurrence?: RecurrenceInterval) {
    if (!recurrence) {
      throw new BusinessRuleException('Rendas com recorrência devem informar o intervalo.');
    }
  }

  async create(dto: CreateIncomeDto): Promise<Income> {
    const user = await this.usersRepository.findOne({ where: { id: dto.userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    if (!user.active) {
      throw new BusinessRuleException('Usuário inativo não pode registrar rendas.');
    }

    const account = await this.accountsRepository.findOne({
      where: { id: dto.accountId },
      relations: ['user'],
    });
    if (!account || account.user.id !== user.id) {
      throw new BusinessRuleException('Conta inválida para o usuário informado.');
    }

    let category: Category | null = null;
    if (dto.categoryId) {
      category = await this.categoriesRepository.findOne({
        where: { id: dto.categoryId },
        relations: ['user'],
      });
      if (!category || category.user.id !== user.id) {
        throw new BusinessRuleException('Categoria inválida para o usuário informado.');
      }
      if (category.type !== CategoryType.Income) {
        throw new BusinessRuleException('Categoria deve ser do tipo renda.');
      }
    }

    let goal: Goal | null = null;
    if (dto.goalId) {
      goal = await this.goalsRepository.findOne({
        where: { id: dto.goalId },
        relations: ['user'],
      });
      if (!goal || goal.user.id !== user.id) {
        throw new BusinessRuleException('Meta inválida para o usuário informado.');
      }
      if (goal.status === GoalStatus.Completed) {
        throw new BusinessRuleException('Não é possível registrar renda em meta concluída.');
      }
    }

    const recurrence = dto.recurrence ?? RecurrenceInterval.None;
    if (recurrence !== RecurrenceInterval.None) {
      this.ensureRecurringValidity(recurrence);
    }

    const amount = this.roundCurrency(this.toNumber(dto.amount));

    const income = this.incomesRepository.create({
      description: dto.description,
      amount,
      date: dto.date,
      recurrence,
      user,
      account,
      category: category ?? null,
      goal: goal ?? null,
    });

    account.balance = this.addCurrency(account.balance, amount);

    if (goal) {
      this.increaseGoalProgress(goal, amount);
      await this.goalsRepository.save(goal);
    }

    await this.accountsRepository.save(account);

    return this.incomesRepository.save(income);
  }

  async findAll(userId?: string): Promise<Income[]> {
    return this.incomesRepository.find({
      relations: ['user', 'account', 'category', 'goal'],
      where: userId ? { user: { id: userId } } : {},
    });
  }

  async findOne(id: string): Promise<Income> {
    const income = await this.incomesRepository.findOne({
      where: { id },
      relations: ['user', 'account', 'category', 'goal'],
    });
    if (!income) {
      throw new NotFoundException('Renda não encontrada.');
    }
    return income;
  }

  async update(id: string, dto: UpdateIncomeDto): Promise<Income> {
    const income = await this.findOne(id);
    const currentIncomeAmount = this.roundCurrency(this.toNumber(income.amount));
    const requestedAmount =
      dto.amount !== undefined ? this.roundCurrency(this.toNumber(dto.amount)) : undefined;

    if (dto.userId && dto.userId !== income.user.id) {
      throw new BusinessRuleException('Não é permitido alterar o usuário da renda.');
    }

    if (requestedAmount !== undefined && requestedAmount <= 0) {
      throw new BusinessRuleException('O valor da renda deve ser positivo.');
    }

    if (dto.recurrence && dto.recurrence !== RecurrenceInterval.None) {
      this.ensureRecurringValidity(dto.recurrence as RecurrenceInterval);
    }

    const previousAccount = await this.accountsRepository.findOne({
      where: { id: income.account.id },
    });
    if (!previousAccount) {
      throw new BusinessRuleException('Conta original não encontrada.');
    }

    let targetAccount = previousAccount;
    if (dto.accountId && dto.accountId !== previousAccount.id) {
      targetAccount = await this.accountsRepository.findOne({
        where: { id: dto.accountId },
        relations: ['user'],
      });
      if (!targetAccount || targetAccount.user.id !== income.user.id) {
        throw new BusinessRuleException('Conta inválida para o usuário informado.');
      }
    }

    let targetGoal = income.goal
      ? await this.goalsRepository.findOne({ where: { id: income.goal.id } })
      : null;

    if (dto.goalId && dto.goalId !== targetGoal?.id) {
      targetGoal = await this.goalsRepository.findOne({ where: { id: dto.goalId } });
      if (!targetGoal) {
        throw new NotFoundException('Meta não encontrada.');
      }
      if (targetGoal.user.id !== income.user.id) {
        throw new BusinessRuleException('Meta inválida para o usuário informado.');
      }
      if (targetGoal.status === GoalStatus.Completed) {
        throw new BusinessRuleException('Não é possível registrar renda em meta concluída.');
      }
    }

    const category = dto.categoryId
      ? await this.categoriesRepository.findOne({
          where: { id: dto.categoryId },
          relations: ['user'],
        })
      : income.category;

    if (category && category.user.id !== income.user.id) {
      throw new BusinessRuleException('Categoria inválida para o usuário informado.');
    }
    if (category && category.type !== CategoryType.Income) {
      throw new BusinessRuleException('Categoria deve ser do tipo renda.');
    }

    previousAccount.balance = this.addCurrency(previousAccount.balance, -currentIncomeAmount);

    if (targetGoal && targetGoal.id !== income.goal?.id) {
      if (income.goal) {
        this.decreaseGoalProgress(income.goal, currentIncomeAmount);
        await this.goalsRepository.save(income.goal);
      }
    } else if (income.goal) {
      this.decreaseGoalProgress(income.goal, currentIncomeAmount);
      await this.goalsRepository.save(income.goal);
    }

    const amount = requestedAmount ?? currentIncomeAmount;

    targetAccount.balance = this.addCurrency(targetAccount.balance, amount);

    if (targetGoal) {
      this.increaseGoalProgress(targetGoal, amount);
      await this.goalsRepository.save(targetGoal);
    }

    await this.accountsRepository.save(previousAccount);
    if (targetAccount.id !== previousAccount.id) {
      await this.accountsRepository.save(targetAccount);
    }

    const updateFields: Partial<Income> = { ...dto };
    delete (updateFields as Record<string, unknown>).amount;

    Object.assign(income, updateFields, {
      amount,
      account: targetAccount,
      goal: targetGoal ?? null,
      category: category ?? null,
    });

    return this.incomesRepository.save(income);
  }

  async remove(id: string): Promise<void> {
    const income = await this.findOne(id);
    const incomeAmount = this.roundCurrency(this.toNumber(income.amount));

    const account = await this.accountsRepository.findOne({ where: { id: income.account.id } });
    if (account) {
      account.balance = this.addCurrency(account.balance, -incomeAmount);
      await this.accountsRepository.save(account);
    }

    if (income.goal) {
      const goal = await this.goalsRepository.findOne({ where: { id: income.goal.id } });
      if (goal) {
        this.decreaseGoalProgress(goal, incomeAmount);
        await this.goalsRepository.save(goal);
      }
    }

    await this.incomesRepository.remove(income);
  }
}
