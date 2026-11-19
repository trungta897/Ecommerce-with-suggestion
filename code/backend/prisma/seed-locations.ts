/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { PrismaClient } from '@prisma/client';
import { PROVINCE_MERGED_FROM_MAP } from '../src/common/constants/province-merge.constant';

const prisma = new PrismaClient() as any;

interface RawWard {
  Code: string;
  Name: string;
  NameEn?: string;
  FullName: string;
  FullNameEn?: string;
  CodeName?: string;
  ProvinceCode: string;
}

interface RawProvince {
  Code: string;
  Name: string;
  NameEn?: string;
  FullName: string;
  FullNameEn?: string;
  CodeName?: string;
  Wards?: RawWard[];
}

const PROVINCES_JSON_URL =
  'https://raw.githubusercontent.com/ThangLeQuoc/vietnamese-provinces-database/master/json/simplified_json_generated_data_vn_units.json';
const BANDO_SQL_URL =
  'https://raw.githubusercontent.com/ThangLeQuoc/vietnamese-provinces-database/master/dataset-generation-scripts/bando_co_dvch.sql';

function getRegion(code: string): 'NORTH' | 'CENTRAL' | 'SOUTH' {
  const northCodes = [
    '01',
    '04',
    '08',
    '11',
    '12',
    '14',
    '15',
    '19',
    '20',
    '22',
    '24',
    '25',
    '31',
    '33',
    '37',
  ];
  const centralCodes = [
    '38',
    '40',
    '42',
    '44',
    '46',
    '48',
    '51',
    '52',
    '56',
    '66',
    '68',
  ];
  if (northCodes.includes(code)) return 'NORTH';
  if (centralCodes.includes(code)) return 'CENTRAL';
  return 'SOUTH';
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

async function fetchWardMergedMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    console.log(
      '📡 Đang tải thông tin sáp nhập cấp xã/phường (bando_co_dvch.sql)...',
    );
    const res = await fetch(BANDO_SQL_URL);
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const text = await res.text();
    const lines = text.split('\n');
    for (const line of lines) {
      const match = line.match(
        /\('([^']+)',\s*'([^']+)',\s*(NULL|'[^']+'),\s*'([^']+)',\s*'([^']+)'\)/,
      );
      if (match) {
        const [, ma, ten, , , truocsapnhap] = match;
        if (
          ma.startsWith('xa') &&
          truocsapnhap &&
          truocsapnhap !== 'giữ nguyên'
        ) {
          map.set(ten.toLowerCase().trim(), truocsapnhap.trim());
        }
      }
    }
    console.log(`✅ Đã nạp ${map.size} thông tin sáp nhập phường/xã.`);
  } catch (err) {
    console.warn(
      '⚠️ Không thể tải bando_co_dvch.sql, tiếp tục không có thông tin sáp nhập chi tiết cho xã/phường:',
      err,
    );
  }
  return map;
}

async function main() {
  console.log(
    '🚀 Bắt đầu quá trình seed đơn vị hành chính Việt Nam (Mốc 2026 - 34 Tỉnh/Thành)...',
  );
  const startTime = Date.now();

  console.log(
    '📡 Đang tải bộ dữ liệu 34 Tỉnh thành từ vietnamese-provinces-database...',
  );
  const res = await fetch(PROVINCES_JSON_URL);
  if (!res.ok) {
    throw new Error(`Lỗi tải dữ liệu JSON (HTTP ${res.status})`);
  }
  const rawProvinces = (await res.json()) as RawProvince[];
  const wardMergedMap = await fetchWardMergedMap();

  const provincesData: {
    id: string;
    name: string;
    fullName: string;
    region: 'NORTH' | 'CENTRAL' | 'SOUTH';
    mergedFrom: string | null;
  }[] = [];

  const wardsData: {
    id: string;
    provinceId: string;
    name: string;
    fullName: string;
    mergedFrom: string | null;
  }[] = [];

  for (const p of rawProvinces) {
    const provinceMerged = PROVINCE_MERGED_FROM_MAP[p.Code] || null;
    provincesData.push({
      id: p.Code,
      name: p.Name,
      fullName: p.FullName,
      region: getRegion(p.Code),
      mergedFrom: provinceMerged || null,
    });

    if (p.Wards && Array.isArray(p.Wards)) {
      for (const w of p.Wards) {
        const keyFullName = w.FullName.toLowerCase().trim();
        const keyName = w.Name.toLowerCase().trim();
        const wardMerged =
          wardMergedMap.get(keyFullName) || wardMergedMap.get(keyName) || null;

        wardsData.push({
          id: w.Code,
          provinceId: p.Code,
          name: w.Name,
          fullName: w.FullName,
          mergedFrom: wardMerged,
        });
      }
    }
  }

  console.log(
    `📊 Dữ liệu đã xử lý: ${provincesData.length} Tỉnh/Thành, ${wardsData.length} Phường/Xã.`,
  );

  console.log('⏳ Đang xóa dữ liệu cũ...');
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE wards;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE provinces;');
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;');

  console.log('⏳ Đang nạp bảng Province (34 Tỉnh/Thành phố)...');
  await prisma.province.createMany({
    data: provincesData,
    skipDuplicates: true,
  });
  console.log('✅ Đã nạp xong bảng Province!');

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
  const doneMsg = `🎉 Hoàn tất seed dữ liệu hành chính 2026 trong ${duration}s!`;
  console.log(doneMsg);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi nghiêm trọng khi seed đơn vị hành chính:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
