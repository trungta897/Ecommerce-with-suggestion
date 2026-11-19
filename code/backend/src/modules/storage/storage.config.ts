import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageConfig {
  constructor(private configService: ConfigService) {}

  get cloudinaryCloudName(): string {
    return this.configService.get<string>('CLOUDINARY_CLOUD_NAME') || '';
  }

  get cloudinaryApiKey(): string {
    return this.configService.get<string>('CLOUDINARY_API_KEY') || '';
  }

  get cloudinaryApiSecret(): string {
    return this.configService.get<string>('CLOUDINARY_API_SECRET') || '';
  }
}
