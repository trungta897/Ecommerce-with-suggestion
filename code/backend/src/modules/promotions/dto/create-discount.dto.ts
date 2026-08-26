import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateDiscountDto {
  @ApiProperty({ description: 'ID của sản phẩm áp dụng Flash Sale / Giảm giá' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    description: 'Giá bán trong chương trình Flash Sale',
    example: 199000,
  })
  @IsNumber()
  @Min(0)
  discountPrice: number;

  @ApiProperty({ description: 'Tổng số lượng suất mở bán', example: 50 })
  @IsNumber()
  @Min(1)
  flashSaleQty: number;

  @ApiProperty({
    description: 'Thời gian bắt đầu Flash Sale',
    example: '2026-08-27T00:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({
    description: 'Thời gian kết thúc Flash Sale',
    example: '2026-08-27T23:59:59.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiPropertyOptional({ description: 'Trạng thái kích hoạt', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
