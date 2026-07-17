import { PrismaClient, Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const prisma = new PrismaClient();

type AmazonProduct = {
  parent_asin: string;
  main_category?: string;
  price?: number | string;
  features?: string[];
  description?: string | string[];
  title?: string;
  store?: string;
  images?: string[];
  average_rating?: number;
  rating_number?: number;
  details?: Prisma.InputJsonObject;
  categories?: string[];
};

type AmazonReview = {
  parent_asin: string;
  user_id?: string;
  rating?: number;
  title?: string;
  text?: string;
  verified_purchase?: boolean;
  helpful_vote?: number;
};

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .substring(0, 100);
}

async function main() {
  console.log('Đang đọc dữ liệu từ thư mục ml/data...');

  // Xóa sạch dữ liệu cũ
  await prisma.review.deleteMany();
  await prisma.user.deleteMany({
    where: { email: { endsWith: '@amazon.com' } },
  });
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  const metaPath = path.join(
    __dirname,
    '../../../ml/data/meta_electronics.jsonl',
  );
  const reviewPath = path.join(
    __dirname,
    '../../../ml/data/reviews_electronics_500k.jsonl',
  );

  if (!fs.existsSync(metaPath) || !fs.existsSync(reviewPath)) {
    console.error(`Không tìm thấy file dữ liệu JSONL`);
    process.exit(1);
  }

  // ----------------------------------------------------
  // 1. LẤY 5 SẢN PHẨM TỪ AMAZON
  // ----------------------------------------------------
  console.log('1. Đang trích xuất 5 sản phẩm đầu tiên...');
  const metaStream = fs.createReadStream(metaPath);
  const rlMeta = readline.createInterface({
    input: metaStream,
    crlfDelay: Infinity,
  });

  const productsToInsert: AmazonProduct[] = [];
  const parentAsins = new Set<string>();

  for await (const line of rlMeta) {
    if (!line.trim()) continue;
    try {
      const item = JSON.parse(line) as AmazonProduct;
      productsToInsert.push(item);
      parentAsins.add(item.parent_asin);
      if (productsToInsert.length >= 5) break;
    } catch {
      // ignore
    }
  }
  rlMeta.close();
  metaStream.close();

  const insertedProducts: Record<string, string> = {}; // Lưu map parent_asin -> productId của DB

  for (let i = 0; i < productsToInsert.length; i++) {
    const item = productsToInsert[i];
    const catName = item.main_category || 'Electronics';
    const catSlug = slugify(catName) || 'electronics';

    let category = await prisma.category.findUnique({
      where: { slug: catSlug },
    });
    if (!category) {
      category = await prisma.category.create({
        data: { name: catName, slug: catSlug },
      });
    }

    const price = typeof item.price === 'number' ? item.price : 0;

    let fullDesc = '';
    if (Array.isArray(item.features) && item.features.length > 0) {
      fullDesc +=
        '🎯 TÍNH NĂNG NỔI BẬT:\n- ' + item.features.join('\n- ') + '\n\n';
    }
    if (Array.isArray(item.description) && item.description.length > 0) {
      fullDesc += '📝 MÔ TẢ SẢN PHẨM:\n' + item.description.join('\n');
    } else if (typeof item.description === 'string') {
      fullDesc += '📝 MÔ TẢ SẢN PHẨM:\n' + item.description;
    }

    const product = await prisma.product.create({
      data: {
        categoryId: category.id,
        name: item.title ? item.title.substring(0, 190) : 'Unknown Product',
        slug:
          slugify(item.title || Math.random().toString()) +
          '-' +
          (item.parent_asin || i.toString()),
        brand: item.store || null,
        description: fullDesc,
        price: price,
        stock: 100,
        images: item.images || [],
        sourceExternalId: item.parent_asin,
        avgRating: item.average_rating || 0,
        reviewCount: item.rating_number || 0,
        specifications: item.details || {},
        tags: item.categories || [],
      },
    });
    insertedProducts[item.parent_asin] = product.id;
  }
  console.log(`✅ Đã thêm 5 sản phẩm vào DB.`);

  // ----------------------------------------------------
  // 2. QUÉT VÀ LẤY REVIEW CỦA 5 SẢN PHẨM NÀY
  // ----------------------------------------------------
  console.log(
    '2. Đang quét file 500.000 reviews để tìm đánh giá cho 5 sản phẩm này (Mất khoảng 1-2 giây)...',
  );
  const reviewStream = fs.createReadStream(reviewPath);
  const rlReview = readline.createInterface({
    input: reviewStream,
    crlfDelay: Infinity,
  });

  const reviewsToInsert: AmazonReview[] = [];
  for await (const line of rlReview) {
    if (!line.trim()) continue;
    try {
      const rev = JSON.parse(line) as AmazonReview;
      if (parentAsins.has(rev.parent_asin)) {
        reviewsToInsert.push(rev);
      }
    } catch {
      // ignore
    }
  }
  rlReview.close();
  reviewStream.close();

  console.log(
    `Tìm thấy ${reviewsToInsert.length} đánh giá. Đang lưu vào DB...`,
  );

  let reviewInserted = 0;
  for (const rev of reviewsToInsert) {
    // Tạo user giả định từ amazon user_id
    const email = `${rev.user_id || 'unknown'}@amazon.com`;
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          fullName: `Amazon Reviewer ${rev.user_id?.substring(0, 4) || ''}`,
          passwordHash: 'not_applicable',
        },
      });
    }

    const productId = insertedProducts[rev.parent_asin];
    if (productId) {
      // Prisma có index unique [userId, productId] trên bảng Review,
      // nên chúng ta dùng upsert hoặc bắt lỗi nếu user đã review sản phẩm này.
      const existingReview = await prisma.review.findUnique({
        where: {
          userId_productId: {
            userId: user.id,
            productId: productId,
          },
        },
      });

      if (!existingReview) {
        await prisma.review.create({
          data: {
            userId: user.id,
            productId: productId,
            rating: Math.floor(rev.rating || 5),
            title: rev.title?.substring(0, 190),
            content: rev.text,
            isVerifiedPurchase: rev.verified_purchase || false,
            helpfulCount: rev.helpful_vote || 0,
          },
        });
        reviewInserted++;
      }
    }
  }

  console.log(
    `✅ Hoàn tất! Đã thêm ${productsToInsert.length} sản phẩm và ${reviewInserted} đánh giá.`,
  );
}

main()
  .catch((e) => {
    console.error('Lỗi khi seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
