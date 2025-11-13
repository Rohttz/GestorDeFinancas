import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { CategoryType } from '../../../common/enums/category-type.enum';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(CategoryType)
  type!: CategoryType;

  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  spendingLimit?: number;
}
