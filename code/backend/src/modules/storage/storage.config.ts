export class StorageConfig {
  static get endpoint(): string {
    return process.env.MINIO_ENDPOINT || 'localhost';
  }

  static get port(): number {
    return parseInt(process.env.MINIO_PORT || '9000', 10);
  }

  static get accessKey(): string {
    return process.env.MINIO_ACCESS_KEY || 'minioadmin';
  }

  static get secretKey(): string {
    return process.env.MINIO_SECRET_KEY || 'minioadmin123';
  }

  static get bucket(): string {
    return process.env.MINIO_BUCKET || 'datn-products';
  }

  static get useSSL(): boolean {
    return process.env.MINIO_USE_SSL === 'true';
  }
}
