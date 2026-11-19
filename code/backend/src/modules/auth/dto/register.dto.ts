import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsString,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: i18nValidationMessage('auth.FULLNAME_REQUIRED') })
  @MaxLength(50)
  fullName: string;

  @IsEmail({}, { message: i18nValidationMessage('auth.INVALID_EMAIL') })
  @IsNotEmpty({ message: i18nValidationMessage('auth.USER_NOT_FOUND') }) // Just using a default, maybe INVALID_EMAIL is better for empty, but class-validator requires IsNotEmpty sometimes. We can just use i18n validation.
  email: string;

  @IsString()
  @MinLength(6, { message: i18nValidationMessage('auth.PASSWORD_TOO_SHORT') })
  @MaxLength(32)
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[\d\W]).{6,32}$/, {
    message: i18nValidationMessage('auth.WEAK_PASSWORD'),
  })
  password: string;
}
