import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RejectReturnDto {
  @IsNotEmpty({ message: 'Lý do từ chối không được để trống' })
  @IsString()
  @MaxLength(500, { message: 'Lý do từ chối không được vượt quá 500 ký tự' })
  rejectReason: string;
}
