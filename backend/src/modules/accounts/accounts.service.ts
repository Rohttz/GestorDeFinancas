import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessRuleException } from '../../common/exceptions/business-rule.exception';
import { User } from '../users/entities/user.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Account } from './entities/account.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(dto: CreateAccountDto): Promise<Account> {
    const user = await this.usersRepository.findOne({ where: { id: dto.userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (dto.initialBalance < 0) {
      throw new BusinessRuleException('O saldo inicial deve ser zero ou positivo.');
    }

    const account = this.accountsRepository.create({
      name: dto.name,
      type: dto.type,
      initialBalance: dto.initialBalance,
      balance: dto.initialBalance,
      creditLimit: dto.creditLimit ?? null,
      active: dto.active ?? true,
      user,
    });

    return this.accountsRepository.save(account);
  }

  async findAll(userId?: string): Promise<Account[]> {
    return this.accountsRepository.find({
      relations: ['user'],
      where: userId ? { user: { id: userId } } : {},
    });
  }

  async findOne(id: string): Promise<Account> {
    const account = await this.accountsRepository.findOne({
      where: { id },
      relations: ['user', 'incomes', 'expenses'],
    });

    if (!account) {
      throw new NotFoundException('Conta não encontrada.');
    }

    return account;
  }

  async update(id: string, dto: UpdateAccountDto): Promise<Account> {
    const account = await this.findOne(id);

    if (dto.userId && dto.userId !== account.user.id) {
      const newUser = await this.usersRepository.findOne({ where: { id: dto.userId } });
      if (!newUser) {
        throw new NotFoundException('Novo usuário não encontrado.');
      }
      account.user = newUser;
    }

    if (dto.initialBalance !== undefined && dto.initialBalance < 0) {
      throw new BusinessRuleException('O saldo inicial deve ser zero ou positivo.');
    }

    Object.assign(account, dto);

    return this.accountsRepository.save(account);
  }

  async remove(id: string, cascade = false): Promise<void> {
    const account = await this.findOne(id);

    if (
      !cascade &&
      ((account.expenses?.length ?? 0) > 0 ||
        (account.incomes?.length ?? 0) > 0)
    ) {
      throw new BusinessRuleException(
        'Não é possível remover a conta com movimentações sem confirmação de cascade.',
      );
    }

    await this.accountsRepository.remove(account);
  }
}
