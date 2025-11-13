import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { GoalStatus } from '../../../common/enums/goal-status.enum';
import { coerceToDecimal } from '../../../common/utils/number.util';

export class CreateGoalDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Transform(({ value }) => coerceToDecimal(value), { toClassOnly: true })
  @IsNumber()
  @IsPositive()
  targetValue!: number;

  @Transform(({ value }) => coerceToDecimal(value), { toClassOnly: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentValue?: number;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsEnum(GoalStatus)
  @IsOptional()
  status?: GoalStatus;

  @IsUUID()
  userId!: string;
}
