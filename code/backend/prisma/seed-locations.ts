/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient() as any;

interface RawWard {
  code: string | number;
  name: string;
  name_with_type?: string;
  parent_code?: string;
}

interface RawDistrict {
  code: string | number;
  name: string;
  name_with_type?: string;
  parent_code?: string;
  wards?: RawWard[];
}

interface RawProvince {
  code: string | number;
  name: string;
  name_with_type?: string;
  districts?: RawDistrict[];
}

const PRIMARY_URL = 'https://provinces.open-api.vn/api/?depth=3';
const BACKUP_URL =
  'https://raw.githubusercontent.com/madnh/vietnam-provinces/master/data.json';

async function fetchProvincesData(): Promise<RawProvince[]> {
  console.log('📡 Đang tải bộ dữ liệu Hành chính Việt Nam từ internet...');
  try {
    const res = await fetch(PRIMARY_URL);
    if (!res.ok) throw new Error(`HTTP Error ${res.status} tại Primary URL`);
    const data = (await res.json()) as RawProvince[];
    console.log('✅ Đã tải thành công từ nguồn chính (GitHub Raw).');
    return data;
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️ Lỗi nguồn chính (${errMsg}). Thử nguồn CDN dự phòng...`);
    const backupRes = await fetch(BACKUP_URL);
    if (!backupRes.ok) {
      throw new Error(
        `Lỗi tải cả 2 nguồn (HTTP ${backupRes.status}). Vui lòng kiểm tra lại mạng.`,
      );
    }
    const backupData = (await backupRes.json()) as RawProvince[];
    console.log('✅ Đã tải thành công từ nguồn CDN Dự phòng (JsDelivr).');
    return backupData;
  }
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

async function main() {
  console.log('🚀 Bắt đầu quá trình seed đơn vị hành chính Việt Nam...');
  const startTime = Date.now();

  const rawData = await fetchProvincesData();

  const provincesData: { id: string; name: string; fullName: string }[] = [];
  const districtsData: {
    id: string;
    provinceId: string;
    name: string;
    fullName: string;
  }[] = [];
  const wardsData: {
    id: string;
    districtId: string;
    name: string;
    fullName: string;
  }[] = [];

  for (const p of rawData) {
    provincesData.push({
      id: String(p.code),
      name: p.name,
      fullName: p.name_with_type || p.name,
    });

    if (p.districts && Array.isArray(p.districts)) {
      for (const d of p.districts) {
        districtsData.push({
          id: String(d.code),
          provinceId: String(p.code),
          name: d.name,
          fullName: d.name_with_type || d.name,
        });

        if (d.wards && Array.isArray(d.wards)) {
          for (const w of d.wards) {
            wardsData.push({
              id: String(w.code),
              districtId: String(d.code),
              name: w.name,
              fullName: w.name_with_type || w.name,
            });
          }
        }
      }
    }
  }

  console.log(
    `📊 Dữ liệu đã xử lý: ${provincesData.length} Tỉnh/Thành, ${districtsData.length} Quận/Huyện, ${wardsData.length} Phường/Xã.`,
  );

  console.log('⏳ Đang nạp bảng Province (Tỉnh/Thành phố)...');
  await prisma.province.createMany({
    data: provincesData,
    skipDuplicates: true,
  });
  console.log('✅ Đã nạp xong bảng Province!');

  console.log('⏳ Đang nạp bảng District (Quận/Huyện)...');
  const districtChunks = chunkArray(districtsData, 1000);
  for (const chunk of districtChunks) {
    await prisma.district.createMany({
      data: chunk,
      skipDuplicates: true,
    });
  }
  console.log('✅ Đã nạp xong bảng District!');

  console.log('⏳ Đang nạp bảng Ward (Phường/Xã) theo cụm (chunks)...');
  const wardChunks = chunkArray(wardsData, 1000);
  let processedWards = 0;
  for (const chunk of wardChunks) {
    await prisma.ward.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    processedWards += chunk.length;
    const progressMsg = `\r   -> Nạp ${processedWards}/${wardsData.length} xã/phường...`;
    process.stdout.write(progressMsg);
  }
  console.log('\n✅ Đã nạp xong toàn bộ bảng Ward!');

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  const doneMsg = `🎉 Hoàn tất seed dữ liệu hành chính trong ${duration}s!`;
  console.log(doneMsg);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi nghiệm trọng khi seed đơn vị hành chính:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
