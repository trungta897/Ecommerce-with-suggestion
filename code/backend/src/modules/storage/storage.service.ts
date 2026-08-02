import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { StorageConfig } from './storage.config';
import * as streamifier from 'streamifier';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);

  onModuleInit(): void {
    cloudinary.config({
      cloud_name: StorageConfig.cloudinaryCloudName,
      api_key: StorageConfig.cloudinaryApiKey,
      api_secret: StorageConfig.cloudinaryApiSecret,
    });
    this.logger.log('Cloudinary configured');
  }

  async uploadFile(
    folder: string,
    key: string,
    buffer: Buffer | Uint8Array,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: key,
          resource_type: 'auto',
        },
        (error, result?: UploadApiResponse) => {
          if (error) {
            this.logger.error(`Upload failed for ${key}`, error);
            return reject(new Error(error?.message || 'Upload failed'));
          }
          if (!result) {
            return reject(
              new Error('Upload failed, no result from Cloudinary'),
            );
          }
          resolve(result.secure_url);
        },
      );

      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  }

  async deleteFile(folder: string, key: string): Promise<void> {
    try {
      const publicId = `${folder}/${key}`;
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      this.logger.error(`Delete failed for ${key}`, error);
      throw error;
    }
  }
}
