import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Account } from 'src/modules/accounts/entities/account.entity';
import { Category } from '../../categories/entities/category.entity';
import { Goal } from 'src/modules/goals/entities/goal.entity';
import { Income } from '../../incomes/entities/income.entity';
import { Expense } from 'src/modules/expenses/entities/expense.entity';

@Entity('usuarios')
export class User extends BaseEntity {
  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column({ default: true })
  active!: boolean;

  @OneToMany(() => Account, (account) => account.user)
  accounts!: Account[];

  @OneToMany(() => Category, (category) => category.user)
  categories!: Category[];

  @OneToMany(() => Goal, (goal) => goal.user)
  goals!: Goal[];

  @OneToMany(() => Income, (income) => income.user)
  incomes!: Income[];

  @OneToMany(() => Expense, (expense) => expense.user)
  expenses!: Expense[];
}
