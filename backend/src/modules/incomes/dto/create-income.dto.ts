import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { RecurrenceInterval } from '../../../common/enums/recurrence-interval.enum';

export class CreateIncomeDto {
  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsDateString()
  date!: string;

  @IsEnum(RecurrenceInterval)
  @IsOptional()
  recurrence?: RecurrenceInterval;

  @IsUUID()
  userId!: string;

  @IsUUID()
  accountId!: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  goalId?: string;
}
