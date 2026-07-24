import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class GoogleCompleteDto {
  @IsNotEmpty()
  @IsString()
  tempToken: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
