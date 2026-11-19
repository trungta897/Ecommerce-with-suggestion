/**
 * Script sửa tag sai trong DB.
 * Chạy: npx ts-node prisma/fix-wrong-tags.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TagFix {
  id: string;
  name: string;
  correctTags: string[];
}

async function main() {
  // Danh sách sản phẩm bị gán tag sai từ Amazon scrape gốc
  const fixes: TagFix[] = [
    {
      // IceFox Walking 3D Pedometer → đây là thiết bị thể thao, không phải tai nghe
      id: 'e2742c7e-4c1e-46b1-9ac5-4aff9d68422f',
      name: 'IceFox Walking 3D Pedometer',
      correctTags: [
        'Electronics',
        'Sports & Outdoors',
        'Exercise & Fitness Accessories',
        'Pedometers',
      ],
    },
    {
      // Plugable USB 3.0 SATA III HDD Docking Station → đây là phụ kiện ổ cứng
      id: '17257d00-fc6a-458b-95d7-18316aae8861',
      name: 'Plugable USB 3.0 SATA III Docking Station',
      correctTags: [
        'Electronics',
        'Computers & Accessories',
        'Computer Accessories & Peripherals',
        'Hard Drive Accessories',
        'Docking Stations',
      ],
    },
    {
      // SVINZ Digital Calendar Alarm Clock → đồng hồ báo thức, không phải Home Audio
      id: '24b2a286-baaf-4b0b-8577-0cbf7cbe886c',
      name: 'SVINZ Digital Calendar Alarm Clock',
      correctTags: [
        'Electronics',
        'Home & Kitchen',
        'Clocks',
        'Alarm Clocks',
        'Digital Picture Frames',
      ],
    },
    {
      // Cheetah Mounts TV Wall Mount Bracket → giá treo TV, không phải tai nghe
      id: 'af7e6e6e-5c72-4907-8aaf-166035ee08f9',
      name: 'Cheetah Mounts TV Wall Mount Bracket',
      correctTags: [
        'Electronics',
        'Television & Video',
        'TV Accessories',
        'TV Mounts, Stands & Turntables',
        'TV Wall Mounts',
      ],
    },
    {
      // Lambow/Vassoul Mascara Sets → mỹ phẩm, không phải tai nghe
      id: '32140090-6fbb-42dd-9de6-a60dac939e3c',
      name: 'Lambow Vassoul 4D Silk Fiber Lash Mascara Sets',
      correctTags: ['Beauty & Personal Care', 'Makeup', 'Eyes', 'Mascara'],
    },
  ];

  console.log(`Fixing ${fixes.length} products with wrong tags...\n`);

  for (const fix of fixes) {
    try {
      const product = await prisma.product.findUnique({
        where: { id: fix.id },
        select: { id: true, name: true, tags: true },
      });

      if (!product) {
        console.log(`[SKIP] Product ${fix.id} (${fix.name}) not found in DB`);
        continue;
      }

      console.log(`[BEFORE] ${product.name?.slice(0, 60)}`);
      console.log(`  Old tags: ${JSON.stringify(product.tags)}`);

      await prisma.product.update({
        where: { id: fix.id },
        data: { tags: fix.correctTags },
      });

      console.log(`  New tags: ${JSON.stringify(fix.correctTags)}`);
      console.log(`[DONE] ✅\n`);
    } catch (error) {
      console.error(`[ERROR] Failed to update ${fix.name}:`, error);
    }
  }

  console.log('All fixes applied successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
