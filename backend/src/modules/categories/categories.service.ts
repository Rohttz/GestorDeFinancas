import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(dto: CreateCategoryDto): Promise<Category> {
    const user = await this.usersRepository.findOne({ where: { id: dto.userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const category = this.categoriesRepository.create({
      name: dto.name,
      type: dto.type,
      spendingLimit: dto.spendingLimit ?? null,
      user,
    });

    return this.categoriesRepository.save(category);
  }

  async findAll(userId?: string): Promise<Category[]> {
    return this.categoriesRepository.find({
      relations: ['user'],
      where: userId ? { user: { id: userId } } : {},
    });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada.');
    }

    return category;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);

    if (dto.userId && dto.userId !== category.user.id) {
      const user = await this.usersRepository.findOne({ where: { id: dto.userId } });
      if (!user) {
        throw new NotFoundException('Usuário não encontrado.');
      }
      category.user = user;
    }

    Object.assign(category, dto);

    return this.categoriesRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);

    await this.categoriesRepository.remove(category);
  }
}
