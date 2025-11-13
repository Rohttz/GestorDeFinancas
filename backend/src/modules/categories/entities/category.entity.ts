import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { CategoryType } from '../../../common/enums/category-type.enum';
import { User } from '../../users/entities/user.entity';
import { Expense } from 'src/modules/expenses/entities/expense.entity';
import { Income } from '../../incomes/entities/income.entity';

@Entity('categorias')
export class Category extends BaseEntity {
  @Column()
  name!: string;

  @Column({ type: 'enum', enum: CategoryType })
  type!: CategoryType;

  @Column({ name: 'spending_limit', type: 'decimal', precision: 12, scale: 2, nullable: true })
  spendingLimit?: number | null;

  @ManyToOne(() => User, (user) => user.categories, { onDelete: 'CASCADE' })
  user!: User;

  @OneToMany(() => Expense, (expense) => expense.category)
  expenses!: Expense[];

  @OneToMany(() => Income, (income) => income.category)
  incomes!: Income[];

}
