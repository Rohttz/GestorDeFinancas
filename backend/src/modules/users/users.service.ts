import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessRuleException } from '../../common/exceptions/business-rule.exception';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { Category } from '../categories/entities/category.entity';
import { DEFAULT_CATEGORY_SEEDS } from '../categories/category-defaults';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const exists = await this.usersRepository.findOne({ where: { email: dto.email } });
    if (exists) {
      throw new BusinessRuleException('Email já cadastrado.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      active: dto.active ?? true,
    });
    const savedUser = await this.usersRepository.save(user);
    await this.seedDefaultCategories(savedUser);
    return savedUser;
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (dto.email && dto.email !== user.email) {
      const exists = await this.usersRepository.findOne({ where: { email: dto.email } });
      if (exists) {
        throw new BusinessRuleException('Email já cadastrado.');
      }
    }

    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 10);
      delete (dto as any).password;
    }

    Object.assign(user, dto);

    const updated = await this.usersRepository.save(user);
    await this.ensureUserHasCategories(updated);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  private async ensureUserHasCategories(user: User): Promise<void> {
    const count = await this.categoriesRepository.count({ where: { user: { id: user.id } } });
    if (count > 0) {
      return;
    }

    const categories = DEFAULT_CATEGORY_SEEDS.map((seed) =>
      this.categoriesRepository.create({
        name: seed.name,
        type: seed.type,
        spendingLimit: seed.spendingLimit ?? null,
        user,
      }),
    );

    await this.categoriesRepository.save(categories);
  }

  private async seedDefaultCategories(user: User): Promise<void> {
    await this.ensureUserHasCategories(user);
  }
}
