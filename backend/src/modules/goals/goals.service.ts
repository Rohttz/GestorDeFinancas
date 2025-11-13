import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessRuleException } from '../../common/exceptions/business-rule.exception';
import { GoalStatus } from '../../common/enums/goal-status.enum';
import { User } from '../users/entities/user.entity';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { Goal } from './entities/goal.entity';

@Injectable()
export class GoalsService {
  constructor(
    @InjectRepository(Goal)
    private readonly goalsRepository: Repository<Goal>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  private normalizeAmount(value: number | string | null | undefined): number {
    if (value === null || value === undefined) {
      return 0;
    }
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }
    const parsed = Number(String(value).replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private roundCurrency(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  async create(dto: CreateGoalDto): Promise<Goal> {
    const user = await this.usersRepository.findOne({ where: { id: dto.userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate > endDate) {
      throw new BusinessRuleException('A data inicial deve ser anterior ou igual à data final.');
    }

    const targetValue = this.roundCurrency(this.normalizeAmount(dto.targetValue));
    const currentValue = this.roundCurrency(this.normalizeAmount(dto.currentValue));

    if (currentValue > targetValue) {
      throw new BusinessRuleException('O progresso da meta não pode exceder o alvo.');
    }

    const goal = this.goalsRepository.create({
      name: dto.name,
      description: dto.description,
      targetValue,
      currentValue,
      startDate: dto.startDate,
      endDate: dto.endDate,
      status: dto.status ?? GoalStatus.Active,
      user,
    });

    return this.goalsRepository.save(goal);
  }

  async findAll(userId?: string): Promise<Goal[]> {
    return this.goalsRepository.find({
      relations: ['user'],
      where: userId ? { user: { id: userId } } : {},
    });
  }

  async findOne(id: string): Promise<Goal> {
    const goal = await this.goalsRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!goal) {
      throw new NotFoundException('Meta não encontrada.');
    }

    return goal;
  }

  async update(id: string, dto: UpdateGoalDto): Promise<Goal> {
    const goal = await this.findOne(id);

    if (dto.userId && dto.userId !== goal.user.id) {
      const user = await this.usersRepository.findOne({ where: { id: dto.userId } });
      if (!user) {
        throw new NotFoundException('Usuário não encontrado.');
      }
      goal.user = user;
    }

    if (dto.startDate && dto.endDate) {
      const startDate = new Date(dto.startDate ?? goal.startDate);
      const endDate = new Date(dto.endDate ?? goal.endDate);
      if (startDate > endDate) {
        throw new BusinessRuleException('A data inicial deve ser anterior ou igual à data final.');
      }
    }

    const target = dto.targetValue
      ? this.roundCurrency(this.normalizeAmount(dto.targetValue))
      : goal.targetValue;
    const current = dto.currentValue
      ? this.roundCurrency(this.normalizeAmount(dto.currentValue))
      : goal.currentValue;
    if (current > target) {
      throw new BusinessRuleException('O progresso da meta não pode exceder o alvo.');
    }

    Object.assign(goal, {
      ...dto,
      targetValue: target,
      currentValue: current,
    });

    return this.goalsRepository.save(goal);
  }

  async remove(id: string): Promise<void> {
    const goal = await this.findOne(id);
    await this.goalsRepository.remove(goal);
  }
}
