import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUUID,
  IsArray,
  IsObject,
  Min,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProductDto {
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  slug?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  brand?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @IsObject()
  specifications?: Record<string, unknown>;

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
  @IsUrl({}, { each: true })
  images?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
