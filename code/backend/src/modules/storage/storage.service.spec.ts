import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';

// Mock the AWS SDK
jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockResolvedValue({}),
    })),
    PutObjectCommand: jest.fn(),
    DeleteObjectCommand: jest.fn(),
    CreateBucketCommand: jest.fn(),
    HeadBucketCommand: jest.fn(),
    PutBucketPolicyCommand: jest.fn(),
  };
});

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService],
    }).compile();

    service = module.get<StorageService>(StorageService);

    // We can avoid calling onModuleInit directly if it attempts to connect to a real S3
    // But since we mocked S3Client and its send method, it's safe to call.
    await service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate public url correctly', () => {
    const url = service.getPublicUrl('test-bucket', 'test-key.jpg');
    expect(url).toContain('test-bucket');
    expect(url).toContain('test-key.jpg');
  });

  it('should upload file and return url', async () => {
    const url = await service.uploadFile(
      'test-bucket',
      'test-key.jpg',
      Buffer.from('test'),
      'image/jpeg',
    );
    expect(url).toContain('test-key.jpg');
  });

  it('should delete file without errors', async () => {
    await expect(
      service.deleteFile('test-bucket', 'test-key.jpg'),
    ).resolves.not.toThrow();
  });
});
