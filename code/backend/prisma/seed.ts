/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import { PrismaClient, Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { parse } from 'csv-parse';
import {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';

const prisma = new PrismaClient();

// MinIO Setup
const s3Client = new S3Client({
  endpoint: 'http://localhost:9000',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'minioadmin',
    secretAccessKey: 'minioadmin123',
  },
  forcePathStyle: true,
});
const MINIO_BUCKET = 'datn-products';
const MINIO_PUBLIC_BASE_URL = 'http://localhost:9000/datn-products';

// Types
type AmazonProduct = {
  parent_asin: string;
  main_category?: string;
  price?: number | string;
  features?: string[];
  description?: string | string[];
  title?: string;
  store?: string;
  images?: any[];
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

// Utils
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

async function ensureBucket() {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: MINIO_BUCKET }));
    console.log(`Bucket ${MINIO_BUCKET} exists`);
  } catch (e: unknown) {
    const error = e as Error & {
      $metadata?: { httpStatusCode?: number };
      name?: string;
    };
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      console.log(`Bucket ${MINIO_BUCKET} not found. Creating...`);
      await s3Client.send(new CreateBucketCommand({ Bucket: MINIO_BUCKET }));
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: '*',
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${MINIO_BUCKET}/*`],
          },
        ],
      };
      await s3Client.send(
        new PutBucketPolicyCommand({
          Bucket: MINIO_BUCKET,
          Policy: JSON.stringify(policy),
        }),
      );
      console.log(`Bucket created and set to public read`);
    } else {
      console.log(
        'Ensure bucket failed, maybe MinIO is not running. Proceeding without MinIO check.',
      );
    }
  }
}

async function uploadToMinIO(url: string, key: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
    const buffer = await res.arrayBuffer();

    let contentType = 'image/jpeg';
    if (url.endsWith('.png')) contentType = 'image/png';
    else if (url.endsWith('.webp')) contentType = 'image/webp';

    await s3Client.send(
      new PutObjectCommand({
        Bucket: MINIO_BUCKET,
        Key: key,
        Body: Buffer.from(buffer),
        ContentType: contentType,
      }),
    );
    return `${MINIO_PUBLIC_BASE_URL}/${key}`;
  } catch (e: any) {
    console.error(`Upload error for ${key}: ${e.message}`);
    return null;
  }
}

async function emptyBucket() {
  console.log(`Đang dọn dẹp bucket ${MINIO_BUCKET}...`);
  try {
    let isTruncated = true;
    let continuationToken: string | undefined = undefined;

    while (isTruncated) {
      const response = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: MINIO_BUCKET,
          ContinuationToken: continuationToken,
        }),
      );

      if (response.Contents && response.Contents.length > 0) {
        const objectsToDelete = response.Contents.map((obj) => ({
          Key: obj.Key,
        }));
        await s3Client.send(
          new DeleteObjectsCommand({
            Bucket: MINIO_BUCKET,
            Delete: { Objects: objectsToDelete },
          }),
        );
        console.log(`  Đã xóa ${objectsToDelete.length} file cũ trong bucket.`);
      }

      isTruncated = response.IsTruncated ?? false;
      continuationToken = response.NextContinuationToken;
    }
  } catch (error: any) {
    console.log(
      `Lỗi khi dọn dẹp bucket (có thể bucket rỗng hoặc chưa tồn tại): ${error.message}`,
    );
  }
}

async function main() {
  console.log(
    '🚀 Bắt đầu quá trình seed dữ liệu (1.000 sản phẩm + upload MinIO)...',
  );

  await ensureBucket();
  await emptyBucket();

  console.log('Đang xóa dữ liệu cũ trong database...');
  await prisma.review.deleteMany();
  await prisma.user.deleteMany({
    where: { email: { endsWith: '@amazon.com' } },
  });
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  const dataDir = path.join(__dirname, '../../../ml/data');
  const trainPath = path.join(dataDir, 'train.csv');
  const testPath = path.join(dataDir, 'test.csv');
  const metaPath = path.join(dataDir, 'meta_electronics.jsonl');
  const reviewPath = path.join(dataDir, 'reviews_electronics_500k.jsonl');

  if (!fs.existsSync(metaPath) || !fs.existsSync(reviewPath)) {
    console.error(`Không tìm thấy file dữ liệu JSONL tại ${dataDir}`);
    process.exit(1);
  }

  console.log(
    '0. Quét metadata để tìm các sản phẩm thuộc danh mục linh kiện PC (RAM, GPU, Case...)...',
  );
  const allowedCategories = [
    'Computer Components',
    'Internal Components',
    'Memory',
    'RAM',
    'Graphics Cards',
    'GPU',
    'Motherboards',
    'Computer Cases',
    'Processors',
    'CPU',
    'Power Supplies',
    'Cooling',
    'Hard Drives',
    'SSD',
    'Laptops',
    'Desktops',
    'Monitors',
  ];
  const targetAsins = new Set<string>();

  const metaStream0 = fs.createReadStream(metaPath);
  const rlMeta0 = readline.createInterface({
    input: metaStream0,
    crlfDelay: Infinity,
  });
  for await (const line of rlMeta0) {
    if (!line.trim()) continue;
    try {
      const item = JSON.parse(line);
      const cats = item.categories || [];
      const title = item.title || '';

      const isTarget =
        cats.some((c: string) =>
          allowedCategories.some((ac) =>
            c.toLowerCase().includes(ac.toLowerCase()),
          ),
        ) ||
        allowedCategories.some((ac) =>
          title.toLowerCase().includes(ac.toLowerCase()),
        );

      if (isTarget) {
        targetAsins.add(item.parent_asin);
      }
    } catch {
      // ignore
    }
  }
  rlMeta0.close();
  metaStream0.close();
  console.log(`Tìm thấy ${targetAsins.size} ASIN thuộc nhóm linh kiện PC.`);

  console.log(
    '1. Đang phân tích train.csv và test.csv để chọn 1.000 sản phẩm top reviews (đã lọc)...',
  );
  const asinCount: Record<string, number> = {};

  const countAsins = (csvPath: string) => {
    return new Promise<void>((resolve, reject) => {
      if (!fs.existsSync(csvPath)) return resolve();
      fs.createReadStream(csvPath)
        .pipe(parse({ columns: true }))
        .on('data', (row) => {
          const asin = row.parent_asin || row.asin;
          if (asin && targetAsins.has(asin)) {
            asinCount[asin] = (asinCount[asin] || 0) + 1;
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });
  };
  await countAsins(trainPath);
  await countAsins(testPath);

  const sortedAsins = Object.entries(asinCount).sort((a, b) => b[1] - a[1]);
  const top1000 = new Set(sortedAsins.slice(0, 1000).map((x) => x[0]));
  console.log(
    `Đã chọn được ${top1000.size} sản phẩm (max: ${sortedAsins[0]?.[1]} reviews, min: ${sortedAsins[999]?.[1]} reviews).`,
  );

  console.log('2. Đang đọc metadata và lọc sản phẩm...');
  const productsToInsert: AmazonProduct[] = [];
  const metaStream = fs.createReadStream(metaPath);
  const rlMeta = readline.createInterface({
    input: metaStream,
    crlfDelay: Infinity,
  });

  for await (const line of rlMeta) {
    if (!line.trim()) continue;
    try {
      const item = JSON.parse(line) as AmazonProduct;
      if (top1000.has(item.parent_asin)) {
        productsToInsert.push(item);
      }
    } catch {
      // ignore
    }
  }
  rlMeta.close();
  metaStream.close();
  console.log(`Đã load metadata cho ${productsToInsert.length} sản phẩm.`);

  console.log(
    '3. & 4. Xử lý lưu Category, upload ảnh MinIO và insert Product...',
  );
  const insertedProducts: Record<string, string> = {};
  let categoriesCreated = 0;
  let imagesUploaded = 0;

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
      categoriesCreated++;
    }

    const processedImages: {
      url: string;
      variant: string;
      isPrimary: boolean;
    }[] = [];
    if (item.images && Array.isArray(item.images)) {
      for (const img of item.images) {
        const sourceUrl = img.hi_res || img.large || img.thumb;
        if (!sourceUrl) continue;
        const variant = img.variant || 'MAIN';
        const key = `${item.parent_asin}/${variant}.jpg`;
        const minioUrl = await uploadToMinIO(sourceUrl, key);
        if (minioUrl) {
          processedImages.push({
            url: minioUrl,
            variant: variant,
            isPrimary: variant === 'MAIN' || processedImages.length === 0,
          });
          imagesUploaded++;
        }
      }
    }

    if (i % 100 === 0 && i > 0) {
      console.log(
        `  Đã xử lý ${i}/${productsToInsert.length} sản phẩm, upload ${imagesUploaded} ảnh...`,
      );
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
          item.parent_asin,
        brand: item.store || null,
        description: fullDesc,
        price: price,
        stock: 100,
        images: processedImages as any,
        sourceExternalId: item.parent_asin,
        avgRating: item.average_rating || 0,
        reviewCount: item.rating_number || 0,
        specifications: item.details || {},
        tags: item.categories || [],
      },
    });
    insertedProducts[item.parent_asin] = product.id;
  }
  console.log(
    `✅ Đã insert ${productsToInsert.length} products, ${categoriesCreated} categories, ${imagesUploaded} images.`,
  );

  console.log('5. Quét reviews_electronics_500k.jsonl để thêm đánh giá...');
  const reviewStream = fs.createReadStream(reviewPath);
  const rlReview = readline.createInterface({
    input: reviewStream,
    crlfDelay: Infinity,
  });

  let reviewCount = 0;
  let userCount = 0;
  const userCache: Record<string, string> = {};
  const BATCH_SIZE = 500;
  let reviewBatch: Prisma.ReviewCreateManyInput[] = [];

  for await (const line of rlReview) {
    if (!line.trim()) continue;
    try {
      const rev = JSON.parse(line) as AmazonReview;
      if (top1000.has(rev.parent_asin)) {
        const productId = insertedProducts[rev.parent_asin];
        if (!productId) continue;

        const email = `${rev.user_id || 'unknown'}_${Math.floor(Math.random() * 10000)}@amazon.com`;

        let userId = userCache[email];
        if (!userId) {
          const user = await prisma.user.create({
            data: {
              email,
              fullName: `Amazon User ${rev.user_id?.substring(0, 4) || ''}`,
              passwordHash: 'not_applicable',
            },
          });
          userId = user.id;
          userCache[email] = userId;
          userCount++;
        }

        reviewBatch.push({
          userId: userId,
          productId: productId,
          rating: Math.floor(rev.rating || 5),
          title: rev.title?.substring(0, 190),
          content: rev.text,
          isVerifiedPurchase: rev.verified_purchase || false,
          helpfulCount: rev.helpful_vote || 0,
        });

        if (reviewBatch.length >= BATCH_SIZE) {
          await prisma.review.createMany({
            data: reviewBatch,
            skipDuplicates: true,
          });
          reviewCount += reviewBatch.length;
          reviewBatch = [];
          if (reviewCount % 5000 === 0) {
            console.log(`  Đã insert ${reviewCount} đánh giá...`);
          }
        }
      }
    } catch {
      // ignore
    }
  }
  if (reviewBatch.length > 0) {
    await prisma.review.createMany({ data: reviewBatch, skipDuplicates: true });
    reviewCount += reviewBatch.length;
  }

  rlReview.close();
  reviewStream.close();

  console.log(
    `✅ Hoàn tất! Đã thêm ${userCount} users và ${reviewCount} đánh giá.`,
  );
  console.log('🎉 Seed dữ liệu thành công!');
}

main()
  .catch((e) => {
    console.error('Lỗi khi seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
