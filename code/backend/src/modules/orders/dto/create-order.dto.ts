import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';
import { ORDER_MAX_ITEMS } from '../../../common/constants/order.constant';
import { CreateOrderItemDto } from './create-order-item.dto';

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
  @IsArray()
  @ArrayMaxSize(ORDER_MAX_ITEMS)
  @ArrayUnique((i: CreateOrderItemDto) => i.productId)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items?: CreateOrderItemDto[];

  @IsOptional()
  useVipPoints?: boolean;

  @IsOptional()
  @IsString()
  sessionId?: string;
}
