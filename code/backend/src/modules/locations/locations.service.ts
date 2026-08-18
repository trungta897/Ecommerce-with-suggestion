import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import { Province, Ward } from '@prisma/client';

@Injectable()
export class LocationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getProvinces() {
    const cacheKey = 'locations:provinces';
    const cached = await this.redis.get(cacheKey);
    if (cached)
      return JSON.parse(cached) as Pick<Province, 'id' | 'name' | 'fullName'>[];

    const data = await this.prisma.province.findMany({
      select: {
        id: true,
        name: true,
        fullName: true,
        region: true,
        mergedFrom: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    await this.redis.set(cacheKey, JSON.stringify(data), 86400); // 24h
    return data;
  }

  async getWards(provinceId: string) {
    const cacheKey = `locations:wards:${provinceId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached)
      return JSON.parse(cached) as Pick<
        Ward,
        'id' | 'provinceId' | 'name' | 'fullName' | 'mergedFrom'
      >[];

    const data = await this.prisma.ward.findMany({
      where: { provinceId },
      select: {
        id: true,
        provinceId: true,
        name: true,
        fullName: true,
        mergedFrom: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    await this.redis.set(cacheKey, JSON.stringify(data), 43200); // 12h
    return data;
  }
}
