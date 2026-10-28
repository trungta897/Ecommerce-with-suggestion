import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Bắt đầu chuẩn hóa dữ liệu tiền tệ về VNĐ...');

  await prisma.$transaction(async (tx) => {
    // 1. Dọn dẹp dữ liệu giao dịch demo cũ vốn đã sai đơn vị
    console.log('1. Xóa dữ liệu UserVoucherUsage, OrderItem, Order demo cũ...');
    const deletedVoucherUsage = await tx.userVoucherUsage.deleteMany({});
    console.log(
      `   - Đã xóa ${deletedVoucherUsage.count} bản ghi user_voucher_usage.`,
    );

    const deletedOrderItems = await tx.orderItem.deleteMany({});
    console.log(`   - Đã xóa ${deletedOrderItems.count} bản ghi order_items.`);

    const deletedOrders = await tx.order.deleteMany({});
    console.log(`   - Đã xóa ${deletedOrders.count} bản ghi orders.`);

    const resetVouchers = await tx.voucher.updateMany({
      data: { usedCount: 0 },
    });
    console.log(`   - Đã reset usedCount cho ${resetVouchers.count} vouchers.`);

    // 2. Quy đổi giá bảng products sang VNĐ (ngưỡng < 10000 đảm bảo idempotent)
    console.log('2. Quy đổi bảng products sang VNĐ (ngưỡng < 10000)...');
    const updatedProducts = await tx.$executeRaw`
      UPDATE \`products\` 
      SET \`price\` = ROUND(\`price\` * 25000), 
          \`discountPrice\` = CASE WHEN \`discountPrice\` IS NOT NULL THEN ROUND(\`discountPrice\` * 25000) ELSE NULL END 
      WHERE \`price\` < 10000;
    `;
    console.log(`   - Đã cập nhật ${updatedProducts} sản phẩm sang VNĐ.`);

    // 3. Quy đổi giá bảng product_discounts (Flash Sale) sang VNĐ
    console.log(
      '3. Quy đổi bảng product_discounts sang VNĐ (ngưỡng < 10000)...',
    );
    const updatedDiscounts = await tx.$executeRaw`
      UPDATE \`product_discounts\` 
      SET \`discountPrice\` = ROUND(\`discountPrice\` * 25000) 
      WHERE \`discountPrice\` < 10000;
    `;
    console.log(
      `   - Đã cập nhật ${updatedDiscounts} đợt flash sale sang VNĐ.`,
    );
  });

  console.log('✅ Hoàn tất chuẩn hóa dữ liệu thành công!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi thực thi migration fix-currency:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
