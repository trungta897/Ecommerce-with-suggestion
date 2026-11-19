import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsDateString,
  Min,
} from 'class-validator';
import { VoucherType, VoucherScope } from '@prisma/client';

export class CreateVoucherDto {
  @IsString()
  code: string;

  @IsEnum(VoucherType)
  type: VoucherType;

  @IsEnum(VoucherScope)
  @IsOptional()
  scope?: VoucherScope = VoucherScope.CART;

  @IsNumber()
  @Min(0)
  value: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  minOrderValue?: number = 0;

  @IsNumber()
  @IsOptional()
  @Min(0)
  maxDiscount?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  usageLimit?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  perUserLimit?: number = 1;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean = true;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  productId?: string;
}
