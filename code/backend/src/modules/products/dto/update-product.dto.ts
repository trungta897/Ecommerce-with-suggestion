import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUUID,
  IsArray,
  IsObject,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProductDto {
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @IsObject()
  specifications?: any;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  price?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  discountPrice?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsArray()
  images?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
