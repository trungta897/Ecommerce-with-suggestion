import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ActivitiesService } from './activities.service';
import { LogActivityDto } from './dto/log-activity.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Activities')
@Controller('activities')
export class ActivitiesController {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly jwtService: JwtService,
  ) {}

  private extractUserId(req: Request): string | null {
    try {
      const authHeader = req.headers.authorization;
      let token: string | undefined;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else if (req.cookies && typeof req.cookies === 'object') {
        const cookieToken = (req.cookies as Record<string, unknown>)[
          'access_token'
        ];
        if (typeof cookieToken === 'string') {
          token = cookieToken;
        }
      }

      if (token) {
        const decoded = this.jwtService.decode<{ sub?: string }>(token);
        return decoded?.sub || null;
      }
    } catch {
      return null;
    }
    return null;
  }

  @Post('log')
  async logActivity(@Req() req: Request, @Body() dto: LogActivityDto) {
    const userId = this.extractUserId(req);
    return this.activitiesService.logActivity(userId, dto);
  }

  @Get('recently-viewed')
  async getRecentlyViewed(
    @Req() req: Request,
    @Query('sessionId') sessionId?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = this.extractUserId(req) || undefined;
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.activitiesService.getRecentlyViewed(
      userId,
      sessionId,
      parsedLimit,
    );
  }

  @Delete('recently-viewed')
  async clearRecentlyViewed(
    @Req() req: Request,
    @Query('sessionId') sessionId?: string,
  ) {
    const userId = this.extractUserId(req) || undefined;
    return this.activitiesService.clearRecentlyViewed(userId, sessionId);
  }

  @Get('recommendations')
  async getRecommendations(
    @Req() req: Request,
    @Query('sessionId') sessionId?: string,
    @Query('productId') productId?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = this.extractUserId(req) || undefined;
    const parsedLimit = limit ? parseInt(limit, 10) : 8;
    return this.activitiesService.getRecommendations(
      userId,
      sessionId,
      productId,
      parsedLimit,
    );
  }
}
