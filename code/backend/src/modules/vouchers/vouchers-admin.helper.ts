import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';

export async function getVoucherUsagesHelper(
  prisma: PrismaService,
  voucherId: string,
  page = 1,
  limit = 10,
) {
  const skip = (page - 1) * limit;

  const [usages, total] = await Promise.all([
    prisma.userVoucherUsage.findMany({
      where: { voucherId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        order: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
            shippingPhone: true,
            shippingName: true,
            createdAt: true,
          },
        },
      },
      orderBy: { usedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.userVoucherUsage.count({ where: { voucherId } }),
  ]);

  return {
    data: usages,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

export async function findAllVouchersHelper(
  prisma: PrismaService,
  page = 1,
  limit = 10,
  search?: string,
) {
  const skip = (page - 1) * limit;
  const where: Prisma.VoucherWhereInput = search
    ? {
        code: { contains: search },
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.voucher.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        product: { select: { id: true, name: true } },
        _count: { select: { usages: true } },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.voucher.count({ where }),
  ]);

  return {
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

export async function createVoucherHelper(
  prisma: PrismaService,
  dto: CreateVoucherDto,
) {
  const { startDate, endDate, ...rest } = dto;
  return prisma.voucher.create({
    data: {
      ...rest,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
  });
}

export async function updateVoucherHelper(
  prisma: PrismaService,
  id: string,
  dto: UpdateVoucherDto,
) {
  const { startDate, endDate, ...rest } = dto;
  const updateData: Prisma.VoucherUpdateInput = {
    ...rest,
  };
  if (startDate) {
    updateData.startDate = new Date(startDate);
  }
  if (endDate) {
    updateData.endDate = new Date(endDate);
  }

  return prisma.voucher.update({
    where: { id },
    data: updateData,
  });
}
