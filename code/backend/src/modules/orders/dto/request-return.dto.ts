import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReturnReason } from '@prisma/client';

export class RequestReturnDto {
  @IsEnum(ReturnReason, {
    message: 'Lý do trả hàng không hợp lệ',
  })
  returnReason: ReturnReason;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Ghi chú không được vượt quá 500 ký tự' })
  note?: string;
}
