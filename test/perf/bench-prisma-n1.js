/**
 * So sánh truy vấn N+1 (nạp lười) và nạp trước (include) của Prisma cho danh sách 50 sản phẩm
 * kèm danh mục và các đợt giảm giá.
 *
 * Chạy (cần MySQL đang chạy, DATABASE_URL trong code/backend/.env):
 *   cd code/backend && node ../../test/perf/bench-prisma-n1.js
 * Kết quả: số câu truy vấn và thời gian (ms) trung bình/trung vị/p95 sau N lần lặp.
 */
const path = require('path');
const { PrismaClient } = require(path.resolve(process.cwd(), 'node_modules/@prisma/client'));
require(path.resolve(process.cwd(), 'node_modules/dotenv')).config();

const LIMIT = 50;
const WARMUP = 5;
const RUNS = Number(process.env.RUNS || 100);

const prisma = new PrismaClient({ log: [{ emit: 'event', level: 'query' }] });
let queryCount = 0;
prisma.$on('query', () => { queryCount++; });

const pct = (arr, p) => arr.slice().sort((a, b) => a - b)[Math.min(arr.length - 1, Math.ceil((p / 100) * arr.length) - 1)];
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;

async function lazy() {
  const products = await prisma.product.findMany({ take: LIMIT, orderBy: { createdAt: 'desc' } });
  return Promise.all(
    products.map(async (p) => ({
      ...p,
      category: await prisma.category.findUnique({ where: { id: p.categoryId } }),
      discounts: await prisma.productDiscount.findMany({ where: { productId: p.id } }),
    })),
  );
}

async function eager() {
  return prisma.product.findMany({
    take: LIMIT,
    orderBy: { createdAt: 'desc' },
    include: { category: true, discounts: true },
  });
}

async function measure(name, fn) {
  for (let i = 0; i < WARMUP; i++) await fn();
  queryCount = 0;
  const times = [];
  for (let i = 0; i < RUNS; i++) {
    const t0 = process.hrtime.bigint();
    await fn();
    times.push(Number(process.hrtime.bigint() - t0) / 1e6);
  }
  return {
    name,
    queriesPerRun: queryCount / RUNS,
    meanMs: +mean(times).toFixed(2),
    p50Ms: +pct(times, 50).toFixed(2),
    p95Ms: +pct(times, 95).toFixed(2),
  };
}

(async () => {
  const res = [await measure('N+1 (nạp lười)', lazy), await measure('include (nạp trước)', eager)];
  console.log(JSON.stringify({ limit: LIMIT, runs: RUNS, results: res }, null, 2));
  await prisma.$disconnect();
})();
