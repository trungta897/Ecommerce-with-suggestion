export class StorageConfig {
  static get cloudinaryCloudName(): string {
    return process.env.CLOUDINARY_CLOUD_NAME || '';
  }

  static get cloudinaryApiKey(): string {
    return process.env.CLOUDINARY_API_KEY || '';
  }

  static get cloudinaryApiSecret(): string {
    return process.env.CLOUDINARY_API_SECRET || '';
  }
}
