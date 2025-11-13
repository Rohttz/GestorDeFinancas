import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Account } from '../../accounts/entities/account.entity';
import { Category } from '../../categories/entities/category.entity';
import { User } from '../../users/entities/user.entity';
import { Goal } from '../../goals/entities/goal.entity';

@Entity('despesas')
export class Expense extends BaseEntity {
  @Column()
  description!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: number;

  @Column({ type: 'date' })
  date!: string;

  @Column({ name: 'installments', type: 'int', default: 1 })
  installments!: number;

  @Column({ name: 'paid_installments', type: 'int', default: 0 })
  paidInstallments!: number;

  @Column({ default: false })
  recurrent!: boolean;

  @ManyToOne(() => User, (user) => user.expenses, { onDelete: 'CASCADE' })
  user!: User;

  @ManyToOne(() => Account, (account) => account.expenses, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  account?: Account | null;

  @ManyToOne(() => Category, (category) => category.expenses, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  category?: Category | null;

  @ManyToOne(() => Goal, (goal) => goal.expenses, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  goal?: Goal | null;
}
