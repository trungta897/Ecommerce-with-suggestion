import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const saltRounds = 10;

  // 1. Super Admin
  const adminEmail = 'admin@datn.com';
  const adminPassword = 'Admin@123456';
  const adminPasswordHash = await bcrypt.hash(adminPassword, saltRounds);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: adminPasswordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
      isVerified: true,
      fullName: 'Super Administrator',
    },
    create: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      fullName: 'Super Administrator',
      role: 'SUPER_ADMIN',
      isActive: true,
      isVerified: true,
    },
  });

  // 2. Employee (Nhân viên vận hành)
  const employeeEmail = 'employee@datn.com';
  const employeePassword = 'Staff@123456';
  const employeePasswordHash = await bcrypt.hash(employeePassword, saltRounds);

  const employee = await prisma.user.upsert({
    where: { email: employeeEmail },
    update: {
      passwordHash: employeePasswordHash,
      role: 'EMPLOYEE',
      isActive: true,
      isVerified: true,
      fullName: 'Nhân Viên Vận Hành',
    },
    create: {
      email: employeeEmail,
      passwordHash: employeePasswordHash,
      fullName: 'Nhân Viên Vận Hành',
      role: 'EMPLOYEE',
      isActive: true,
      isVerified: true,
    },
  });

  // 3. Customer (Khách hàng - Thuần Số Điện Thoại + OTP)
  const customerPhone = '0912345678';
  const customerPlaceholderEmail = `${customerPhone}@placeholder.local`;

  let customer = await prisma.user.findUnique({
    where: { phone: customerPhone },
  });

  if (customer) {
    customer = await prisma.user.update({
      where: { id: customer.id },
      data: {
        fullName: 'Nguyễn Văn Khách',
        role: 'CUSTOMER',
        isActive: true,
        isVerified: true,
        vipPoints: 150,
      },
    });
  } else {
    customer = await prisma.user.create({
      data: {
        phone: customerPhone,
        email: customerPlaceholderEmail,
        fullName: 'Nguyễn Văn Khách',
        passwordHash: '',
        role: 'CUSTOMER',
        isActive: true,
        isVerified: true,
        vipPoints: 150,
      },
    });
  }

  console.log('✅ Đã khởi tạo đầy đủ các tài khoản test:');
  console.log(`- SUPER_ADMIN: ${admin.email} (Admin@123456)`);
  console.log(`- EMPLOYEE:    ${employee.email} (Staff@123456)`);
  console.log(
    `- CUSTOMER:    SĐT ${customer.phone} (OTP qua Redis, không cần Email)`,
  );
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi khởi tạo tài khoản test:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
