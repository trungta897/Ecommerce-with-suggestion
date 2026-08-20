import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class ResetPasswordDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  otp: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: i18nValidationMessage('auth.PASSWORD_TOO_SHORT') })
  @MaxLength(32)
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[\d\W]).{6,32}$/, {
    message: i18nValidationMessage('auth.WEAK_PASSWORD'),
  })
  newPassword: string;
}
