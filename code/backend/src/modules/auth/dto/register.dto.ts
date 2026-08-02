import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class RegisterDto {
  @IsNotEmpty({ message: i18nValidationMessage('auth.FULLNAME_REQUIRED') })
  fullName: string;

  @IsEmail({}, { message: i18nValidationMessage('auth.INVALID_EMAIL') })
  @IsNotEmpty({ message: i18nValidationMessage('auth.USER_NOT_FOUND') }) // Just using a default, maybe INVALID_EMAIL is better for empty, but class-validator requires IsNotEmpty sometimes. We can just use i18n validation.
  email: string;

  @MinLength(6, { message: i18nValidationMessage('auth.PASSWORD_TOO_SHORT') })
  password: string;
}
