import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { GoalStatus } from '../../../common/enums/goal-status.enum';
import { User } from '../../users/entities/user.entity';
import { Income } from '../../incomes/entities/income.entity';
import { Expense } from 'src/modules/expenses/entities/expense.entity';

@Entity('metas')
export class Goal extends BaseEntity {
  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ name: 'target_value', type: 'decimal', precision: 12, scale: 2 })
  targetValue!: number;

  @Column({ name: 'current_value', type: 'decimal', precision: 12, scale: 2, default: 0 })
  currentValue!: number;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate!: string;

  @Column({ type: 'enum', enum: GoalStatus, default: GoalStatus.Active })
  status!: GoalStatus;

  @ManyToOne(() => User, (user) => user.goals, { onDelete: 'CASCADE' })
  user!: User;

  @OneToMany(() => Income, (income) => income.goal)
  incomes!: Income[];

  @OneToMany(() => Expense, (expense) => expense.goal)
  expenses!: Expense[];
}
