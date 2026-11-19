/**
 * Đo hiệu năng endpoint gợi ý của dịch vụ ML khi bộ đệm Redis MISS và HIT bằng autocannon.
 *
 * Chuẩn bị: chạy Redis và dịch vụ ML (uvicorn service.main:app --port 8001), cài autocannon
 *   npm i autocannon  (trong thư mục này hoặc toàn cục)
 * Chạy:  node bench-ml-cache.js <ML_API_KEY> <đường_dẫn_train.csv>
 * Kết quả: in JSON (độ trễ trung bình, p50, p95, p99, thông lượng, số lỗi).
 */
const autocannon = require('autocannon');
const fs = require('fs');

const [apiKey, trainCsv] = process.argv.slice(2);
if (!apiKey || !trainCsv) {
  console.error('Usage: node bench-ml-cache.js <API_KEY> <train.csv>');
  process.exit(1);
}
const BASE = process.env.ML_URL || 'http://localhost:8001';
const CONNECTIONS = Number(process.env.CONNECTIONS || 50);
const DURATION = Number(process.env.DURATION || 15);
const REPEATS = Number(process.env.REPEATS || 3);

// Lấy ~3000 mã sản phẩm thật từ tập huấn luyện làm hạt giống
const asins = [...new Set(fs.readFileSync(trainCsv, 'utf8').split('\n').slice(1, 20000).map((l) => l.split(',')[1]).filter(Boolean))].slice(0, 3000);
const pick = () => asins[Math.floor(Math.random() * asins.length)];
const headers = { 'X-API-Key': apiKey };

function run(title, requests) {
  return new Promise((resolve) => {
    autocannon({ url: BASE, connections: CONNECTIONS, duration: DURATION, headers, requests }, (err, r) => {
      resolve({
        title,
        avgLatencyMs: r.latency.average,
        p50Ms: r.latency.p50,
        p97_5Ms: r.latency.p97_5,
        p99Ms: r.latency.p99,
        reqPerSec: r.requests.average,
        total2xx: r['2xx'],
        errors: r.errors + r.non2xx + r.timeouts,
      });
    });
  });
}

(async () => {
  const out = [];
  for (let i = 0; i < REPEATS; i++) {
    // MISS: mỗi yêu cầu dùng tập hạt giống ngẫu nhiên mới => khóa bộ đệm luôn mới
    out.push(
      await run(`miss#${i + 1}`, [
        {
          method: 'GET',
          setupRequest: (req) => {
            req.path = `/recommend/hybrid/bench_user?limit=10&items=${pick()},${pick()},${pick()}&weights=5,3,1&n=${Math.random()}`;
            return req;
          },
        },
      ]),
    );
    // HIT: cùng một URL => sau lần đầu luôn đọc từ Redis
    const fixed = `/recommend/hybrid/bench_user_hit?limit=10&items=${asins[0]},${asins[1]},${asins[2]}&weights=5,3,1`;
    await fetch(BASE + fixed, { headers });
    out.push(await run(`hit#${i + 1}`, [{ method: 'GET', path: fixed }]));
  }
  console.log(JSON.stringify({ connections: CONNECTIONS, durationSec: DURATION, results: out }, null, 2));
})();
