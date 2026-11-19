import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ActivityType } from '@prisma/client';

export class LogActivityDto {
  @IsNotEmpty()
  @IsEnum(ActivityType)
  action: ActivityType;

  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  searchQuery?: string;
}
