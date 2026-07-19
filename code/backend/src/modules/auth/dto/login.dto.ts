import { IsEmail, IsNotEmpty } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class LoginDto {
  @IsEmail({}, { message: i18nValidationMessage('auth.INVALID_EMAIL') })
  email: string;

  @IsNotEmpty({ message: i18nValidationMessage('auth.INVALID_PASSWORD') })
  password: string;
}
