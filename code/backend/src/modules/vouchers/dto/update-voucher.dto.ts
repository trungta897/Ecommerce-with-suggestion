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

export class UpdateVoucherDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsEnum(VoucherType)
  @IsOptional()
  type?: VoucherType;

  @IsEnum(VoucherScope)
  @IsOptional()
  scope?: VoucherScope;

  @IsNumber()
  @IsOptional()
  @Min(0)
  value?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  minOrderValue?: number;

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
  perUserLimit?: number;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  productId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
