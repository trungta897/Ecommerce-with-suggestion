import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CreateOrderDto {
  @IsNotEmpty()
  @IsString()
  shippingName: string;

  @IsNotEmpty()
  @IsString()
  shippingAddress: string;

  @IsNotEmpty()
  @IsString()
  shippingPhone: string;

  @IsOptional()
  @IsString()
  deliveryMethod?: string;

  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  voucherId?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  provinceId?: string;

  @IsOptional()
  @IsString()
  wardId?: string;

  @IsOptional()
  pickupTime?: Date;

  @IsOptional()
  items?: { productId: string; quantity: number }[];

  @IsOptional()
  useVipPoints?: boolean;
}
