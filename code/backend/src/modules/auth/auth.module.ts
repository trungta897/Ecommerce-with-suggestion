import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback_secret_key_change_me',
      signOptions: {
        // [KNOWN LIMITATION] NFR Q-04: AT=15m + RT=7d.
        // Phạm vi đồ án dùng long-lived AT=7d để đơn giản hóa.
        // Production: AT='15m' + implement POST /auth/refresh endpoint.
        expiresIn: '7d',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
