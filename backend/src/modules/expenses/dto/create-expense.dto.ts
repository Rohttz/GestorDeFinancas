import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { coerceToDecimal } from '../../../common/utils/number.util';

export class CreateExpenseDto {
  @IsString()
  @IsNotEmpty()
  description!: string;

  @Transform(({ value }) => coerceToDecimal(value), { toClassOnly: true })
  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  installments?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  paidInstallments?: number;

  @IsBoolean()
  @IsOptional()
  recurrent?: boolean;

  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsUUID()
  accountId?: string;

  @IsOptional()
  @IsUUID()
  goalId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
