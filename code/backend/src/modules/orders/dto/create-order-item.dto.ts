import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';
import { ORDER_ITEM_MAX_QUANTITY } from '../../../common/constants/order.constant';

export class CreateOrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(1)
  @Max(ORDER_ITEM_MAX_QUANTITY)
  quantity: number;
}
