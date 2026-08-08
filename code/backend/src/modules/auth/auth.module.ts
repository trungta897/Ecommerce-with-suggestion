import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleAuthService } from './google-auth.service';
import { MailModule } from '../mail/mail.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback_secret_key_change_me',
      signOptions: {
        expiresIn: '7d', // 7 days
      },
    }),
    MailModule,
    RedisModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleAuthService],
  exports: [AuthService],
})
export class AuthModule {}
