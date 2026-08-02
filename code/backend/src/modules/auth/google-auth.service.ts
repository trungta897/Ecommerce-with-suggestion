import { Injectable, BadRequestException, HttpStatus } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';
import { GoogleLoginDto } from './dto/google-login.dto';
import { GoogleCompleteDto } from './dto/google-complete.dto';
import { BcryptHelper } from '../../common/utils/bcrypt.util';
import { v4 as uuidv4 } from 'uuid';
import { I18nService, I18nContext } from 'nestjs-i18n';

@Injectable()
export class GoogleAuthService {
  private googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private redisService: RedisService,
    private i18n: I18nService,
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async verifyGoogleToken(dto: GoogleLoginDto) {
    const lang = I18nContext.current()?.lang || 'vi';
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: dto.credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new BadRequestException(
          this.i18n.t('auth.GOOGLE_INVALID_TOKEN', { lang }),
        );
      }

      let user = await this.prisma.user.findUnique({
        where: { email: payload.email },
      });

      if (user) {
        // Link Google ID if missing
        if (!user.googleId) {
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: { googleId: payload.sub, provider: 'GOOGLE' },
          });
        }

        const accessToken = this.jwtService.sign({
          sub: user.id,
          email: user.email,
          role: user.role,
        });
        return {
          statusCode: HttpStatus.OK,
          accessToken,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
          },
        };
      } else {
        const { email, name, picture } = payload;

        const tempToken = uuidv4();
        await this.redisService.set(
          `GOOGLE_TEMP:${tempToken}`,
          JSON.stringify({
            email,
            fullName: name,
            avatarUrl: picture,
            googleId: payload.sub,
          }),
          600,
        ); // 10 mins

        return {
          statusCode: HttpStatus.ACCEPTED,
          action: 'REQUIRE_PASSWORD',
          tempToken,
          message: this.i18n.t('auth.GOOGLE_COMPLETE_INFO', { lang }),
          email,
          fullName: name,
        };
      }
    } catch (error: unknown) {
      if (error instanceof BadRequestException) throw error;
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        this.i18n.t('auth.GOOGLE_FAILED', { lang, args: { error: message } }),
      );
    }
  }

  async completeRegistration(dto: GoogleCompleteDto) {
    const lang = I18nContext.current()?.lang || 'vi';
    const cachedData = await this.redisService.get(
      `GOOGLE_TEMP:${dto.tempToken}`,
    );
    if (!cachedData) {
      throw new BadRequestException(
        this.i18n.t('auth.SESSION_EXPIRED', { lang }),
      );
    }

    const parsedData = JSON.parse(cachedData) as {
      email: string;
      fullName: string;
      avatarUrl: string;
      googleId: string;
    };
    const { email, fullName, avatarUrl, googleId } = parsedData;
    const passwordHash = await BcryptHelper.hashPassword(dto.password);

    const newUser = await this.prisma.user.create({
      data: {
        email,
        fullName,
        passwordHash,
        avatarUrl,
        googleId,
        provider: 'GOOGLE',
        phone: dto.phone,
        address: dto.address,
        isVerified: true,
      },
    });

    await this.redisService.del(`GOOGLE_TEMP:${dto.tempToken}`);

    const accessToken = this.jwtService.sign({
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });
    return {
      accessToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
      },
    };
  }
}
