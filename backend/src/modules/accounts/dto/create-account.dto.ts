import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { AccountType } from '../../../common/enums/account-type.enum';

export class CreateAccountDto {
  @IsNotEmpty()
  name!: string;

  @IsEnum(AccountType)
  type!: AccountType;

  @IsNumber()
  @Min(0)
  initialBalance!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  creditLimit?: number;

  @IsUUID()
  userId!: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
