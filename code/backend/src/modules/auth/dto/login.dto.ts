import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class LoginDto {
  @IsString()
  @IsEmail({}, { message: i18nValidationMessage('auth.INVALID_EMAIL') })
  email: string;

  @IsString()
  @IsNotEmpty({ message: i18nValidationMessage('auth.INVALID_PASSWORD') })
  password: string;

  @IsOptional()
  @IsString()
  sessionId?: string;
}
