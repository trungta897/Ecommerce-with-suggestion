const fs = require('fs');
const path = require('path');

const viDir = path.join(__dirname, '../src/messages/vi');
const enDir = path.join(__dirname, '../src/messages/en');

console.log('🔍 [i18n] Đang kiểm tra chéo các file ngôn ngữ (vi/en)...');

if (!fs.existsSync(viDir) || !fs.existsSync(enDir)) {
  console.log('⚠️ Không tìm thấy thư mục ngôn ngữ, bỏ qua kiểm tra.');
  process.exit(0);
}

const viFiles = fs.readdirSync(viDir).filter((f) => f.endsWith('.json'));
const enFiles = fs.readdirSync(enDir).filter((f) => f.endsWith('.json'));

let hasError = false;

// Hàm so sánh keys đệ quy
function compareKeys(obj1, obj2, filePath, prefix = '', lang1 = 'vi', lang2 = 'en') {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  keys1.forEach((key) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (!keys2.includes(key)) {
      console.error(`❌ [LỖI i18n] Thiếu key '${fullKey}' trong file '${lang2}/${filePath}'`);
      hasError = true;
    } else if (typeof obj1[key] === 'object' && obj1[key] !== null) {
      if (typeof obj2[key] === 'object' && obj2[key] !== null) {
        compareKeys(obj1[key], obj2[key], filePath, fullKey, lang1, lang2);
      } else {
        console.error(
          `❌ [LỖI i18n] Kiểu dữ liệu không khớp cho key '${fullKey}' trong '${lang2}/${filePath}'`
        );
        hasError = true;
      }
    }
  });
}

// Kiểm tra vi -> en
viFiles.forEach((file) => {
  if (!enFiles.includes(file)) {
    console.error(`❌ [LỖI i18n] File '${file}' tồn tại trong 'vi' nhưng thiếu trong 'en'`);
    hasError = true;
    return;
  }

  const viData = JSON.parse(fs.readFileSync(path.join(viDir, file), 'utf8'));
  const enData = JSON.parse(fs.readFileSync(path.join(enDir, file), 'utf8'));

  compareKeys(viData, enData, file, '', 'vi', 'en');
});

// Kiểm tra en -> vi
enFiles.forEach((file) => {
  if (!viFiles.includes(file)) {
    console.error(`❌ [LỖI i18n] File '${file}' tồn tại trong 'en' nhưng thiếu trong 'vi'`);
    hasError = true;
    return;
  }
  const viData = JSON.parse(fs.readFileSync(path.join(viDir, file), 'utf8'));
  const enData = JSON.parse(fs.readFileSync(path.join(enDir, file), 'utf8'));

  compareKeys(enData, viData, file, '', 'en', 'vi');
});

if (hasError) {
  console.error(
    '\n🛑 Git Commit Bị Chặn! Vui lòng sửa các lỗi i18n bên trên trước khi commit lại.'
  );
  process.exit(1);
} else {
  console.log('✅ [i18n] Tất cả các file ngôn ngữ đã khớp hoàn hảo!');
}
