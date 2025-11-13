import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  private sanitizeUser(user: User): AuthenticatedUser {
    const { passwordHash, ...safe } = user;
    return safe as AuthenticatedUser;
  }

  async login(dto: LoginDto): Promise<AuthenticatedUser> {
    const user = await this.usersRepository.findOne({ where: { email: dto.email } });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    if (!user.active) {
      throw new UnauthorizedException('Usuário inativo.');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    return this.sanitizeUser(user);
  }
}
