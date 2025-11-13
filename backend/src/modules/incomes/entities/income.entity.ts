import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { RecurrenceInterval } from '../../../common/enums/recurrence-interval.enum';
import { Account } from '../../accounts/entities/account.entity';
import { Category } from '../../categories/entities/category.entity';
import { User } from '../../users/entities/user.entity';
import { Goal } from 'src/modules/goals/entities/goal.entity';

@Entity('rendas')
export class Income extends BaseEntity {
  @Column()
  description!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: number;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'enum', enum: RecurrenceInterval, default: RecurrenceInterval.None })
  recurrence!: RecurrenceInterval;

  @ManyToOne(() => User, (user) => user.incomes, { onDelete: 'CASCADE' })
  user!: User;

  @ManyToOne(() => Account, (account) => account.incomes, { onDelete: 'CASCADE' })
  account!: Account;

  @ManyToOne(() => Category, (category) => category.incomes, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  category?: Category | null;

  @ManyToOne(() => Goal, (goal) => goal.incomes, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  goal?: Goal | null;
}
