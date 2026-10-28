import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@datn.com';
  const password = 'Admin@123456';
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
      isVerified: true,
      fullName: 'Super Administrator',
    },
    create: {
      email,
      passwordHash,
      fullName: 'Super Administrator',
      role: 'SUPER_ADMIN',
      isActive: true,
      isVerified: true,
    },
  });

  console.log('✅ Super Admin account ready:');
  console.log(`Email: ${admin.email}`);
  console.log(`Role: ${admin.role}`);
  console.log(`Full Name: ${admin.fullName}`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi khởi tạo tài khoản admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
