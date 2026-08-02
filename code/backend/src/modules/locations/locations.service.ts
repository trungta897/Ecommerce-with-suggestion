import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProvinces() {
    return await this.prisma.province.findMany({
      select: {
        id: true,
        name: true,
        fullName: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getDistricts(provinceId: string) {
    return await this.prisma.district.findMany({
      where: { provinceId },
      select: {
        id: true,
        provinceId: true,
        name: true,
        fullName: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getWards(districtId: string) {
    return await this.prisma.ward.findMany({
      where: { districtId },
      select: {
        id: true,
        districtId: true,
        name: true,
        fullName: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
}
