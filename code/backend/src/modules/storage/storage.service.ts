import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import { StorageConfig } from './storage.config';

@Injectable()
export class StorageService implements OnModuleInit {
  private s3Client: S3Client;
  private readonly logger = new Logger(StorageService.name);

  async onModuleInit(): Promise<void> {
    const protocol = StorageConfig.useSSL ? 'https' : 'http';

    // Create S3 client
    this.s3Client = new S3Client({
      endpoint: `${protocol}://${StorageConfig.endpoint}:${StorageConfig.port}`,
      region: 'us-east-1', // MinIO requires a region, even if dummy
      credentials: {
        accessKeyId: StorageConfig.accessKey,
        secretAccessKey: StorageConfig.secretKey,
      },
      forcePathStyle: true, // Required for MinIO
    });

    try {
      await this.ensureBucket(StorageConfig.bucket);
    } catch (error) {
      this.logger.error(
        `Failed to initialize bucket ${StorageConfig.bucket}`,
        error,
      );
    }
  }

  async uploadFile(
    bucket: string,
    key: string,
    buffer: Buffer | Uint8Array,
    contentType: string,
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      });

      await this.s3Client.send(command);
      return this.getPublicUrl(bucket, key);
    } catch (error) {
      this.logger.error(`Upload failed for ${key}`, error);
      throw error;
    }
  }

  async deleteFile(bucket: string, key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      this.logger.error(`Delete failed for ${key}`, error);
      throw error;
    }
  }

  getPublicUrl(bucket: string, key: string): string {
    const protocol = StorageConfig.useSSL ? 'https' : 'http';
    return `${protocol}://${StorageConfig.endpoint}:${StorageConfig.port}/${bucket}/${key}`;
  }

  async ensureBucket(bucket: string): Promise<void> {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: bucket }));
      this.logger.log(`Bucket ${bucket} exists`);
    } catch (e: unknown) {
      const error = e as Error & { $metadata?: { httpStatusCode?: number } };
      if (
        error.name === 'NotFound' ||
        error.$metadata?.httpStatusCode === 404
      ) {
        this.logger.log(`Bucket ${bucket} not found. Creating...`);
        await this.s3Client.send(new CreateBucketCommand({ Bucket: bucket }));

        // Set public read policy
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: '*',
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${bucket}/*`],
            },
          ],
        };

        await this.s3Client.send(
          new PutBucketPolicyCommand({
            Bucket: bucket,
            Policy: JSON.stringify(policy),
          }),
        );
        this.logger.log(`Bucket ${bucket} created and set to public read`);
      } else {
        throw error;
      }
    }
  }
}
