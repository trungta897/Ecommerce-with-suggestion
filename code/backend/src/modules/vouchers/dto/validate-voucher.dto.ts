import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class VoucherCartItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  @IsOptional()
  categoryId?: string;
}

export class ValidateVoucherDto {
  @IsString()
  code: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsNumber()
  @Min(0)
  subtotal: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => VoucherCartItemDto)
  items?: VoucherCartItemDto[];
}
