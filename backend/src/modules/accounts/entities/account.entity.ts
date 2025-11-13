import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { AccountType } from '../../../common/enums/account-type.enum';
import { User } from '../../users/entities/user.entity';
import { Expense } from 'src/modules/expenses/entities/expense.entity';
import { Income } from 'src/modules/incomes/entities/income.entity';

@Entity('contas')
export class Account extends BaseEntity {
  @Column()
  name!: string;

  @Column({ type: 'enum', enum: AccountType })
  type!: AccountType;

  @Column({ name: 'initial_balance', type: 'decimal', precision: 12, scale: 2 })
  initialBalance!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  balance!: number;

  @Column({ name: 'credit_limit', type: 'decimal', precision: 12, scale: 2, nullable: true })
  creditLimit?: number | null;

  @Column({ default: true })
  active!: boolean;

  @ManyToOne(() => User, (user) => user.accounts, { onDelete: 'CASCADE' })
  user!: User;

  @OneToMany(() => Expense, (expense) => expense.account)
  expenses!: Expense[];

  @OneToMany(() => Income, (income) => income.account)
  incomes!: Income[];

}
