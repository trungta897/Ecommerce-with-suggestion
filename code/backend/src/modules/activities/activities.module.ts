import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { RedisModule } from '../redis/redis.module';
import { requireSecret } from '../../common/utils/secrets.helper';

@Module({
  imports: [
    RedisModule,
    JwtModule.register({
      secret: requireSecret(
        process.env.JWT_SECRET,
        'JWT_SECRET',
        'fallback_secret_key_change_me',
      ),
      signOptions: {
        expiresIn: '7d',
      },
    }),
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
